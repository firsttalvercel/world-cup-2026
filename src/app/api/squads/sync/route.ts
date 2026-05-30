import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import groupsData from "@/data/groups.json";
import type { Group } from "@/types";

const BASE = "https://v3.football.api-sports.io";

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

  let synced = 0;
  const errors: string[] = [];

  for (const { code, name } of ALL_TEAMS) {
    // Skip if already synced with squad data
    const { data: existing } = await supabase
      .from("team_squads")
      .select("team_code, api_team_id, squad")
      .eq("team_code", code)
      .single();
    if (existing?.squad) continue;

    // Find API team ID via search if not already stored
    let apiId = existing?.api_team_id ?? null;
    if (!apiId) {
      const searchRes = await fetch(
        `${BASE}/teams?search=${encodeURIComponent(name)}`,
        { headers: apiHeaders() }
      );
      if (!searchRes.ok) { errors.push(`Search failed for ${name}`); continue; }
      const searchData = await searchRes.json();
      const results: { team: { id: number; name: string; national: boolean } }[] = searchData.response ?? [];
      // Prefer national team, then best name match
      const match =
        results.find((r) => r.team.national && normalize(r.team.name) === normalize(name)) ??
        results.find((r) => r.team.national) ??
        results.find((r) => normalize(r.team.name) === normalize(name));
      if (!match) { errors.push(`No API team found for ${name} (${code})`); continue; }
      apiId = match.team.id;
    }

    // Fetch squad
    const squadRes = await fetch(`${BASE}/players/squads?team=${apiId}`, {
      headers: apiHeaders(),
    });
    if (!squadRes.ok) { errors.push(`Failed to fetch squad for ${code}`); continue; }
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
