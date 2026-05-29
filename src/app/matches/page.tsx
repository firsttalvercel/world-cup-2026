"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Filter, X, RefreshCw } from "lucide-react";
import type { Match, MatchStage } from "@/types";
import {
  groupMatchesByDate,
  formatMatchDate,
  convertToMadridTime,
  getStageBadgeColor,
} from "@/lib/utils";
import { motion } from "framer-motion";

const allGroups = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const allStages: MatchStage[] = ["Group Stage","Round of 32","Round of 16","Quarterfinal","Semifinal","Third Place","Final"];

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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
    // Auto-refresh every 60s during the tournament
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, []);

  const allTeams = useMemo(() =>
    Array.from(new Set(matches.flatMap((m) => [m.homeTeam?.name, m.awayTeam?.name]).filter(Boolean))).sort() as string[],
    [matches]
  );

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (teamFilter && m.homeTeam?.name !== teamFilter && m.awayTeam?.name !== teamFilter) return false;
      if (groupFilter && m.group !== groupFilter) return false;
      if (stageFilter && m.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.homeTeam?.name?.toLowerCase().includes(q) ||
          m.awayTeam?.name?.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          m.stadiumName.toLowerCase().includes(q) ||
          m.stage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [matches, search, teamFilter, groupFilter, stageFilter]);

  const byDate = groupMatchesByDate(filtered);
  const sortedDates = Object.keys(byDate).sort();
  const hasFilters = teamFilter || groupFilter || stageFilter || search;

  function clearFilters() {
    setSearch(""); setTeamFilter(""); setGroupFilter(""); setStageFilter("");
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Match Schedule
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            All {matches.length} matches — times shown in{" "}
            <span className="text-brand-500 font-medium">Spain (Madrid) timezone</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 shrink-0">
          {lastUpdated && (
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
          <button
            onClick={fetchMatches}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams, cities, stadiums..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 text-sm transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
              showFilters || hasFilters
                ? "border-brand-500 bg-brand-500/10 text-brand-500"
                : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-brand-500" />}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
              <option value="">All Teams</option>
              {allTeams.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
              <option value="">All Groups</option>
              {allGroups.map((g) => <option key={g} value={g}>Group {g}</option>)}
            </select>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50">
              <option value="">All Stages</option>
              {allStages.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </motion.div>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Showing <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> matches
      </p>

      {/* Loading skeleton */}
      {loading && matches.length === 0 && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      )}

      {/* Match list grouped by date */}
      {sortedDates.length === 0 && !loading ? (
        <div className="text-center py-20 text-gray-400">No matches found.</div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <section key={date}>
              <div className="sticky top-16 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm py-2 mb-4 border-b border-gray-100 dark:border-gray-800/60">
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                  {formatMatchDate(date)}
                </h2>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Time (Madrid)</th>
                      <th className="px-4 py-3 text-right">Home</th>
                      <th className="px-4 py-3 text-center w-20">Score</th>
                      <th className="px-4 py-3 text-left">Away</th>
                      <th className="px-4 py-3 text-left">Stage</th>
                      <th className="px-4 py-3 text-left">Matchday</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {byDate[date].map((match) => (
                      <MatchRow key={match.id} match={match} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {byDate[date].map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchRow({ match }: { match: Match }) {
  const madridTime = convertToMadridTime(match.date, match.time);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
      <td className="px-4 py-4">
        <span className="font-bold text-brand-500">{madridTime}</span>
        {match.status === "live" && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> LIVE
          </span>
        )}
      </td>
      <td className="px-4 py-4 text-right">
        {match.homeTeam ? (
          <span className="font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-2">
            {match.homeTeam.name} <span className="text-xl">{match.homeTeam.flag}</span>
          </span>
        ) : <span className="text-gray-400 italic">TBD</span>}
      </td>
      <td className="px-4 py-4 text-center">
        {match.status === "finished" || match.status === "live" ? (
          <span className={`font-black text-gray-900 dark:text-white ${match.status === "live" ? "text-red-400" : ""}`}>
            {match.homeScore ?? 0}–{match.awayScore ?? 0}
          </span>
        ) : (
          <span className="text-gray-400 text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">vs</span>
        )}
      </td>
      <td className="px-4 py-4">
        {match.awayTeam ? (
          <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">{match.awayTeam.flag}</span> {match.awayTeam.name}
          </span>
        ) : <span className="text-gray-400 italic">TBD</span>}
      </td>
      <td className="px-4 py-4">
        <span className={`group-badge text-xs ${getStageBadgeColor(match.stage)}`}>
          {match.group ? `Group ${match.group}` : match.stage}
        </span>
      </td>
      <td className="px-4 py-4 text-gray-500 dark:text-gray-400 text-xs">
        {match.matchday ? `MD ${match.matchday}` : "—"}
      </td>
    </tr>
  );
}

function MatchCard({ match }: { match: Match }) {
  const madridTime = convertToMadridTime(match.date, match.time);

  return (
    <div className="match-card">
      <div className="flex items-center justify-between mb-3">
        <span className={`group-badge text-xs ${getStageBadgeColor(match.stage)}`}>
          {match.group ? `Group ${match.group}` : match.stage}
        </span>
        {match.status === "live" && (
          <span className="flex items-center gap-1 text-xs text-red-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> LIVE
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end text-right">
          {match.homeTeam ? (
            <><span className="text-sm font-bold text-gray-900 dark:text-white">{match.homeTeam.name}</span>
            <span className="text-2xl">{match.homeTeam.flag}</span></>
          ) : <span className="text-gray-400 text-sm italic">TBD</span>}
        </div>
        <div className="text-center min-w-[60px]">
          {match.status === "finished" || match.status === "live" ? (
            <span className={`text-base font-black ${match.status === "live" ? "text-red-400" : "text-gray-900 dark:text-white"}`}>
              {match.homeScore ?? 0}–{match.awayScore ?? 0}
            </span>
          ) : (
            <div>
              <p className="text-xs font-bold text-brand-500">{madridTime}</p>
              <p className="text-xs text-gray-400">Madrid</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 text-left">
          {match.awayTeam ? (
            <><span className="text-2xl">{match.awayTeam.flag}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{match.awayTeam.name}</span></>
          ) : <span className="text-gray-400 text-sm italic">TBD</span>}
        </div>
      </div>
    </div>
  );
}
