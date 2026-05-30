import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knockout Bracket — Round of 32 to Final",
  description:
    "FIFA World Cup 2026 knockout bracket. Follow the Round of 32, Round of 16, Quarterfinals, Semifinals and the Final on July 19, 2026.",
  openGraph: {
    title: "FIFA World Cup 2026 Knockout Bracket",
    description:
      "Full knockout bracket for World Cup 2026 — from Round of 32 to the Final on July 19.",
    url: "https://world-cup-26.com/bracket",
  },
  alternates: { canonical: "https://world-cup-26.com/bracket" },
};

export default function BracketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
