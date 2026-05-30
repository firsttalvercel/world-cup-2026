import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamCode: string }> }
) {
  const { teamCode } = await params;
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("team_squads")
    .select("squad")
    .eq("team_code", teamCode.toUpperCase())
    .single();

  if (error || !data?.squad) {
    return NextResponse.json({ players: [] });
  }

  // Normalize player shape
  const players = (data.squad as any[]).map((p: any) => ({
    id: p.id,
    name: p.name,
    age: p.age ?? 0,
    number: p.number ?? 0,
    position: p.position ?? "",
    photo: p.photo ?? "",
  }));

  return NextResponse.json({ players });
}
