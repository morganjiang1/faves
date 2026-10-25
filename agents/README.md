# Faves Butler

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

The Faves Butler plans a hangout for you and your friends that's fair for everyone. Tell it who's coming, where each of you lives and what you're into. It plans the whole day from spots locals actually love, puts the first stop where nobody has a long trip, and tells you each friend's travel time. You can swap a stop, book it, and get a Faves group chat for everyone, all in one conversation.

**Try it in ASI:One:** "plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, we like pickleball and hot pot, under $40 each". Then "swap the hot pot for ramen", "book it", "make a group chat".

## The agents

| Agent | Address | What it does |
|---|---|---|
| Faves Butler | `agent1qfpzxevq7dyhxy32vtvyju6zw7z5kzv2lx7p244zrfq3cqxl8skyvhyh4kk` | Talks to you (Agent Chat Protocol), works out what you want, coordinates the three agents below, sends the itinerary as an interactive card, charges the booking fee (Payment Protocol) and makes the group chat |
| Faves Planner | `agent1qgmfty97r86evjgwd8azkmuwfmssyn9ads387r079sy7feqq9uz02n6a3x7` | Builds the day with Faves' Locals Score (Google, Yelp, Reddit and TikTok), opening hours, sunset and travel legs; the first stop is the fairest one for everyone's starting point; swaps a stop on request |
| Faves Scout | `agent1qgz8893yqj0jvk3fhlj0czaeu2ewg00c3fa9yf2c5cw9ha4eak0pj7g7f9y` | Finds spots for niche asks ("a Gundam store near Japantown"): Faves data first, then a live run of our Apify Actor (actors/faves-local-spots) |
| Faves Booker | `agent1qdfk9h8hawwxjujzwm5pke5zw5w0vwnt8zkgysvfs33l8zqzu9gau0xkqnk` | Books the day: reservation links, walk-ins, and an AI voice call (Cartesia) for places that only take phone bookings, only after a person confirms |

## How it works

1. You ask the Butler in plain words. With an ASI:One key it reads your message with the `asi1-mini` model; without one, plain rules read it.
2. The Butler asks the Planner, which calls the Faves server (`npm run chat-server` in `faves/`). That server runs the same planner as the Faves app over its city data (10 US cities, scraped with Apify from Google Maps, Yelp, TripAdvisor, Reddit and TikTok).
3. "Meet in the middle": each friend's neighborhood or town becomes a starting point (only the neighborhood, never an address). The planner picks the first stop that keeps the longest trip shortest, then the total travel, among spots close to the best Locals Score.
4. You get the plan as text and as an ASI:One interactive card with Book it / Make a group chat / Swap buttons.
5. "book it" asks the Booker; "make a group chat" creates a Faves group with the plan pinned as a ticket and the butler in it, and returns the invite link.

If an agent doesn't answer in time, the Butler calls the Faves server itself, so a conversation never stalls. Live scouting falls back to Faves data, booking falls back to links, and the model falls back to rules.

## Run it

```sh
# 1. The Faves server (planner API + chat relay), from faves/
npm install
npm run chat-server

# 2. The agents, from faves/agents/
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python run.py            # all four agents, connected to Agentverse through mailboxes
```

Keys go in `faves/.env` (never committed): `AGENTVERSE_API_KEY` (registers the agents so ASI:One can find them), `ASI_ONE_API_KEY` (the model), and optionally `APIFY_TOKEN`, `CARTESIA_API_KEY`, `FAVES_CALL_NUMBER` (the number the booking call dials in a demo). Everything runs without keys, with the rules and Faves data.

To register on Agentverse, start `run.py`, open the Agent inspector link it prints for the Butler, click Connect and choose Mailbox (or run `.venv/bin/python register.py` with `AGENTVERSE_API_KEY` set).

## Test the whole flow locally

```sh
.venv/bin/python test_flow.py   # plan -> swap -> book -> group chat, against the local Faves server
```
