import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export type VoteAggregate = {
  home: number;
  draw: number;
  away: number;
  total: number;
};

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("match_votes")
      .select("match_id, home_score, away_score");

    if (error) throw error;

    const counts: Record<string, { home: number; draw: number; away: number }> = {};
    for (const row of data) {
      if (!counts[row.match_id]) counts[row.match_id] = { home: 0, draw: 0, away: 0 };
      if (row.home_score > row.away_score) counts[row.match_id].home++;
      else if (row.home_score === row.away_score) counts[row.match_id].draw++;
      else counts[row.match_id].away++;
    }

    const votes: Record<string, VoteAggregate> = {};
    for (const [matchId, c] of Object.entries(counts)) {
      const total = c.home + c.draw + c.away;
      votes[matchId] = {
        home: Math.round((c.home / total) * 100),
        draw: Math.round((c.draw / total) * 100),
        away: Math.round((c.away / total) * 100),
        total,
      };
    }

    return NextResponse.json({ votes });
  } catch {
    return NextResponse.json({ votes: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { matchId, sessionId, homeScore, awayScore } = await req.json();
    if (!matchId || !sessionId || homeScore == null || awayScore == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("match_votes")
      .upsert(
        { match_id: matchId, session_id: sessionId, home_score: homeScore, away_score: awayScore },
        { onConflict: "match_id,session_id" }
      );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
