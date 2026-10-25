# Faves screen audit

Every screen in the Faves identity (see `docs/design_system.md`): cream paper, plum ink, the rose
heart, postcards for spots, tickets for plans. For each screen: what it does, which app gave us
an idea for it (if any), and its screenshot in `docs/screens/` (local, not committed; re-take any
with `node scripts/shot.mjs <name> <path>`).

No screen should be recognizable as another app's. The ideas we took are listed as "inspired by
X for <idea>".

Since 2026-10-25 every screen follows "simple, not bare" (`docs/design_system.md`): what you need
for the moment stays on the screen, details sit one tap away in a sheet. On the main screens that
cut the words on the first screen roughly in half (Home 71 to 47, a spot 85 to 64, a group info
screen 89 to 53, a day page 207 to 94) without removing a feature.

## The demo path

| Screen | File | What it does | Inspired by | Screenshot |
|---|---|---|---|---|
| Onboarding | `src/app/onboarding.tsx` | a fan of three of the city's postcards and the rose wordmark; then name, city, interests (postcard-framed photo tiles), who you go out with, how you get around | Partiful for one question per screen; Corner for picking three interests from photo tiles | `r-onboarding.png`, `r-onboarding-name.png`, `r-onboarding-interests.png` |
| Home | `src/app/(tabs)/index.tsx` | wordmark and city; the "this week in <city>" postcard deck with quiet dots; the plan prompt with one row of quick starts; your plans as tickets (only when there are some); tonight (or this weekend); hidden gems; a link to popular days. Rewards and search moved to You and Popular days | none | `v2-home.png`, `v2-home-2.png` |
| Explore | `src/app/(tabs)/explore.tsx` | search on top, one row of filters (a Category chip that opens the categories, open now, hidden gems, moments), the map (OpenStreetMap under a paper wash) with emoji pins and names, a floating List / Map pill; list rows show the name, one meta line, the score and save | none | `map-sim-explore.png`, `map-web-explore.png`, `r-explore.png` |
| Place page | `src/app/place/[id].tsx` | a 4:5 postcard of clips and photos with dots, the Locals Score stamp, the name and vibe, one facts line (tap: the Details sheet with hours, address and directions, phone, website, booking), one score line (tap: where the score comes from), a local's quote, a strip of moments, Been here? Rank it; sticky Add to a plan with a send-to-chat icon | TikTok and Instagram for short vertical clips of a place | `v2-place.png`, `v2-place-2.png` |
| Plan builder | `src/app/builder.tsx` | ask in plain words or answer a few questions; the plan streams in | Google Maps "Ask Maps" for an answer that forms as you watch | `r-builder.png` |
| Itinerary | `src/app/plan/[id].tsx` | the route map, the title and one line (day, hours, cost), a rain alert only when rain is likely, the agent's note after a change, the day as a timeline of stops with clips and travel legs; the bottom bar: Change plans (a sheet with the live re-plans, your own words, re-plans left, sunset and weather, what you asked for) and Share with friends; the "..." has vote by link, recap, plan again, delete | Wanderlog for travel legs between stops | `map-sim-itinerary.png`, `map-web-itinerary.png` |
| Chats | `src/app/(tabs)/chats.tsx` | your groups, join by code, try it with sample friends | none | `chat-a.png` |
| Group chat | `src/app/chat/[id].tsx` | messages, spots as postcards, plans as tickets (stops as one line each, the mini map, one fairness line, In / Maybe / Out, Lock it in, a "..." for swap and the full day), the pinned next hangout with a countdown, the agent (Fave) with the three quick asks that fit the moment and a "+" for the rest, read-aloud and voice notes, phone numbers in its messages you tap to call | Partiful for In / Maybe / Out | `butler-1-plan.png` to `butler-4-tldr.png`, `chat-b.png` |
| New group | `src/app/chat/new.tsx` | name, emoji (one scroll row), people by username, sample friends | none | |
| Group info | `src/app/chat/info/[id].tsx` | the sticker (tap for another emoji) and name; members with add by username or contacts and the invite code with copy, QR (a sheet) and share; one "Starting from" row (a sheet: live location or a neighborhood, how you get around); the agent's name; mute, leave | none | |
| Join | `src/app/join/[code].tsx` | joins a group from an invite link and opens it | none | |

