"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wc2026_score_preds";

export type ScorePrediction = {
  home: number;
  away: number;
  submittedAt: string;
};

export type PredictionResult = "exact" | "result" | "wrong";

export function getPredictionResult(
  prediction: ScorePrediction,
  actualHome: number,
  actualAway: number
): PredictionResult {
  if (prediction.home === actualHome && prediction.away === actualAway)
    return "exact";
  const predDiff = Math.sign(prediction.home - prediction.away);
  const actualDiff = Math.sign(actualHome - actualAway);
  if (predDiff === actualDiff) return "result";
  return "wrong";
}

export function useScorePredictions() {
  const [predictions, setPredictions] = useState<Record<string, ScorePrediction>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setPredictions(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, []);

  const savePrediction = useCallback((matchId: string, home: number, away: number) => {
    setPredictions((prev) => {
      const next = {
        ...prev,
        [matchId]: { home, away, submittedAt: new Date().toISOString() },
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const getPrediction = useCallback(
    (matchId: string): ScorePrediction | null => {
      return predictions[matchId] ?? null;
    },
    [predictions]
  );

  return { savePrediction, getPrediction, ready };
}
