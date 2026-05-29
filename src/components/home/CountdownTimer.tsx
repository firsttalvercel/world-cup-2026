"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCountdown, OPENING_MATCH_DATE } from "@/lib/utils";

const LABELS = ["Days", "Hours", "Minutes", "Seconds"];

function CountUnit({ value, label }: { value: number; label: string }) {
  const display = String(value).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-3xl bg-gray-900 dark:bg-gray-950 border border-gray-700 dark:border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden">
        {/* Gloss top */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/8 to-transparent pointer-events-none" />
        {/* Split line */}
        <div className="absolute inset-x-0 top-1/2 h-[1.5px] bg-black/60 z-10" />

        <AnimatePresence mode="popLayout">
          <motion.span
            key={display}
            initial={{ y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-white tabular-nums tracking-tight"
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </div>

      <span className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const [countdown, setCountdown] = useState<ReturnType<typeof formatCountdown> | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (now >= OPENING_MATCH_DATE) { setStarted(true); return; }
    setCountdown(formatCountdown(OPENING_MATCH_DATE));
    const interval = setInterval(() => setCountdown(formatCountdown(OPENING_MATCH_DATE)), 1000);
    return () => clearInterval(interval);
  }, []);

  if (started) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl font-black gradient-text">The World Cup has begun!</p>
      </div>
    );
  }

  if (!countdown) {
    return (
      <div className="flex flex-col items-center gap-8">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Countdown to Opening Match</p>
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
          {LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-4 sm:gap-6 lg:gap-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-3xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-widest text-gray-400">{label}</span>
              </div>
              {i < 3 && <span className="text-4xl sm:text-5xl font-black text-gray-300 dark:text-gray-700 pb-10">:</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const units = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Minutes" },
    { value: countdown.seconds, label: "Seconds" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col items-center gap-8"
    >
      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">
        Countdown to Opening Match
      </p>

      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
        {units.map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-4 sm:gap-6 lg:gap-8">
            <CountUnit value={unit.value} label={unit.label} />
            {i < 3 && (
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-300 dark:text-gray-700 pb-12 select-none">
                :
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        June 11, 2026 · Estadio Azteca, Mexico City · 21:00 Madrid
      </p>
    </motion.div>
  );
}
