"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "wc2026_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setFavorites(new Set(JSON.parse(stored)));
    } catch {}
    setReady(true);
  }, []);

  const toggle = useCallback((teamName: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(teamName) ? next.delete(teamName) : next.add(teamName);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (teamName: string) => favorites.has(teamName),
    [favorites]
  );

  return { favorites, toggle, isFavorite, ready };
}