## Everything else

| Screen | File | What it does | Inspired by | Screenshot |
|---|---|---|---|---|
| Day page | `src/app/day/[id].tsx` | a community day: who did it and their note, likes, the route map, the stops (name, time, travel leg), Do this day | DoorDash for doing again what someone else did | `day-featured.png` |
| Popular days | `src/app/feed.tsx` | back and a title, search and the leaderboard as icons, Trending / Newest / Saved, the days people did this week (sample people, labeled), likes, share, Do this day, save | none | `r-feed.png` |
| Saved | `src/app/saved.tsx` | saved spots (list or map, sort) and saved days | Google Maps for a saved list that opens as a map; Letterboxd for a diary of days | `r-saved.png` |
| You | `src/app/(tabs)/profile.tsx` | your passport with days out, saved and ranked (each opens its list), then Popular days, Spot rewards, Faves Plus, Settings, and your activity | Beli for a stats row (days, saved, ranked) | `r-profile.png` |
| Rankings | `src/app/rankings.tsx` | your ranked spots and a leaderboard (sample people, labeled) | Beli for ranking places against each other | `r-rankings.png` |
| Rank a spot | `src/app/rank.tsx` | how was it, then which did you like more | Beli for the head-to-head comparison | `rank-2-compare.png` |
| Day recap | `src/app/recap/[id].tsx` | rate each stop, then a short story of the day and a share card | Strava for one stat at a time | `recap-8-summary.png` |
| Group vote | `src/app/group/[id].tsx` | vote on a plan by link | Partiful for RSVPs | `group-4-voted.png` |
| Search | `src/app/search.tsx` | spots and days in your city, live suggestions with a save heart, results with hidden gems, no-results help; opened from Popular days | Corner for calling out hidden gems | `r-search.png` |
| City | `src/app/city.tsx` | switch city | none | `city.png` |
| Spot Moments | `src/app/moments/[id].tsx` | the postcard wall: every post at a spot pinned up as a tilted postcard (who, when, taken here), the Locals Score stamp, Pin one up; posts from other phones arrive live through Convex | Instagram for a place's grid of posts | `r-moments.png` |
| Post a moment | `src/app/post-moment/[id].tsx` | record or pick a clip; "Taken here" only when you're there while it's open | BeReal for proving you're really there | `post-camera.png` |
| Full-screen day | `src/app/reel.tsx` | swipe through a day's stops as clips | TikTok for vertical swiping | `reel-day.png` |
| Spot rewards | `src/app/wallet.tsx`, `src/app/payout.tsx` | earnings from your days and spots, cash out (test data, labeled) | Ibotta and Venmo for earnings and transfers | `r-wallet.png`, `payout.png` |
| Faves Plus | `src/app/plus.tsx` | the paywall (test mode, labeled) | Meetup for monthly and yearly plan rows | `r-plus.png` |
| Settings | `src/app/settings.tsx` | you, how you get around, interests, demo mode, the community numbers, connected services (one row, a sheet), reset, Powered by | iOS Settings for grouped rows | `r-settings.png` |

## Checks

- Text contrast: every text color is checked against its surface in `docs/design_system.md`.
- Typing works in every input with the inspector off (`e2e/chat.spec.ts`, "typing works").
- Web journeys at iPhone size: `npx playwright test` (27 flows).
- The map draws everywhere: OpenStreetMap tiles in place of Apple's, which can fail in the
  simulator (`map-sim-before.png` shows the blank grid it replaced).
