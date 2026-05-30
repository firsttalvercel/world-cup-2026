"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Filter, X, RefreshCw, Star, Check } from "lucide-react";
import type { Match, MatchStage } from "@/types";
import {
  groupMatchesByDate,
  formatMatchDate,
  formatMatchTime,
  formatRelativeKickoff,
  getTzAbbr,
  getTodayInTz,
  getStageBadgeColor,
  DATA_TZ,
} from "@/lib/utils";
import { useFavorites } from "@/lib/useFavorites";
import { useTimezoneContext } from "@/lib/TimezoneContext";
import { useScorePredictions, getPredictionResult, type ScorePrediction } from "@/lib/useScorePredictions";
import { RedCards } from "@/components/ui/RedCards";
import { VoteButtons } from "@/components/ui/VoteButtons";
import { NotifyButton } from "@/components/ui/NotifyButton";
import { motion } from "framer-motion";
import type { VoteAggregate } from "@/app/api/votes/route";

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
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { favorites, toggle, isFavorite, ready } = useFavorites();
  const { userTz, hour12, ready: tzReady } = useTimezoneContext();
  const { getPrediction, savePrediction, ready: predsReady } = useScorePredictions();
  const [votes, setVotes] = useState<Record<string, VoteAggregate>>({});
  const todayRef = useRef<HTMLElement | null>(null);
  const scrolledToToday = useRef(false);

  const today = getTodayInTz(DATA_TZ);

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

  useEffect(() => {
    fetch("/api/votes")
      .then((r) => r.json())
      .then((d) => setVotes(d.votes ?? {}))
      .catch(() => {});
    const interval = setInterval(() => {
      fetch("/api/votes")
        .then((r) => r.json())
        .then((d) => setVotes(d.votes ?? {}))
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to today's section once on first load
  useEffect(() => {
    if (!loading && matches.length > 0 && !scrolledToToday.current) {
      scrolledToToday.current = true;
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [loading, matches]);

  const allTeams = useMemo(() =>
    Array.from(new Set(matches.flatMap((m) => [m.homeTeam?.name, m.awayTeam?.name]).filter(Boolean))).sort() as string[],
    [matches]
  );

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (favoritesOnly && favorites.size > 0) {
        if (!favorites.has(m.homeTeam?.name ?? "") && !favorites.has(m.awayTeam?.name ?? "")) return false;
      }
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
  }, [matches, search, teamFilter, groupFilter, stageFilter, favoritesOnly, favorites]);

  const byDate = groupMatchesByDate(filtered);
  const sortedDates = Object.keys(byDate).sort();
  const hasFilters = teamFilter || groupFilter || stageFilter || search || favoritesOnly;

  // Prediction summary across all finished matches
  const predSummary = useMemo(() => {
    if (!predsReady) return null;
    let exact = 0, result = 0, wrong = 0;
    matches.forEach((m) => {
      if (m.status !== "finished") return;
      const pred = getPrediction(m.id);
      if (!pred) return;
      const r = getPredictionResult(pred, m.homeScore ?? 0, m.awayScore ?? 0);
      if (r === "exact") exact++;
      else if (r === "result") result++;
      else wrong++;
    });
    return { exact, result, wrong, total: exact + result + wrong };
  }, [matches, predsReady, getPrediction]);

  function clearFilters() {
    setSearch(""); setTeamFilter(""); setGroupFilter(""); setStageFilter(""); setFavoritesOnly(false);
  }

  function jumpToToday() {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <span className="text-brand-500 font-medium">{tzReady ? getTzAbbr(userTz) : "your local"} timezone</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 shrink-0">
          {lastUpdated && <span className="hidden sm:inline">Updated {lastUpdated.toLocaleTimeString()}</span>}
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

      {/* Prediction summary */}
      {predSummary && predSummary.total > 0 && (
        <div className="mb-6 flex flex-wrap gap-3 items-center p-4 rounded-2xl bg-brand-500/5 border border-brand-500/15">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your predictions</span>
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              {predSummary.exact} exact
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
              {predSummary.result} right result
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              {predSummary.wrong} wrong
            </span>
          </div>
          <span className="text-xs text-gray-400 ml-auto">{predSummary.total} graded</span>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={jumpToToday}
          className="px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
        >
          Jump to Today
        </button>
        {ready && (
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              favoritesOnly
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? "fill-amber-500 text-amber-500" : ""}`} />
            My Teams {favorites.size > 0 && `(${favorites.size})`}
          </button>
        )}
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
              showFilters || (hasFilters && !favoritesOnly)
                ? "border-brand-500 bg-brand-500/10 text-brand-500"
                : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Filter className="w-4 h-4" /> Filters
            {(teamFilter || groupFilter || stageFilter) && <span className="w-2 h-2 rounded-full bg-brand-500" />}
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
        {favoritesOnly && favorites.size === 0 && (
          <span className="ml-2 text-amber-500">— star teams in the list to use this filter</span>
        )}
      </p>

      {/* Loading skeleton */}
      {loading && matches.length === 0 && (
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {sortedDates.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No matches found</h3>
          <p className="text-gray-400 text-sm mb-6">Try adjusting your search or filters</p>
          <button
            onClick={clearFilters}
            className="px-5 py-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold text-sm border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Match list grouped by date */}
      {sortedDates.length > 0 && (
        <div className="space-y-8">
          {sortedDates.map((date) => {
            const isToday = date === today;
            const isPast = date < today;
            return (
              <section
                key={date}
                ref={isToday ? (el) => { todayRef.current = el; } : undefined}
              >
                <div className="sticky top-16 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm py-2 mb-4 border-b border-gray-100 dark:border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <h2 className={`text-sm font-bold uppercase tracking-widest ${
                      isToday ? "text-brand-500" : isPast ? "text-gray-400 dark:text-gray-600" : "text-gray-500 dark:text-gray-400"
                    }`}>
                      {isToday ? "Today — " : ""}{formatMatchDate(date)}
                    </h2>
                    {isToday && (
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/60 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Time</th>
                        <th className="px-4 py-3 text-right">Home</th>
                        <th className="px-4 py-3 text-center w-20">Score</th>
                        <th className="px-4 py-3 text-left">Away</th>
                        <th className="px-4 py-3 text-left">Stage</th>
                        <th className="px-4 py-3 text-left">Matchday</th>
                        <th className="px-4 py-3 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {byDate[date].map((match) => (
                        <MatchRow key={match.id} match={match} isFavorite={isFavorite} onToggleFavorite={toggle} userTz={userTz} hour12={hour12} tzReady={tzReady} prediction={predsReady ? getPrediction(match.id) : null} onSavePrediction={savePrediction} voteData={votes[match.id] ?? null} />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {byDate[date].map((match) => (
                    <MatchCard key={match.id} match={match} isFavorite={isFavorite} onToggleFavorite={toggle} userTz={userTz} hour12={hour12} tzReady={tzReady} prediction={predsReady ? getPrediction(match.id) : null} onSavePrediction={savePrediction} voteData={votes[match.id] ?? null} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StarButton({ teamName, isFavorite, onToggle }: {
  teamName: string;
  isFavorite: (name: string) => boolean;
  onToggle: (name: string) => void;
}) {
  const active = isFavorite(teamName);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(teamName); }}
      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={active ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={`w-3.5 h-3.5 transition-colors ${active ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`} />
    </button>
  );
}

function MatchRow({ match, isFavorite, onToggleFavorite, userTz, hour12, tzReady, prediction, onSavePrediction, voteData }: {
  match: Match;
  isFavorite: (name: string) => boolean;
  onToggleFavorite: (name: string) => void;
  userTz: string;
  hour12: boolean;
  tzReady: boolean;
  prediction: ScorePrediction | null;
  onSavePrediction: (matchId: string, home: number, away: number) => void;
  voteData: VoteAggregate | null;
}) {
  const localTime = tzReady ? formatMatchTime(match.date, match.time, userTz, hour12) : "--:--";
  const tzLabel = tzReady ? getTzAbbr(userTz) : "";
  const startsIn = match.status === "upcoming" ? formatRelativeKickoff(match.date, match.time) : "";
  const homeActive = isFavorite(match.homeTeam?.name ?? "");
  const awayActive = isFavorite(match.awayTeam?.name ?? "");
  const isUpcoming = match.status === "upcoming";
  const isFinished = match.status === "finished";

  return (
    <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${homeActive || awayActive ? "bg-amber-50/40 dark:bg-amber-900/10" : ""}`}>
      <td className="px-4 py-4">
        <span className="font-bold text-brand-500">{localTime}</span>
        <span className="ml-1 text-xs text-gray-400">{tzLabel}</span>
        {match.status === "live" && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> LIVE
          </span>
        )}
        {startsIn && <p className="text-[10px] text-gray-400 mt-0.5">{startsIn}</p>}
      </td>
      <td className="px-4 py-4 text-right">
        {match.homeTeam ? (
          <span className="font-semibold text-gray-900 dark:text-white flex items-center justify-end gap-2">
            <RedCards count={match.homeRedCards} />
            {match.homeTeam.name} <span className="text-xl">{match.homeTeam.flag}</span>
          </span>
        ) : <span className="text-gray-400 italic">TBD</span>}
      </td>
      <td className="px-4 py-4 text-center">
        {isUpcoming ? (
          <div className="space-y-2 min-w-[160px]">
            {match.homeTeam && match.awayTeam && (
              <VoteButtons
                matchId={match.id}
                homeName={match.homeTeam.name}
                homeFlag={match.homeTeam.flag}
                awayName={match.awayTeam.name}
                awayFlag={match.awayTeam.flag}
                voteData={voteData}
              />
            )}
            <ScoreInput matchId={match.id} prediction={prediction} onSave={onSavePrediction} />
          </div>
        ) : (
          <span className={`font-black text-gray-900 dark:text-white ${match.status === "live" ? "text-red-400" : ""}`}>
            {match.homeScore ?? 0}–{match.awayScore ?? 0}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        {match.awayTeam ? (
          <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-xl">{match.awayTeam.flag}</span> {match.awayTeam.name}
            <RedCards count={match.awayRedCards} />
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
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1.5 items-end">
          <div className="flex gap-1 items-center">
            {match.homeTeam && <StarButton teamName={match.homeTeam.name} isFavorite={isFavorite} onToggle={onToggleFavorite} />}
            {match.awayTeam && <StarButton teamName={match.awayTeam.name} isFavorite={isFavorite} onToggle={onToggleFavorite} />}
            {isUpcoming && <NotifyButton matchId={match.id} />}
          </div>
          {isFinished && prediction && (
            <PredictionBadge prediction={prediction} actualHome={match.homeScore ?? 0} actualAway={match.awayScore ?? 0} />
          )}
        </div>
      </td>
    </tr>
  );
}

function MatchCard({ match, isFavorite, onToggleFavorite, userTz, hour12, tzReady, prediction, onSavePrediction, voteData }: {
  match: Match;
  isFavorite: (name: string) => boolean;
  onToggleFavorite: (name: string) => void;
  userTz: string;
  hour12: boolean;
  tzReady: boolean;
  prediction: ScorePrediction | null;
  onSavePrediction: (matchId: string, home: number, away: number) => void;
  voteData: VoteAggregate | null;
}) {
  const localTime = tzReady ? formatMatchTime(match.date, match.time, userTz, hour12) : "--:--";
  const tzLabel = tzReady ? getTzAbbr(userTz) : "";
  const startsIn = match.status === "upcoming" ? formatRelativeKickoff(match.date, match.time) : "";
  const homeActive = isFavorite(match.homeTeam?.name ?? "");
  const awayActive = isFavorite(match.awayTeam?.name ?? "");
  const isUpcoming = match.status === "upcoming";
  const isFinished = match.status === "finished";

  return (
    <div className={`match-card ${homeActive || awayActive ? "border-amber-400/40 dark:border-amber-500/30" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`group-badge text-xs ${getStageBadgeColor(match.stage)}`}>
          {match.group ? `Group ${match.group}` : match.stage}
        </span>
        <div className="flex items-center gap-1">
          {match.status === "live" && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> LIVE
            </span>
          )}
          {match.homeTeam && <StarButton teamName={match.homeTeam.name} isFavorite={isFavorite} onToggle={onToggleFavorite} />}
          {match.awayTeam && <StarButton teamName={match.awayTeam.name} isFavorite={isFavorite} onToggle={onToggleFavorite} />}
          {isUpcoming && <NotifyButton matchId={match.id} />}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 justify-end text-right">
          {match.homeTeam ? (
            <><RedCards count={match.homeRedCards} /><span className="text-sm font-bold text-gray-900 dark:text-white">{match.homeTeam.name}</span>
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
              <p className="text-xs font-bold text-brand-500">{localTime}</p>
              <p className="text-xs text-gray-400">{tzLabel}</p>
              {startsIn && <p className="text-[10px] text-gray-400 mt-0.5">{startsIn}</p>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 text-left">
          {match.awayTeam ? (
            <><span className="text-2xl">{match.awayTeam.flag}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{match.awayTeam.name}</span>
            <RedCards count={match.awayRedCards} /></>
          ) : <span className="text-gray-400 text-sm italic">TBD</span>}
        </div>
      </div>

      {/* Vote + prediction row */}
      {isUpcoming && match.homeTeam && match.awayTeam && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <VoteButtons
            matchId={match.id}
            homeName={match.homeTeam.name}
            homeFlag={match.homeTeam.flag}
            awayName={match.awayTeam.name}
            awayFlag={match.awayTeam.flag}
            voteData={voteData}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Exact score prediction</span>
            <ScoreInput matchId={match.id} prediction={prediction} onSave={onSavePrediction} />
          </div>
        </div>
      )}
      {isFinished && prediction && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-400">Your prediction</span>
          <PredictionBadge prediction={prediction} actualHome={match.homeScore ?? 0} actualAway={match.awayScore ?? 0} />
        </div>
      )}
    </div>
  );
}

// --- Prediction sub-components ---

function ScoreInput({ matchId, prediction, onSave }: {
  matchId: string;
  prediction: ScorePrediction | null;
  onSave: (matchId: string, home: number, away: number) => void;
}) {
  const [home, setHome] = useState(prediction?.home?.toString() ?? "");
  const [away, setAway] = useState(prediction?.away?.toString() ?? "");
  const [saved, setSaved] = useState(!!prediction);

  function handleSave() {
    const h = parseInt(home);
    const a = parseInt(away);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onSave(matchId, h, a);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setSaved(false);
    };
  }

  const inputClass = "w-7 h-7 text-center text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="flex items-center gap-1.5">
      <input type="number" min="0" max="20" value={home} onChange={handleChange(setHome)} className={inputClass} placeholder="0" />
      <span className="text-xs text-gray-400 font-bold">–</span>
      <input type="number" min="0" max="20" value={away} onChange={handleChange(setAway)} className={inputClass} placeholder="0" />
      <button
        onClick={handleSave}
        disabled={home === "" || away === ""}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs font-bold disabled:opacity-30 ${
          saved
            ? "bg-emerald-500 text-white"
            : "bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 border border-brand-500/20"
        }`}
      >
        <Check className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function PredictionBadge({ prediction, actualHome, actualAway }: {
  prediction: ScorePrediction;
  actualHome: number;
  actualAway: number;
}) {
  const result = getPredictionResult(prediction, actualHome, actualAway);
  const styles = {
    exact: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
    result: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50",
    wrong: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  };
  const label = {
    exact: "Exact",
    result: "Result",
    wrong: "Wrong",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[result]}`}>
      {prediction.home}–{prediction.away}
      <span className="opacity-60">·</span>
      {label[result]}
    </span>
  );
}
