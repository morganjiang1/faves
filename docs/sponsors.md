# Cal Hacks 13.0: sponsor requirements and how Faves meets them

Event rules that apply to everything:
- All implementation must happen during the hacking period (Fri 10/23 to Sun 10/25). Faves started 10/24.
- Devpost submission: team name, table number, a 2 to 3 sentence pitch. Judges come to the table; demo plus talk in 5 minutes or less.
- Judged on impact, functionality, technical complexity and creativity.

## Fetch.ai: ASI:One Agent Challenge (1st $1,500 or $1,250 + internship interview, 2nd, 3rd, special recognition)

| Requirement | How Faves meets it |
|---|---|
| At least one agent registered on Agentverse | The Faves Butler (orchestrator) plus Scout, Planner and Booker agents, built with uAgents in `agents/`, connected to Agentverse through mailboxes |
| Agent Chat Protocol (ACP) | The Butler includes the chat protocol (`chat_protocol_spec`), acknowledges every message, handles start and end of session |
| Discoverable and usable through ASI:One | Published manifest, a clear agent description and keywords ("plan a hangout", "things to do with friends", "meet in the middle") |
| Meaningful tool use or multi-agent orchestration | Butler -> Scout (Faves data + live Apify Actors) -> Planner (Locals Score, fair meet-in-the-middle, hours, sunset, routes) -> Booker (reservation links, Cartesia voice call) |
| Complete primary workflow inside an ASI:One conversation | In ASI:One: "plan a Saturday in SF for me and 3 friends, we live in the Mission, the Richmond and Oakland, we like pickleball and hot pot, under $40 each" -> the Butler returns a day plan with each friend's travel time, lets you swap a stop, books, and creates a Faves group chat link for the friends |
| Public GitHub repo with run and test instructions | Needs Morgan's decision (see "Needed from Morgan") |
| README: agent names and addresses, Innovation Lab badges | `agents/README.md` with every agent's name and address and both badges |
| Demo video, 3 to 5 minutes | Recorded at the end |
| Register the submission through the Cal Hacks ASI:One Submission Agent | Morgan, at submission time |
| Bonus: multi-agent collaboration | Four agents with distinct jobs |
| Bonus: Payment Protocol with a credible monetization model | A small booking fee per booked plan through the Payment Protocol, the same model as Faves' booking commissions |
| Bonus: ASI1 Interactive Cards | The itinerary as a card with stops, times, everyone's travel time, and Swap / Book / Make group chat buttons |
| Bonus: reliability and recovery | Every tool call has a fallback: live scouting falls back to Faves data, booking falls back to links, the LLM falls back to the built-in planner |
| Bonus: real-time data | Live Apify runs, opening hours, sunset times |

## Convex: Best use of Convex ($5,000)

"Build it on Convex... Use real Convex features like live queries and components."

| Convex feature | Where it shows |
|---|---|
| Live queries | Group chats, RSVPs, stop votes and the pinned plan ticket update on every phone instantly |
| Agent component | The in-app Butler's threads, messages and tool calls |
| Workflow component | Durable plan -> vote -> lock -> book -> remind flow that survives failures |
| Scheduled functions and crons | Day-before and leave-now reminders with each person's travel time |
| Vector search | "Find a spot by vibe" over the city's places |
| File storage | Spot Moments clips and photos, served from Convex instead of bundled in the app |
| Presence | Who is in the chat right now |
| Actions | Calls to Apify, Cartesia and the Fetch.ai agents, with secrets kept in Convex env vars |

## Cartesia: Best Use of Cartesia (Meta glasses)

"Voice should be core to the product, not just a feature added for the demo."

| Requirement | How Faves meets it |
|---|---|
| Voice is core | Two voice flows: (1) the Butler's voice mode: talk to your group's Butler hands-free while you're out ("we're running 15 minutes late", "find somewhere warm nearby, it's raining"), and it answers out loud and updates the plan; (2) the reservation specialist: for places with no online booking, the Booker calls the place with a Cartesia voice agent, says it is an AI assistant booking for the group, and posts the result in the chat |
| Cartesia features | Managed Agents (speech recognition + LLM + Sonic voice, turn-taking and interruptions) for both flows; Sonic TTS streaming for spoken replies in the chat |
| A working demo, one complete flow | Group chat -> "Book it" -> confirm tap -> live call (a teammate's phone plays the restaurant) -> booking confirmed in the chat |
| 2-minute demo-first presentation | Script in `docs/demo_script.md` |
| README: setup, Cartesia features used, known limitations | Section in the main README |
| No API keys in the repo | Keys only in `.env` (gitignored) and Convex env vars |
| Accessibility, privacy, responsible use | Voice mode for people who can't look at their phone; the agent always discloses it is an AI; never calls without a person's confirm tap; no call audio stored; location shared only at neighborhood level |

## Apify: Best use of Apify ($5,000 across the top 5) and Best Actor ($400)

"Project must be using Apify in a meaningful way." A separate award for building an Actor at the event.

| Requirement | How Faves meets it |
|---|---|
| Meaningful use | All Faves data comes from Apify Actors (Google Maps, Yelp, TripAdvisor, Reddit, TikTok search) across 10 cities; the Scout agent runs Actors live for niche requests |
| Build an Actor at the event | `actors/faves-local-spots`: input a city and a vibe, output ranked spots with a Locals Score that blends Google ratings with Reddit and TikTok local mentions, plus hidden-gem flags. Published to Apify Store and used by the Scout agent |
| Credits | $200 with promo code APIFY_CAL_HACKS |

## Needed from Morgan

1. Public repo: Fetch.ai requires a public GitHub repo. Decide whether `morganjiang1/faves` goes public at submission, or only the agents and Actor go in a separate public repo.
2. Fetch.ai: sign in to Agentverse and ASI:One, redeem CALHACKS26AV (Agentverse Premium) and CALHACKS26 (ASI:One Pro), create an Agentverse API key and an ASI:One API key, and add them to `.env`.
3. Cartesia: sign up at play.cartesia.ai, redeem CARTESIACALHACKS, create an API key (starts with `sk_car_`), add it to `.env`. Optional: a phone number (Twilio) for real outbound calls.
4. Convex: run `npx convex dev` once in `faves/` and sign in, so the app gets a cloud deployment that every phone can reach.
5. Apify: add promo code APIFY_CAL_HACKS under Billing > Subscriptions for $200 in credits.
6. At submission: the Devpost entry, registration through the Cal Hacks ASI:One Submission Agent, and recording the 3 to 5 minute demo video.
