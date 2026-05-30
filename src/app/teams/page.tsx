import Link from "next/link";
import groupsData from "@/data/groups.json";
import type { Group } from "@/types";

const groups = groupsData as Group[];

export default function TeamsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Teams
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          48 nations across 12 groups — tap any team to see their squad and fixtures
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.id}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              Group {group.id}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {group.standings.map(({ team, points, played, won, drawn, lost }) => (
                <Link
                  key={team.code}
                  href={`/teams/${team.code.toLowerCase()}`}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group"
                >
                  <span className="text-3xl">{team.flag}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {team.name}
                    </p>
                    {played > 0 ? (
                      <p className="text-xs text-gray-400">
                        {points} pts · {won}W {drawn}D {lost}L
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Group {group.id}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
