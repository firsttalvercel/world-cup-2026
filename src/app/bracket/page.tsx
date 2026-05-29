"use client";

import { motion } from "framer-motion";

const rounds = [
  {
    name: "Round of 32",
    short: "R32",
    matches: Array.from({ length: 16 }, (_, i) => ({
      id: `r32-${i + 1}`,
      home: "TBD",
      away: "TBD",
      homeflag: "🏴",
      awayflag: "🏴",
    })),
  },
  {
    name: "Round of 16",
    short: "R16",
    matches: Array.from({ length: 8 }, (_, i) => ({
      id: `r16-${i + 1}`,
      home: "TBD",
      away: "TBD",
      homeflag: "🏴",
      awayflag: "🏴",
    })),
  },
  {
    name: "Quarterfinals",
    short: "QF",
    matches: Array.from({ length: 4 }, (_, i) => ({
      id: `qf-${i + 1}`,
      home: "TBD",
      away: "TBD",
      homeflag: "🏴",
      awayflag: "🏴",
    })),
  },
  {
    name: "Semifinals",
    short: "SF",
    matches: Array.from({ length: 2 }, (_, i) => ({
      id: `sf-${i + 1}`,
      home: "TBD",
      away: "TBD",
      homeflag: "🏴",
      awayflag: "🏴",
    })),
  },
  {
    name: "Final",
    short: "F",
    matches: [
      { id: "final", home: "TBD", away: "TBD", homeflag: "🏴", awayflag: "🏴" },
    ],
  },
];

function MatchSlot({
  match,
  size = "sm",
}: {
  match: { id: string; home: string; away: string; homeflag: string; awayflag: string };
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = {
    sm: "w-36 text-xs",
    md: "w-44 text-xs",
    lg: "w-52 text-sm",
  }[size];

  return (
    <div
      className={`${sizeClass} rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:border-brand-500/50 hover:shadow-md transition-all`}
    >
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <span className="text-base">{match.homeflag}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
          {match.home}
        </span>
      </div>
      <div className="px-3 py-2 flex items-center gap-2">
        <span className="text-base">{match.awayflag}</span>
        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate flex-1">
          {match.away}
        </span>
      </div>
    </div>
  );
}

export default function BracketPage() {
  return (
    <div className="max-w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Knockout Bracket
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Round of 32 through the Final — 32 knockout matches total
        </p>
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-semibold text-brand-600 dark:text-brand-400 text-sm">
              Bracket fills in after the Group Stage (July 11, 2026)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              The top 2 teams from each of the 12 groups + 8 best third-placed teams (32 total) advance to the Round of 32.
            </p>
          </div>
        </div>
      </div>

      {/* Bracket — horizontal scroll on mobile */}
      <div className="overflow-x-auto no-scrollbar pb-8">
        <div className="flex gap-8 items-start min-w-max px-4 pt-4">
          {rounds.map((round, roundIdx) => (
            <motion.div
              key={round.name}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: roundIdx * 0.1 }}
              className="flex flex-col"
            >
              {/* Round header */}
              <div className="text-center mb-6">
                <span className="inline-block bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand-500/20">
                  {round.name}
                </span>
              </div>

              {/* Matches */}
              <div
                className="flex flex-col gap-4"
                style={{
                  gap: `${Math.max(16, roundIdx * 48)}px`,
                }}
              >
                {round.matches.map((match) => (
                  <div key={match.id} className="flex items-center">
                    <MatchSlot
                      match={match}
                      size={roundIdx >= 3 ? "lg" : roundIdx >= 2 ? "md" : "sm"}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Champion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="text-center mb-6">
              <span className="inline-block bg-gold-500/20 text-gold-600 dark:text-yellow-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-gold-500/30">
                Champion
              </span>
            </div>
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-pulse-slow">
              <span className="text-5xl">🏆</span>
            </div>
            <p className="mt-4 text-sm font-bold text-gray-500 dark:text-gray-400">
              TBD
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Aug 2, 2026</p>
            <p className="text-xs text-gray-400">MetLife Stadium</p>
          </motion.div>
        </div>
      </div>

      {/* Dates legend */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { round: "Round of 32", dates: "Jul 13–17" },
            { round: "Round of 16", dates: "Jul 18–21" },
            { round: "Quarterfinals", dates: "Jul 23–25" },
            { round: "Semifinals", dates: "Jul 28–29" },
            { round: "Final", dates: "Aug 2" },
          ].map((item) => (
            <div
              key={item.round}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center border border-gray-200 dark:border-gray-800"
            >
              <p className="text-xs font-bold text-gray-900 dark:text-white">{item.round}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.dates}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
