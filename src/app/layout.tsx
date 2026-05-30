import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TimezoneProvider } from "@/lib/TimezoneContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LiveTicker } from "@/components/layout/LiveTicker";
import { GoalCelebration } from "@/components/ui/GoalCelebration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "World Cup 2026 — FIFA World Cup 2026",
    template: "%s | World Cup 2026",
  },
  description:
    "Your ultimate companion for FIFA World Cup 2026. Live scores, match schedule, group standings, knockout bracket, stadiums, and historical stats.",
  keywords: [
    "FIFA World Cup 2026",
    "World Cup schedule",
    "football",
    "soccer",
    "groups",
    "bracket",
    "stadiums",
    "USA",
    "Canada",
    "Mexico",
  ],
  authors: [{ name: "World Cup 2026" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://world-cup-26.com",
    siteName: "World Cup 2026",
    title: "World Cup 2026 — FIFA World Cup 2026",
    description:
      "Your ultimate companion for FIFA World Cup 2026. Matches, groups, knockout bracket, stadiums and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup 2026 — FIFA World Cup 2026",
    description: "Your ultimate FIFA World Cup 2026 companion.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a14" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-white dark:bg-gray-950 font-sans antialiased">
        <ThemeProvider>
          <TimezoneProvider>
            <GoalCelebration />
            <LiveTicker />
            <Header />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </TimezoneProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
