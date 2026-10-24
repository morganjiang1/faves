# Faves: build plan

Tell it who's coming and what you're into, and it finds the spots locals actually love (courts, food, views, hidden gems) and plans the whole day, routes included.

## Moments it's built for

- Friends who always end up just going to eat: "find us something new to do."
- Sports: find pickleball, tennis or basketball courts that are open now, with ratings, lights and surface.
- Food: the best hot pot or sushi nearby, ranked by locals, not tourists.
- Night: somewhere to chill with a skyline view, timed to sunset.
- First date: aquarium, then food, then a view.
- Catching up: your college friend loves Gundam, so a Gundam store, then coffee, then a movie.
- Day trips to nearby cities, or a small two-hour plan.

## Screens

Every screen is built from a captured reference (see `docs/design_references.md`, filled in Phase 0).

1. **Onboarding:** your city, interests, who you usually hang out with, how you get around.
2. **Home:** a big "What are we doing?" prompt; occasion chips (Date, Friends, Sports, Night, Day trip, Rainy day, Cheap); "Most-done days this week" (the DoorDash "most ordered" pattern); "Hidden gems near you"; "Open now."
3. **Plan builder:** who's coming, vibe, budget, time window, how you're getting around, and must-dos ("pickleball, then hot pot"). Returns a full day in about 30 seconds.
4. **Itinerary:** a timeline of stops with times; travel legs (walk, bus, car) with durations on a map; opening-hours checks; reserve and ticket buttons; swap any stop; a Plan B; share to the group; "Start the day."
5. **Place page:** the Locals Score with its breakdown (Google, Yelp, Reddit, TikTok); hidden-gem badge; what locals say (quotes with their sources); photos; hours. Courts show sport, surface, lights, number of courts and whether they're open now.
6. **Explore map:** filters by category (courts, food by cuisine, views, date spots, nightlife, rainy day), with a list/map toggle.
7. **Community:** popular itineraries, posts, likes, "Do this day" (copy it and customize).
8. **Day recap:** after the outing, thumbs up or down per stop, a Beli-style "which did you like more?", and a shareable recap card.
9. **Profile:** your rankings, saved spots and days, past days, friends.
10. **Group:** invite friends by link (they can vote without the app), vote on stops, one shared plan.

## The agent

- **Planner:** turns the request into constraints, finds candidates for each stop, scores them, orders stops by opening hours and travel time, checks weather and budget, and explains each pick.
- **Niche interests:** "loves Gundam" searches specialty stores, events and related spots.
- **Live re-plan:** "it's raining," "we're running late," "swap the sushi spot." It changes what's needed and keeps the rest.
- **Booking:** reservation links (OpenTable, Resy, Google), event tickets, and as a stretch goal, a voice agent that calls places with no online booking.
- **Group vote:** the agent merges everyone's votes into the final plan.

## Data: the Locals Score

| Source | What we use | How |
|---|---|---|
| Google Places API | ratings, review counts, hours, photos, place types | official API |
| Yelp API | ratings, categories, review counts | official API |
| Reddit | locals' recommendations in city subreddits (mentions, upvotes, recency) | Apify scraper |
| TikTok | local creators' posts about a place (mentions, views, saves) | Apify scraper |
| OpenStreetMap | courts: sport, surface, lights, access, count | Overpass API (free) |
| Open-Meteo | weather and sunset times | free API |
| Ticketmaster | events, concerts, games | Discovery API (free key) |

- **Quality:** ratings adjusted for review count, so a 4.9 with 12 reviews doesn't beat a 4.7 with 2,000.
- **Local love:** how often locals recommend it on Reddit and TikTok, weighted by upvotes and how recent.
- **Hidden gem:** high quality and high local love, but low tourist exposure.
- Every score shows where it came from. Each city is pre-computed by scheduled data jobs and cached.
- Google and Yelp data comes through their official APIs and follows their caching limits.

## Social

- "Most-done days" this week, and trending in your city.
- Your finished day becomes a post automatically; others like it and tap "Do this day."
- End-of-day thumbs up and down feed back into the rankings.
- Friends' rankings, Beli-style.

## Tech

- **App:** Expo (React Native). One codebase for iPhone and the website. Demo on iPhone through Expo Go by scanning a QR code; TestFlight later.
- **Maps:** Apple Maps on iPhone, Google Maps on web. Routes (car, transit, walking) from Google's Routes API. "Navigate" opens Apple Maps.
- **Backend:** Supabase (Postgres, sign-in, storage, live updates for group votes) plus server functions for the agent and data jobs.
- **AI:** any OpenAI-compatible model, chosen by an environment setting.
- **Tests:** unit tests for scoring and the planner, scripted iPhone flows (Maestro), web flows (Playwright), and side-by-side visual checks against the references.
- Versions and APIs are checked against current official docs at build time.

## Design process

1. **Capture:** screenshots of every page and button in the reference apps, from App Store screenshots, official sites, and frames from real walkthrough videos.
2. **Catalog:** `docs/design_references.md` lists every reference with measured colors, type, spacing and corner radius.
3. **Element map:** each of our screens and components names the reference screen it follows.
4. **Build, then compare:** a screen is only done once it's been checked side by side against its reference.

## What "done" means

- Every screen has loading, empty, error and offline states.
- It works on a real iPhone through Expo Go, and on the web.
- No console errors. Agent results show progress while they load.
- Every main flow has a scripted test that passes.
- The demo script has been rehearsed on the phone.

## Build order

0. References and design system (colors, type, components), all from the catalog.
1. Data for the demo city and the Locals Score.
2. Home, Explore and the Place page.
3. Planner agent, itinerary and routes.
4. Community, day recap, likes, groups.
5. Polish, tests, demo script, rehearsal on iPhone.

## Accounts and keys needed

- Demo city.
- Google Cloud project with billing turned on (Places API (New), Routes API).
- Yelp API key, Supabase project, an AI model API key, Ticketmaster API key, and the existing Apify account.
- An iPhone with Expo Go installed.
