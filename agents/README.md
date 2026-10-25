# Faves Agent

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:hackathon](https://img.shields.io/badge/hackathon-5F43F1)

The Faves Agent plans a hangout for you and your friends that's fair for everyone. Tell it who's coming, where each of you lives and what you're into. It plans the whole day from spots locals actually love, puts the first stop where nobody has a long trip, and tells you each friend's travel time. You can swap a stop, book it, and get a Faves group chat for everyone, all in one conversation.

**Try it in ASI:One:** "plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, we like pickleball and hot pot, under $40 each". Then "swap the hot pot for ramen", "book it", "make a group chat".

## The agents

| Agent | Address | What it does |
|---|---|---|
| Faves Agent | `agent1qfpzxevq7dyhxy32vtvyju6zw7z5kzv2lx7p244zrfq3cqxl8skyvhyh4kk` | Talks to you (Agent Chat Protocol), works out what you want, coordinates the three agents below, sends the itinerary as an interactive card, charges the booking fee (Payment Protocol) and makes the group chat |
| Faves Planner | `agent1qgmfty97r86evjgwd8azkmuwfmssyn9ads387r079sy7feqq9uz02n6a3x7` | Builds the day with Faves' Locals Score (what locals on Faves rank, post and save), opening hours, sunset and travel legs; the first stop is the fairest one for everyone's starting point; swaps a stop on request |
| Faves Scout | `agent1qgz8893yqj0jvk3fhlj0czaeu2ewg00c3fa9yf2c5cw9ha4eak0pj7g7f9y` | Finds spots for niche asks ("a Gundam store near Japantown"): Faves data first, then a live run of our Apify Actor (actors/faves-local-spots) |
| Faves Booker | `agent1qdfk9h8hawwxjujzwm5pke5zw5w0vwnt8zkgysvfs33l8zqzu9gau0xkqnk` | Books the day: reservation links, walk-ins, and the phone number to call for places that only take bookings by phone |

## How it works

1. You ask the Faves Agent in plain words. With an ASI:One key it reads your message with the `asi1-mini` model; without one, plain rules read it.
2. The Faves Agent asks the Planner, which calls the Faves server (`npm run chat-server` in `faves/`). That server runs the same planner as the Faves app over its city data (10 US cities, seeded from what locals already share publicly, gathered with Apify Actors).
3. "Meet in the middle": each friend's neighborhood or town becomes a starting point (only the neighborhood, never an address). The planner picks the first stop that keeps the longest trip shortest, then the total travel, among spots close to the best Locals Score.
4. You get the plan as text and as an ASI:One interactive card with Book it / Make a group chat / Swap buttons.
5. "book it" asks the Booker; "make a group chat" creates a Faves group with the plan pinned as a ticket and the agent in it, and returns the invite link.

If an agent doesn't answer in time, the Faves Agent calls the Faves server itself, so a conversation never stalls. Live scouting falls back to Faves data, booking falls back to links, and the model falls back to rules.

## Run it

```sh
# 1. The Faves server (planner API + chat relay), from faves/
npm install
npm run chat-server

# 2. The agents, from faves/agents/
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python run.py            # all four agents, connected to Agentverse through mailboxes
```

Keys go in `faves/.env` (never committed): `AGENTVERSE_API_KEY` (registers the agents so ASI:One can find them), `ASI_ONE_API_KEY` (the model), and optionally `APIFY_TOKEN` (live scouting). Everything runs without keys, with the rules and Faves data.

To register on Agentverse, start `run.py`, open the Agent inspector link it prints for the Faves Agent, click Connect and choose Mailbox (or run `.venv/bin/python register.py` with `AGENTVERSE_API_KEY` set).

## Test the whole flow locally

```sh
.venv/bin/python test_flow.py               # plan -> swap -> book (and pay) -> group chat, against the local Faves server
.venv/bin/python test_flow.py --real-clock  # the same conversation at today's real date and time
```

The test pins the clock with `FAVES_NOW` (an ISO time the agents send with every plan) to a
Saturday at 10 PM, so it gives the same answers on any day. It checks that the plan is a day with
several stops that starts in the future, that "swap the hot pot" changed the hot pot stop, that
the booking details arrive as a chat message followed by the Payment Protocol request (which the
test user pays), and that the group chat link arrives.
