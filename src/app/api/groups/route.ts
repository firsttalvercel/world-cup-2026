import { NextResponse } from "next/server";
import { getLiveStandings } from "@/lib/football-api";
import staticGroups from "@/data/groups.json";

export const dynamic = "force-dynamic";

export async function GET() {
  let groups;

  try {
    groups = await getLiveStandings();
  } catch (err) {
    console.warn("Live API unavailable, falling back to static data:", err);
    groups = staticGroups;
  }

  return NextResponse.json({ groups, total: groups.length });
}
