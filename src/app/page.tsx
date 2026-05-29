import { Metadata } from "next";
import { motion } from "framer-motion";
import { CountdownTimer } from "@/components/home/CountdownTimer";
import { StatsCards } from "@/components/home/StatsCards";
import { NavigationCards } from "@/components/home/NavigationCards";
import { TodayMatches } from "@/components/home/TodayMatches";
import { HeroSection } from "@/components/home/HeroSection";

export const metadata: Metadata = {
  title: "World Cup 2026 — FIFA World Cup 2026 Companion",
  description:
    "Follow every match of FIFA World Cup 2026 across USA, Canada and Mexico. Schedule, groups, bracket, stadiums and history.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* Stats */}
        <section>
          <StatsCards />
        </section>

        {/* Countdown */}
        <section className="flex flex-col items-center">
          <CountdownTimer />
        </section>

        {/* Today / Upcoming Matches */}
        <section>
          <TodayMatches />
        </section>

        {/* Navigation Cards */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Explore World Cup 2026
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Everything you need to follow the tournament
            </p>
          </div>
          <NavigationCards />
        </section>
      </div>
    </div>
  );
}
