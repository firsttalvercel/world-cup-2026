"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Group, GroupStanding } from "@/types";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, MinusCircle, RefreshCw } from "lucide-react";

function QualificationIcon({ status }: { status: GroupStanding["qualified"] }) {
  if (status === "knockout") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === "eliminated") return <MinusCircle className="w-4 h-4 text-red-400" />;
  return <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600" />;
}

function GroupTable({ group }: { group: Group }) {
  const sorted = [...group.standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Group {group.id}</h3>
        <span className="text-xs text-gray-400 uppercase tracking-wider">Group Stage</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
              <th className="px-4 py-3 text-left w-6">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-center">P</th>
              <th className="px-4 py-3 text-center">W</th>
              <th className="px-4 py-3 text-center">D</th>
              <th className="px-4 py-3 text-center">L</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">GF</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">GA</th>
              <th className="px-4 py-3 text-center hidden sm:table-cell">GD</th>
              <th className="px-4 py-3 text-center font-bold">Pts</th>
              <th className="px-4 py-3 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {sorted.map((standing, i) => (
              <tr key={standing.team.code}
                className={cn("hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                  i < 2 && "border-l-2 border-emerald-500")}>
                <td className="px-4 py-3.5 text-gray-400 text-xs font-medium">{i + 1}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{standing.team.flag}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{standing.team.name}</span>
                    <span className="text-xs text-gray-400 hidden sm:inline">{standing.team.code}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400">{standing.played}</td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400">{standing.won}</td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400">{standing.drawn}</td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400">{standing.lost}</td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">{standing.goalsFor}</td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">{standing.goalsAgainst}</td>
                <td className="px-4 py-3.5 text-center text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {standing.goalDifference > 0 ? `+${standing.goalDifference}` : standing.goalDifference}
                </td>
                <td className="px-4 py-3.5 text-center font-black text-gray-900 dark:text-white text-base">{standing.points}</td>
                <td className="px-4 py-3.5 text-center"><QualificationIcon status={standing.qualified} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border-l-2 border-emerald-500 bg-emerald-500/10" />
          Advance to Round of 32
        </div>
      </div>
    </motion.div>
  );
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  async function fetchGroups() {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      setGroups(data.groups);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
    const interval = setInterval(fetchGroups, 60_000);
    return () => clearInterval(interval);
  }, []);

  const displayGroups = activeTab === "all" ? groups : groups.filter((g) => g.id === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Group Standings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {groups.length} groups, 48 teams — top 2 from each advance
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 shrink-0">
          {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={fetchGroups} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs — horizontal scroll on mobile, no wrapping */}
      <div className="overflow-x-auto no-scrollbar mb-8">
        <div className="flex gap-1.5 min-w-max pb-1">
          <button onClick={() => setActiveTab("all")}
            className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
              activeTab === "all" ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}>
            All Groups
          </button>
          {groups.map((g) => (
            <button key={g.id} onClick={() => setActiveTab(g.id)}
              className={cn("px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                activeTab === g.id ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700")}>
              Group {g.id}
            </button>
          ))}
        </div>
      </div>

      {loading && groups.length === 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 skeleton rounded-2xl" />)}
        </div>
      )}

      <div className={cn("grid gap-6", activeTab === "all" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 max-w-2xl")}>
        <AnimatePresence mode="wait">
          {displayGroups.map((group) => <GroupTable key={group.id} group={group} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}
