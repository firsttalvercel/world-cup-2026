import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { endpoint, p256dh, auth, matchId } = await req.json();
    if (!endpoint || !p256dh || !auth || !matchId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        { endpoint, p256dh, auth, match_id: matchId },
        { onConflict: "endpoint,match_id" }
      );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint, matchId } = await req.json();
    if (!endpoint || !matchId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint)
      .eq("match_id", matchId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const endpoint = req.nextUrl.searchParams.get("endpoint");
    if (!endpoint) return NextResponse.json({ matchIds: [] });

    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("match_id")
      .eq("endpoint", endpoint);

    if (error) throw error;
    return NextResponse.json({ matchIds: data.map((r) => r.match_id) });
  } catch {
    return NextResponse.json({ matchIds: [] });
  }
}
