import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import type { Match, MatchStage } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MADRID_TZ = "Europe/Madrid";

export function convertToMadridTime(dateStr: string, timeStr: string): string {
  try {
    const utcDateStr = `${dateStr}T${timeStr}:00Z`; // API times are UTC
    const date = new Date(utcDateStr);
    return formatInTimeZone(date, MADRID_TZ, "HH:mm");
  } catch {
    return timeStr;
  }
}

export function formatMatchDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "EEEE, MMMM d, yyyy");
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "MMM d");
  } catch {
    return dateStr;
  }
}

export function groupMatchesByDate(matches: Match[]): Record<string, Match[]> {
  return matches.reduce(
    (acc, match) => {
      const date = match.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(match);
      return acc;
    },
    {} as Record<string, Match[]>
  );
}

export function getStageOrder(stage: MatchStage): number {
  const order: Record<MatchStage, number> = {
    "Group Stage": 1,
    "Round of 32": 2,
    "Round of 16": 3,
    Quarterfinal: 4,
    Semifinal: 5,
    "Third Place": 6,
    Final: 7,
  };
  return order[stage] ?? 0;
}

export function getStageBadgeColor(stage: MatchStage): string {
  const colors: Record<MatchStage, string> = {
    "Group Stage": "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "Round of 32": "bg-purple-500/20 text-purple-300 border-purple-500/30",
    "Round of 16": "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    Quarterfinal: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Semifinal: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    "Third Place": "bg-green-500/20 text-green-300 border-green-500/30",
    Final: "bg-gold-500/20 text-yellow-300 border-yellow-500/30",
  };
  return colors[stage] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

export function getCountryFlag(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getTodayMatches(matches: Match[]): Match[] {
  const today = new Date().toISOString().split("T")[0];
  return matches.filter((m) => m.date === today);
}

export function getUpcomingMatches(matches: Match[], limit = 5): Match[] {
  const today = new Date().toISOString().split("T")[0];
  return matches
    .filter((m) => m.date >= today && m.status === "upcoming")
    .slice(0, limit);
}

export function formatCountdown(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export const OPENING_MATCH_DATE = new Date("2026-06-11T02:00:00Z");
export const FINAL_DATE = new Date("2026-08-03T01:00:00Z");
export const CALENDAR_ICS_URL =
  "https://calendar.google.com/calendar/ical/the007.throwaway%40gmail.com/public/basic.ics";
