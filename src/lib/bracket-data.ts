import type { RoundKey } from "@/lib/supabase";

/**
 * WC2026 R32 bracket template.
 * Each entry is [position1, position2] where positions are:
 *   "1A" = 1st place Group A
 *   "2B" = 2nd place Group B
 *   "3C" = 3rd place Group C (8 best 3rd-place qualify)
 *
 * Bracket seeding follows the standard group-cross pairing pattern.
 * The 3rd-place draw (matches 13-16) uses the best available 3rd-placed teams.
 */
export const R32_TEMPLATE: [string, string][] = [
  // Top half
  ["1A", "2B"],
  ["1C", "2D"],
  ["1E", "2F"],
  ["1G", "2H"],
  ["1I", "2J"],
  ["1K", "2L"],
  ["1B", "2A"],
  ["1D", "2C"],
  // Bottom half
  ["1F", "2E"],
  ["1H", "2G"],
  ["1J", "2I"],
  ["1L", "2K"],
  // 3rd place slots (best 8 of 12 advance)
  ["3A", "3B"],
  ["3C", "3D"],
  ["3E", "3F"],
  ["3G", "3H"],
];

export const ROUND_CONFIG = [
  { key: "r32"   as RoundKey, label: "Round of 32", short: "R32", count: 16, gap: 8   },
  { key: "r16"   as RoundKey, label: "Round of 16", short: "R16", count: 8,  gap: 24  },
  { key: "qf"    as RoundKey, label: "Quarterfinal", short: "QF", count: 4,  gap: 56  },
  { key: "sf"    as RoundKey, label: "Semifinal",    short: "SF", count: 2,  gap: 120 },
  { key: "final" as RoundKey, label: "Final",        short: "F",  count: 1,  gap: 248 },
];

/**
 * Given a position string like "1A", return the team from groups data.
 * seed=0 for 1st place, seed=1 for 2nd, seed=2 for 3rd.
 */
export function resolvePosition(
  position: string,
  groupsMap: Record<string, { name: string; flag: string }[]>
): { name: string; flag: string } | null {
  const seed = parseInt(position[0]) - 1;
  const groupId = position[1];
  const teams = groupsMap[groupId];
  if (!teams || !teams[seed]) return null;
  return teams[seed];
}

/**
 * Build a flat map of all team names → flag for quick lookup.
 */
export function buildTeamFlagMap(
  groupsMap: Record<string, { name: string; flag: string }[]>
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const teams of Object.values(groupsMap)) {
    for (const t of teams) {
      map[t.name] = t.flag;
    }
  }
  return map;
}

/**
 * Get the two team names for a bracket match.
 * For R32, resolved from template + groups data.
 * For later rounds, resolved from previous round picks.
 */
export function getMatchTeams(
  roundIdx: number,
  matchIdx: number,
  picks: Record<RoundKey, (string | null)[]>,
  groupsMap: Record<string, { name: string; flag: string }[]>
): [string | null, string | null] {
  if (roundIdx === 0) {
    const [pos1, pos2] = R32_TEMPLATE[matchIdx];
    const t1 = resolvePosition(pos1, groupsMap);
    const t2 = resolvePosition(pos2, groupsMap);
    return [t1?.name ?? null, t2?.name ?? null];
  }
  const prevKey = ROUND_CONFIG[roundIdx - 1].key;
  return [
    picks[prevKey][matchIdx * 2] ?? null,
    picks[prevKey][matchIdx * 2 + 1] ?? null,
  ];
}

/**
 * Apply a pick, clearing downstream slots in that bracket branch.
 */
export function applyPick(
  prev: Record<RoundKey, (string | null)[]>,
  roundIdx: number,
  matchIdx: number,
  team: string
): Record<RoundKey, (string | null)[]> {
  const next = { ...prev };
  const roundKey = ROUND_CONFIG[roundIdx].key;

  next[roundKey] = [...prev[roundKey]];
  next[roundKey][matchIdx] = team;

  // Clear all downstream picks in this bracket branch
  let idx = matchIdx;
  for (let r = roundIdx + 1; r < ROUND_CONFIG.length; r++) {
    idx = Math.floor(idx / 2);
    const rKey = ROUND_CONFIG[r].key;
    next[rKey] = [...prev[rKey]];
    next[rKey][idx] = null;
  }

  return next;
}
