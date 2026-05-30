"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "wc2026_timezone";

export function useTimezone() {
  const [userTz, setUserTzState] = useState<string>("UTC");
  const [hour12, setHour12] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTzState(stored ?? detected);
    setReady(true);
  }, []);

  const setUserTz = (tz: string) => {
    setUserTzState(tz);
    localStorage.setItem(STORAGE_KEY, tz);
  };

  const resetToDetected = () => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTz(detected);
  };

  return { userTz, setUserTz, resetToDetected, hour12, ready };
}
