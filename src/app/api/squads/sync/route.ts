import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import groupsData from "@/data/groups.json";
import type { Group } from "@/types";

const BASE = "https://v3.football.api-sports.io";
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

const groups = groupsData as Group[];

// All team codes from our data
const ALL_TEAMS = groups.flatMap((g) =>
  g.standings.map((s) => ({ code: s.team.code, name: s.team.name }))
);

// Known name differences: our name → API-Football name (lowercase)
const NAME_MAP: Record<string, string> = {
  "south korea": "korea republic",
  "ivory coast": "côte d'ivoire",
  "czech republic": "czechia",
  "usa": "united states",
  "congo dr": "dr congo",
};

function normalize(name: string) {
  const lower = name.toLowerCase().trim();
  return NAME_MAP[lower] ?? lower;
}

function apiHeaders() {
  return { "x-apisports-key": process.env.API_SPORTS_KEY! };
}

export async function GET() {
  if (!process.env.API_SPORTS_KEY) {
    return NextResponse.json({ error: "API_SPORTS_KEY not set" }, { status: 500 });
  }

  const supabase = createServerSupabase();

  // Extract team IDs from WC 2026 fixtures (more reliable than /teams endpoint)
  const fixturesRes = await fetch(`${BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`, {
    headers: apiHeaders(),
  });
  if (!fixturesRes.ok) {
    return NextResponse.json({ error: "Failed to fetch fixtures from API" }, { status: 500 });
  }
  const fixturesData = await fixturesRes.json();
  const fixtures: { teams: { home: { id: number; name: string }; away: { id: number; name: string } } }[] =
    fixturesData.response ?? [];

  if (fixtures.length === 0) {
    return NextResponse.json({ error: "No WC 2026 fixtures found in API — may not be available yet", synced: 0, total: ALL_TEAMS.length });
  }

  // Build map: normalized API team name → API team ID
  const apiTeamMap = new Map<string, number>();
  for (const { teams } of fixtures) {
    apiTeamMap.set(normalize(teams.home.name), teams.home.id);
    apiTeamMap.set(normalize(teams.away.name), teams.away.id);
  }

  let synced = 0;
  const errors: string[] = [];

  for (const { code, name } of ALL_TEAMS) {
    // Skip if already synced
    const { data: existing } = await supabase
      .from("team_squads")
      .select("team_code")
      .eq("team_code", code)
      .single();
    if (existing) continue;

    const apiId = apiTeamMap.get(normalize(name));
    if (!apiId) {
      errors.push(`No API team ID for ${name} (${code})`);
      continue;
    }

    // Fetch squad
    const squadRes = await fetch(`${BASE}/players/squads?team=${apiId}`, {
      headers: apiHeaders(),
    });
    if (!squadRes.ok) {
      errors.push(`Failed to fetch squad for ${code}`);
      continue;
    }
    const squadData = await squadRes.json();
    const players = squadData.response?.[0]?.players ?? [];

    await supabase.from("team_squads").upsert(
      { team_code: code, api_team_id: apiId, squad: players, fetched_at: new Date().toISOString() },
      { onConflict: "team_code" }
    );
    synced++;
  }

  return NextResponse.json({ synced, total: ALL_TEAMS.length, errors });
}
