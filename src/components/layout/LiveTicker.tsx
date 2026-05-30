"use client";

import { useEffect, useState } from "react";
import type { Match } from "@/types";
import { RedCards } from "@/components/ui/RedCards";

export function LiveTicker() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/matches");
        const data = await res.json();
        setLiveMatches((data.matches as Match[]).filter((m) => m.status === "live"));
      } catch {}
    }
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (liveMatches.length === 0) return null;

  // Duplicate items so the scroll loops seamlessly
  const items = [...liveMatches, ...liveMatches];

  return (
    <div className="bg-red-600 text-white text-xs font-bold overflow-hidden h-8 flex items-center">
      <div className="shrink-0 bg-red-700 px-3 h-full flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
        LIVE
      </div>
      <div className="flex-1 overflow-hidden">
        <div
          className="flex gap-8 whitespace-nowrap animate-ticker"
          style={{ animation: `ticker ${liveMatches.length * 6}s linear infinite` }}
        >
          {items.map((m, i) => (
            <span key={`${m.id}-${i}`} className="flex items-center gap-2">
              <span>{m.homeTeam?.flag ?? "🏴"}</span>
              <span>{m.homeTeam?.name ?? "TBD"}</span>
              <RedCards count={m.homeRedCards} />
              <span className="font-black tabular-nums">
                {m.homeScore ?? 0} – {m.awayScore ?? 0}
              </span>
              <RedCards count={m.awayRedCards} />
              <span>{m.awayTeam?.name ?? "TBD"}</span>
              <span>{m.awayTeam?.flag ?? "🏴"}</span>
              <span className="opacity-40 mx-2">·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
