"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Save, Share2, Check, RefreshCw } from "lucide-react";
import { supabase, emptyPicks, type Picks, type RoundKey } from "@/lib/supabase";
import {
  ROUND_CONFIG,
  getMatchTeams,
  applyPick,
  buildTeamFlagMap,
} from "@/lib/bracket-data";
import type { Group } from "@/types";

const STORAGE_KEYS = {
  id: "wc2026_pred_id",
  picks: "wc2026_pred_picks",
  author: "wc2026_pred_author",
};

export default function PredictPage() {
  const [picks, setPicks] = useState<Picks>(emptyPicks());
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsMap, setGroupsMap] = useState<Record<string, { name: string; flag: string }[]>>({});
  const [flagMap, setFlagMap] = useState<Record<string, string>>({});
  const [authorName, setAuthorName] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load groups data
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => {
        const g: Group[] = d.groups ?? [];
        setGroups(g);
        const map: Record<string, { name: string; flag: string }[]> = {};
        for (const group of g) {
          map[group.id] = group.standings.map((s) => ({
            name: s.team.name,
            flag: s.team.flag,
          }));
        }
        setGroupsMap(map);
        setFlagMap(buildTeamFlagMap(map));
      });

    // Restore from localStorage
    try {
      const id = localStorage.getItem(STORAGE_KEYS.id);
      const p = localStorage.getItem(STORAGE_KEYS.picks);
      const a = localStorage.getItem(STORAGE_KEYS.author);
      if (id) setSavedId(id);
      if (p) setPicks(JSON.parse(p));
      if (a) setAuthorName(a);
    } catch {}

    setLoading(false);
  }, []);

  function handlePick(roundIdx: number, matchIdx: number, team: string) {
    setPicks((prev) => {
      const next = applyPick(prev, roundIdx, matchIdx, team);
      try { localStorage.setItem(STORAGE_KEYS.picks, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  async function savePrediction() {
    setSaving(true);
    try {
      const champion = picks.final[0] ?? null;
      const payload = {
        author_name: authorName.trim() || "Anonymous",
        picks,
        champion,
        champion_flag: champion ? (flagMap[champion] ?? null) : null,
        updated_at: new Date().toISOString(),
      };

      if (savedId) {
        await supabase.from("predictions").update(payload).eq("id", savedId);
      } else {
        const { data, error } = await supabase
          .from("predictions")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setSavedId(data.id);
        try {
          localStorage.setItem(STORAGE_KEYS.id, data.id);
          localStorage.setItem(STORAGE_KEYS.author, authorName);
        } catch {}
      }
    } catch (e) {
      console.error("Failed to save prediction:", e);
    } finally {
      setSaving(false);
    }
  }

  async function copyShareLink() {
    if (!savedId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/predict/${savedId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  function resetBracket() {
    setPicks(emptyPicks());
    setSavedId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.id);
      localStorage.removeItem(STORAGE_KEYS.picks);
    } catch {}
  }

  const totalPicks = Object.values(picks).flat().filter(Boolean).length;
  const maxPicks = 31;
  const champion = picks.final[0];
  const progress = Math.round((totalPicks / maxPicks) * 100);

  return (
    <div className="max-w-full px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
              Prediction Bracket
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Pick your winners round by round —{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{totalPicks}</span>
              /{maxPicks} picks made
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 w-44"
            />
            <button
              onClick={savePrediction}
              disabled={saving || totalPicks === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {saving
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Save className="w-4 h-4" />}
              {savedId ? "Update" : "Save"}
            </button>
            {savedId && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {copied
                  ? <Check className="w-4 h-4 text-emerald-500" />
                  : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            )}
            {totalPicks > 0 && (
              <button
                onClick={resetBracket}
                className="px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Saved banner */}
        {savedId && (
          <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Bracket saved.</span>
            <code className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-mono break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/predict/${savedId}`
                : `/predict/${savedId}`}
            </code>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">{progress}%</span>
        </div>
      </div>

      {/* Bracket */}
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
              {/* Round header */}
              <div className="text-center mb-5">
                <span className="inline-block bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider px-3 py-1.5 rounded-full border border-brand-500/20">
                  {round.label}
                </span>
                <p className="text-[10px] text-gray-400 mt-1">{round.count} matches</p>
              </div>

              {/* Match slots */}
              <div className="flex flex-col" style={{ gap: `${round.gap}px` }}>
                {Array.from({ length: round.count }).map((_, matchIdx) => {
                  const [t1Name, t2Name] = getMatchTeams(
                    roundIdx, matchIdx, picks, groupsMap
                  );
                  const winner = picks[round.key][matchIdx];

                  const t1 = t1Name ? { name: t1Name, flag: flagMap[t1Name] ?? "🏴" } : null;
                  const t2 = t2Name ? { name: t2Name, flag: flagMap[t2Name] ?? "🏴" } : null;

                  return (
                    <PredictSlot
                      key={matchIdx}
                      team1={t1}
                      team2={t2}
                      winner={winner}
                      onPick={(team) => handlePick(roundIdx, matchIdx, team)}
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
                <span className="text-4xl">{flagMap[champion] ?? "🏆"}</span>
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

      {/* Info */}
      <div className="max-w-7xl mx-auto mt-4">
        <p className="text-xs text-gray-400 text-center">
          Click a team to pick them as the winner — they advance automatically to the next round.
          Save your bracket to get a shareable link.
          Teams seeded from current group standings (updates when tournament begins).
        </p>
      </div>
    </div>
  );
}

// ---- Components ----

function PredictSlot({
  team1,
  team2,
  winner,
  onPick,
}: {
  team1: { name: string; flag: string } | null;
  team2: { name: string; flag: string } | null;
  winner: string | null;
  onPick: (team: string) => void;
}) {
  return (
    <div className="w-44 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <TeamButton
        team={team1}
        isWinner={winner !== null && winner === team1?.name}
        isLoser={winner !== null && winner !== team1?.name}
        onClick={() => team1 && onPick(team1.name)}
      />
      <div className="h-px bg-gray-100 dark:bg-gray-800" />
      <TeamButton
        team={team2}
        isWinner={winner !== null && winner === team2?.name}
        isLoser={winner !== null && winner !== team2?.name}
        onClick={() => team2 && onPick(team2.name)}
      />
    </div>
  );
}

function TeamButton({
  team,
  isWinner,
  isLoser,
  onClick,
}: {
  team: { name: string; flag: string } | null;
  isWinner: boolean;
  isLoser: boolean;
  onClick: () => void;
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
    <button
      onClick={onClick}
      className={`w-full px-3 py-2.5 flex items-center gap-2 text-left transition-all duration-150 min-h-[40px] ${
        isWinner
          ? "bg-emerald-50 dark:bg-emerald-900/25"
          : isLoser
          ? "opacity-35"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer active:scale-95"
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
      {isWinner && (
        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
      )}
    </button>
  );
}
