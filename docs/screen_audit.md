# Faves screen audit

Every screen in the Faves identity (see `docs/design_system.md`): cream paper, plum ink, the rose
heart, postcards for spots, tickets for plans. For each screen: what it does, which app gave us
an idea for it (if any), and its screenshot in `docs/screens/` (local, not committed; re-take any
with `node scripts/shot.mjs <name> <path>`).

No screen should be recognizable as another app's. The ideas we took are listed as "inspired by
X for <idea>".

## The demo path

| Screen | File | What it does | Inspired by | Screenshot |
|---|---|---|---|---|
| Onboarding | `src/app/onboarding.tsx` | a fan of three of the city's postcards and the rose wordmark; then name, city, interests (postcard-framed photo tiles), who you go out with, how you get around | Partiful for one question per screen; Corner for picking three interests from photo tiles | `r-onboarding.png`, `r-onboarding-name.png`, `r-onboarding-interests.png` |
| Home | `src/app/(tabs)/index.tsx` | "this week in <city>" postcard deck, the plan prompt, occasion chips, your plans as tickets, postcard rows (tonight, this weekend, hidden gems), most-done days as sample tickets | none | `v2-home.png`, `v2-home-2.png` |
| Explore | `src/app/(tabs)/explore.tsx` | the map (OpenStreetMap under a paper wash) with emoji pins and names, chips for open now, hidden gems and moments, categories, an ask bar; a list view | none | `map-sim-explore.png`, `map-web-explore.png`, `r-explore.png` |
| Place page | `src/app/place/[id].tsx` | a 4:5 postcard of clips and photos with dots, the Locals Score stamp, facts on paper, a real Reddit quote, logistics, a postcard wall of Spot Moments, where the score comes from; sticky Add to a plan and Send to a chat | TikTok and Instagram for short vertical clips of a place | `v2-place.png`, `v2-place-2.png` |
| Plan builder | `src/app/builder.tsx` | ask in plain words or answer a few questions; the plan streams in | Google Maps "Ask Maps" for an answer that forms as you watch | `r-builder.png` |
| Itinerary | `src/app/plan/[id].tsx` | the route map, the day as a timeline of stops with clips and travel legs, live re-plans (rain, running late, cheaper), Share with friends, a link, a vote, a recap | Wanderlog for travel legs between stops | `map-sim-itinerary.png`, `map-web-itinerary.png` |
| Chats | `src/app/(tabs)/chats.tsx` | your groups, join by code, try it with sample friends | none | `chat-a.png` |
| Group chat | `src/app/chat/[id].tsx` | messages, spots as postcards, plans as tickets with In / Maybe / Out, the pinned next hangout with a countdown, the butler (Fave) with quick asks, read-aloud and voice notes, Call to book with a confirm sheet | Partiful for In / Maybe / Out | `butler-1-plan.png` to `butler-4-tldr.png`, `chat-b.png` |
| New group | `src/app/chat/new.tsx` | name, emoji, people by username, sample friends | none | |
| Group info | `src/app/chat/info/[id].tsx` | members and where each starts from, add by username or contacts, QR and invite link, the butler's name, your start point (live or a neighborhood) and how you get around, mute, leave | none | |
| Join | `src/app/join/[code].tsx` | joins a group from an invite link and opens it | none | |

## Everything else

| Screen | File | What it does | Inspired by | Screenshot |
|---|---|---|---|---|
| Day page | `src/app/day/[id].tsx` | a community day: its stops, route map, notes, Do this day | DoorDash for doing again what someone else did | `day-featured.png` |
| Community | `src/app/feed.tsx` | most-done days this week (sample people, labeled), posts, likes, Do this day | none | `r-feed.png` |
| Saved | `src/app/saved.tsx` | saved spots (list or map) and saved days | Google Maps for a saved list that opens as a map; Letterboxd for a diary of days | `r-saved.png` |
| You | `src/app/(tabs)/profile.tsx` | your stats, your days, want to try, rankings, rewards, Plus, settings | Beli for a stats row (days, saved, ranked) | `r-profile.png` |
| Rankings | `src/app/rankings.tsx` | your ranked spots and a leaderboard (sample people, labeled) | Beli for ranking places against each other | `r-rankings.png` |
| Rank a spot | `src/app/rank.tsx` | how was it, then which did you like more | Beli for the head-to-head comparison | `rank-2-compare.png` |
| Day recap | `src/app/recap/[id].tsx` | rate each stop, then a short story of the day and a share card | Strava for one stat at a time | `recap-8-summary.png` |
| Group vote | `src/app/group/[id].tsx` | vote on a plan by link | Partiful for RSVPs | `group-4-voted.png` |
| Search | `src/app/search.tsx` | spots and days, live suggestions, results with hidden gems, no-results help | Beli for add, save and hide on each suggestion; Corner for calling out hidden gems | `r-search.png` |
| City | `src/app/city.tsx` | switch city | none | `city.png` |
| Spot Moments | `src/app/moments/[id].tsx` | the postcard wall: every post at a spot pinned up as a tilted postcard (who, when, taken here), the Locals Score stamp, one local quote, Pin one up; posts from other phones arrive live through Convex | Instagram for a place's grid of posts | `r-moments.png` |
| Post a moment | `src/app/post-moment/[id].tsx` | record or pick a clip; "Taken here" only when you're there while it's open | BeReal for proving you're really there | `post-camera.png` |
| Full-screen day | `src/app/reel.tsx` | swipe through a day's stops as clips | TikTok for vertical swiping | `reel-day.png` |
| Spot rewards | `src/app/wallet.tsx`, `src/app/payout.tsx` | earnings from your days and spots, cash out (test data, labeled) | Ibotta and Venmo for earnings and transfers | `r-wallet.png`, `payout.png` |
| Faves Plus | `src/app/plus.tsx` | the paywall (test mode, labeled) | Meetup for monthly and yearly plan rows | `r-plus.png` |
| Settings | `src/app/settings.tsx` | you, how you get around, interests, demo mode, the city data, connected services, Powered by | iOS Settings for grouped rows | `r-settings.png` |

## Checks

- Text contrast: every text color is checked against its surface in `docs/design_system.md`.
- Typing works in every input with the inspector off (`e2e/chat.spec.ts`, "typing works").
- Web journeys at iPhone size: `npx playwright test` (15 flows).
- The map draws everywhere: OpenStreetMap tiles in place of Apple's, which can fail in the
  simulator (`map-sim-before.png` shows the blank grid it replaced).
