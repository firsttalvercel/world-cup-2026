import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Match Schedule — All 104 Fixtures",
  description:
    "Full FIFA World Cup 2026 match schedule. All 104 games across USA, Canada and Mexico — group stage, Round of 32, knockouts and the Final on July 19.",
  openGraph: {
    title: "FIFA World Cup 2026 Match Schedule — All 104 Fixtures",
    description:
      "Every World Cup 2026 match: dates, times, venues and live scores. Group stage through to the Final.",
    url: "https://world-cup-26.com/matches",
  },
  alternates: { canonical: "https://world-cup-26.com/matches" },
};

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
