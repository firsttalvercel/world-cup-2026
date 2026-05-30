"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import groupsData from "@/data/groups.json";
import matchesData from "@/data/matches.json";
import type { Group, GroupStanding, Match } from "@/types";
import { formatMatchDate, formatMatchTime, getStageBadgeColor, DATA_TZ } from "@/lib/utils";
import { useTimezoneContext } from "@/lib/TimezoneContext";

const groups = groupsData as Group[];
const allMatches = matchesData as Match[];

const POS_ORDER = ["G", "D", "M", "F"];
const POS_LABEL: Record<string, string> = { G: "Goalkeeper", D: "Defender", M: "Midfielder", F: "Forward" };

interface SquadPlayer {
  id: number;
  name: string;
  age: number;
  number: number;
  position: string;
  photo: string;
}

function SquadSection({ teamCode }: { teamCode: string }) {
  const [players, setPlayers] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/squads/${teamCode}`)
      .then((r) => r.json())
      .then((d) => setPlayers(d.players ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [teamCode]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-10 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        Squad not available yet — will populate before the tournament starts
      </div>
    );
  }

  const grouped = POS_ORDER.reduce<Record<string, SquadPlayer[]>>((acc, pos) => {
    acc[pos] = players.filter((p) => p.position?.[0] === pos);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {POS_ORDER.map((pos) => {
        const group = grouped[pos];
        if (!group?.length) return null;
        return (
          <div key={pos}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              {POS_LABEL[pos]}s ({group.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                >
                  <span className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-black flex items-center justify-center shrink-0">
                    {p.number || "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {p.name}
                    </p>
                    {p.age > 0 && (
                      <p className="text-xs text-gray-400">Age {p.age}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function TeamPage() {
  const { code } = useParams<{ code: string }>();
  const { userTz, hour12, ready: tzReady } = useTimezoneContext();

  const upperCode = code.toUpperCase();

  // Find team in groups
  let standing: GroupStanding | null = null;
  let group: Group | null = null;
  let rank = 1;

  for (const g of groups) {
    const sorted = [...g.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    const idx = sorted.findIndex((s) => s.team.code === upperCode);
    if (idx !== -1) {
      standing = sorted[idx];
      group = g;
      rank = idx + 1;
      break;
    }
  }

  if (!standing || !group) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400">Team not found.</p>
        <Link href="/teams" className="mt-4 inline-flex items-center gap-1 text-brand-500 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Teams
        </Link>
      </div>
    );
  }

  const { team } = standing;

  const teamMatches = allMatches.filter(
    (m) => m.homeTeam?.code === upperCode || m.awayTeam?.code === upperCode
  );

  const finished = teamMatches.filter((m) => m.status === "finished");
  const upcoming = teamMatches.filter((m) => m.status === "upcoming");

  function getResult(m: Match) {
    const isHome = m.homeTeam?.code === upperCode;
    const tf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const ta = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
    if (tf > ta) return { label: "W", color: "text-emerald-500 bg-emerald-500/10" };
    if (tf === ta) return { label: "D", color: "text-gray-400 bg-gray-100 dark:bg-gray-800" };
    return { label: "L", color: "text-red-400 bg-red-500/10" };
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back */}
      <Link href="/teams" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-500 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> All Teams
      </Link>

      {/* Hero */}
      <div className="flex items-center gap-5 mb-8">
        <span className="text-7xl">{team.flag}</span>
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">{team.name}</h1>
          <Link href="/groups" className="text-sm text-brand-500 hover:text-brand-400">
            Group {group.id} · Rank #{rank}
          </Link>
        </div>
      </div>

      {/* Stats row */}
      {standing.played > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Points", value: standing.points },
            { label: "W / D / L", value: `${standing.won}/${standing.drawn}/${standing.lost}` },
            { label: "Goals", value: `${standing.goalsFor}–${standing.goalsAgainst}` },
            { label: "Played", value: standing.played },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-10">
        {/* Upcoming fixtures */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-500" /> Upcoming
            </h2>
            <div className="space-y-2">
              {upcoming.map((m) => {
                const opp = m.homeTeam?.code === upperCode ? m.awayTeam : m.homeTeam;
                const isHome = m.homeTeam?.code === upperCode;
                const time = tzReady ? formatMatchTime(m.date, m.time, userTz, hour12) : m.time;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{opp?.flag}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {isHome ? "vs" : "@"} {opp?.name}
                        </p>
                        <p className="text-xs text-gray-400">{formatMatchDate(m.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-500">{time}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStageBadgeColor(m.stage)}`}>
                        {m.group ? `Group ${m.group}` : m.stage}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Results */}
        {finished.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Results</h2>
            <div className="space-y-2">
              {finished.map((m) => {
                const opp = m.homeTeam?.code === upperCode ? m.awayTeam : m.homeTeam;
                const isHome = m.homeTeam?.code === upperCode;
                const tf = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
                const ta = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
                const res = getResult(m);
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${res.color}`}>
                        {res.label}
                      </span>
                      <span className="text-xl">{opp?.flag}</span>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {isHome ? "vs" : "@"} {opp?.name}
                      </p>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                      {tf} – {ta}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Squad */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> Squad
          </h2>
          <SquadSection teamCode={upperCode} />
        </section>
      </div>
    </div>
  );
}
