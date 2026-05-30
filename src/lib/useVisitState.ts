"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "wc2026_visit_state";

export interface MatchSnapshot {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
}

export interface VisitState {
  lastVisit: number; // epoch ms
  visitCount: number;
  lastMatchSnapshots: MatchSnapshot[]; // snapshots of favorite-team matches on last visit
}

const DEFAULT: VisitState = {
  lastVisit: 0,
  visitCount: 0,
  lastMatchSnapshots: [],
};

function load(): VisitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

function save(state: VisitState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/** Returns the visit state from the *previous* visit (before updating), plus a function to commit the current visit. */
export function useVisitState() {
  const [prev, setPrev] = useState<VisitState | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = load();
    setPrev(stored);
    setReady(true);
  }, []);

  /** Call once you have the current match snapshots to persist. Updates lastVisit and increments visitCount. */
  function commitVisit(snapshots: MatchSnapshot[]) {
    const stored = load();
    save({
      lastVisit: Date.now(),
      visitCount: stored.visitCount + 1,
      lastMatchSnapshots: snapshots,
    });
  }

  return { prev, ready, commitVisit };
}
