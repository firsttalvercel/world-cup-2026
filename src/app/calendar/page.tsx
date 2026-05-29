"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Download, ExternalLink, Copy, Check, Smartphone, Globe, Mail } from "lucide-react";
import { CALENDAR_ICS_URL } from "@/lib/utils";

const GOOGLE_CAL_URL = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(CALENDAR_ICS_URL)}`;

const instructions = [
  {
    title: "Google Calendar",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    steps: [
      "Open Google Calendar on desktop",
      'Click the + icon next to "Other calendars"',
      'Select "From URL"',
      "Paste the ICS URL below and click Add",
      "All 104 World Cup matches sync automatically",
    ],
  },
  {
    title: "Apple Calendar",
    icon: Smartphone,
    color: "from-gray-500 to-gray-700",
    steps: [
      "Open the Calendar app on Mac or iPhone",
      'Go to File → New Calendar Subscription (Mac) or Settings → Calendar → Accounts → Add Account (iPhone)',
      "Paste the ICS URL",
      'Click Subscribe and set "Auto-refresh" to Every Week',
      "Matches will appear in your calendar",
    ],
  },
  {
    title: "Outlook",
    icon: Mail,
    color: "from-blue-600 to-indigo-600",
    steps: [
      "Open Outlook (desktop or web)",
      'Go to Calendar view and click "Add calendar"',
      'Choose "Subscribe from web"',
      "Paste the ICS URL and click Import",
      "The calendar will sync automatically",
    ],
  },
];

export default function CalendarPage() {
  const [copied, setCopied] = useState(false);

  function copyUrl() {
    navigator.clipboard.writeText(CALENDAR_ICS_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Add Matches to Your Calendar
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Subscribe to all 104 World Cup matches — they&apos;ll sync automatically to your calendar app.
        </p>
      </div>

      {/* Main action card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-brand-500/10 to-gold-500/10 border border-brand-500/20 rounded-2xl p-8 mb-10"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/30">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              FIFA World Cup 2026 Calendar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All 104 matches · Auto-updates · Free
            </p>
          </div>
        </div>

        {/* ICS URL */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-center gap-3 mb-6">
          <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate font-mono">
            {CALENDAR_ICS_URL}
          </code>
          <button
            onClick={copyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors shrink-0"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copy URL</>
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={GOOGLE_CAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all hover:shadow-xl hover:shadow-brand-600/25 active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Google Calendar
          </a>
          <a
            href={CALENDAR_ICS_URL}
            download="worldcup2026.ics"
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download .ics File
          </a>
        </div>
      </motion.div>

      {/* Setup instructions */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        How to Subscribe
      </h2>

      <div className="space-y-4">
        {instructions.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 + 0.2 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}
              >
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
            </div>
            <ol className="p-5 space-y-3">
              {item.steps.map((step, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center justify-center shrink-0 mt-0.5">
                    {j + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Match times in the calendar are in local stadium time. All times on World Cup 2026 are converted to Spain (Madrid) timezone for your convenience.
        </p>
      </div>
    </div>
  );
}
