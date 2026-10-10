# MultiPOV

Watch multiple YouTube and Twitch streams or VODs in one grid. Built for following several player POVs of the same game.

## Features

- Paste YouTube or Twitch links into a grid
- Layout templates: 1, 2 side-by-side, 2 stacked, 3 focus, 3 columns, 4 (2×2), 6 (3×2)
- Drag the splits between frames to make one POV larger
- Listen to one cell at a time (others stay muted)
- Drag cells to reorder
- Streamer roster saved in your browser (localStorage)
- Optional free Twitch / YouTube API keys for live badges and importing follows / subscriptions

## Run locally

```bash
npm install
npm run dev -- --port 43123 --hostname 127.0.0.1
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Pastes and the grid work with no API keys.

## Optional API setup (free)

Copy `.env.example` to `.env.local` and fill in values.

1. **AUTH_SECRET** — `openssl rand -base64 32`
2. **Twitch** — create an app at [Twitch Developer Console](https://dev.twitch.tv/console/apps). Set the redirect URL to `http://127.0.0.1:43123/api/auth/callback/twitch`. Enables live status and “Connect Twitch” (import follows).
3. **Google / YouTube** — create an OAuth client in Google Cloud with the YouTube Data API enabled. Redirect: `http://127.0.0.1:43123/api/auth/callback/google`. Add a YouTube Data API key as `YOUTUBE_API_KEY` for “Refresh YT live”. Put the OAuth app in testing mode and add yourself as a test user.

Neither Twitch nor YouTube charges for this. YouTube has a free daily quota; live searches are limited (~100/day), so refresh is manual.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint
