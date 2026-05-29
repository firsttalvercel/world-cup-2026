"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import stadiumsData from "@/data/stadiums.json";
import type { Stadium } from "@/types";
import { MapPin, Users, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

const stadiums = stadiumsData as Stadium[];

const countryFilters = ["All", "USA", "Mexico", "Canada"] as const;

const countryColors = {
  USA: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Mexico: "bg-green-500/20 text-green-400 border-green-500/30",
  Canada: "bg-red-500/20 text-red-400 border-red-500/30",
};

const countryFlags = {
  USA: "🇺🇸",
  Mexico: "🇲🇽",
  Canada: "🇨🇦",
};

export default function StadiumsPage() {
  const [filter, setFilter] = useState<"All" | "USA" | "Mexico" | "Canada">("All");
  const [selected, setSelected] = useState<Stadium | null>(null);

  const filtered =
    filter === "All" ? stadiums : stadiums.filter((s) => s.country === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Stadiums & Cities
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          16 world-class venues across the USA, Mexico, and Canada
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {(["USA", "Mexico", "Canada"] as const).map((c) => {
          const count = stadiums.filter((s) => s.country === c).length;
          return (
            <div
              key={c}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-center"
            >
              <p className="text-3xl mb-1">{countryFlags[c]}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{c}</p>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {countryFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all",
              filter === f
                ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {f === "All" ? "All Venues" : `${countryFlags[f as keyof typeof countryFlags]} ${f}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((stadium, i) => (
          <motion.div
            key={stadium.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            whileHover={{ y: -4 }}
            onClick={() => setSelected(selected?.id === stadium.id ? null : stadium)}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/10 transition-all duration-200"
          >
            {/* Stadium image placeholder */}
            <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 relative flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">{countryFlags[stadium.country]}</span>
                <p className="text-white/60 text-xs mt-2 font-medium">{stadium.city}</p>
              </div>
              <span
                className={`absolute top-3 right-3 group-badge text-xs ${countryColors[stadium.country]}`}
              >
                {stadium.country}
              </span>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-gray-900 dark:text-white text-base mb-1">
                {stadium.name}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {stadium.city}, {stadium.country}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">Capacity</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {stadium.capacity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">Opened</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{stadium.opened}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-2.5">
                  <p className="text-xs text-gray-400 mb-0.5">Matches</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{stadium.matches}</p>
                </div>
              </div>

              {selected?.id === stadium.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {stadium.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <Flag className="w-3.5 h-3.5" />
                    {stadium.surface}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
