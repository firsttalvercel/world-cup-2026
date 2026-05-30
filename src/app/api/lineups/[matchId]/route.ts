import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("match_lineups")
    .select("home_lineup, away_lineup, fetched_at")
    .eq("match_id", matchId)
    .single();

  if (error || !data?.home_lineup) {
    return NextResponse.json({ lineup: null });
  }

  return NextResponse.json({
    lineup: {
      home: data.home_lineup,
      away: data.away_lineup,
      fetchedAt: data.fetched_at,
    },
  });
}
