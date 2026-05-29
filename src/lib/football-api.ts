import type { Match, Group, GroupStanding, Team, MatchStage } from "@/types";
import { getCache, setCache, TTL } from "@/lib/cache";

const BASE_URL = "https://api.football-data.org/v4";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY!;
const COMPETITION = "WC";
const SEASON = "2026";

// Rate limit safe: cache aggressively
const HEADERS = {
  "X-Auth-Token": API_KEY,
};

// Country code → flag emoji
// Includes both ISO and football-data.org TLA variants
const FLAG_MAP: Record<string, string> = {
  MEX: "🇲🇽", USA: "🇺🇸", CAN: "🇨🇦", BRA: "🇧🇷", ARG: "🇦🇷",
  FRA: "🇫🇷", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", ESP: "🇪🇸", GER: "🇩🇪", POR: "🇵🇹",
  NED: "🇳🇱", BEL: "🇧🇪", CRO: "🇭🇷", URU: "🇺🇾", COL: "🇨🇴",
  SEN: "🇸🇳", MAR: "🇲🇦", NGA: "🇳🇬", EGY: "🇪🇬", CMR: "🇨🇲",
  CIV: "🇨🇮", GHA: "🇬🇭", RSA: "🇿🇦", TUN: "🇹🇳", DZA: "🇩🇿",
  JPN: "🇯🇵", KOR: "🇰🇷", SAU: "🇸🇦", IRN: "🇮🇷", AUS: "🇦🇺",
  QAT: "🇶🇦", CHN: "🇨🇳", UZB: "🇺🇿", IDN: "🇮🇩", THA: "🇹🇭",
  SRB: "🇷🇸", SUI: "🇨🇭", DNK: "🇩🇰", POL: "🇵🇱", AUT: "🇦🇹",
  TUR: "🇹🇷", SCO: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", GRE: "🇬🇷", HUN: "🇭🇺", SVK: "🇸🇰",
  CZE: "🇨🇿", ROU: "🇷🇴", UKR: "🇺🇦", SWE: "🇸🇪", NOR: "🇳🇴",
  FIN: "🇫🇮", ITA: "🇮🇹", ECU: "🇪🇨", PER: "🇵🇪", CHI: "🇨🇱",
  CHL: "🇨🇱", VEN: "🇻🇪", BOL: "🇧🇴", PAR: "🇵🇾", CRC: "🇨🇷",
  PAN: "🇵🇦", HON: "🇭🇳", SLV: "🇸🇻", JAM: "🇯🇲", TTO: "🇹🇹",
  CUB: "🇨🇺", HTI: "🇭🇹", NZL: "🇳🇿", ALG: "🇩🇿",
  // football-data.org TLA variants that differ from ISO codes
  KSA: "🇸🇦", DEN: "🇩🇰",
  // Teams reported as missing flags
  BIH: "🇧🇦",               // Bosnia-Herzegovina
  HAI: "🇭🇹",               // Haiti (API uses HAI, not HTI)
  CUW: "🇨🇼",               // Curaçao
  CPV: "🇨🇻",               // Cape Verde Islands
  IRQ: "🇮🇶",               // Iraq
  COD: "🇨🇩", DRC: "🇨🇩",  // Congo DR
  JOR: "🇯🇴",               // Jordan
};

function getFlag(tla: string): string {
  return FLAG_MAP[tla] ?? "🏴";
}

function mapStage(stage: string): MatchStage {
  const map: Record<string, MatchStage> = {
    GROUP_STAGE: "Group Stage",
    LAST_32: "Round of 32",
    ROUND_OF_32: "Round of 32",
    LAST_16: "Round of 16",
    ROUND_OF_16: "Round of 16",
    QUARTER_FINALS: "Quarterfinal",
    SEMI_FINALS: "Semifinal",
    THIRD_PLACE: "Third Place",
    FINAL: "Final",
  };
  return map[stage] ?? "Group Stage";
}

function mapStatus(status: string): Match["status"] {
  if (status === "IN_PLAY" || status === "PAUSED" || status === "HALFTIME") return "live";
  if (status === "FINISHED" || status === "AWARDED") return "finished";
  return "upcoming";
}

function mapGroup(group: string | null): string | undefined {
  if (!group) return undefined;
  // "GROUP_A" → "A"
  const match = group.match(/GROUP_([A-L])/);
  return match?.[1];
}

