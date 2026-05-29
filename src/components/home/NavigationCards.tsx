"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  BarChart3,
  Network,
  MapPin,
  CalendarDays,
  Clock,
} from "lucide-react";

const navCards = [
  {
    href: "/matches",
    icon: Calendar,
    title: "Match Schedule",
    description: "All 104 matches with Spain-time conversion",
    color: "from-blue-500/20 to-cyan-500/20",
    border: "hover:border-blue-500/50",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/20",
  },
  {
    href: "/groups",
    icon: BarChart3,
    title: "Group Standings",
    description: "Groups A–L with live table updates",
    color: "from-purple-500/20 to-pink-500/20",
    border: "hover:border-purple-500/50",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/20",
  },
  {
    href: "/bracket",
    icon: Network,
    title: "Knockout Bracket",
    description: "R32 through Final — full bracket view",
    color: "from-amber-500/20 to-orange-500/20",
    border: "hover:border-amber-500/50",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
  },
  {
    href: "/stadiums",
    icon: MapPin,
    title: "Stadiums & Cities",
    description: "16 venues across 3 countries",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "hover:border-emerald-500/50",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/20",
  },
  {
    href: "/calendar",
    icon: CalendarDays,
    title: "Add to Calendar",
    description: "Subscribe to all matches in one click",
    color: "from-rose-500/20 to-pink-500/20",
    border: "hover:border-rose-500/50",
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/20",
  },
  {
    href: "/history",
    icon: Clock,
    title: "World Cup History",
    description: "All winners, records, and legends",
    color: "from-indigo-500/20 to-violet-500/20",
    border: "hover:border-indigo-500/50",
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/20",
  },
];

export function NavigationCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {navCards.map((card, i) => (
        <motion.div
          key={card.href}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.08 + 0.6 }}
          whileHover={{ y: -3 }}
        >
          <Link
            href={card.href}
            className={`block bg-gradient-to-br ${card.color} border border-gray-200/60 dark:border-gray-800/60 ${card.border} rounded-2xl p-6 transition-all duration-200 hover:shadow-xl group`}
          >
            <div
              className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
            >
              <card.icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              {card.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {card.description}
            </p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
