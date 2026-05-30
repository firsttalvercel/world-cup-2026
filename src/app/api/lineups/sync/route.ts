import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { findApiFixtureId, fetchLineups } from "@/lib/apiFootball";
import matchesData from "@/data/matches.json";
import type { Match } from "@/types";
import { fromZonedTime } from "date-fns-tz";

const DATA_TZ = "Europe/Madrid";
// Fetch lineups for matches starting within this many hours
const WINDOW_HOURS = 3;

export async function GET() {
  if (!process.env.API_SPORTS_KEY) {
    return NextResponse.json({ error: "API_SPORTS_KEY not set" }, { status: 500 });
  }

  const supabase = createServerSupabase();
  const now = Date.now();
  const windowMs = WINDOW_HOURS * 3_600_000;

  // Find upcoming matches within the window
  const upcoming = (matchesData as Match[]).filter((m) => {
    if (m.status === "finished" || !m.homeTeam || !m.awayTeam) return false;
    try {
      const kickoff = fromZonedTime(`${m.date}T${m.time}:00`, DATA_TZ);
      const diff = kickoff.getTime() - now;
      return diff > 0 && diff <= windowMs;
    } catch {
      return false;
    }
  });

  if (upcoming.length === 0) {
    return NextResponse.json({ synced: 0, message: "No matches in window" });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const match of upcoming) {
    try {
      // Check if we already have a confirmed lineup
      const { data: existing } = await supabase
        .from("match_lineups")
        .select("api_fixture_id, home_lineup")
        .eq("match_id", match.id)
        .single();

      // If lineup already fetched, skip
      if (existing?.home_lineup) continue;

      // Find the API-Football fixture ID if we don't have it
      let fixtureId = existing?.api_fixture_id ?? null;
      if (!fixtureId) {
        fixtureId = await findApiFixtureId(match.date, match.homeTeam!.name, match.awayTeam!.name);
        if (!fixtureId) {
          errors.push(`No fixture ID found for ${match.id}`);
          continue;
        }
        // Store the fixture ID even if lineup isn't available yet
        await supabase.from("match_lineups").upsert(
          { match_id: match.id, api_fixture_id: fixtureId },
          { onConflict: "match_id" }
        );
      }

      // Fetch lineup
      const lineups = await fetchLineups(fixtureId);
      if (!lineups || lineups.length < 2) continue;

      const home = lineups.find(
        (l) => l.team.name.toLowerCase().includes(match.homeTeam!.name.toLowerCase().split(" ")[0])
      ) ?? lineups[0];
      const away = lineups.find((l) => l !== home) ?? lineups[1];

      await supabase.from("match_lineups").upsert(
        {
          match_id: match.id,
          api_fixture_id: fixtureId,
          home_lineup: home,
          away_lineup: away,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "match_id" }
      );

      synced++;
    } catch (e) {
      errors.push(`Error for ${match.id}: ${e}`);
    }
  }

  return NextResponse.json({ synced, checked: upcoming.length, errors });
}
