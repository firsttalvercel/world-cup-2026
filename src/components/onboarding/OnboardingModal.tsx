"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Match } from "@/types";

const ONBOARDED_KEY = "wc2026_onboarded";
const FAVORITES_KEY = "wc2026_favorites";

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [teams, setTeams] = useState<{ name: string; flag: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const onboarded = localStorage.getItem(ONBOARDED_KEY);
    const favorites = localStorage.getItem(FAVORITES_KEY);
    const hasFavorites = favorites && JSON.parse(favorites).length > 0;
    if (onboarded || hasFavorites) return;

    setShow(true);

    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        const map = new Map<string, string>();
        for (const m of (data.matches ?? []) as Match[]) {
          if (m.homeTeam?.name) map.set(m.homeTeam.name, m.homeTeam.flag);
          if (m.awayTeam?.name) map.set(m.awayTeam.name, m.awayTeam.flag);
        }
        setTeams(
          Array.from(map.entries())
            .map(([name, flag]) => ({ name, flag }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      })
      .catch(() => {});
  }, []);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function finish() {
    localStorage.setItem(ONBOARDED_KEY, "1");
    if (selected.size > 0) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...selected]));
    }
    setShow(false);
    // Reload so MyTeamsSection picks up the new favorites
    window.location.reload();
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="px-6 pt-8 pb-5">
              <div className="text-4xl mb-3">⚽</div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                Welcome to World Cup 2026
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
                Pick the teams you support and we'll personalize your homepage, schedule and alerts.
              </p>
            </div>

            {/* Teams grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {teams.length === 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="h-12 skeleton rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {teams.map(({ name, flag }) => {
                    const active = selected.has(name);
                    return (
                      <button
                        key={name}
                        onClick={() => toggle(name)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95 ${
                          active
                            ? "bg-brand-500/10 border-brand-500/50 text-brand-600 dark:text-brand-400"
                            : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="text-xl">{flag}</span>
                        <span className="truncate flex-1 text-left">{name}</span>
                        {active && (
                          <span className="text-brand-500 text-xs font-black shrink-0">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <button
                onClick={finish}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-bold text-sm transition-colors"
              >
                {selected.size > 0
                  ? `Follow ${selected.size} team${selected.size > 1 ? "s" : ""} →`
                  : "Skip for now →"}
              </button>
              {selected.size === 0 && (
                <p className="text-center text-xs text-gray-400">
                  You can always star teams from the schedule later
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
