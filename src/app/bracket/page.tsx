"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Match } from "@/types";
import { formatMatchTime, formatShortDate } from "@/lib/utils";
import { RedCards } from "@/components/ui/RedCards";
import { useTimezoneContext } from "@/lib/TimezoneContext";
import { RefreshCw } from "lucide-react";

const ROUND_ORDER = [
  { stage: "Round of 32", api: "LAST_32", short: "R32" },
  { stage: "Round of 16", api: "LAST_16", short: "R16" },
  { stage: "Quarterfinal", api: "QUARTER_FINALS", short: "QF" },
  { stage: "Semifinal", api: "SEMI_FINALS", short: "SF" },
  { stage: "Final", api: "FINAL", short: "F" },
];

function MatchSlot({ match, userTz, hour12 }: { match: Match | null; userTz: string; hour12?: boolean }) {
  const tbd = !match?.homeTeam && !match?.awayTeam;
  const localTime = match ? formatMatchTime(match.date, match.time, userTz, hour12) : null;
  const isLive = match?.status === "live";
  const isDone = match?.status === "finished";

  return (
    <div className={`
      w-44 rounded-xl border overflow-hidden transition-all duration-200
      ${isLive
        ? "border-red-500/60 shadow-lg shadow-red-500/20"
        : isDone
        ? "border-gray-300 dark:border-gray-700"
        : "border-gray-200 dark:border-gray-800"}
      bg-white dark:bg-gray-900
    `}>
      {/* Home team */}
      <div className={`px-3 py-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800
        ${isDone && match.homeScore! > match.awayScore! ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}>
        <span className="text-base w-6 text-center">
          {match?.homeTeam?.flag ?? "🏴"}
        </span>
        <span className={`text-xs flex-1 truncate font-semibold
          ${tbd ? "text-gray-400 italic" : "text-gray-800 dark:text-gray-200"}`}>
          {match?.homeTeam?.name ?? "TBD"}
        </span>
        <RedCards count={match?.homeRedCards} />
        {(isDone || isLive) && (
          <span className={`text-xs font-black tabular-nums ${isLive ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
            {match?.homeScore ?? 0}
          </span>
        )}
      </div>

      {/* Away team */}
      <div className={`px-3 py-2 flex items-center gap-2
        ${isDone && match.awayScore! > match.homeScore! ? "bg-emerald-50 dark:bg-emerald-900/20" : ""}`}>
        <span className="text-base w-6 text-center">
          {match?.awayTeam?.flag ?? "🏴"}
        </span>
        <span className={`text-xs flex-1 truncate font-semibold
          ${tbd ? "text-gray-400 italic" : "text-gray-800 dark:text-gray-200"}`}>
          {match?.awayTeam?.name ?? "TBD"}
        </span>
        <RedCards count={match?.awayRedCards} />
        {(isDone || isLive) && (
          <span className={`text-xs font-black tabular-nums ${isLive ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
            {match?.awayScore ?? 0}
          </span>
        )}
      </div>

      {/* Date/time footer */}
      {match && !isDone && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800/60 text-center">
          <span className="text-[10px] text-gray-400">
            {formatShortDate(match.date)} · {localTime}
          </span>
        </div>
      )}
      {isLive && (
        <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-center flex items-center justify-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-[10px] font-bold text-red-500">LIVE</span>
        </div>
      )}
    </div>
  );
}

export default function BracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { userTz, hour12, ready: tzReady } = useTimezoneContext();
  const tz = tzReady ? userTz : "UTC";

  async function fetchMatches() {
    setLoading(true);
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(data.matches);
      setLastUpdated(new Date());
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

  // Group matches by stage
  const byStage = ROUND_ORDER.map(({ stage, short }) => ({
    stage,
    short,
    matches: matches.filter((m) => m.stage === stage),
  }));

  // Find the winner (Final winner)
  const finalMatch = matches.find((m) => m.stage === "Final");
  const champion =
    finalMatch?.status === "finished"
      ? finalMatch.homeScore! > finalMatch.awayScore!
        ? finalMatch.homeTeam
        : finalMatch.awayTeam
      : null;

  return (
    <div className="max-w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Knockout Bracket
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Teams fill in automatically as each round is played
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 shrink-0">
          {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={fetchMatches} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">📅</span>
          <div>
            <p className="font-semibold text-brand-600 dark:text-brand-400 text-sm">
              Round of 32 starts June 28, 2026
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Teams populate automatically once the group stage ends on July 10. Scores update every 60 seconds during live matches.
            </p>
          </div>
        </div>
      </div>

      {/* Bracket — horizontal scroll */}
      <div className="overflow-x-auto no-scrollbar pb-8">
        <div className="flex gap-6 lg:gap-10 items-start min-w-max px-4 pt-4">
          {byStage.map(({ stage, short, matches: stageMatches }, roundIdx) => {
            // Vertical spacing grows with each round
            const gap = [8, 24, 56, 120, 248][roundIdx] ?? 8;

            return (
              <motion.div
                key={stage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: roundIdx * 0.08 }}
                className="flex flex-col"
              >
                {/* Round header */}
                <div className="text-center mb-5">
                  <span className="inline-block bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand-500/20">
                    {stage}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">{stageMatches.length} matches</p>
                </div>

                {/* Match slots */}
                <div className="flex flex-col" style={{ gap: `${gap}px` }}>
                  {stageMatches.length > 0
                    ? stageMatches.map((match) => (
                        <MatchSlot key={match.id} match={match} userTz={tz} hour12={hour12} />
                      ))
                    : // Skeleton placeholders if no data yet
                      Array.from({ length: [16, 8, 4, 2, 1][roundIdx] }).map((_, i) => (
                        <MatchSlot key={i} match={null} userTz={tz} hour12={hour12} />
                      ))}
                </div>
              </motion.div>
            );
          })}

          {/* Champion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="text-center mb-5">
              <span className="inline-block bg-amber-500/20 text-amber-600 dark:text-yellow-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-amber-500/30">
                Champion
              </span>
            </div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              {champion ? (
                <span className="text-4xl">{champion.flag}</span>
              ) : (
                <span className="text-4xl">🏆</span>
              )}
            </div>
            <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-300">
              {champion ? champion.name : "TBD"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Aug 2 · MetLife Stadium</p>
          </motion.div>
        </div>
      </div>

      {/* Round dates */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { round: "Round of 32", dates: "Jun 28 – Jul 2" },
            { round: "Round of 16", dates: "Jul 6 – Jul 9" },
            { round: "Quarterfinals", dates: "Jul 13 – Jul 14" },
            { round: "Semifinals", dates: "Jul 18 – Jul 19" },
            { round: "Final", dates: "Aug 2" },
          ].map((item) => (
            <div key={item.round}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-800">
              <p className="text-xs font-bold text-gray-900 dark:text-white">{item.round}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.dates}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
