# World Cup 2026

A FIFA World Cup 2026 companion app — live scores, match schedule, group standings, knockout bracket, stadiums, history, and score predictions.

Live at [world-cup-26.com](https://world-cup-26.com)

## Features

| Feature | Description |
|---------|-------------|
| Match Schedule | All 104 matches with live scores, auto-refreshing every 60s |
| Group Standings | Live table for all 12 groups, top-2 highlighted |
| Knockout Bracket | Full bracket from Round of 32 to the Final |
| Score Predictions | Predict the score for any upcoming match, graded after the final whistle |
| Stadiums | All 16 host venues across USA, Canada, and Mexico |
| History | Past World Cup winners and statistics |
| Live Ticker | Scrolling live score bar when matches are in progress |
| Goal Celebrations | Confetti animation on every goal, red card animation on dismissals |
| Timezone Support | Auto-detects your local timezone, persists preference, supports 12h/24h format |
| PWA | Installable on mobile as a standalone app |
| Dark Mode | Full dark/light theme support |

## Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion, canvas-confetti
- **Data**: football-data.org API
- **Hosting**: Vercel (primary) + Railway (backup)
- **Domain**: world-cup-26.com

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```
FOOTBALL_DATA_API_KEY=your_key_here
```

Get a free API key at [football-data.org](https://www.football-data.org).

## Deployment

Vercel auto-deploys on every push to `main`. Railway is configured as a backup and redirects to the primary domain.
