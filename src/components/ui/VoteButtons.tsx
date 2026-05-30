"use client";

import { useState, useEffect } from "react";
import type { VoteAggregate } from "@/app/api/votes/route";

const STORAGE_KEY = "wc2026_match_votes";
const SESSION_KEY = "wc2026_session_id";

type VoteChoice = "home" | "draw" | "away";

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "anon";
  }
}

function getSavedVote(matchId: string): VoteChoice | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored)[matchId] ?? null;
  } catch {
    return null;
  }
}

function saveVote(matchId: string, choice: VoteChoice) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const all = stored ? JSON.parse(stored) : {};
    all[matchId] = choice;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function VoteButtons({
  matchId,
  homeName,
  homeFlag,
  awayName,
  awayFlag,
  voteData,
  onVoted,
}: {
  matchId: string;
  homeName: string;
  homeFlag: string;
  awayName: string;
  awayFlag: string;
  voteData: VoteAggregate | null;
  onVoted?: () => void;
}) {
  const [selected, setSelected] = useState<VoteChoice | null>(null);
  const [localVotes, setLocalVotes] = useState<VoteAggregate | null>(voteData);

  useEffect(() => {
    setSelected(getSavedVote(matchId));
  }, [matchId]);

  useEffect(() => {
    setLocalVotes(voteData);
  }, [voteData]);

  async function vote(choice: VoteChoice) {
    if (selected === choice) return;

    setSelected(choice);
    saveVote(matchId, choice);

    // Optimistically update local bar
    const encoded = choice === "home" ? { h: 1, a: 0 } : choice === "draw" ? { h: 0, a: 0 } : { h: 0, a: 1 };

    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          sessionId,
          homeScore: encoded.h,
          awayScore: encoded.a,
        }),
      });
      if (res.ok) {
        // Refresh aggregate
        const data = await fetch("/api/votes").then((r) => r.json());
        if (data.votes?.[matchId]) setLocalVotes(data.votes[matchId]);
        onVoted?.();
      }
    } catch {}
  }

  const btnBase =
    "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-semibold transition-all duration-150 cursor-pointer";

  const activeHome =
    "bg-brand-500/15 border-brand-500/50 text-brand-600 dark:text-brand-400 shadow-sm";
  const activeDraw =
    "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-200 shadow-sm";
  const activeAway =
    "bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400 shadow-sm";
  const idle =
    "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800";

  return (
    <div className="space-y-2">
      {/* Vote buttons */}
      <div className="flex gap-1.5">
        <button
          onClick={() => vote("home")}
          className={`${btnBase} ${selected === "home" ? activeHome : idle}`}
        >
          <span className="text-lg">{homeFlag}</span>
          <span className="truncate w-full text-center leading-tight">{homeName}</span>
          {localVotes && selected && (
            <span className="font-black text-sm">{localVotes.home}%</span>
          )}
        </button>

        <button
          onClick={() => vote("draw")}
          className={`${btnBase} ${selected === "draw" ? activeDraw : idle} max-w-[52px]`}
        >
          <span className="text-base">🤝</span>
          <span>Draw</span>
          {localVotes && selected && (
            <span className="font-black text-sm">{localVotes.draw}%</span>
          )}
        </button>

        <button
          onClick={() => vote("away")}
          className={`${btnBase} ${selected === "away" ? activeAway : idle}`}
        >
          <span className="text-lg">{awayFlag}</span>
          <span className="truncate w-full text-center leading-tight">{awayName}</span>
          {localVotes && selected && (
            <span className="font-black text-sm">{localVotes.away}%</span>
          )}
        </button>
      </div>

      {/* Progress bar — shown after voting */}
      {localVotes && selected && localVotes.total >= 1 && (
        <div className="space-y-1">
          <div className="flex h-1.5 rounded-full overflow-hidden gap-[1px]">
            <div className="bg-brand-500 transition-all duration-500 rounded-l-full" style={{ width: `${localVotes.home}%` }} />
            <div className="bg-gray-300 dark:bg-gray-600 transition-all duration-500" style={{ width: `${localVotes.draw}%` }} />
            <div className="bg-amber-400 transition-all duration-500 rounded-r-full" style={{ width: `${localVotes.away}%` }} />
          </div>
          <p className="text-[9px] text-gray-400 text-center">
            {localVotes.total.toLocaleString()} {localVotes.total === 1 ? "vote" : "votes"}
          </p>
        </div>
      )}

      {!selected && (
        <p className="text-[10px] text-gray-400 text-center">Who do you think wins?</p>
      )}
    </div>
  );
}
