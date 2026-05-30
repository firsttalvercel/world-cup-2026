import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServerSupabase } from "@/lib/supabase";
import { fromZonedTime } from "date-fns-tz";

const DATA_TZ = "Europe/Madrid";

export async function GET() {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    const supabase = createServerSupabase();

    // Fetch all upcoming matches
    const matchRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://world-cup-26.com"}/api/matches`);
    const { matches } = await matchRes.json();

    const now = Date.now();
    const windowStart = now + 25 * 60 * 1000; // 25 min from now
    const windowEnd = now + 35 * 60 * 1000;   // 35 min from now

    // Find matches kicking off in ~30 min
    const upcoming = (matches ?? []).filter((m: { date: string; time: string; status: string }) => {
      if (m.status !== "upcoming") return false;
      try {
        const kickoff = fromZonedTime(`${m.date}T${m.time}:00`, DATA_TZ).getTime();
        return kickoff >= windowStart && kickoff <= windowEnd;
      } catch {
        return false;
      }
    });

    if (upcoming.length === 0) {
      return NextResponse.json({ sent: 0, message: "No matches in window" });
    }

    let sent = 0;
    let failed = 0;

    for (const match of upcoming) {
      // Get all subscriptions for this match
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("match_id", match.id);

      if (!subs || subs.length === 0) continue;

      const payload = JSON.stringify({
        title: "Kickoff in 30 minutes!",
        body: `${match.homeTeam?.flag ?? ""} ${match.homeTeam?.name ?? "TBD"} vs ${match.awayTeam?.flag ?? ""} ${match.awayTeam?.name ?? "TBD"}`,
        tag: `match-${match.id}`,
        url: "/matches",
      });

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: unknown) {
          // Remove expired/invalid subscriptions
          if (err && typeof err === "object" && "statusCode" in err &&
              (err.statusCode === 404 || err.statusCode === 410)) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
          failed++;
        }
      }
    }

    return NextResponse.json({ sent, failed, matches: upcoming.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
