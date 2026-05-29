import { NextRequest, NextResponse } from "next/server";
import { getLiveMatches } from "@/lib/football-api";
import staticMatches from "@/data/matches.json";
import type { Match, MatchStage } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team")?.toLowerCase();
  const group = searchParams.get("group")?.toUpperCase();
  const stage = searchParams.get("stage") as MatchStage | null;
  const city = searchParams.get("city")?.toLowerCase();
  const date = searchParams.get("date");

  let matches: Match[];

  try {
    matches = await getLiveMatches();
  } catch (err) {
    console.warn("Live API unavailable, falling back to static data:", err);
    matches = staticMatches as Match[];
  }

  if (team) {
    matches = matches.filter(
      (m) =>
        m.homeTeam?.name.toLowerCase().includes(team) ||
        m.awayTeam?.name.toLowerCase().includes(team)
    );
  }
  if (group) matches = matches.filter((m) => m.group === group);
  if (stage) matches = matches.filter((m) => m.stage === stage);
  if (city) matches = matches.filter((m) => m.city.toLowerCase().includes(city));
  if (date) matches = matches.filter((m) => m.date === date);

  return NextResponse.json({ matches, total: matches.length });
}
