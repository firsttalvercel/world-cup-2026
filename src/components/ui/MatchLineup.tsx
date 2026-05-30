"use client";

import { useState, useEffect } from "react";
import { Users, ChevronDown, ChevronUp, Clock } from "lucide-react";
import type { ApiLineupTeam, ApiPlayer } from "@/lib/apiFootball";

const POS_ORDER = ["G", "D", "M", "F"];
const POS_LABEL: Record<string, string> = { G: "GK", D: "DEF", M: "MID", F: "FWD" };

function groupByPos(players: { player: ApiPlayer }[]) {
  return POS_ORDER.reduce<Record<string, ApiPlayer[]>>((acc, pos) => {
    acc[pos] = players.filter((p) => p.player.pos === pos).map((p) => p.player);
    return acc;
  }, {});
}

function LineupSide({ lineup, label }: { lineup: ApiLineupTeam; label: string }) {
  const grouped = groupByPos(lineup.startXI);
  return (
    <div className="flex-1 min-w-0">
      <div className="mb-2">
        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{label}</p>
        <p className="text-[10px] text-brand-500 font-semibold">{lineup.formation}</p>
        {lineup.coach?.name && (
          <p className="text-[10px] text-gray-400">Coach: {lineup.coach.name}</p>
        )}
      </div>
      <div className="space-y-1.5">
        {POS_ORDER.map((pos) => {
          const players = grouped[pos];
          if (!players?.length) return null;
          return (
            <div key={pos}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                {POS_LABEL[pos]}
              </p>
              <div className="space-y-0.5">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <span className="w-4 text-[10px] font-bold text-gray-400 text-right shrink-0">
                      {p.number}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {lineup.substitutes?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Subs
          </p>
          <div className="space-y-0.5">
            {lineup.substitutes.map(({ player: p }) => (
              <div key={p.id} className="flex items-center gap-1.5">
                <span className="w-4 text-[10px] font-bold text-gray-400 text-right shrink-0">
                  {p.number}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500 truncate">
                  {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface LineupData {
  home: ApiLineupTeam;
  away: ApiLineupTeam;
  fetchedAt: string;
}

export function MatchLineup({
  matchId,
  homeTeamName,
  awayTeamName,
  isUpcoming,
}: {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  isUpcoming: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [lineup, setLineup] = useState<LineupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!open || fetched) return;
    setLoading(true);
    fetch(`/api/lineups/${matchId}`)
      .then((r) => r.json())
      .then((d) => {
        setLineup(d.lineup ?? null);
        setFetched(true);
      })
      .catch(() => setFetched(true))
      .finally(() => setLoading(false));
  }, [open, matchId, fetched]);

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors w-full"
      >
        <Users className="w-3.5 h-3.5" />
        Lineup
        {open ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {open && (
        <div className="mt-3">
          {loading && (
            <div className="space-y-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-3 skeleton rounded" />
              ))}
            </div>
          )}

          {!loading && !lineup && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {isUpcoming
                ? "Lineup announced ~1 hour before kickoff"
                : "Lineup not available"}
            </div>
          )}

          {!loading && lineup && (
            <div className="flex gap-4">
              <LineupSide lineup={lineup.home} label={homeTeamName} />
              <div className="w-px bg-gray-100 dark:bg-gray-800 shrink-0" />
              <LineupSide lineup={lineup.away} label={awayTeamName} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
