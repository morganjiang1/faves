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
- **Booking:** reservation links (OpenTable, Resy, Google), event tickets, and for places with no online booking, their phone number to tap and call.
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

## Spot Moments: see what a place is really like

Before you go somewhere, watch clips people took there.

- **Post from the spot.** The in-app camera only posts a clip to a place when your phone is actually there (within about 150 m, during opening hours), so every clip carries "Taken here". Funny moments with friends: tag them and the clip also lands in your group's day recap.
- **Moments on every place page.** A vertical reel at the top of the place page: Highlights (most liked) and Right now (clips from the last few hours, so you can see if it's busy or dead tonight). Tap through like stories.
- **Seeded before we have users.** Public TikTok videos already tagged at the place (in San Francisco, 429 of 600 scraped videos carry a location tag) show through TikTok's official embed, credited to the creator, until our own clips take over.
- **Feeds the rest of the app.** Fresh clips count toward the Locals Score's local love, and clips that lead to verified visits earn spot rewards.
- **Moderation.** Report and hide, automatic checks for unsafe content, and Right now clips expire after a day.
- **References to capture before building:** TikTok location pages, Instagram location pages and Snap Map stories (Yelp's photo and video grid is already in the catalog).

## Logistics on every place

Already in the scraped data for each place: price level and a cost-per-person estimate, opening hours with "open now", phone number, website, address and directions, reservation link where there is one, and how busy it usually is by hour.

## Spot rewards: get paid for not gatekeeping

People earn real money when their spots and days help others.

- **What earns:** not raw likes, which are easy to fake with friends or bots, but verified use. You earn when someone saves your spot, does your day (location check-in at the stops), and gives it a thumbs up at the end.
- **Rates (starting point):** about $0.01 per save, $0.25 per verified "did this day", and a bonus when a spot you posted first becomes a trending hidden gem. Likes still show on posts, they just don't pay.
- **Wallet:** earnings show live on your profile ("Your spots earned $3.42 this month, 48 people did your Sunset in Bernal day"). Cash out at $5 as a gift card or a bank transfer.
- **Where the money comes from:** a share of real revenue, so rewards scale with use, not with a cash pile: booking commissions (reservations, tickets, tours) and a share of Faves Plus revenue. A fixed share of each booking made from your post goes to you. No paid placements in the feed, the same rule Beli follows.
- **Anti-fraud:** rewards need a real visit (GPS near the place during opening hours), one reward per account per spot, new accounts earn after a short trust period, and unusual like or save patterns are held for review.
- **Legal:** payouts go through a provider that handles identity checks and US tax forms (1099s above the IRS threshold), so we never hold or send money ourselves.
- **Hackathon demo:** the wallet, earnings feed and payout screen run on test data; real payouts come after launch.

## Monetization (copied from Beli)

How Beli makes money, from its App Store listing, its creator terms and press coverage:

| Beli | What it is | Price |
|---|---|---|
| Free core app | Ranking, lists, map, friends and recommendations; "nothing in the core restaurant tracking requires a subscription" | free |
| Beli Supper Club | Invite-only annual membership for top users with partner dinners at hard-to-book restaurants plus premium app features (New York only) | $74.99 / year |
| Creator subscriptions (paid guides) | Subscribe to a creator's paid restaurant guides; the contract is with the creator, Beli takes payment as their agent | $5.79 / month or $42.90 / year |
| Weekly Streak Restore | Rescues a broken weekly logging streak | $0.99 |
| Reservation partners | Book a table without leaving the app (Resy, OpenTable, SevenRooms); terms not public | commission (undisclosed) |
| Ticketed events | One-off parties with restaurant partners | per ticket |
| No in-feed ads | The founders rule them out to protect the rankings | none |

Faves, same model:

| Faves | What it is | Price |
|---|---|---|
| **Free** | Everything core: explore, Locals Scores, hidden gems, planning days, the community, posting spots and earning rewards | free |
| **Faves Plus** | Members-only Faves Nights at partner spots (the Supper Club idea, in every city); perks at partner places; live Plan B re-planning; "busy now" crowd levels and best time to go; 2x spot rewards; streak saves included | $5.79 / month or $42.90 / year (Beli's tested price points) |
| **Local guides** | Top locals sell paid guides and days ("my 12 date spots", "Gundam day in SF"); the creator sets the price, Faves takes payment as their agent and keeps a cut | from $5.79 / month |
| **Weekend streak save** | Keeps your "something new every weekend" streak alive | $0.99 |
| **Booking commissions** | Reservations, tickets, tours and classes booked from a plan | partner commission |
| **Faves Nights tickets** | Hosted group outings with partner venues | per ticket |
| **No ads** | Locals Scores are never for sale | none |

Sources: [Beli on the App Store](https://apps.apple.com/us/app/beli/id1478375386), [Beli paid guides terms](https://beliapp.com/paid-guides-terms-subscriber), [Is Beli free? (prices checked 2026-10-02)](https://crumble.me/guides/is-beli-free), [Resy: reservations in Beli](https://blog.resy.com/?p=93063), [Ivey Business Review: Beli, A Recipe for Revenue](https://www.iveybusinessreview.ca/magazine/articles/beli), [San Francisco Chronicle on Beli](https://www.sfchronicle.com/food/article/beli-restaurants-bay-area-app-20772802.php).

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
