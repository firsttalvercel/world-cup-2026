"use client";

import { motion } from "framer-motion";
import { Trophy, Building2, Globe, Swords } from "lucide-react";

const stats = [
  {
    icon: Swords,
    label: "Total Matches",
    value: "104",
    color: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/25",
  },
  {
    icon: Building2,
    label: "Stadiums",
    value: "16",
    color: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/25",
  },
  {
    icon: Globe,
    label: "Countries",
    value: "48",
    color: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/25",
  },
  {
    icon: Trophy,
    label: "Current Stage",
    value: "Group Stage",
    color: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/25",
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 + 0.5 }}
          className={`glass-card p-5 hover:scale-[1.03] transition-transform duration-200 group cursor-default`}
        >
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-200`}
          >
            <stat.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {stat.value}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
