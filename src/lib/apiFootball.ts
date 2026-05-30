const BASE = "https://v3.football.api-sports.io";
const WC_LEAGUE = 1;
const WC_SEASON = 2026;

function headers() {
  return { "x-apisports-key": process.env.API_SPORTS_KEY! };
}

export interface ApiPlayer {
  id: number;
  name: string;
  number: number;
  pos: string;   // G, D, M, F
  grid: string | null; // "1:1", "2:1" etc.
}

export interface ApiLineupTeam {
  formation: string;
  startXI: { player: ApiPlayer }[];
  substitutes: { player: ApiPlayer }[];
  coach: { name: string };
  team: { id: number; name: string };
}

export interface ApiFixture {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
}

// Known name differences between our data and API-Football
const NAME_MAP: Record<string, string> = {
  "south korea": "korea republic",
  "usa": "united states",
  "ivory coast": "côte d'ivoire",
  "czech republic": "czechia",
  "congo dr": "dr congo",
  "cape verde": "cape verde islands",
};

function normalize(name: string): string {
  const lower = name.toLowerCase().trim();
  return NAME_MAP[lower] ?? lower;
}

function teamsMatch(ourName: string, apiName: string): boolean {
  return normalize(ourName) === normalize(apiName);
}

export async function fetchFixturesByDate(date: string): Promise<ApiFixture[]> {
  const url = `${BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}&date=${date}`;
  const res = await fetch(url, { headers: headers(), next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.response ?? [];
}

export async function findApiFixtureId(
  date: string,
  homeTeam: string,
  awayTeam: string
): Promise<number | null> {
  const fixtures = await fetchFixturesByDate(date);
  const match = fixtures.find(
    (f) =>
      teamsMatch(homeTeam, f.teams.home.name) &&
      teamsMatch(awayTeam, f.teams.away.name)
  );
  return match?.fixture.id ?? null;
}

export async function fetchLineups(fixtureId: number): Promise<ApiLineupTeam[] | null> {
  const url = `${BASE}/fixtures/lineups?fixture=${fixtureId}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.response || data.response.length === 0) return null;
  return data.response;
}
