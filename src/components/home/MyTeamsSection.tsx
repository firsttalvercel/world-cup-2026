"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { formatMatchTime, getTzAbbr, formatRelativeKickoff } from "@/lib/utils";
import { useTimezoneContext } from "@/lib/TimezoneContext";
import type { Match } from "@/types";
import type { Group } from "@/types";

function TeamCard({ teamName, matches, groups, userTz, hour12, tzReady }: {
  teamName: string;
  matches: Match[];
  groups: Group[];
  userTz: string;
  hour12: boolean;
  tzReady: boolean;
}) {
  const teamMatches = matches.filter(
    (m) => m.homeTeam?.name === teamName || m.awayTeam?.name === teamName
  );
  const nextMatch = teamMatches.find((m) => m.status === "upcoming");
  const lastMatch = [...teamMatches].reverse().find((m) => m.status === "finished");

  // Find team in group standings
  let groupId: string | null = null;
  let rank: number | null = null;
  let points: number | null = null;
  for (const g of groups) {
    const sorted = [...g.standings].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    const idx = sorted.findIndex((s) => s.team.name === teamName);
    if (idx !== -1) {
      groupId = g.id;
      rank = idx + 1;
      points = sorted[idx].points;
      break;
    }
  }

  const flag = teamMatches[0]?.homeTeam?.name === teamName
    ? teamMatches[0]?.homeTeam?.flag
    : teamMatches[0]?.awayTeam?.flag;

  const getResult = (m: Match) => {
    const isHome = m.homeTeam?.name === teamName;
    const teamScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
    if (teamScore > oppScore) return { label: "W", color: "text-emerald-500" };
    if (teamScore === oppScore) return { label: "D", color: "text-gray-400" };
    return { label: "L", color: "text-red-400" };
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{flag ?? "🏴"}</span>
          <span className="font-bold text-gray-900 dark:text-white">{teamName}</span>
        </div>
        {groupId && (
          <Link href="/groups"
            className="text-xs text-gray-400 hover:text-brand-500 transition-colors">
            Group {groupId} · {rank !== null ? `#${rank}` : "—"} · {points ?? 0} pts
          </Link>
        )}
      </div>

      {/* Next match */}
      {nextMatch && (
        <div className="text-xs bg-brand-500/5 dark:bg-brand-500/10 rounded-xl p-2.5 border border-brand-500/15">
          <p className="text-gray-400 mb-1 font-medium uppercase tracking-wider text-[10px]">Next</p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {nextMatch.homeTeam?.flag} {nextMatch.homeTeam?.name ?? "TBD"}
              <span className="text-gray-400 mx-1">vs</span>
              {nextMatch.awayTeam?.flag} {nextMatch.awayTeam?.name ?? "TBD"}
            </span>
            <div className="text-right shrink-0">
              <p className="font-bold text-brand-500">
                {tzReady ? formatMatchTime(nextMatch.date, nextMatch.time, userTz, hour12) : "--:--"}
                <span className="ml-1 font-normal text-gray-400">{tzReady ? getTzAbbr(userTz) : ""}</span>
              </p>
              {formatRelativeKickoff(nextMatch.date, nextMatch.time) && (
                <p className="text-[10px] text-gray-400">{formatRelativeKickoff(nextMatch.date, nextMatch.time)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Last result */}
      {lastMatch && (() => {
        const opp = lastMatch.homeTeam?.name === teamName ? lastMatch.awayTeam : lastMatch.homeTeam;
        const isHome = lastMatch.homeTeam?.name === teamName;
        const teamScore = isHome ? (lastMatch.homeScore ?? 0) : (lastMatch.awayScore ?? 0);
        const oppScore = isHome ? (lastMatch.awayScore ?? 0) : (lastMatch.homeScore ?? 0);
        const res = getResult(lastMatch);
        return (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <span>Last: {opp?.flag} {opp?.name}</span>
            <span className={`font-black ${res.color}`}>
              {res.label} {teamScore}–{oppScore}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

export function MyTeamsSection() {
  const { favorites, ready } = useFavorites();
  const { userTz, hour12, ready: tzReady } = useTimezoneContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/matches").then((r) => r.json()),
      fetch("/api/groups").then((r) => r.json()),
    ]).then(([matchData, groupData]) => {
      setMatches(matchData.matches ?? []);
      setGroups(groupData.groups ?? []);
    }).catch(() => {});
  }, []);

  if (!ready || favorites.size === 0) return null;

  const teamList = [...favorites];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Teams</h2>
        </div>
        <Link href="/matches?favorites=1"
          className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 font-medium">
          All matches <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamList.map((name) => (
          <TeamCard
            key={name}
            teamName={name}
            matches={matches}
            groups={groups}
            userTz={userTz}
            hour12={hour12}
            tzReady={tzReady}
          />
        ))}
      </div>
    </section>
  );
}
