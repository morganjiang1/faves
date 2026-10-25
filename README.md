# Faves

Never know what to do? Tell Faves who's coming and what you're into. It finds the spots locals
actually love (courts, food, views, hidden gems), plans the whole day so it's fair for everyone's
starting point, and lets your group chat plan it together with a butler that books and reminds.

- **Spots are postcards.** Home opens on "this week in <city>", a deck of the spots locals love,
  each with a short clip and a Locals Score stamp. A spot's page is one big postcard with the
  facts on paper, a real local quote and a wall of posts from people who went.
- **Locals Score** for every spot, built from Google, Yelp, TripAdvisor, Reddit and TikTok, with a
  hidden-gem flag for places locals rate highly that tourists haven't found.
- **A planner agent** turns "me and 3 friends, pickleball then hot pot, 2pm to 9pm, by bus" into a
  day: stops picked by Locals Score, kind and opening hours, a route that keeps moving forward, a
  view timed to sunset, a Plan B and a reason for every pick. It re-plans live: "it's raining",
  "we're running 30 min late", "swap the sushi spot".
- **Fair for everyone.** Each friend has a starting point (live and approximate, only if they turn
  it on, or a home neighborhood) and a way of getting around. The first stop keeps the longest
  trip short, the ticket shows each person's travel time, and everyone gets their trip home.
- **Plans are tickets in group chats.** Make a group, add friends by username, contacts, link or
  QR. Plans arrive as tickets with In / Maybe / Out, swaps post a note saying who changed what,
  and the next locked plan is pinned with a countdown and an add-to-calendar.
