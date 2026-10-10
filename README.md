# Stream Mosaic

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

Copy `.env.example` to `.env.local` (or fill the empty keys). Restart `npm run dev` after changes. Neither Twitch nor YouTube charges for this.

### 1. AUTH_SECRET

Already needed for Connect buttons:

```bash
openssl rand -base64 32
```

Put the result in `AUTH_SECRET`. Also set:

```
AUTH_URL=http://127.0.0.1:43123
```

### 2. Twitch (live badges + import follows)

1. Open [Twitch Developer Console](https://dev.twitch.tv/console/apps) and log in.
2. **Register Your Application**.
3. Name: `Stream Mosaic` (or anything).
4. OAuth Redirect URLs (exact):

   `http://127.0.0.1:43123/api/auth/callback/twitch`

5. Category: **Website Integration**.
6. Create, then open the app → **New Secret** → copy **Client ID** and **Client Secret** into:

```
TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
```

### 3. Google / YouTube (import subscriptions + live refresh)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → create or pick a project.
2. **APIs & Services → Library** → enable **YouTube Data API v3**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - App name: Stream Mosaic
   - Add your Google account under **Test users**
   - Scopes: add `.../auth/youtube.readonly` (or leave and grant at login)
   - Publishing status: stay in **Testing** (no verification needed for personal use)
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs:

     `http://127.0.0.1:43123/api/auth/callback/google`

   - Copy Client ID and Client Secret into:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

5. **Credentials → Create credentials → API key** (for “Refresh YT live” only):
   - Restrict the key to **YouTube Data API v3** if you want
   - Put it in:

```
YOUTUBE_API_KEY=...
```

YouTube has a free daily quota; live searches are limited (~100/day), so refresh is manual.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint
- `npm run openspec:update` — refresh OpenSpec Cursor skills/commands

## OpenSpec

This repo uses [OpenSpec](https://openspec.dev/) for change proposals and specs (`openspec/`). In Cursor chat:

- `/opsx-propose` — plan a change
- `/opsx-apply` — implement the change
- `/opsx-archive` — archive when done

Restart Cursor after pulling so the new commands load.

## Graphify

This repo uses [graphify](https://github.com/safishamsi/graphify) for a local codebase knowledge graph (`graphify-out/`). Cursor rule: [`.cursor/rules/graphify.mdc`](.cursor/rules/graphify.mdc).

Install the CLI (once per machine):

```bash
pip install graphifyy
# or: pipx install graphifyy
graphify cursor install   # writes .cursor/rules/graphify.mdc
graphify update .         # rebuild AST graph (no API key)
graphify hook install     # optional: refresh graph on git commit
```

In Cursor:

- `/graphify .` — full rebuild
- `/graphify . --update` — incremental update

Query helpers: `graphify query "..."`, `graphify path "A" "B"`, `graphify explain "..."`. Open `graphify-out/graph.html` for the interactive view.
