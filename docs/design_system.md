# Faves design system: the warm postcard

Faves has one idea for how it looks: **every spot is a postcard, every plan is a ticket, and the
group chat is where friends turn them into a day out.** Cream paper, plum ink, a rose heart, a
sunset orange and a gem lavender. Nothing is borrowed screen for screen; where another app gave
us an idea, the last section says which and for what.

Tokens live in `src/theme/tokens.ts`. The shared pieces live in `src/components/ui.tsx`,
`src/components/postcard/`, `src/components/ticket/` and `src/components/chat/`.

## Color

| Token | Value | Use | Contrast |
|---|---|---|---|
| `paper` | `#FFF8F1` | every page | |
| `card` | `#FFFFFF` | postcard stock, tickets, sheets | |
| `paperDeep` | `#F5E6D6` | sunken areas, chips, inputs, disabled buttons | |
| `line` | `#E9DCCD` | hairlines, card borders | |
| `ink` | `#1E1530` | text, dark buttons | 16.9:1 on paper |
| `inkSoft` | `#55486A` | secondary text | 7.9:1 on paper |
| `inkMuted` | `#6E6280` | meta text | 5.4:1 on paper |
| `rose` | `#FF4F6D` | the Heart Pin: fills, stamps, hearts, the + tab | ink on rose 5.5:1 |
| `roseInk` | `#C92A4F` | rose as text and as the primary button fill | cream on it 5.1:1 |
| `roseTint` | `#FFE3E8` | the agent's bubbles, selected fills | |
| `sunset` | `#FF9A4D` | the ticket stub, highlights | ink on it 8.3:1 |
| `sunsetInk` | `#B4501C` | "closed", warnings as text | 4.9:1 |
| `sunsetTint` | `#FFE7D4` | warm bands | |
| `lavender` / `lavInk` / `lavTint` | `#8E6BE8` / `#5A3FB0` / `#EFE8FB` | hidden gems, change notes in the chat | lavInk on tint 6.4:1 |
| `open` | `#2B7A4B` | "open now", live | 5.0:1 |

**Dark mode is deep plum, never black:** `plum #1A1226` page, `plumRaised #271B35`, `plumLine
#3A2C4A`, `cream #FFF3E8` text (16.6:1), `creamSoft #CBBBD6`, `creamMuted #A898B8`, with
`roseOnPlum #FF6F88`, `openOnPlum #6FD69B`, `sunsetOnPlum #FFAA6B`.

Every text color passes 4.5:1 on the surface it sits on. The Scores section shows community
signals only (locals who ranked it, moments, saves, shared days), in the palette's own colors.

## Type

- **Display:** Bricolage Grotesque 600 / 700 / 800 (`font.displaySemi`, `font.display`,
  `font.displayHeavy`). Titles, place names on postcards, ticket times, the wordmark.
- **Body:** the system face (SF Pro on iPhone, the system stack on the web).
- **Scale:** 11, 13, 15, 17, 20, 24, 28, 34, 60 (the wordmark). Display titles run tight
  (letter-spacing -0.5 to -1.5); meta labels are 11 to 13, sometimes caps with 0.6 tracking.

## Shape and texture

- **Postcard** (`Postcard`): white card stock, a 6 to 8 pt frame around the photo or clip, a
  cream caption strip, a slight tilt (-3 to 4 degrees) when it sits in a pile, a plum shadow at
  8 to 16 percent. Sizes: `deck` (4:5, Home), `row`, `mini`.
- **Stamp** (`Stamp`): a round sticker with a dashed rose ring and the Locals Score, tilted -8
  degrees, in the postcard's top corner. Muted (line ring) when a spot isn't rated yet.
