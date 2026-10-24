# Faves

Never know what to do? Tell Faves who's coming and what you're into. It finds the spots locals actually love (courts, food, views, hidden gems) and plans the whole day, routes included.

- **Video first.** Home opens on the Top 10 spots this week in your city, each playing a short clip, then what's open tonight, this weekend, the most-done days and hidden gems. Every day and itinerary shows each stop's clip, and you can swipe through a whole day full screen. Each clip shows its poster's username.
- **Every spot plays full screen.** A spot's page is a vertical player: its clips, then its photos, with the name, Locals Score, what it is, whether it's open and a real local quote over the video, and a rail to add it to a day, save, share or get directions. Details (hours, cost, phone, booking, where the score comes from) open in a sheet.
- **Locals Score** for every spot, built from Google, Yelp, TripAdvisor, Reddit and TikTok, with a hidden-gem flag for places locals rate highly that tourists haven't found.
- **A planner agent** that turns "me and 3 friends, pickleball then hot pot, 2pm to 9pm, by bus" into a full day: stops picked by Locals Score, kind and opening hours, ordered by time and travel, a view timed to sunset, a Plan B for every stop and a reason for every pick. It re-plans live: "it's raining", "we're running 30 min late", "swap the sushi spot".
- **Spot Moments**: a spot's posts in a grid with play counts, and the clips you post, which carry "Taken here" only when your phone is at the spot while it's open.
- **Community**: the most-done days in your city, Do this day, likes, posts, a Beli-style ranking of the spots you've been to, group voting by link, an end-of-day recap and share card.
- **Spot rewards and Faves Plus**: the wallet and the Plus paywall run on test data in this build.
- 10 cities: New York, Los Angeles, San Francisco, Chicago, Seattle, Boston, Austin, Miami, Washington DC and San Diego.

iPhone app (Expo Go) and website from one codebase.

## Run it

You need Node 22.13 or newer (Expo SDK 58 does not run on Node 20; `nvm use` picks the version in `.nvmrc`).

```sh
npm install
```

### On your iPhone with Expo Go

1. Install **Expo Go** from the App Store (it must support SDK 58).
2. Start the dev server from this folder:
   ```sh
   npx expo start
   ```
3. Scan the QR code in the terminal with the iPhone camera (same Wi-Fi as your computer). If the phone can't reach your computer (other network, campus Wi-Fi), use a tunnel instead:
   ```sh
   npx expo start --tunnel
   ```
4. Faves opens in Expo Go. Maps use Apple Maps; location is used for distances and for posting moments.

On a Mac with Xcode you can also run it in the iPhone simulator: `npx expo start --ios`.

### On the web

Development (hot reload):

```sh
npx expo start --web            # http://localhost:8081
```

Production build:

```sh
npx expo export --platform web  # writes dist/
node scripts/serve-web.mjs 8090 # http://localhost:8090
```

`dist/` is a static single-page app; any static host works if it serves `index.html` for unknown paths. The web map is Leaflet on OpenStreetMap tiles, so it needs no key. `/?city=san-francisco` opens Home in a given city.

### Spot clips

Clips live in `assets/videos/<city>/` (480 x 854 H.264, muted, 2 to 5 seconds, with a poster JPG) and are listed in that folder's `manifest.json`: `{ "<placeId>": { "video", "poster", "creator", "views", "postedAt", "sourceUrl", "more": [extra clips] } }`. `sourceUrl` is kept for our records and is never bundled or shown. After adding or replacing clips, run `node scripts/make-video-index.mjs` to regenerate `src/data/videos.ts` (the app bundles every clip listed there). Spots without a clip show their photos, zooming slowly.

## Environment variables

Nothing is required. With no keys the app runs on the bundled city data and keeps your plans, saves, rankings, posts and votes on the device. Copy `.env.example` to `.env` to turn on any of these:

| Variable | What it turns on |
|---|---|
| `EXPO_PUBLIC_LLM_BASE_URL`, `EXPO_PUBLIC_LLM_API_KEY`, `EXPO_PUBLIC_LLM_MODEL` | Any OpenAI-compatible chat model reads requests and writes the reasons. Any error falls back to the built-in parser. |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Google Routes API travel times and route lines (and Places API (New)). |
| `EXPO_PUBLIC_YELP_KEY` | Live Yelp ratings. |
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Synced group votes. |
| `EXPO_PUBLIC_TICKETMASTER_KEY` | Events and tickets. |
| `EXPO_PUBLIC_WEB_URL` | The public website address used in share links. |

`EXPO_PUBLIC_` values are built into the app. For a public build, put paid keys behind your own proxy.

## Tests

```sh
npm test                              # unit tests (Jest): parser, planner, re-plan, hours, sunset, travel legs, community days, links
npx expo export --platform web && npx playwright test   # web journeys at iPhone size
maestro test maestro/                 # iPhone flows in Expo Go (see maestro/README.md)
```

## How it's built

- `src/app/`: screens (expo-router). `src/components/`: shared UI. `src/lib/`: the planner agent (`parser.ts`, `planner.ts`), scores, hours, sunset, travel legs, community days, rewards, optional adapters. `src/state/`: on-device storage and the current city.
- `src/data/cities/`: one slim JSON file per city, loaded only when you pick that city (a separate chunk on the web). `src/data/videos.ts`: the bundled spot clips.
- `data/scripts/`: the data pipeline. `scrape.mjs` and `osm.mjs` collect Google Maps, Yelp, TripAdvisor, Reddit, TikTok and OpenStreetMap data; `locals.mjs` looks up the spots locals name; `build.mjs` merges and scores them (including spots found through TikTok location tags in `data/raw/<city>/tiktok_spots.json`); `export.mjs` writes the app's city files. Raw and built data stay out of git.
- Every screen copies a named screen from a popular app. The catalog with measured values is `docs/design_references.md`, the token and component map is `docs/design_system.md`, and `docs/screen_audit.md` records each screen next to its reference.
- The full product plan is in `docs/plan.md`.

## Team

- Morgan Jiang ([@morganjiang1](https://github.com/morganjiang1))
- [@Hsharma-06](https://github.com/Hsharma-06)
