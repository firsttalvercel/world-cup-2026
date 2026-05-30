"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import type { Match } from "@/types";

type EventType = "goal" | "redcard";

type MatchEvent = {
  type: EventType;
  teamName: string;
  teamFlag: string;
};

export function GoalCelebration() {
  const prevState = useRef<
    Record<string, { home: number; away: number; homeRed: number; awayRed: number }>
  >({});
  const [event, setEvent] = useState<MatchEvent | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerGoal = useCallback((flag: string, name: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEvent({ type: "goal", teamFlag: flag, teamName: name });

    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ffffff"];
    confetti({ particleCount: 90, spread: 70, origin: { x: 0.1, y: 0.6 }, colors });
    confetti({ particleCount: 90, spread: 70, origin: { x: 0.9, y: 0.6 }, colors });
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 120,
        origin: { x: 0.5, y: 0.35 },
        startVelocity: 20,
        colors: ["#fbbf24", "#ffffff", "#22c55e"],
      });
    }, 200);

    timerRef.current = setTimeout(() => setEvent(null), 3500);
  }, []);

  const triggerRedCard = useCallback((flag: string, name: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEvent({ type: "redcard", teamFlag: flag, teamName: name });
    timerRef.current = setTimeout(() => setEvent(null), 3000);
  }, []);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        const live = (data.matches as Match[]).filter((m) => m.status === "live");

        for (const match of live) {
          const prev = prevState.current[match.id];
          const currHome = match.homeScore ?? 0;
          const currAway = match.awayScore ?? 0;
          const currHomeRed = match.homeRedCards ?? 0;
          const currAwayRed = match.awayRedCards ?? 0;

          if (prev) {
            // Goal detection
            if (currHome > prev.home && match.homeTeam) {
              triggerGoal(match.homeTeam.flag, match.homeTeam.name);
            } else if (currAway > prev.away && match.awayTeam) {
              triggerGoal(match.awayTeam.flag, match.awayTeam.name);
            }
            // Red card detection
            else if (currHomeRed > prev.homeRed && match.homeTeam) {
              triggerRedCard(match.homeTeam.flag, match.homeTeam.name);
            } else if (currAwayRed > prev.awayRed && match.awayTeam) {
              triggerRedCard(match.awayTeam.flag, match.awayTeam.name);
            }
          }

          prevState.current[match.id] = {
            home: currHome,
            away: currAway,
            homeRed: currHomeRed,
            awayRed: currAwayRed,
          };
        }
      } catch {}
    }

    check();
    const interval = setInterval(check, 15_000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerGoal, triggerRedCard]);

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={`${event.type}-${event.teamName}`}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
        >
          {event.type === "goal" ? (
            <GoalOverlay flag={event.teamFlag} name={event.teamName} />
          ) : (
            <RedCardOverlay flag={event.teamFlag} name={event.teamName} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoalOverlay({ flag, name }: { flag: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <motion.span
        initial={{ y: -20, rotate: -10 }}
        animate={{ y: [0, -12, 0], rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-8xl sm:text-9xl drop-shadow-2xl"
      >
        {flag}
      </motion.span>
      <div className="bg-gray-950/90 backdrop-blur-md border border-white/10 text-white px-8 py-4 rounded-2xl text-center shadow-2xl">
        <p className="text-3xl sm:text-4xl font-black tracking-tight">GOAL!</p>
        <p className="text-sm font-semibold text-gray-300 mt-1">{name}</p>
      </div>
    </div>
  );
}

function RedCardOverlay({ flag, name }: { flag: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <motion.span
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-6xl sm:text-7xl drop-shadow-2xl"
        >
          {flag}
        </motion.span>
        <motion.div
          initial={{ rotate: -15, scale: 0.5 }}
          animate={{ rotate: [0, 5, -3, 0], scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-14 h-20 sm:w-16 sm:h-24 bg-red-500 rounded-[3px] shadow-2xl shadow-red-500/60"
        />
      </div>
      <div className="bg-gray-950/90 backdrop-blur-md border border-red-500/30 text-white px-8 py-4 rounded-2xl text-center shadow-2xl">
        <p className="text-2xl sm:text-3xl font-black tracking-tight text-red-400">RED CARD</p>
        <p className="text-sm font-semibold text-gray-300 mt-1">{name}</p>
      </div>
    </div>
  );
}
