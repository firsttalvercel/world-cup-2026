import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stadiums — 16 World Cup 2026 Venues",
  description:
    "All 16 FIFA World Cup 2026 stadiums across the USA, Canada and Mexico. Capacity, city, surface and which matches are played at each venue.",
  openGraph: {
    title: "FIFA World Cup 2026 Stadiums",
    description:
      "Explore all 16 stadiums hosting the 2026 World Cup — from MetLife Stadium in New York to Estadio Azteca in Mexico City.",
    url: "https://world-cup-26.com/stadiums",
  },
  alternates: { canonical: "https://world-cup-26.com/stadiums" },
};

export default function StadiumsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
