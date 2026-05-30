"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Check, ExternalLink, Calendar } from "lucide-react";
import { supabase, type Prediction } from "@/lib/supabase";
import { ROUND_CONFIG, getMatchTeams, buildTeamFlagMap } from "@/lib/bracket-data";
import type { Group } from "@/types";
import Link from "next/link";

export default function SharedPredictionPage() {
  const { id } = useParams<{ id: string }>();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [groupsMap, setGroupsMap] = useState<Record<string, { name: string; flag: string }[]>>({});
  const [flagMap, setFlagMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("predictions").select("*").eq("id", id).single(),
      fetch("/api/groups").then((r) => r.json()),
    ]).then(([{ data, error }, groupsData]) => {
      if (error || !data) {
        setNotFound(true);
      } else {
        setPrediction(data as Prediction);
      }

      const groups: Group[] = groupsData.groups ?? [];
      const map: Record<string, { name: string; flag: string }[]> = {};
      for (const g of groups) {
        map[g.id] = g.standings.map((s) => ({ name: s.team.name, flag: s.team.flag }));
      }
      setGroupsMap(map);
      setFlagMap(buildTeamFlagMap(map));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 skeleton rounded-xl max-w-sm mx-auto" />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !prediction) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🏴</div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Bracket not found</h2>
        <p className="text-gray-400 mb-6">This prediction link may be invalid or expired.</p>
        <Link href="/predict" className="btn-primary inline-flex items-center gap-2">
          Make your own bracket
        </Link>
      </div>
    );
  }

  const picks = prediction.picks;
  const champion = prediction.champion;
  const totalPicks = Object.values(picks).flat().filter(Boolean).length;
  const date = new Date(prediction.created_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="max-w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Prediction Bracket</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {prediction.author_name}&apos;s Picks
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {date}
              </span>
              <span>·</span>
              <span>{totalPicks}/31 picks made</span>
              {champion && (
                <>
                  <span>·</span>
                  <span>
                    Champion: <strong className="text-gray-700 dark:text-gray-300">{prediction.champion_flag} {champion}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          <Link
            href="/predict"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Make your own
          </Link>
        </div>

        {/* Read-only banner */}
        <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-400">
          Viewing a read-only bracket. Click &quot;Make your own&quot; to create yours.
        </div>
      </div>

      {/* Bracket — read-only */}
      <div className="overflow-x-auto no-scrollbar pb-8">
        <div className="flex gap-6 lg:gap-10 items-start min-w-max px-4 pt-4">
          {ROUND_CONFIG.map((round, roundIdx) => (
            <motion.div
              key={round.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: roundIdx * 0.07 }}
              className="flex flex-col"
            >
              <div className="text-center mb-5">
                <span className="inline-block bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand-500/20">
                  {round.label}
                </span>
              </div>

              <div className="flex flex-col" style={{ gap: `${round.gap}px` }}>
                {Array.from({ length: round.count }).map((_, matchIdx) => {
                  const [t1Name, t2Name] = getMatchTeams(roundIdx, matchIdx, picks, groupsMap);
                  const winner = picks[round.key][matchIdx];
                  const t1 = t1Name ? { name: t1Name, flag: flagMap[t1Name] ?? "🏴" } : null;
                  const t2 = t2Name ? { name: t2Name, flag: flagMap[t2Name] ?? "🏴" } : null;

                  return (
                    <ReadOnlySlot
                      key={matchIdx}
                      team1={t1}
                      team2={t2}
                      winner={winner}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Champion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col items-center justify-center"
          >
            <div className="text-center mb-5">
              <span className="inline-block bg-amber-500/20 text-amber-600 dark:text-yellow-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-amber-500/30">
                Champion
              </span>
            </div>
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              {champion ? (
                <span className="text-4xl">{prediction.champion_flag ?? "🏆"}</span>
              ) : (
                <Trophy className="w-10 h-10 text-white/70" />
              )}
            </div>
            <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-300 text-center max-w-[96px]">
              {champion ?? "TBD"}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ReadOnlySlot({
  team1,
  team2,
  winner,
}: {
  team1: { name: string; flag: string } | null;
  team2: { name: string; flag: string } | null;
  winner: string | null;
}) {
  return (
    <div className="w-44 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <ReadOnlyTeam team={team1} isWinner={winner === team1?.name} hasWinner={winner !== null} />
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <ReadOnlyTeam team={team2} isWinner={winner === team2?.name} hasWinner={winner !== null} />
    </div>
  );
}

function ReadOnlyTeam({
  team,
  isWinner,
  hasWinner,
}: {
  team: { name: string; flag: string } | null;
  isWinner: boolean;
  hasWinner: boolean;
}) {
  if (!team) {
    return (
      <div className="px-3 py-2.5 flex items-center gap-2 min-h-[40px]">
        <span className="text-gray-300 dark:text-gray-700 text-base w-6 text-center">—</span>
        <span className="text-[11px] text-gray-300 dark:text-gray-700 italic">TBD</span>
      </div>
    );
  }

  return (
    <div
      className={`px-3 py-2.5 flex items-center gap-2 min-h-[40px] ${
        isWinner
          ? "bg-emerald-50 dark:bg-emerald-900/25"
          : hasWinner
          ? "opacity-35"
          : ""
      }`}
    >
      <span className="text-base w-6 text-center shrink-0">{team.flag}</span>
      <span
        className={`text-[11px] flex-1 truncate font-semibold leading-tight ${
          isWinner
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-gray-800 dark:text-gray-200"
        }`}
      >
        {team.name}
      </span>
      {isWinner && <Check className="w-3 h-3 text-emerald-500 shrink-0" />}
    </div>
  );
}
