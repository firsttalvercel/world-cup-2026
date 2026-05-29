"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/types";
import { convertToMadridTime } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

export function TodayMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMatches() {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data.matches ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-16 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayMatches = matches.filter(
    (m) => m.date === today && m.homeTeam && m.awayTeam
  );

  const displayed =
    todayMatches.length > 0
      ? todayMatches
      : matches
          .filter((m) => m.date >= today && m.homeTeam && m.awayTeam)
          .slice(0, 3);

  if (displayed.length === 0) return null;

  const isToday = todayMatches.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isToday ? "Today's Matches" : "Upcoming Matches"}
          </h2>
          {isToday && (
            <span className="flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMatches}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <Link
            href="/matches"
            className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 font-medium"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      <div className="space-y-3">
        {displayed.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  if (!match.homeTeam || !match.awayTeam) return null;

  const madridTime = convertToMadridTime(match.date, match.time);
  const isLive = match.status === "live";
  const isDone = match.status === "finished";
  const showScore = isLive || isDone;

  return (
    <div className={`match-card flex items-center gap-4 ${isLive ? "border-red-500/40 shadow-red-500/10 shadow-lg" : ""}`}>
      <div className="text-center min-w-[60px]">
        {isLive ? (
          <div className="flex items-center gap-1 justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold text-red-500">LIVE</span>
          </div>
        ) : (
          <>
            <p className="text-sm font-bold text-brand-500">{madridTime}</p>
            <p className="text-xs text-gray-400">Madrid</p>
          </>
        )}
      </div>

      <div className="flex-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
            {match.homeTeam.name}
          </span>
          <span className="text-xl">{match.homeTeam.flag}</span>
        </div>

        <div className="text-center px-3">
          {showScore ? (
            <span className={`text-base font-black tabular-nums ${isLive ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
              {match.homeScore ?? 0} – {match.awayScore ?? 0}
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
              vs
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{match.awayTeam.flag}</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      <div className="text-right min-w-[80px] hidden md:block">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {match.stadiumName}
        </p>
        {match.group && (
          <p className="text-xs text-brand-500 font-medium">
            Group {match.group}
          </p>
        )}
      </div>
    </div>
  );
}
