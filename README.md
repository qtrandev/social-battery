# social-battery

A live "social battery" status page — glanceable energy level, from empty to full, over the course of your day.

Leave it fullscreen on a TV/monitor (landscape) so people around you can see your energy at a glance, or prop your phone up (portrait) at your desk. Inspired by the enamel-pin "my social battery" meme and pomodoro-timer single-purpose tool sites.

## How it works

Your battery follows a default trajectory across the day — wake time (100%) → work-end (~50%) → sleep time (a small floor, never a dead-looking 0). At any point you can manually set it to whatever feels right; the moment you do, the app throws away the rest of the default line and draws a new one from *(now, your value)* to *(sleep time, floor)*. That's it — no calendar integration, no "is this a workday" flag. The override itself is the signal that today's rhythm is different.

Outside your wake↔sleep window, the page shows a distinct "recharging" state instead of a flat 0.

## URLs

- `/yourname` — always the latest, live state.
- `/yourname/v2` — a pinned snapshot, frozen at the moment it was pinned.

## Stack

React + Vite + Tailwind, deployed to Netlify with Netlify Functions + Netlify Blobs for persistence.

## Local dev

```
npm install
npm run dev
```
