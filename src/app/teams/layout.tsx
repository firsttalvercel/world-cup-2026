import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Teams — All 48 Nations",
  description:
    "All 48 teams competing at FIFA World Cup 2026. Browse squads, group standings and fixtures for every nation.",
  alternates: { canonical: "https://world-cup-26.com/teams" },
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
