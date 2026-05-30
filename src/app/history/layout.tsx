import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "World Cup History — All-Time Winners & Records",
  description:
    "Complete FIFA World Cup history: all-time winners from 1930 to 2022, top scorers, records and facts. Brazil leads with 5 titles.",
  openGraph: {
    title: "FIFA World Cup History — All-Time Winners & Records",
    description:
      "Every World Cup winner since 1930, top scorers, most titles by country and tournament records.",
    url: "https://world-cup-26.com/history",
  },
  alternates: { canonical: "https://world-cup-26.com/history" },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
