"use client";

import { useEffect, useState, useRef } from "react";
import { X, Sparkles } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { useVisitState, type MatchSnapshot } from "@/lib/useVisitState";
import { useTimezoneContext } from "@/lib/TimezoneContext";
import { fromZonedTime } from "date-fns-tz";
import { formatMatchTime, getTzAbbr, getTodayInTz, DATA_TZ } from "@/lib/utils";
import type { Match } from "@/types";

interface Alert {
  key: string;
  text: string;
  sub?: string;
  type: "welcome" | "kickoff" | "result" | "info";
}

/** ms until a match's kickoff (negative if past) */
function msUntilKickoff(m: Match): number {
  try {
    const utc = fromZonedTime(`${m.date}T${m.time}:00`, DATA_TZ);
    return utc.getTime() - Date.now();
  } catch {
    return Infinity;
  }
}

export function SmartBanner() {
  const { favorites, ready: favReady } = useFavorites();
  const { prev, ready: visitReady, commitVisit } = useVisitState();
  const { userTz, hour12, ready: tzReady } = useTimezoneContext();
  const [matches, setMatches] = useState<Match[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const committed = useRef(false);

  // Fetch matches once
  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => setMatches(data.matches ?? []))
      .catch(() => {});
  }, []);

  // Compute alerts once all data is ready
  useEffect(() => {
    if (!favReady || !visitReady || !tzReady || matches.length === 0) return;
    if (committed.current) return;

    const favList = [...favorites];
    if (favList.length === 0) return;

    const today = getTodayInTz(DATA_TZ);
    const now = Date.now();
    const lastVisit = prev?.lastVisit ?? 0;
    const hoursSinceLast = lastVisit ? (now - lastVisit) / 3_600_000 : Infinity;
    const isFirstVisit = !lastVisit;
    const isNewDay = !isFirstVisit && hoursSinceLast >= 8;

    const newAlerts: Alert[] = [];

    // --- Micro-alerts: today's matches for favorite teams ---
    const todayFavMatches = matches.filter(
      (m) =>
        m.date === today &&
        (favList.includes(m.homeTeam?.name ?? "") ||
          favList.includes(m.awayTeam?.name ?? ""))
    );

    for (const m of todayFavMatches) {
      if (m.status === "finished") continue;
      const msLeft = msUntilKickoff(m);
      const hoursLeft = msLeft / 3_600_000;

      if (m.status === "live") {
        newAlerts.push({
          key: `live-${m.id}`,
          text: `${m.homeTeam?.flag ?? ""} ${m.homeTeam?.name ?? "TBD"} vs ${m.awayTeam?.flag ?? ""} ${m.awayTeam?.name ?? "TBD"} is live right now`,
          sub: m.homeScore != null ? `${m.homeScore} – ${m.awayScore}` : undefined,
          type: "kickoff",
        });
      } else if (hoursLeft > 0 && hoursLeft <= 3) {
        const timeStr = tzReady
          ? `${formatMatchTime(m.date, m.time, userTz, hour12)} ${getTzAbbr(userTz)}`
          : m.time;
        newAlerts.push({
          key: `soon-${m.id}`,
          text: `Kickoff in ${hoursLeft < 1 ? `${Math.round(hoursLeft * 60)}m` : `${Math.floor(hoursLeft)}h`}: ${m.homeTeam?.flag ?? ""} ${m.homeTeam?.name ?? "TBD"} vs ${m.awayTeam?.flag ?? ""} ${m.awayTeam?.name ?? "TBD"}`,
          sub: timeStr,
          type: "kickoff",
        });
      } else if (hoursLeft > 3) {
        const timeStr = tzReady
          ? `${formatMatchTime(m.date, m.time, userTz, hour12)} ${getTzAbbr(userTz)}`
          : m.time;
        const fav = favList.find(
          (f) => f === m.homeTeam?.name || f === m.awayTeam?.name
        );
        const flag =
          fav === m.homeTeam?.name ? m.homeTeam?.flag : m.awayTeam?.flag;
        newAlerts.push({
          key: `today-${m.id}`,
          text: `${flag ?? ""} ${fav} plays today`,
          sub: `vs ${fav === m.homeTeam?.name ? m.awayTeam?.name : m.homeTeam?.name} at ${timeStr}`,
          type: "info",
        });
      }
    }

    // --- What changed since last visit (only on new-day return) ---
    if (isNewDay && prev?.lastMatchSnapshots) {
      const snapshotMap = new Map(
        prev.lastMatchSnapshots.map((s) => [s.id, s])
      );
      const changedResults: string[] = [];

      for (const m of matches) {
        if (m.status !== "finished") continue;
        const isFavMatch =
          favList.includes(m.homeTeam?.name ?? "") ||
          favList.includes(m.awayTeam?.name ?? "");
        if (!isFavMatch) continue;

        const snap = snapshotMap.get(m.id);
        const wasFinished = snap?.status === "finished";
        if (wasFinished) continue; // already knew this result

        // New result since last visit
        const homeFlag = m.homeTeam?.flag ?? "";
        const awayFlag = m.awayTeam?.flag ?? "";
        const homeName = m.homeTeam?.name ?? "TBD";
        const awayName = m.awayTeam?.name ?? "TBD";
        const score = `${m.homeScore ?? 0} – ${m.awayScore ?? 0}`;

        // Determine result for the fav team
        const fav = favList.find(
          (f) => f === m.homeTeam?.name || f === m.awayTeam?.name
        );
        let outcome = "";
        if (fav) {
          const isHome = m.homeTeam?.name === fav;
          const ts = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
          const os = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
          outcome =
            ts > os ? " — Won" : ts === os ? " — Draw" : " — Lost";
        }

        changedResults.push(
          `${homeFlag} ${homeName} ${score} ${awayFlag} ${awayName}${outcome}`
        );
      }

      if (changedResults.length > 0) {
        newAlerts.unshift({
          key: "changed-results",
          text: `${changedResults.length} new result${changedResults.length > 1 ? "s" : ""} since your last visit`,
          sub: changedResults.slice(0, 2).join(" · ") + (changedResults.length > 2 ? ` +${changedResults.length - 2} more` : ""),
          type: "result",
        });
      }
    }

    // --- Welcome back (returning user, new day, no other alerts) ---
    if (!isFirstVisit && isNewDay && newAlerts.length === 0) {
      const upcomingFav = matches.find(
        (m) =>
          m.status === "upcoming" &&
          (favList.includes(m.homeTeam?.name ?? "") ||
            favList.includes(m.awayTeam?.name ?? ""))
      );
      if (upcomingFav) {
        const fav = favList.find(
          (f) => f === upcomingFav.homeTeam?.name || f === upcomingFav.awayTeam?.name
        );
        const flag =
          fav === upcomingFav.homeTeam?.name
            ? upcomingFav.homeTeam?.flag
            : upcomingFav.awayTeam?.flag;
        const daysUntil = Math.ceil(
          (new Date(upcomingFav.date).getTime() - Date.now()) / 86_400_000
        );
        const whenStr = daysUntil <= 0 ? "today" : daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;
        newAlerts.push({
          key: "welcome-back",
          text: `Welcome back — ${flag ?? ""} ${fav} plays ${whenStr}`,
          sub: `vs ${fav === upcomingFav.homeTeam?.name ? upcomingFav.awayTeam?.name : upcomingFav.homeTeam?.name}`,
          type: "welcome",
        });
      }
    }

    setAlerts(newAlerts);

    // Commit this visit
    const snapshots: MatchSnapshot[] = matches
      .filter(
        (m) =>
          favList.includes(m.homeTeam?.name ?? "") ||
          favList.includes(m.awayTeam?.name ?? "")
      )
      .map((m) => ({
        id: m.id,
        homeTeam: m.homeTeam?.name ?? "",
        awayTeam: m.awayTeam?.name ?? "",
        homeScore: m.homeScore ?? 0,
        awayScore: m.awayScore ?? 0,
        status: m.status,
      }));

    commitVisit(snapshots);
    committed.current = true;
  }, [favReady, visitReady, tzReady, matches, favorites, prev, userTz, hour12, commitVisit]);

  const visible = alerts.filter((a) => !dismissed.has(a.key));
  if (visible.length === 0) return null;

  const typeStyles: Record<Alert["type"], string> = {
    kickoff: "border-brand-500/30 bg-brand-500/5 dark:bg-brand-500/10",
    result: "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10",
    info: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
    welcome: "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900",
  };

  const typeTextColor: Record<Alert["type"], string> = {
    kickoff: "text-brand-600 dark:text-brand-400",
    result: "text-amber-600 dark:text-amber-400",
    info: "text-gray-700 dark:text-gray-300",
    welcome: "text-gray-700 dark:text-gray-300",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-2">
      {visible.map((alert) => (
        <div
          key={alert.key}
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${typeStyles[alert.type]}`}
        >
          <Sparkles className={`w-4 h-4 mt-0.5 shrink-0 ${typeTextColor[alert.type]}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold leading-snug ${typeTextColor[alert.type]}`}>
              {alert.text}
            </p>
            {alert.sub && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {alert.sub}
              </p>
            )}
          </div>
          <button
            onClick={() => setDismissed((prev) => new Set([...prev, alert.key]))}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
