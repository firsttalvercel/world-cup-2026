import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServerSupabase } from "@/lib/supabase";
import { fromZonedTime } from "date-fns-tz";
import type { Match } from "@/types";

const DATA_TZ = "Europe/Madrid";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://world-cup-26.com";

async function sendToSubscribers(
  supabase: ReturnType<typeof createServerSupabase>,
  matchId: string,
  payload: object
) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("match_id", matchId);

  if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  const payloadStr = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payloadStr
      );
      sent++;
    } catch (err: unknown) {
      if (err && typeof err === "object" && "statusCode" in err &&
        (err.statusCode === 404 || err.statusCode === 410)) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
      failed++;
    }
  }
  return { sent, failed };
}

export async function GET() {
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const supabase = createServerSupabase();
    const matchRes = await fetch(`${SITE_URL}/api/matches`);
    const { matches } = await matchRes.json() as { matches: Match[] };

    const now = Date.now();
    let totalSent = 0;
    let totalFailed = 0;
    const events: string[] = [];

    // --- 1. Kickoff in ~30 min ---
    const kickoffWindow = (matches ?? []).filter((m) => {
      if (m.status !== "upcoming") return false;
      try {
        const t = fromZonedTime(`${m.date}T${m.time}:00`, DATA_TZ).getTime();
        return t >= now + 25 * 60 * 1000 && t <= now + 35 * 60 * 1000;
      } catch { return false; }
    });

    for (const m of kickoffWindow) {
      const { sent, failed } = await sendToSubscribers(supabase, m.id, {
        title: "Kickoff in 30 minutes!",
        body: `${m.homeTeam?.flag ?? ""} ${m.homeTeam?.name ?? "TBD"} vs ${m.awayTeam?.flag ?? ""} ${m.awayTeam?.name ?? "TBD"}`,
        tag: `kickoff-${m.id}`,
        url: "/matches",
      });
      totalSent += sent; totalFailed += failed;
      if (sent > 0) events.push(`kickoff: ${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
    }

    // --- 2. Live match state changes (goals, red cards, full time) ---
    const liveAndFinished = (matches ?? []).filter(
      (m) => m.status === "live" || m.status === "finished"
    );

    for (const m of liveAndFinished) {
      // Get previous state
      const { data: prev } = await supabase
        .from("match_state")
        .select("*")
        .eq("match_id", m.id)
        .single();

      const prevHomeScore = prev?.home_score ?? 0;
      const prevAwayScore = prev?.away_score ?? 0;
      const prevHomeRed = prev?.home_red_cards ?? 0;
      const prevAwayRed = prev?.away_red_cards ?? 0;
      const prevStatus = prev?.status ?? "upcoming";

      const curHomeScore = m.homeScore ?? 0;
      const curAwayScore = m.awayScore ?? 0;
      const curHomeRed = m.homeRedCards ?? 0;
      const curAwayRed = m.awayRedCards ?? 0;

      // Goals
      if (curHomeScore > prevHomeScore) {
        const { sent, failed } = await sendToSubscribers(supabase, m.id, {
          title: `GOAL! ${m.homeTeam?.flag ?? ""} ${m.homeTeam?.name}`,
          body: `${m.homeTeam?.name} ${curHomeScore}–${curAwayScore} ${m.awayTeam?.name}`,
          tag: `goal-home-${m.id}-${curHomeScore}`,
          url: "/matches",
        });
        totalSent += sent; totalFailed += failed;
        if (sent > 0) events.push(`goal: ${m.homeTeam?.name} (${curHomeScore}-${curAwayScore})`);
      }
      if (curAwayScore > prevAwayScore) {
        const { sent, failed } = await sendToSubscribers(supabase, m.id, {
          title: `GOAL! ${m.awayTeam?.flag ?? ""} ${m.awayTeam?.name}`,
          body: `${m.homeTeam?.name} ${curHomeScore}–${curAwayScore} ${m.awayTeam?.name}`,
          tag: `goal-away-${m.id}-${curAwayScore}`,
          url: "/matches",
        });
        totalSent += sent; totalFailed += failed;
        if (sent > 0) events.push(`goal: ${m.awayTeam?.name} (${curHomeScore}-${curAwayScore})`);
      }

      // Red cards
      if (curHomeRed > prevHomeRed) {
        const { sent, failed } = await sendToSubscribers(supabase, m.id, {
          title: `Red card — ${m.homeTeam?.name}`,
          body: `${m.homeTeam?.name} down to ${11 - curHomeRed} men`,
          tag: `red-home-${m.id}-${curHomeRed}`,
          url: "/matches",
        });
        totalSent += sent; totalFailed += failed;
      }
      if (curAwayRed > prevAwayRed) {
        const { sent, failed } = await sendToSubscribers(supabase, m.id, {
          title: `Red card — ${m.awayTeam?.name}`,
          body: `${m.awayTeam?.name} down to ${11 - curAwayRed} men`,
          tag: `red-away-${m.id}-${curAwayRed}`,
          url: "/matches",
        });
        totalSent += sent; totalFailed += failed;
      }

      // Full time
      if (m.status === "finished" && prevStatus !== "finished") {
        const winner =
          curHomeScore > curAwayScore ? m.homeTeam?.name :
          curAwayScore > curHomeScore ? m.awayTeam?.name : null;
        const { sent, failed } = await sendToSubscribers(supabase, m.id, {
          title: "Full time!",
          body: winner
            ? `${m.homeTeam?.name} ${curHomeScore}–${curAwayScore} ${m.awayTeam?.name} · ${winner} win`
            : `${m.homeTeam?.name} ${curHomeScore}–${curAwayScore} ${m.awayTeam?.name} · Draw`,
          tag: `fulltime-${m.id}`,
          url: "/matches",
        });
        totalSent += sent; totalFailed += failed;
        if (sent > 0) events.push(`fulltime: ${m.homeTeam?.name} ${curHomeScore}-${curAwayScore} ${m.awayTeam?.name}`);
      }

      // Upsert current state
      await supabase.from("match_state").upsert({
        match_id: m.id,
        home_score: curHomeScore,
        away_score: curAwayScore,
        home_red_cards: curHomeRed,
        away_red_cards: curAwayRed,
        status: m.status,
        updated_at: new Date().toISOString(),
      }, { onConflict: "match_id" });
    }

    return NextResponse.json({ sent: totalSent, failed: totalFailed, events });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
