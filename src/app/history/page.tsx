"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import historyData from "@/data/history.json";
import { Trophy, Target, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["Winners", "Top Scorers", "Teams", "Facts"] as const;
type Tab = (typeof tabs)[number];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <span className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
      {value}{suffix}
    </span>
  );
}

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>("Winners");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          World Cup History
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          92 years of football glory — every champion, record, and legend
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Trophy, label: "Editions", value: 22, color: "from-amber-500 to-orange-500" },
          { icon: Target, label: "Total Goals (avg tournament)", value: 141, color: "from-blue-500 to-cyan-500" },
          { icon: Star, label: "Record goals (1958)", value: 126, color: "from-purple-500 to-pink-500" },
          { icon: Zap, label: "All-time top scorer goals", value: 16, color: "from-emerald-500 to-teal-500" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <AnimatedCounter value={item.value} />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800 pb-0">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all",
              tab === t
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Winners timeline */}
      {tab === "Winners" && (
        <div className="space-y-3">
          {[...historyData.winners].reverse().map((w, i) => (
            <motion.div
              key={w.year}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 hover:border-brand-500/40 transition-all hover:shadow-md"
            >
              <div className="text-center min-w-[60px]">
                <p className="text-lg font-black text-brand-500">{w.year}</p>
                <p className="text-xs text-gray-400">{w.host}</p>
              </div>
              <div className="flex-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-gray-900 dark:text-white">{w.champion}</span>
                </div>
                <span className="text-gray-400 text-sm hidden sm:block">vs</span>
                <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                  {w.runnerUp}
                </div>
                <div className="ml-auto text-right">
                  <span className="text-base font-black text-gray-900 dark:text-white">{w.score}</span>
                </div>
              </div>
              {w.goldenBoot && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 min-w-[160px]">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>{w.goldenBoot} ({w.goldenBootGoals})</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Top Scorers */}
      {tab === "Top Scorers" && (
        <div className="space-y-3">
          {historyData.topScorers.map((scorer, i) => (
            <motion.div
              key={scorer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg font-black text-amber-500">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-white">{scorer.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{scorer.country}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{scorer.goals}</p>
                <p className="text-xs text-gray-400">goals</p>
              </div>
              <div className="hidden sm:block min-w-[120px] text-right">
                <p className="text-xs text-gray-400">{scorer.years.join(", ")}</p>
              </div>
              {/* Goal bar */}
              <div className="hidden md:block w-32">
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                    style={{ width: `${(scorer.goals / 16) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Teams */}
      {tab === "Teams" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {historyData.teamStats.map((team, i) => (
            <motion.div
              key={team.country}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{team.flag}</span>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{team.country}</p>
                  <p className="text-xs text-gray-400">{team.appearances} appearances</p>
                </div>
                {team.titles > 0 && (
                  <div className="ml-auto flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-bold text-amber-500">{team.titles}x</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{team.titles}</p>
                  <p className="text-xs text-gray-400">Titles</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{team.finals}</p>
                  <p className="text-xs text-gray-400">Finals</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2">
                  <p className="text-lg font-black text-gray-900 dark:text-white">{team.semis}</p>
                  <p className="text-xs text-gray-400">Semis</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Facts */}
      {tab === "Facts" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {historyData.facts.map((fact, i) => (
            <motion.div
              key={fact.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:border-brand-500/40 hover:shadow-md transition-all"
            >
              <Zap className="w-5 h-5 text-brand-500 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">{fact.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {fact.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
