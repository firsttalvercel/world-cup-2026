import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Standings — All 12 Groups",
  description:
    "FIFA World Cup 2026 group stage standings. Track all 12 groups, points tables, goal difference and qualification status for all 48 teams.",
  openGraph: {
    title: "FIFA World Cup 2026 Group Standings",
    description:
      "Live group standings for all 12 groups at the 2026 FIFA World Cup. 48 teams, 3 host nations.",
    url: "https://world-cup-26.com/groups",
  },
  alternates: { canonical: "https://world-cup-26.com/groups" },
};

export default function GroupsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
