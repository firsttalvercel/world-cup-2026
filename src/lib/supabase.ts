import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — uses anon key + RLS
export const supabase = createClient(url, anonKey);

// Server client — uses service role key, bypasses RLS (API routes only)
export function createServerSupabase() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export type Prediction = {
  id: string;
  author_name: string;
  picks: Picks;
  champion: string | null;
  champion_flag: string | null;
  created_at: string;
  updated_at: string;
};

export type RoundKey = "r32" | "r16" | "qf" | "sf" | "final";
export type Picks = Record<RoundKey, (string | null)[]>;

export function emptyPicks(): Picks {
  return {
    r32:   Array(16).fill(null),
    r16:   Array(8).fill(null),
    qf:    Array(4).fill(null),
    sf:    Array(2).fill(null),
    final: Array(1).fill(null),
  };
}