function mapTeam(t: { name: string; tla: string } | null): Team | null {
  if (!t) return null;
  return {
    name: t.name,
    code: t.tla,
    flag: getFlag(t.tla),
  };
}

// Map football-data.org match → our Match type
function mapMatch(m: Record<string, unknown>): Match {
  const utcDate = m.utcDate as string;
  const dateObj = new Date(utcDate);
  const date = dateObj.toISOString().split("T")[0];
  const time = dateObj.toISOString().substring(11, 16); // "HH:MM" UTC

  const score = m.score as Record<string, unknown>;
  const ft = score.fullTime as { home: number | null; away: number | null };
  const homeTeamRaw = m.homeTeam as { name: string; tla: string } | null;
  const awayTeamRaw = m.awayTeam as { name: string; tla: string } | null;

  return {
    id: String(m.id),
    date,
    time,
    homeTeam: mapTeam(homeTeamRaw),
    awayTeam: mapTeam(awayTeamRaw),
    homeScore: ft.home ?? undefined,
    awayScore: ft.away ?? undefined,
    group: mapGroup((m.group as string) ?? null),
    stage: mapStage(m.stage as string),
    stadiumId: String(m.id), // no venue in free tier
    stadiumName: "TBC",
    city: "TBC",
    country: "USA",
    status: mapStatus(m.status as string),
    matchday: m.matchday as number | undefined,
  };
}

// Map standings → our Group type
// Returns empty array if the API doesn't have group-stage data yet (triggers static fallback)
function mapStandings(raw: Record<string, unknown>[]): Group[] {
  const groupMap: Record<string, GroupStanding[]> = {};

  for (const standing of raw) {
    const groupLabel = standing.group as string | null;
    const table = standing.table as Record<string, unknown>[];

    if (!table?.length) continue;

    // Only process entries that have a proper GROUP_X label
    if (!groupLabel) continue;
    const m = groupLabel.match(/GROUP_([A-L])/);
    if (!m) continue;
    const groupId = m[1];

    if (!groupMap[groupId]) groupMap[groupId] = [];

    for (const row of table) {
      const team = row.team as { name: string; tla: string };
      groupMap[groupId].push({
        team: { name: team.name, code: team.tla, flag: getFlag(team.tla), group: groupId },
        played: (row.playedGames as number) ?? 0,
        won: (row.won as number) ?? 0,
        drawn: (row.draw as number) ?? 0,
        lost: (row.lost as number) ?? 0,
        goalsFor: (row.goalsFor as number) ?? 0,
        goalsAgainst: (row.goalsAgainst as number) ?? 0,
        goalDifference: (row.goalDifference as number) ?? 0,
        points: (row.points as number) ?? 0,
        qualified: "pending",
      });
    }
  }

  return Object.entries(groupMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, standings]) => ({
      id,
      name: `Group ${id}`,
      standings,
    }));
}

// ---- Public API ----

export async function getLiveMatches(): Promise<Match[]> {
  const CACHE_KEY = "live_matches";

  // Determine TTL: shorter during an active match day, longer otherwise
  const hasLiveMatch = getCache<Match[]>(CACHE_KEY)?.some(
    (m) => m.status === "live"
  );
  const ttl = hasLiveMatch ? TTL.LIVE : TTL.FIXTURES;

  const cached = getCache<Match[]>(CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(
    `${BASE_URL}/competitions/${COMPETITION}/matches?season=${SEASON}`,
    { headers: HEADERS, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`football-data API error: ${res.status}`);

  const data = await res.json();
  const matches = (data.matches as Record<string, unknown>[]).map(mapMatch);

  // Re-evaluate TTL now that we have fresh data
  const isMatchDay = matches.some((m) => m.status === "live");
  setCache(CACHE_KEY, matches, isMatchDay ? TTL.LIVE : TTL.FIXTURES);

  return matches;
}

export async function getLiveStandings(): Promise<Group[]> {
  const CACHE_KEY = "live_standings";

  const cached = getCache<Group[]>(CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(
    `${BASE_URL}/competitions/${COMPETITION}/standings?season=${SEASON}`,
    { headers: HEADERS, cache: "no-store" }
  );

  if (!res.ok) throw new Error(`football-data API error: ${res.status}`);

  const data = await res.json();
  const groups = mapStandings(data.standings as Record<string, unknown>[]);

  setCache(CACHE_KEY, groups, TTL.STANDINGS);

  return groups;
}
