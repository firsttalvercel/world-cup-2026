import matchesData from "@/data/matches.json";
import type { Match } from "@/types";
import { convertToMadridTime, formatShortDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function TodayMatches() {
  const today = new Date().toISOString().split("T")[0];
  const todayMatches = (matchesData as Match[]).filter((m) => m.date === today);

  if (todayMatches.length === 0) {
    const upcoming = (matchesData as Match[])
      .filter((m) => m.date >= today && m.homeTeam)
      .slice(0, 3);

    if (upcoming.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Upcoming Matches
          </h2>
          <Link
            href="/matches"
            className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 font-medium"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {upcoming.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Today&apos;s Matches
          </h2>
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
        </div>
        <Link
          href="/matches"
          className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-400 font-medium"
        >
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="space-y-3">
        {todayMatches.map((match) => (
          <MatchRow key={match.id} match={match} />
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  if (!match.homeTeam || !match.awayTeam) return null;

  const madridTime = convertToMadridTime(match.date, match.time);

  return (
    <div className="match-card flex items-center gap-4">
      <div className="text-center min-w-[60px]">
        <p className="text-sm font-bold text-brand-500">{madridTime}</p>
        <p className="text-xs text-gray-400">Madrid</p>
      </div>

      <div className="flex-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-sm font-semibold text-gray-900 dark:text-white hidden sm:block">
            {match.homeTeam.name}
          </span>
          <span className="text-xl">{match.homeTeam.flag}</span>
        </div>

        <div className="text-center px-3">
          {match.status === "finished" ? (
            <span className="text-base font-black text-gray-900 dark:text-white">
              {match.homeScore} - {match.awayScore}
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
