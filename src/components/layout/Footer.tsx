import Link from "next/link";
import { Trophy } from "lucide-react";

const links = [
  { label: "Matches", href: "/matches" },
  { label: "Groups", href: "/groups" },
  { label: "Teams", href: "/teams" },
  { label: "Bracket", href: "/bracket" },
  { label: "Stadiums", href: "/stadiums" },
  { label: "Calendar", href: "/calendar" },
  { label: "History", href: "/history" },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-gold-500 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="text-gray-900 dark:text-white">World Cup</span>
                <span className="gradient-text"> 2026</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Your premium companion for FIFA World Cup 2026. Follow every match
              across the USA, Canada, and Mexico.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              Navigation
            </h3>
            <ul className="grid grid-cols-2 gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tournament info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wider">
              Tournament
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Opening match</dt>
                <dd className="font-medium text-gray-900 dark:text-white">June 11, 2026</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Final</dt>
                <dd className="font-medium text-gray-900 dark:text-white">Aug 2, 2026</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Teams</dt>
                <dd className="font-medium text-gray-900 dark:text-white">48</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Matches</dt>
                <dd className="font-medium text-gray-900 dark:text-white">104</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Stadiums</dt>
                <dd className="font-medium text-gray-900 dark:text-white">16</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800 space-y-4 text-xs text-gray-400 dark:text-gray-500">
          <p className="leading-relaxed">
            This site stores your preferences (favourite teams, timezone, notification subscriptions) locally in your browser using localStorage. No personal data is collected, transmitted to third parties, or used for advertising. Preferences can be cleared at any time by clearing your browser data. Push notifications, if enabled, are processed via the Web Push protocol and may involve your browser vendor&apos;s push service (e.g. Google FCM for Chrome, Mozilla for Firefox). This site uses no cookies other than those strictly necessary for functionality.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p>© 2026 World Cup 2026. An unofficial fan site. Not affiliated with or endorsed by FIFA.</p>
            <p>FIFA World Cup™ is a registered trademark of FIFA.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
