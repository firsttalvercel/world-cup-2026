"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTimezone } from "./useTimezone";

type TimezoneContextType = ReturnType<typeof useTimezone>;

const TimezoneContext = createContext<TimezoneContextType | null>(null);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const tz = useTimezone();
  return (
    <TimezoneContext.Provider value={tz}>{children}</TimezoneContext.Provider>
  );
}

export function useTimezoneContext() {
  const ctx = useContext(TimezoneContext);
  if (!ctx)
    throw new Error("useTimezoneContext must be used inside TimezoneProvider");
  return ctx;
}
