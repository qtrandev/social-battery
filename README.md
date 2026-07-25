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

This starts the Vite dev server only — pages render, but anything that hits `/.netlify/functions/*` (creating a battery, dragging the gauge, pinning a version) will 404 until you're running through the Netlify CLI below.

## Netlify setup

Once per machine:

```
npm install -g netlify-cli   # or use `npx netlify-cli ...` without installing it globally
netlify login                # opens a browser for auth
```

Once per checkout:

```
netlify init   # first time ever — creates a new Netlify site and links this folder to it
netlify link    # site already exists (e.g. re-cloning on another machine) — just connects this folder to it
```

`netlify init` will also offer to wire up continuous deployment from this repo's GitHub remote; skip that if you'd rather deploy manually with `netlify deploy`.

Then, for local dev with functions + Blobs working:

```
netlify dev
```

This proxies the Vite dev server (per the `[dev]` block in `netlify.toml`) while also serving the Netlify Functions and Netlify Blobs locally. Use this instead of plain `npm run dev` whenever you need the create/override/pin flows to actually work, not just the UI.