- **Every group has a butler** ("Fave", rename it): ask it to plan, post two options and run the
  vote, find a spot by vibe, book, set reminders (the evening before, and a leave-now nudge with
  each person's own travel time), handle running late (times and reminders move), or sum up the
  chat. Moments people post at a spot show up on its postcard wall for everyone. It can phone a place to book, only after someone in
  the group confirms, and it always says it's an AI. It can read its replies aloud.
- **Spot Moments, Community, rankings, recaps**, plus Spot rewards and Faves Plus on test data.
- 10 cities: New York, Los Angeles, San Francisco, Chicago, Seattle, Boston, Austin, Miami,
  Washington DC and San Diego.

iPhone app (Expo Go) and website from one codebase. Built with Convex, Fetch.ai, Cartesia and
Apify (see `docs/sponsors.md`).

## Run it

You need Node 22.13 or newer (`nvm use` picks the version in `.nvmrc`), and Python 3.11+ for the
Fetch.ai agents.

```sh
npm install
```

Three things run side by side. Each works without the others, with less:

```sh
npm run convex          # 1. Convex: live group chats, the butler, reminders (local, no account needed)
npm run chat-server     # 2. the Faves server: planner API for the agents, voice, calls (port 8787)
npx expo start          # 3. the app
```

- `npm run convex` runs a local Convex backend (`CONVEX_AGENT_MODE=anonymous`) and writes
  `EXPO_PUBLIC_CONVEX_URL` to `.env.local`. The first time, load the spots for vibe search:
  `npm run convex:seed`.
- Without Convex, chats go through the Faves server's relay; without either, chats work on the
  phone only and say so.
- The server finds your computer's address on the Wi-Fi by itself; phones on the same network
  reach it. `EXPO_PUBLIC_CHAT_URL` overrides it.

### On your iPhone with Expo Go

1. Install **Expo Go** from the App Store (SDK 58).
2. `npx expo start`, then scan the QR code with the camera (same Wi-Fi). On another network use
   `npx expo start --tunnel` (chats then need `EXPO_PUBLIC_CHAT_URL` and a public Convex URL).
3. Invite links open as `faves://join/<code>`, or in Expo Go as `exp://<your-ip>:8081/--/join/<code>`.

On a Mac with Xcode: `npx expo start --ios` runs it in the simulator.

### On the web

```sh
npx expo start --web            # development, http://localhost:8081
npx expo export --platform web  # production build in dist/
node scripts/serve-web.mjs 8090 # http://localhost:8090
```

Invite links on the web are `http://<host>:8090/join/<code>`.

### The Fetch.ai agents (Butler, Planner, Scout, Booker)

```sh
cd agents && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python run.py          # all four agents (needs npm run chat-server)
.venv/bin/python test_flow.py    # the whole ASI:One conversation, locally
.venv/bin/python register.py     # Agentverse mailboxes (needs AGENTVERSE_API_KEY)
```

Names, addresses and badges are in `agents/README.md`. In ASI:One the Butler plans a fair day
with everyone's travel times, swaps stops, books (links, or a phone call after you confirm),
charges a booking fee through the Payment Protocol and makes the group chat with an invite link.

### Voice and the booking call (Cartesia)

1. Put `CARTESIA_API_KEY` in `.env` and restart `npm run chat-server`. The butler's replies can
   then be read in Cartesia's voice, and the mic in the chat types out voice notes.
2. For calls: get a phone number in the Cartesia dashboard, run `npm run cartesia:setup` (it
   makes the "Faves Booker" agent and prints `CARTESIA_AGENT_ID` and `CARTESIA_FROM_NUMBER_ID`),
   and set `FAVES_CALL_NUMBER` to the phone that plays the restaurant in a demo.
3. In a chat, a stop that only books by phone shows **Call to book**. Nothing dials until someone
   taps **Call now**; the voice says it's an AI and never gives card details; the outcome is
   posted in the chat. `FAVES_CALL_REAL=1` rings the place itself instead of the demo phone.

Without Cartesia the speaker uses the phone's own voice and calls say they aren't set up yet.

### Live local scouting (Apify)

`actors/faves-local-spots` is our Apify Actor: plain words ("cozy bookstore") to OpenStreetMap
places, ranked by what locals say on the city's subreddit, with a Locals Score and hidden-gem
flags. `cd actors/faves-local-spots && npm install && npm test`, then `apify push` and set
`APIFY_ACTOR` and `APIFY_TOKEN`. The Scout agent and the butler use it for asks Faves' own data
doesn't cover yet.

### Spot clips

Clips live in `assets/videos/<city>/` (480 x 854 H.264, muted, 2 to 5 seconds, with a poster) and
are listed in that folder's `manifest.json`. After adding clips, run
`python3 scripts/clip_quality.py` (it picks each clip's best frame and the best clip first), then
`node scripts/make-video-index.mjs`.

## Environment variables

Nothing is required. Copy `.env.example` to `.env` to turn things on. Secrets stay on the server
(`.env`) or in Convex (`npx convex env set`), never in the app.

| Variable | What it turns on | Where |
|---|---|---|
| `EXPO_PUBLIC_CONVEX_URL` | live chats on Convex (written by `npm run convex`) | app |
| `EXPO_PUBLIC_CHAT_URL` | the Faves server's address, if not found by itself | app |
| `ASI_ONE_API_KEY` | ASI:One as the butler's model (Convex) and the Fetch.ai Butler's reader; keyless rules otherwise | Convex, agents |
| `AGENTVERSE_API_KEY` | Agentverse mailboxes for the four agents | agents |
| `CARTESIA_API_KEY`, `CARTESIA_AGENT_ID`, `CARTESIA_FROM_NUMBER_ID`, `CARTESIA_VOICE_ID` | voice and the booking call | server |
| `FAVES_CALL_NUMBER`, `FAVES_CALL_REAL` | who the booking call rings | server |
| `APIFY_TOKEN`, `APIFY_ACTOR` | live scouting with our Actor | server, agents |
| `FAVES_API_URL`, `FAVES_WEB_URL` | where the agents and Convex reach the server, and the public web address for invite links | server, agents, Convex |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY`, `EXPO_PUBLIC_YELP_KEY`, `EXPO_PUBLIC_LLM_*`, `EXPO_PUBLIC_TICKETMASTER_KEY` | optional live data adapters from the first build; these are built into the app, so use restricted keys or leave them empty | app |

## Tests

```sh
npm test                                        # unit tests (Jest): planner, fairness, routes, chat rules, hours, links
npm run test:relay                              # the chat relay, two phones
npx expo export --platform web && npx playwright test   # web journeys at iPhone size, chats and the butler on Convex
cd actors/faves-local-spots && npm test         # the Actor's ranking
cd agents && .venv/bin/python test_flow.py      # the Fetch.ai Butler end to end
```

Playwright starts the web build and `npm run chat-server`; run `npm run convex` first for the
chat and butler flows.

## How it's built

- `src/app/`: screens (expo-router). `src/components/`: postcards, tickets, chat, map and shared UI.
- `src/lib/`: the planner (`parser.ts`, `planner.ts`), fairness (`fair.ts`), scores, hours,
  sunset, travel legs, vibe vectors.
- `src/chat/`: one set of chat rules (`reduce.mjs`) shared by the phone, the relay and Convex;
  transports (`convex.ts`, `relay.ts`, `local.ts`) behind one interface; the on-phone butler;
  voice.
- `convex/`: tables, the live chat query and mutation, the butler (Convex Agent with tools), the
  plan workflow (lock, book, remind), crons, presence, vector search, clip storage.
- `server/`: the Faves server (planner API for the agents, relay, Cartesia).
- `agents/`: the Fetch.ai uAgents. `actors/`: the Apify Actor. `data/scripts/`: the city data
  pipeline.
- Design: the warm postcard identity is in `docs/design_system.md`; `docs/screen_audit.md` lists
  every screen and which idea came from which app.

## Team

- Morgan Jiang ([@morganjiang1](https://github.com/morganjiang1))
- [@Hsharma-06](https://github.com/Hsharma-06)