- **Postmark** (`Postmark`): wavy lines with the neighborhood and how long ago it was posted.
- **Ticket** (`Ticket`): a perforated edge between the stops and a sunset stub with the day, the
  date, the start time and "admit N". Stops as one line each (time and name), the mini map, one
  fairness line ("Everyone's within 25 min", tap it for each person's trip), who's in by name.
- **Buttons:** primary = roseInk with a darker lip (`#8F1C38`, 3 pt) and cream label; secondary =
  card with a line border; chips = paperDeep pills, ink when selected.
- **Corners:** cards 18, sheets 24, buttons 16, chips full round, postcard frames 10.

## Components

| Component | Where | What makes it Faves |
|---|---|---|
| Postcard deck | Home, "this week in <city>" | a pile of tilted postcards you flick through; the top one plays its clip; quiet dots under it (tap to deal the next) |
| Postcard rows | Home (tonight, or this weekend when tonight is empty; hidden gems) | small postcards with stamps; gems get a lavender gem badge |
| Place page | `place/[id]` | one big 4:5 postcard (clips and photos, swipe with dots), the name and a one-line vibe, one facts line ("Open till 12 AM · Free · 0.4 mi", tap for the Details sheet), one score line ("9.7 from 348 locals", tap for where it comes from), a local's quote, a small strip of moments, sticky "Add to a plan" with a send-to-chat icon |
| Plan ticket | chats, Home "your plans" | the ticket above; in a chat it carries In / Maybe / Out, Lock it in (Add to calendar once locked) and a "..." Plan options sheet (swap a stop, the full day); option tickets add a thumbs up for the vote |
| Pinned hangout | top of a chat | the next locked plan as a stub: day, time, title, the countdown and who's going |
| The agent | every group chat | "Fave" (renamable), rose-tint bubbles with a heart, one or two short spoken lines that never repeat the ticket; change notes in lavender pills say who asked; a phone number in its message is bold and underlined, tap it to call |
| Quick asks | above the chat composer | the three that fit the moment (no plan: Plan something, Find a spot, Two options or tl;dr; a proposed plan: Book it, tl;dr, Plan something; locked: Running late, Remind us, Book it), and a pinned "+" that opens every ask |
| More sheets | ticket "...", itinerary "Change plans", group info, Settings | `MenuRow` rows on a paper `Sheet`: what you need now stays on the screen, the rest is one tap away |
| Voice | chat header and composer | a speaker that reads the agent's replies aloud, a mic for voice notes |
| Map | Explore, itinerary, day page, saved | OpenStreetMap tiles under a paper wash, emoji spot pins with names, numbered plum teardrops on the route |
| Onboarding | first run | three of the city's postcards fanned on paper, the rose wordmark, one question per screen with postcard-framed photo tiles |
| Empty states | everywhere | a blank tilted postcard with a dashed stamp holding the icon, a display title, one line, one button |

## Simple, not bare

Each screen shows what the person needs for what they're doing right now, and tucks the rest
one tap away. It isn't one rule for every screen: a plan ticket keeps its stops, times and In /
Maybe / Out in view, a spot page keeps why it's good (the score, a local's words, moments) in
view, and the details (hours, address, phone, each person's trip, re-plans, weather, the score
breakdown) open in a sheet or a tap. No sentence where a label works, no helper text people
don't need to act, one row of chips at most, tap targets of 44 pt or more.

## Words

Plain and short. No em dashes. The agent talks in one or two short lines that can be read aloud. Say what happens ("Moved the reminders to the new times"), not
what the system is. Sample people are tagged **Sample**; rewards and payouts in this build are
tagged **Test data**.

## Where ideas came from

Faves screens are our own. These apps gave us an idea each:

| Idea | Inspired by |
|---|---|
| Ranking the places you've been against each other | Beli, for comparing two spots to build a ranked list |
| One question per screen in onboarding | Partiful, for the first-run flow |
| Picking at least three interests from photo tiles | Corner, for the personalize step |
| A plan that streams in as it's being made | Google Maps "Ask Maps", for showing the answer as it forms |
| Travel legs between stops ("5 min walk, 0.3 mi") | Wanderlog, for the itinerary legs |
| In / Maybe / Out on a plan | Partiful, for RSVPs |
| Doing a day someone else did | DoorDash, for "order it again" |
| A short recap of the day with one stat at a time | Strava, for the year-in-sport story |
| Hidden-gem flag with the reason ("loved by locals, few visitors yet") | Corner, for calling out hidden gems |
| Short vertical clips of a spot | TikTok and Instagram, for location posts |
| Earnings and cash out | Ibotta and Venmo, for the wallet and transfer flow |
| The paywall's plan rows | Meetup, for monthly and yearly rows |
