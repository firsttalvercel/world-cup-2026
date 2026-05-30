"use client";

import type { VoteAggregate } from "@/app/api/votes/route";

export function PredictionBar({
  votes,
  homeName,
  awayName,
}: {
  votes: VoteAggregate;
  homeName: string;
  awayName: string;
}) {
  if (votes.total < 3) return null;

  return (
    <div className="mt-2.5 space-y-1">
      {/* Bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-[1px]">
        <div
          className="bg-brand-500 transition-all duration-500"
          style={{ width: `${votes.home}%` }}
        />
        <div
          className="bg-gray-300 dark:bg-gray-600 transition-all duration-500"
          style={{ width: `${votes.draw}%` }}
        />
        <div
          className="bg-amber-400 transition-all duration-500"
          style={{ width: `${votes.away}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-gray-400">
        <span className="font-semibold text-brand-500">{votes.home}% {homeName}</span>
        {votes.draw > 0 && <span>{votes.draw}% Draw</span>}
        <span className="font-semibold text-amber-500">{votes.away}% {awayName}</span>
      </div>

      <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center">
        {votes.total.toLocaleString()} {votes.total === 1 ? "vote" : "votes"}
      </p>
    </div>
  );
}
