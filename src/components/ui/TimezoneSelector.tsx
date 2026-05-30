"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { useTimezoneContext } from "@/lib/TimezoneContext";
import { getTzAbbr } from "@/lib/utils";

const COMMON_TZ = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Toronto",
  "America/Vancouver",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Jerusalem",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function TimezoneSelector() {
  const { userTz, setUserTz, resetToDetected, ready } = useTimezoneContext();
  const [open, setOpen] = useState(false);

  if (!ready) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        title="Change timezone"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{getTzAbbr(userTz)}</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 z-50 w-60 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  resetToDetected();
                  setOpen(false);
                }}
                className="w-full text-left text-xs text-brand-500 hover:text-brand-400 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Reset to my timezone
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {COMMON_TZ.map((tz) => {
                const isSelected = tz === userTz;
                return (
                  <button
                    key={tz}
                    onClick={() => {
                      setUserTz(tz);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      isSelected
                        ? "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{tz.replace("_", " ").split("/").pop()}</span>
                    <span className="text-xs text-gray-400">{getTzAbbr(tz)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
