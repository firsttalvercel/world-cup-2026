import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar — Add World Cup 2026 to Your Calendar",
  description:
    "Add all FIFA World Cup 2026 matches to Google Calendar, Apple Calendar or any app. Subscribe to the full tournament schedule with one click.",
  openGraph: {
    title: "FIFA World Cup 2026 Calendar Subscription",
    description:
      "Subscribe to the complete World Cup 2026 schedule in your calendar app. Never miss a match.",
    url: "https://world-cup-26.com/calendar",
  },
  alternates: { canonical: "https://world-cup-26.com/calendar" },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
