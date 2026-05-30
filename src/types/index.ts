export interface Team {
  name: string;
  code: string;
  flag: string;
  group?: string;
}

export type MatchStage =
  | "Group Stage"
  | "Round of 32"
  | "Round of 16"
  | "Quarterfinal"
  | "Semifinal"
  | "Third Place"
  | "Final";

export interface Match {
  id: string;
  date: string;
  time: string;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore?: number;
  awayScore?: number;
  homeRedCards?: number;
  awayRedCards?: number;
  group?: string;
  stage: MatchStage;
  stadiumId: string;
  stadiumName: string;
  city: string;
  country: string;
  status: "upcoming" | "live" | "finished";
  matchday?: number;
}

export interface GroupStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualified?: "knockout" | "eliminated" | "pending";
}

export interface Group {
  id: string;
  name: string;
  standings: GroupStanding[];
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: "USA" | "Mexico" | "Canada";
  capacity: number;
  surface: string;
  opened: number;
  image: string;
  description: string;
  latitude: number;
  longitude: number;
  matches: number;
}

export interface HistoricalWinner {
  year: number;
  champion: string;
  runnerUp: string;
  score: string;
  host: string;
  topScorer?: string;
  topScorerGoals?: number;
  goldenBoot?: string;
  goldenBootGoals?: number;
}

export interface TopScorer {
  name: string;
  country: string;
  goals: number;
  years: number[];
}

export interface KnockoutMatch {
  id: string;
  round: string;
  matchNumber: number;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  homeScore?: number;
  awayScore?: number;
  winner?: Team | null;
  date?: string;
  stadiumId?: string;
  status: "upcoming" | "live" | "finished" | "tbd";
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  description: string;
}
