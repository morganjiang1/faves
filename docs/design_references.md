# Faves design references

> **Research record.** This is the catalog of real-app screens we studied while building
> Faves, with measured values. It is not the design: the Faves identity is in
> `docs/design_system.md`, and `docs/screen_audit.md` lists which idea each screen took from
> which app ("inspired by X for <idea>"). Reference images stay local in `references/`.


Every screen and component in Faves follows a real screen from a popular app. This file is the catalog: where each reference came from, what it shows, and the values measured from it. The screenshots themselves stay on our machines in `references/` (not committed); file names below point into it.

Captured 2026-10-24 from App Store screenshots, official websites and frames of real walkthrough videos. pt = px divided by the scale stated for each file.


---

# Discovery catalog: places + discovery apps (Beli, Google Maps, Apple Maps, Yelp, Corner, Atlas Obscura)

Captured 2026-10-24. Every value below was measured with PIL from the saved images (pixel sampling, run-length edges, ink bounding boxes, diagonal corner-radius probes). Images live in `references/discovery/<app>/` (local only). Nothing here is a default or a guess unless marked "approx" or "visual".

## How to read the numbers

- **px** = pixels in the saved file. **pt** = iOS points, derived from the stated scale for that file.
- App Store screenshots are device mockups; the phone screen was cropped out and its width tied to the device width (Dynamic Island devices = 393 pt, notch devices = 375 pt, checked against the status-bar clock size and notch width).
- Font sizes are derived from cap height (SF/Proxima/Google Sans cap height is about 0.70 to 0.72 em), so they are +/-1 pt.
- Video frames are H.264: colors are +/-4 per channel and edges are soft. App Store and apple.com images are exact.

| Source set | Scale used |
|---|---|
| Beli App Store crops (1061 px wide screen) | 2.70 px/pt (393 pt device) |
| Beli iPad App Store (2048 px) | 2.0 px/pt |
| Beli YouTube screen recording (590x1280) | 1.5 px/pt |
| Google Maps App Store crops (1007 px screen) | 2.56 px/pt |
| Google Maps iPad crop | relative only (px given) |
| Apple Maps App Store crops (1002 px screen) | ~2.5 px/pt |
| apple.com/maps place card (640 px) | 1.6 px/pt (30 pt close button) |
| apple.com/maps phone screens (484 px) | 1.23 px/pt |
| Yelp App Store crops (990 px screen, notch phone) | 2.64 px/pt (375 pt) |
| Corner App Store cards (1035-1041 px) | ~2.64 px/pt (marketing card, +/-5%) |
| Corner YouTube screen recording (590x1280) | 1.5 px/pt |
| Atlas Obscura App Store crops (967 px screen, notch phone) | 2.58 px/pt (375 pt) |

---

## 1. Beli (most important)

### Sources
- App Store: https://apps.apple.com/us/app/beli/id1478375386 (4.84 stars, 17,544 ratings, v10.4.1, 2026-10-23). 6 iPhone (1284x2778) + 2 iPad (2048x2732) screenshots downloaded at full size.
- Website: https://beliapp.com (Squarespace). CSS read with curl: body font **proxima-nova** (Typekit), headings **Playfair Display**, brand color `#134f5c` in custom.css. The serif restaurant names and onboarding titles in the app match Playfair Display (visual); app UI text is a geometric sans consistent with Proxima Nova (visual, not verifiable from outside the app).
- YouTube (screen recording, used heavily): "BELI APP - your top restaurants, ranked - how to use" https://www.youtube.com/watch?v=GlMma4eXe18 (590x1280 vertical).
- YouTube (news segment, place page frames only, 360p): "What foodies need to know about Beli app" https://www.youtube.com/watch?v=B_qqVXphZis
- YouTube (category sheet frame): "I dug into how Beli ACTUALLY works..." https://www.youtube.com/watch?v=MBMcUvRPgC4
- Watched, nothing usable (stock footage / slides / App Store pages): sxgpO5EQPiI, N-bbvNf_7p8, RQCKv6EQ_Cc, XBI27NXe9Ac.

### Brand tokens (Beli)
| Token | Value | Where measured |
|---|---|---|
| Brand teal (primary) | `#134F5C` | filter icon, time-slot buttons, View Map pill, segmented toggle, tab-bar Search button, site CSS |
| Teal text (tabs, stat values) | `#004F5E` / `#0F3F49` | Featured Lists tab, profile stat value, active chip text |
| Score green (feed) | `#009C61` | score circle on feed post |
| Score green (lists) | `#329966` | score circle on Recs list |
| Match green | `#009C60` | "+28% Match" |
| Map pin green | `#229868` (gradient `#148C5C` to `#2CA474`) | map pins |
| Primary text | `#222428` / `#000000` | titles, names |
| Secondary text | `#989AA3` | meta lines, dates |
| Tertiary / inactive tab | `#A2A4AB`, `#666666` | tabs |
| Chip border/text | `#424242` | unselected chips |
| Hairline / score ring | `#D3D3D3` | score circle ring, Following button |
| Row divider | `#F4F5F8` / `#F7F7FA` (1 pt) | feed + list separators |
| Profile row separator | `#D0CFD3` | profile rows |
| Card border | `#EBEBEB` | profile stat cards |
| Search field fill | `#EDEDED` (App Store) / `#ECEAED` (video) | search fields |
| Sentiment green / yellow / pink | `#8ECEAC` / `#F0CC70` / `#E8A4AC` (video) | "How was it?" circles |
| Sage illustration blob | `#DCE8E0` (video) | empty-state illustrations |

### Screens

**beli/beli_appstore_02_mylists_map_been.png**: My Lists, Been tab, map view (2.70 px/pt)
- Nav: centered "MY LISTS" uppercase semibold `#222428`, cap 27 px (about 14 pt); share + more icons right.
- Large title "Restaurants ⌄": bold `#222428`, cap 42 px (about 22 pt).
- Tabs: Been (active, bold `#222428`, letter-spaced, about 15 pt) / Want to Try / Recs / Guides / More ⌄ (inactive `#A2A4AB`). Active underline `#222428`, 5 px (2 pt), width of the label.
- Filter chips: height 85 px (**32 pt**), fully rounded, 1 pt `#424242` border, white fill, `#424242` text about 16 pt; leading filter chip 98 px wide (36 pt) with teal `#134F5C` icon; gap 22 px (**8 pt**). Chips: filter, City ⌄, Reserve, Open now, Cuisine ⌄.
- Map pins: green circle `#229868` (white fork-knife glyph) fused to a white pill holding the score in black bold (digit height 26 px, about 13 pt bold); pin pill height 78 px (29 pt); soft drop shadow. Pins overlap freely. Basemap is Apple MapKit light.
- Locate button: white circle 106 px (**39 pt**) with teal `#134F5C` arrow.

**beli/beli_appstore_03_feed_post_ranked.png**: friend's ranking post in the feed
- Avatar 162 px (60 pt) circle. Headline "**Judy** ranked **Rosario's** with **Eliot Frost**": names bold, verbs regular, black, about 17 pt. Meta "🍴 · Astoria, Queens" and "↻ 1 visit" `#989AA3` about 16 pt.
- **Score circle**: 108 px (**40 pt**) diameter, white fill, 1 pt `#D3D3D3` ring, number `#009C61` semibold (digit height 28 px, about 15 pt).
- Two square photos 422 px (156 pt), gap 22 px (8 pt), radius about 20 px (7.5 pt).
- "**Notes:** Top 5 rated slice shop in NYC. Really enjoyed." black about 17 pt.
- Engagement row: red heart emoji + "131", "422 bookmarks" right, about 14 pt black. Action row: heart, send (outline, black) left; ⊕ and bookmark right.
- Date "January 17" `#989AA3` about 14 pt; full-bleed divider `#F4F5F8` 3 px (1 pt).
- Comments: 37 pt avatar, "**Renee Saw** omg this looks AMAZING" about 17 pt, "1 like   Reply" `#808080` about 14 pt, liked heart `#D0706C`.

**beli/beli_appstore_04_featured_lists.png**: Discover, Featured Lists
- Nav title "New York, NY ▾" semibold `#424242` (about 20 pt), back chevron.
- Two-tab header: "Featured Lists" active `#004F5E` semibold with 2 pt `#004F5E` underline spanning the half; "My Challenges" `#666666`; hairline `#E9E9E9`.
- Search field: fill `#EDEDED`, height 95 px (**35 pt**), radius about 27 px (**10 pt**), magnifier `#676767`, placeholder "Search" `#777777` about 17 pt, 15 pt side margins.
- Rows: square thumbnail 238 px (88 pt), radius about 4 pt; title black about 18 pt medium ("Top 10 NYC Pancakes"); 2-line subtitle black regular about 16 pt; progress "You've been to 0 of 10" `#666666` about 16 pt; separator `#F4F5F8`; row pitch about 104 pt.

**beli/beli_appstore_05_recs_list_reserve.png**: Recs tab list with reservations
- Active chip (filter with count): fill `#EAEDEF`, 1 px `#A2ABC8` border, icon/text `#0F3F49`, count badge = teal `#134F5C` circle with white digit. Height 85 px (32 pt). Inactive chips as on screen 02.
- Row: name black bold, cap 35 px (about 19 pt); "$$$$ | Caribbean" and neighborhood `#222428` about 16 pt.
- **Score circle**: 105 px (**39 pt**), 1 pt `#D3D3D3` ring, number `#329966`; **rating-count badge** "2k" = teal `#134F5C` circle about 50 px (18 pt) overlapping bottom-right, white bold about 9 pt.
- Time-slot buttons: fill `#134F5C`, 213x95 px (**79x35 pt**), radius 14 px (**5 pt**), gap 21 px (8 pt); "9:30 PM" white semibold about 13 pt over "SEAT" white bold caps about 9 pt; horizontally scrolling. OpenTable logo row under.
- Meta "1.0 mi • Closed • Opens 5:30 PM" `#989AA2` about 16 pt. Right: ⊕ (outline black) and bookmark (filled `#134F5C` when saved, outline black when not), about 28 pt.
- Section divider `#F7F7FA` 1 pt.
- **"View Map" floating pill**: fill `#134F5C`, height 111 px (**41 pt**), fully rounded, white map icon + "View Map" semibold about 17 pt, drop shadow, bottom-right above tab bar.

**beli/beli_appstore_06_profile.png**: profile
- Nav: back, "Judy Thelen" bold about 20 pt, bell/share/more icons.
- Avatar 96 pt circle with 1 pt `#D3D3D3` ring; "@judy" bold `#222427` about 18 pt + teal verified badge; "Member since August 2019" `#989AA3`; "**+28% Match**" `#009C60` + "· **4 Meals Together**" black; quote line; "🎓 Beli University '26".
- Social buttons: 33 pt outlined circles. Stats trio: number `#222427` semibold about 14 pt over label `#989AA3` about 16 pt.
- "Following" outlined button: 1 pt `#D3D3D3`, height 92 px (**34 pt**), radius 17 px (**6 pt**), letter-spaced `#222427` text; square dropdown button same style.
- List rows (Been 1336, Want to Try 1075, Places you both want to try 43): leading icon, title black bold about 18 pt, count black bold right, chevron `#BFBFBF`, row height 117 px (**43 pt**), separators `#D0CFD3` full width.
- Stat cards (2-up): 1 pt `#EBEBEB` border, radius 34 px (**12.6 pt**), height 230 px (85 pt), teal icon, label `#8D8C8C` about 16 pt, value `#004F5E` bold about 18 pt ("#1064", "148 weeks").

**beli/beli_appstore_ipad_list_map_toggle.png**: iPad list/map (2.0 px/pt)
- **List | Map segmented toggle**: 896x64 px (**448x32 pt**), radius 17 px (**8.5 pt**). Selected segment fill `#134F5C` with white icon + "List" (cap 23 px, about 16 pt); unselected segment white with 2 pt `#134F5C` outline and teal icon + "Map".
- Tab bar: Feed, Your Lists (active label bold), **Search = teal `#134F5C` 30 pt circle with white +**, Leaderboard, Profile (avatar). Labels `#222428` about 11 pt; top hairline `#CCCCCC` 0.5 pt.
- Chips: "Filters ①" active style, Restaurants ⌄, New York, NY ⌄, Cuisine ⌄, Price ⌄. Teal "beli" wordmark centered in nav.

**beli/beli_appstore_ipad_profile_activity.png**: iPad profile + Recent Activity (progress bar "118 of 200" with teal fill, activity rows with score circles).

**beli/beli_appstore_01_hero_home.png**: marketing hero; shows the home (search, Reserve now / Recs Nearby / Trending chips, Featured Lists, Your Feed).

**Video frames (1.5 px/pt, compressed)**
- **beli_rank_1_how_was_it_vid.jpg**: rating sheet = stacked white cards over a dimmed list. Card 1: restaurant name in Playfair-style bold serif + "$$$ | Delicatessen, Diner, Sandwiches" gray + ✕. Card 2: "Add to my list of [🍴 Restaurants ▾]" (outlined dropdown). Card 3: "How was it?" bold centered + three circles 88 px (**58 pt**), centers 174 px (116 pt) apart: green `#8ECEAC` "I liked it!", yellow `#F0CC70` "It was fine", pink `#E8A4AC` "I didn't like it". Labels `#818183` until selected (then black, white ✓ in the circle).
- **beli_rank_2_it_was_fine_details_vid.jpg**: after picking, detail rows with leading icons + chevrons: Who did you go with?, Add labels (good for, etc.), Add notes, Add favorite dishes, Add photos, Add visit date, Stealth mode (toggle, "Hide this activity from newsfeed"); "Okay" teal bold.
- **beli_rank_3_which_do_you_prefer_vid.jpg / beli_rank_4_..._b_vid.jpg**: the comparison. White card "Which do you prefer?" bold about 15 pt. Two side-by-side option cards about 250x250 px (**167x166 pt**), 1 pt dark-teal border, radius about 7 pt; content centered: name in bold serif (2 lines allowed) + city regular gray. **"OR" disc** 43 px (**29 pt**) `#19444A` with white bold "OR", sitting on the 14 pt gap between cards. Bottom row: "↶ Undo" (teal icon + text, left), **"Too tough"** outlined pill 163x52 px (**109x35 pt**, teal 1 pt border, teal text, centered), "Skip ↷" (teal, right).
- **beli_rank_5_ranked_toast_vid.jpg**: toast "Gasoline Grill ranked!" near-black `#212123`, 70 px (47 pt) tall, radius about 11 pt, white text, top of screen.
- **beli_rank_first_spot_modal_vid.jpg**: "Wooo! You ranked your first spot!" modal (Playfair title, gray body explaining scores unlock after 10 ranks, teal pill CTA "Let's rank another!").
- **beli_empty_been_list_modal_vid.jpg**: empty state modal: white card 512 px (341 pt) wide, radius about 7 pt; illustration = teal line art on a sage blob `#DCE8E0`; title "Your "Been" List" Playfair bold (about 30 pt); body `#454545` about 17 pt centered, two short paragraphs; CTA full-width teal pill 75 px (**50 pt**) tall, white "Let's rank!" about 18 pt.
- **beli_recs_locked_state_vid.jpg**: locked state: lock illustration, "Recs are locked" Playfair, body, teal pill "Rank more restaurants", "Close" text button.
- **beli_ranked_list_numbered_vid.jpg**: ranked list. Progress card "Your progress to **Personalized Recs!** ⓘ" (track `#EBE8EF`, fill teal, milestones "Unlock Scores", "Recs"); rows "**1. Gasoline Grill**" bold about 17 pt, "$$ | Burgers", address, "1.2 mi • Open • Closes 8:00 PM" gray; score circle on the right shows a gray lock until unlocked; "View Map" pill.
- **beli_leaderboard_vid.jpg**: "Leaderboard" Playfair about 28 pt; segmented control Been / Influence / Notes / Photos (track `#F0F0F5`, selected white); caption "Number of places on your been list" gray; dropdown chips "All Members ▾" "New York, NY ▾"; rows 81 px (**54 pt**): rank number `#848486`, 30 pt avatar, handle `#7E7E7E` about 16 pt, count black bold right.
- **beli_home_feed_search_vid.jpg**: home. "beli" teal wordmark, calendar/bell/menu icons; search field fill `#ECEAED`, 54 px (36 pt) tall, "Search a restaurant, member, etc."; chips: inactive filled `#9CB8B8` with white icon+text, active "Trending" `#184850` (35 pt tall); invite card with teal "Invite friends" button 65 px (43 pt); "FEATURED LISTS" caps header + "See all" teal; photo list cards with white text overlay "Top 14 NYC Bagels / You've been to 0 of 14"; "YOUR FEED".
- **beli_search_restaurants_members_vid.jpg**: search: tabs Restaurants | Members (icon + label, teal active + underline); outlined fields "Search restaurant, cuisine, occasion" and "📍 Current Location ✕"; chips Recs / Trending / Friend recs; "Places you may have been in Copenhagen" bold; rows name + gray address + ⊕ + bookmark + ✕.
- **beli_start_here_list_vid.jpg**: onboarding list "Start here! How many of these spots have you tried?" teal bold, rows with ⊕ / bookmark / ✕.
- **beli_view_map_coachmark_vid.jpg**: teal coach mark "View Map / View any list on Beli in map view / Got it!" pointing at the View Map pill.
- **beli_profile_empty_vid.jpg**, **beli_onboarding_city_pick_vid.jpg**: empty profile; "Where are you eating most?" Playfair title + city list.
- **beli_choose_category_sheet_vid.jpg** (MBMcUvRPgC4): "Choose a category" sheet: icon chips Restaurants (selected teal fill, white), Bars, Bakeries, Coffee & Tea, Ice Cream & Dessert (outlined).
- **beli_place_page_top_news_vid.png / beli_place_page_dishes_photos_news_vid.png** (360p news broadcast, about 0.4 px/pt; structure only, no measurements): place page = map header with pin; restaurant name in big Playfair-style serif over the map fade; ⊕ and bookmark buttons; **teal tag line "Casual Dinner · Cheap Eats · Hidden Gem · Lunch · …"**; "$ | Chinese, Noodles, Dumplings"; neighborhood gray; outlined pill actions Website / Call / Directions; **"Scores" section: Rec Score circle (8.4 + count badge) "How much we think you will like it" next to Friend Score circle ("–", "What your friends think")**; "Popular dishes" photo row with "See all photos"; dishes page: Menu search, Popular dishes tiles, "Photos from Beli members" 2-column grid.

### iOS patterns (Beli)
Custom 5-item tab bar with a raised teal center action; standard back-chevron nav bars, title centered or leading; sheets are stacked white cards over a dim scrim (not a single system sheet); floating pill over list content; MapKit basemap.

---

## 2. Google Maps

### Sources
- App Store: https://apps.apple.com/us/app/google-maps/id585027354 (4.67 stars, 7.4M ratings, v26.43.1). 9 iPhone (1242x2688), 3 iPad (2048x2732), 4 iMessage screenshots.
- Fonts: https://www.google.com/maps HTML references **Google Sans** and **Google Sans Text**.
- YouTube tried, unusable (phone filmed in hand / slideshow): tui9hq9lfsU, UthVfEx1kk0.

### Screens (2.56 px/pt)

**google_maps/google_maps_place_page_troys_cafe.png**: place page (bottom sheet)
- Sheet: white, top corner radius about 85 px (**about 30 pt**), grabber `#C7C7C7` 107x11 px (**42x4 pt**) centered.
- Title "Troy's Cafe" `#1F1F1F` regular, about 22 pt. Share and close = **34 pt circles `#F2F2F2`** with `#1F1F1F` glyphs, 8 pt apart.
- Rating row: "4.0" + 5 stars (filled `#FFBB2A`/`#FCB828`, empty `#E5EBEB`, each 21 px = 8 pt, pitch 13.7 pt) + "(523) · 🚇 30 min", `#5E5E5E` about 16 pt.
- Type row "Coffee shop · $10–20 · ♿" `#5D5D5D`. **Status "Open" `#188438` + "· Closes 11 PM" `#5E5E5E`**.
- Action pills (horizontal scroll): "Directions" filled `#007B8B` with white icon+label; Start, Order, Reserve = tonal `#D2F7FF` fill with `#014F5B` icon+label. Height 107 px (**42 pt**), fully rounded, first pill 128 pt wide, gap 22 px (**8.6 pt**), label about 16 pt medium.
- Photo collage: big photo 686x857 px (268x334 pt) + right column of two stacked photos; gap 21 px (8 pt); radius about 44 px (**17 pt**); "2 days ago" badge dark `#5F5E5C` translucent with white text.
- Tabs: Overview (active `#00676C`, 8 px = **3 pt** rounded underline `#00696D`), Menu, Reviews, Photos, Updates, About (`#5D5D5D`), about 16 pt; hairline `#E3E3E3`.
- Tonal buttons "Reserve a table", "Order online": `#D2F7FF` / `#014F5C`, 42 pt tall, two equal widths.
- Description `#1D1D1D` about 16 pt, 2 lines + "…".

**google_maps/google_maps_saved_list_sheet_nyc_restaurants.png**: saved list (shared)
- Map shows list items as small white circular markers with the list's emoji (🍝).
- Sheet: emoji + "NYC Restaurants" `#1D1D1D` (cap 45 px, about 24 pt); share/close circles; avatar stack + "Adriana and 1 other • Shared list" `#5D5D5D` about 15 pt; description `#5D5D5D` about 16 pt.
- Chips "Invite collaborators", "+ Add places", "…": tonal `#D2F7FF` / `#014F5B`, 42 pt tall, 8 pt gap.
- Divider `#E3E3E3`. "16 places" `#5D5D5D` + dropdown chip "✓ Recently edited ▾" fill `#DEE4E4`, 86 px (34 pt) tall.
- Place photo row: tiles about 148 pt wide, gap 8 pt, radius about 20 px (8 pt).
- Locate FAB: white 143 px (**56 pt**) circle, icon `#3C4043`.

**google_maps/google_maps_results_filter_chips.png**: search results
- "Results" `#1E1E1E` about 22 pt + share/close circles.
- Filter row: tune icon, chips "Sort By ▾", "**✓ Open Now**" (selected: fill `#DBE2E8`), "Price ▾", "To…". Unselected fill `#F2F2F2`, no border, text `#1E1E1E` about 16 pt. Height 86 px (**34 pt**), gap 22 px (8.6 pt).
- Result card: 3-photo row (149 pt squares, gap 9 pt), name about 20 pt, rating row, "Open · Closes 11 PM · 1.9 mi", 2-line description `#5D5D5D`, action chips Directions / Call / Share / Save (tonal). Cards separated by an 8.6 pt band `#F8F8FA`.

**google_maps/google_maps_search_bar_category_chips_maptype_sheet.png**: explore map top bar (behind a 60% black scrim from the Map type sheet; white reads as `#666666`, so true fills are white)
- Search pill: white, about 48 pt tall, 21 pt side margins, Maps pin logo left, "Search here" placeholder (true color about `#5D5D5D`, about 18 pt), mic + Lens + avatar right.
- Category chips under it: white with shadow, about 32 pt tall, icon + label `#1F1F1F` about 15 pt (Home, Restaurants, Gas, Groceries…), about 8 pt gap.
- Map type sheet: "Map type" about 20 pt, three tiles (Default selected: 2 to 3 pt `#007B8B` ring + teal label), "Map details" 4-column icon grid (Transit, Traffic, Biking, Street View, Air Quality, Wildfires, 3D).

**google_maps/google_maps_ipad_popular_times_directory.png**: popular times (px only)
- "Popular times  Thursdays ▾" + ⓘ. Bars `#7CACF8`, 31 px wide with 4 px gaps; current hour bar `#EA79BB` with live portion `#BC50AC`. Callout pill outlined `#E3E3E3`: "👥 **Live 1 PM**" `#CC1884` + ": A little busy" `#5D5D5D`. Axis labels 6a 9a 12p 3p 6p 9p `#5D5D5D`. "⏱ People usually spend **1-2 hours** here".
- Directory: outlined search field `#C7C7C7`; category chips fill `#F2F2F2` (Food & Drink, Shopping, Services…); place cards.

**google_maps/google_maps_ask_maps_gemini_sheet.png**: "Ask Maps" conversational sheet (user bubble, answer text, tinted "Drive (Fastest)" card). **google_maps/google_maps_appstore_01_navigation.png**: navigation (reference only).

### iOS patterns (Google Maps)
Map-first; persistent bottom sheet with grabber and detents; floating search pill + chip row over the map; Material tonal buttons inside iOS sheets.

---

## 3. Apple Maps

### Sources
- App Store: https://apps.apple.com/us/app/apple-maps/id915056765 (v5.11). 6 iPhone (1320x2868), 4 iPad, 5 Watch.
- apple.com: https://www.apple.com/maps/ (downloaded `_large_2x` assets: place_cards, search_boc_screen, search_filters, guides_screen, guides_boc_screen, curation_boc_screen, editorial_experts_boc_screen, exploration).
- Font: SF Pro (system). YouTube -IZPWQ_yF18 was a filmed phone, too small to use.

### Screens

**apple_maps/apple_maps_place_card_waterbar_web.jpg**: place card (1.6 px/pt)
- Card fill `#F6F6F4` (light material), grabber `#C2C2C2` about 36 pt wide.
- Title "Waterbar" SF Pro Bold about 28 pt black; subtitle "Seafood · **SOMA**" (SOMA = link `#007AFF`). Close: 30 pt circle `#E0E4E8`, ✕ `#7C7D82`.
- Button row: primary "🚗 54 min" fill `#007AFF` white, 239x78 px (**149x48 pt**), radius about 8.5 pt; "Order" secondary fill `#E1E1E3` with blue icon+text; "•••" 47x48 pt; gap 9 pt.
- **Stat strip** (4 columns, thin vertical dividers): uppercase label `#7C7C7E` about 12 pt semibold (HOURS / YELP (3.2K) / COST / GOOD TO KNOW); values: "Open" `#20BF3E` about 20 pt semibold, "★ 3.5" `#FC8C00`, "$$$" black with the unused "$" gray, amenity glyphs.
- Photo carousel: 255 pt square photo + next one peeking, radius about 8.5 pt, gap about 7.5 pt.
- Bottom action tiles: 4 equal tiles `#E4E6E3`, 88 px (**55 pt**) tall, gap 9 pt, blue `#007AFF` icon over label (Call, Website, Guides, Share) about 13 pt semibold.

**apple_maps/apple_maps_search_results_restaurants_web.jpg**: search results (1.23 px/pt)
- Header: orange `#FC8C1C` category disc + "Restaurants" bold about 22 pt + "25 found · Edit Search" (gray + `#0057FF` link); ✕ circle.
- Chips (32 pt tall): filter-icon circle, "**In Guides**" selected (`#007BFF` fill, white), "Open Now" unselected (`#F2F2F0` fill, 1 pt `#DCDCDA` border, black), "Pizza Restaurant" selected.
- Rows: name semibold black about 17 pt; meta `#676765` about 15 pt "37 mi · Italian Cuisine · San Francisco"; hours line "Open · 12:00 PM – 11:00 PM"; guide attribution "The Infatuation: **The SF & East Bay Pizza…**" (blue); "★ 4.0 (3,767) on Yelp" star `#FF8A00`; "**Closed**" `#FA3A13`. Thumbnail 65 pt square, radius about 5.5 pt, right aligned. Separators `#E0E0DE` 1 px, inset.
- "Related Guides" gray header + full-width guide card 363x181 pt, radius 8 pt, publisher logo + white bold title over the photo.

**apple_maps/apple_maps_local_lists_guide_tinted.png**: Local Lists guide (about 2.5 px/pt)
- Sheet tinted from the hero photo (`#9C805C`); hero full bleed; "Maps / **Local Lists**" lockup; title white bold about 30 pt ("Trending Restaurants in Baton Rouge").
- Two tinted buttons `#A98F6C`, 180x53 pt, radius about 24 pt, white icon over label about 13 pt (Add to Guides, Share).
- Description white about 17 pt + "**More**"; publisher row (logo + "Local Lists" + "20 Places · Updated 1 hour ago" `#E4C8A8`).

**apple_maps/apple_maps_nearby_transit_sheet_chips.png**: grouped sheet (iOS 26 look)
- Background `#F2F2F6`, white cards radius about 65 px (26 pt), 16 pt side inset.
- Chips: "Suggested" selected `#0088FC` white text; others `#F4F4F9` with hairline; about 45 pt tall (large capsules).
- Section header bold about 22 pt + walking pill `#E6E6EC` 24 pt tall with `#77777D` icon.
- Rows black about 17 pt; secondary `#7C7C81`; separators `#D5D5D6` inset; live icon `#34C458`. Close 43 pt circle; grabber `#BABABF` 59x4 pt.

**apple_maps/apple_maps_publisher_guides_grid_web.jpg**: publisher page: logo, Website/Share tiles, chips ("All Guides" `#0078FC` selected, others white with `#DBDDDC` border, 33 pt), 2-column guide cards 175x223 pt, radius 8 pt, gap 10 pt, white bold title on a bottom gradient.

**apple_maps/apple_maps_city_guides_browse_web.jpg**: city guides: navy header `#2C4C64`, "GUIDES" caps + "San Francisco ⌄" white bold about 26 pt; "Browse by Interest" chips (fill `#F4F6F5`, border `#DADCDB`, 32 pt): Food and Drink, Things to Do, Nightlife; "Editors' Picks" cards 194x246 pt, radius 8 pt, publisher logo + title overlay.

**apple_maps/apple_maps_guide_detail_web.jpg**, **apple_maps_guide_on_map_web.jpg**: guide detail (hero, title, Website/Save/Share tiles, description, publisher + "7 places") and the guide drawn on the map (glyph pins with the place name under each, stacked square map controls top right). **apple_maps_search_filter_chips_web.jpg**: marketing collage of search filter chips. **apple_maps_3d_exploration_web.jpg**, **apple_maps_appstore_01_navigation.png**: reference only.

### iOS patterns (Apple Maps)
System sheets with detents and grabber; material backgrounds; SF Pro; systemBlue/systemGreen/systemOrange semantics; place card actions as equal tiles.

---

## 4. Yelp

### Sources
- App Store: https://apps.apple.com/us/app/yelp-food-services-reviews/id284910350 (4.54 stars, 2.09M ratings, v26.43.1). 10 iPhone (1242x2688), 5 iPad.
- Fonts: https://business.yelp.com loads **Poppins-Bold.ttf / Poppins-Regular.ttf**; app headings visually match Poppins. yelp.com itself returned a bot wall (not bypassed).
- YouTube "How to Use Yelp's Nearby Feature" https://www.youtube.com/watch?v=dE2wA8o1Nns (Android, 360p): empty state + filters frames only. mL4Lsi8-ooA (Collections) had no usable app frames.

### Screens (2.64 px/pt)

**yelp/yelp_search_results_filter_chips.png**: search results
- Top search pill over map: "‹  **Restaurants** current location  [map]" `#2B2740` + gray.
- Filter chips: white fill, 1 px `#B0AFB5` border, text `#2B2740` about 15 pt, 84 px (**32 pt**) tall, fully rounded; **selected "Offers delivery" = fill `#E4F2F5`, border + text `#00808F`**.
- Card: 3 square photos 280 px (106 pt), gap 3 pt, radius about 2.6 pt; "**2. Lei Wang's Kitchen**" `#0F0B23` bold about 20 pt + bookmark; **star tiles** = red `#FB503B` rounded squares about 13 pt with white stars, about 1.5 pt apart, partial tile split, empty tile `#DCDCDE`; count "53" `#62606D`; tag pills "Noodles" "Thai" fill `#F4F4F4`, text `#656273`, 22 pt tall; "$ • Nob Hill, 0.2 mi" `#605E6C`; "📈 **141 orders** last week"; "✓ Delivery, Takeout" (check `#00A87F`).
- "Order now" outlined button: 1 pt `#B7B6BC`, 106 px (**40 pt**) tall, radius about 4 pt, text `#161326` about 17 pt. Section band `#EFEFEF`.
- "Make Yelp a more "you" kinda place" bold about 22 pt + "Add preferences" filled `#F43838`, 40 pt, radius about 3 pt.

**yelp/yelp_business_page_hero_actions.png**: business page
- Hero photo 667 px (**253 pt**) tall: name white bold about 32 pt over it, star tiles `#FF643D`, count white; overlay nav "‹ Search", bookmark/share/more.
- "$$$ • Hair Salons, Skin Care" `#151716` about 17 pt; "**Open** until 8:00 PM" (Open `#00A87D` bold, rest `#6D6B78`).
- Four actions: 105 px (**40 pt**) circles `#EBEBEB` with `#2E2E30` icons, labels `#5B5C5E` about 15 pt (Call, View map, Website, Save).
- Section band `#F8F8F8` 8 pt. "Start a review:" `#171719` + five empty star tiles `#E4E4E4` 84 px (**32 pt**), gap 4 pt, radius 5 pt. Divider `#EDEDED`. "Add Photo" / "Check In" circle-icon buttons. "Book an Appointment" row + calendar icon.

**yelp/yelp_photos_videos_grid.png**: photo grid
- Nav "‹ Back", "Photos and Videos" bold, share, +.
- Search field outlined 1 px `#C5C4CA`, 105 px (40 pt), radius about 4 pt, "Search photos".
- Tabs with counts: "All (57)" active `#130F27` + red underline `#E04840` 10 px (4 pt); "Food (21)", "Menu (10)", "Outside" `#666472` about 17 pt.
- Grid: hero photo full width (975x724 px, 369x274 pt), then 2 equal columns; gutters 7 px (**2.7 pt**), no corner radius; caption white bold about 16 pt on a bottom gradient ("Carne Asada Bowl"); 👍 translucent white circle top-right of each tile.

**yelp/yelp_collections_saved_lists.png**: Collections (saved lists)
- Nav "Collections" bold centered, "Create" red `#E20002` right. "Featured in **Oakland, CA** ⌄".
- Featured card photo 272x144 pt, radius about 4 pt, bottom-right dark translucent block with bookmark + "20" white bold; title bold about 18 pt; 2-line description `#0F1012` about 14 pt.
- "My Collections": square tiles 115 pt, gap 11 pt, radius about 4 pt, bookmark+count badge; title bold about 16 pt + "Non-Public" `#2B2C2E` about 13 pt. "Following Collections" row below.

**yelp/yelp_home_nearby_open_now.png**: home: outlined "Search reviews" field (40 pt); "**Nearby and open now**" bold about 30 pt; "Great spots near you" bold about 20 pt + "The best in your neighborhood" `#525355`; horizontal cards (photo 128 pt wide, radius about 2.6 pt, name bold, stars, "$$ • Category"); section band `#F4F4F4`; "Picks for you" + Yelp heart mark; "Mexican restaurants / ♥ Right here right now".

**yelp/yelp_reservations_list_time_slots.png**: reservations: selected chip "Reservations" fill `#39818D` white (29 pt); "📅 Table for 2, today at 7:00 pm" `#30A2BE` + "Edit"; "Yelp Reservations" bold about 24 pt; numbered rows "**1. Oak + Elixir**" bold about 20 pt, distance right gray, stars, address gray, ✓/✕ amenities, "🕒 Live wait: under 5 minutes" green; time buttons outlined 1 pt `#B8B7BD`, 104x36 pt, radius about 2.6 pt, text `#131025` about 17 pt.

**yelp/yelp_empty_no_results_android_vid.png** (Android, 360p, structure only): "**Sorry, we couldn't find any results**" bold Poppins + small illustration; helper "Try widening the map search area, or entering a different search" gray; "**People also search for**" + outlined suggestion chips (Takeout, Restaurants, Delivery, Reservations); "Notice something missing here? [Add business]" with an illustration tile.
**yelp/yelp_filters_sheet_android_vid.png** (Android): filters sheet (Price, Popular, Sort radio list). **yelp/yelp_deals_list.png**: Deals (Current Deals / My Deals segmented, list rows with thumbnail, stars, deal line). **yelp/yelp_appstore_01_hero.png**: marketing hero.

---

## 5. Corner (corner: curate & share places)

### Sources
- App Store: https://apps.apple.com/us/app/corner-curate-share-places/id1668282277 (4.55 stars, 860 ratings, v5.20.0, 2026-10-23). 9 iPhone (1284x2778, marketing cards over sky).
- Website https://corner.inc returned a Vercel security checkpoint (not bypassed), so no CSS fonts. In-app type (visual): wide geometric grotesk for headings, plain grotesk body, italic for descriptors.
- YouTube screen recording "corner app - curate & share places - how to use" https://www.youtube.com/watch?v=c7Wr1l_Yz9Y (590x1280).

### Screens

**corner/corner_map_emoji_pins_categories_search.png**: explore map (about 2.64 px/pt)
- Basemap desaturated light gray (`#ECECEC` land, white roads), so content pops.
- **Place pins**: 3D object icon in a white circle (about 23 pt) + name `#191919` semibold about 12 pt + **italic gray descriptor** under it ("new café", "popular spanish tapas", "omakase sushi"). Friends' activity = small green dots; "saved" = blue bookmark flag with "saved" caption.
- Top: add-friend and bell buttons (white circles about 40 pt).
- "⟳ search here" pill: fill `#1C64FC`, white, 84 px (**32 pt**) tall.
- Filter pills: "everyone ▾", "◐ open now": white with soft shadow, about 24 to 28 pt tall.
- **Category row**: 7 items (top picks, eat, cafes, bars, go out, shops, leisure) = 3D object icon about 36 pt over black label about 13 pt.
- **Search bar**: fill `#1A1A1A`, 125 px (**47 pt**) tall, fully rounded, 14 pt side margins, white query text about 17 pt ("spots to cowork from"), right **blue `#1870FF` circle about 41 pt** with icon.
- Floating tab bar: white pill (search, map, avatar, +), icons `#B8B9BB`.

**corner/corner_ai_search_results_hidden_gem_cards.png**: AI search results (about 2.64 px/pt)
- Query bubble: white rounded, soft shadow, black about 18 pt ("non touristy spots for a proper girl's night out with @eliza"). Answer `#656565` about 17 pt.
- Tabs: **for you** (bold black + 2 pt black underline) / popular / trending / friends / your spots.
- Result card: white, radius about 44 px (**17 pt**), soft blue-gray shadow, about 156 pt tall. Thumbnail 238x344 px (90x131 pt), radius about 14 pt. Name black bold about 18 pt; "NoMad" `#868686`; **vibe line: purple dot `#A571ED` + "lowkey giraffe lounge" `#868686`**; **hidden-gem line: outline gem icon + italic black "only 22 saves on google"** about 16 pt; social line: overlapping friend avatars + pill "saved 277 times" (fill `#EFEFEF`, 63 px = **24 pt** tall, text `#8C8C8C` about 14 pt); bookmark = white 30 pt circle with blue `#0077FF` bookmark.
- Bottom: "💬 get more specific" + suggestion chips "+ cocktail bars", "+ rooftop spots", "+ wine bars" (white pills, shadow, about 27 pt).

**corner/corner_profile_stats_city_chips.png** (card scale about 2.88 px/pt): rounded-square avatar; "jake" bold about 22 pt, "@jake", "131 following  32 followers"; badges "① corner rank" and "5 week streak"; **city chips: selected "🌐 all" black fill white text; unselected "new york", "san francisco" fill `#F7FBFE` text `#929697`**, about 36 pt; stat tiles (fill `#F4F9FD`): "45 in common", "986 want to try", "157 favorites"; 4-across photo strip + "view all photos".

**corner/corner_place_card_hours_vibe_vid.jpg** (video, 1.5 px/pt): place card
- Sheet bg `#F0F4F8`; title heavy black about 26 pt ("La Fontaine"); address `#727274` about 14 pt.
- **Hours row: "closed" `#CE4E07` bold + "Tuesday: 8:00 PM – 3:00 AM" black about 15 pt + ⌄ (expands the week).**
- Share/close: white rounded-square buttons about 35 pt.
- Vibe card: white, radius about 14 px (9 pt): "🎷 jazz & whisky" `#7E7E7E` + description `#818181` about 13 pt; photo strip beside it.
- Social proof: avatar cluster + "saved by m1amagi, maria.ur and 3 others".
- Action chips "◎ directions", "🔗 site", "ig": white pills with shadow, black about 15 pt, about 38 pt tall. Floating "+ add".
- Search bar on this screen: black `#000100` pill, 64 px (43 pt).

**corner/corner_friends_activity_feed_vid.jpg**: friends' activity: segmented "near you" (black pill, white text) / "following"; "♥ invite friends" pill; full-width photo cards; "islam.jaa 👍 liked" `#7A7A7C`; place name bold black about 18 pt; neighborhood gray; "*from corner — Colorful canal-side district…*" italic `#B5B5B5`; three outlined circle buttons (bookmark, comment, heart).

**corner/corner_empty_profile_build_your_corner_vid.jpg**: empty state: stat tiles at 0; big photo card radius about 31 px (20 pt) with white "⊕ **build your corner**" bold about 22 pt centered.

**corner/corner_appstore_04_vibe_check_reviews.png**: review quotes (marketing composite, px only): round avatar with light-blue ring `#B8D6F0`; bubble fill `#F7FBFE`, generous radius; name bold `#232321`; quote regular `#232321`, lowercase, casual ("literally such a tourist trap…"); emoji reaction pills `#F4F9FD` with 1 px `#B7BABF` border and count `#585858` ("🍵 2", "❤️ 4").

**corner/corner_map_search_here_category_chips_vid.jpg**: map with "search here" and text category chips (eat, café, bar, shop, club). **corner_onboarding_personalize_map_vid.jpg**: "personalize your map / pick at least 3" photo tiles (actually good food, random cool spots, aesthetic cafes, date night, vintage). **corner_appstore_02/03/06**: import from anywhere (share sheet), friends' map, multi-city maps (reference only).

---

## 6. Atlas Obscura

### Sources
- App Store: https://apps.apple.com/us/app/atlas-obscura-travel-guide/id1563250221 (4.85 stars, 9,895 ratings, v1.20.1). 9 iPhone (1242x2688).
- Website https://www.atlasobscura.com is behind a Cloudflare challenge for scripted fetches; not bypassed, so no CSS. Website layout captured from YouTube desktop walkthrough "Atlas Obscura Honest Review & User Experience" https://www.youtube.com/watch?v=S3QKP0nhU34 (854x360). _5ofh2eaeQ8 (Atlas Obscura Trips site) and TsWjedQiGhU (App Store pages only) not used.

### Screens (2.58 px/pt)

**atlas_obscura/atlas_obscura_place_page_been_want_tiles.png**: hidden-gem place page
- Hero photo full bleed 725 px (**281 pt**) tall; round dark `#1C1C1C` buttons 91 px (35 pt): back, share, bookmark, map; "See all 13" dark pill bottom-right.
- Title "Rakotzbrücke Devil's Bridge" bold `#1D1D1D` about 28 pt (2 lines); location "Gablenz, Germany" `#818181` about 17 pt; dek bold `#1D1D1D` about 17 pt ("This jaw-dropping 19th-century bridge uses its reflection…").
- **Been / Want tiles**: two tiles 409x237 px (**158x92 pt**), gap 10 pt, radius about 4 pt. "I've Been Here": white, 1 pt `#E2E2E2` border, flag icon, "165" bold, label `#1E1E1E` about 14 pt. "I Want to Go": fill `#FAF0D7`, gold star `#FFAF00`, "3677".
- "📷 Add a photo" `#006B5B` semibold about 17 pt; divider `#E2E2E2`; body copy.

**atlas_obscura/atlas_obscura_map_pins_clusters_card.png**: map
- Header bar `#1C1C1C` (avatar, AO logo, grid icon). Search field white, **square corners**, placeholder `#787878`, about 40 pt tall; filter = white circle.
- Pins: teardrop `#ECAD3C` with 1 pt black outline; clusters `#F4B13F` circles with black bold counts. FABs white 34 pt circles with `#FFAE00` icons.
- Bottom card: white, square corners; title `#1D1D1D` bold about 17 pt; description `#1F1F1F` about 14 pt; category "Art" `#838383`; photo right with bookmark.

**atlas_obscura/atlas_obscura_save_to_list_sheet.png**: save sheet: top radius about 13 pt; "Save to a List" bold `#1D1D1D` about 22 pt; close = black `#1E1E1E` 35 pt circle with white ✕; rows at 64 pt pitch: black `#1C1C1C` icon discs with gold `#FCAC00` glyphs (⊕ Create a new list, flag Been there, star Want to go), custom lists plain text, private list with lock icon; text `#1E1E1E` about 17 pt.

**atlas_obscura/atlas_obscura_browse_categories.png**: browse: yellow `#FFAE02` background; "Browse" + ✕; category tiles black `#1E1E1E` 158x88 pt, radius about 2.6 pt, gap 9 pt, white bold label top-left (Architecture, Art & Culture, Death & Afterlife, Food & Drink, History, Nature); "Latest Places" bold about 26 pt + chevron; place cards with bookmark disc.

**atlas_obscura/atlas_obscura_category_list_sorted.png**: category list: crimson `#A00830` hero with arch-masked photo, caption gray, title "Outsider Architecture" bold about 26 pt, "↑↓ Sorted by Distance" `#006B5E`, large photo cards with black bookmark discs.

**atlas_obscura/atlas_obscura_profile_stats.png**: dark `#1C1C1C` profile header, username `#FFAF00` bold, link `#2EB682`; "My Stats" tiles `#1E1E1E` 159 pt wide, gap 8.5 pt, radius about 2.6 pt, yellow hexagon badge, white bold number ("1,287 Places I've Been", "11,566 Places I Want to Go").

**atlas_obscura/atlas_obscura_web_explore_the_atlas_cards_vid.jpg** (desktop website, 360p): "Explore the Atlas", FEATURED / MOST RECENT toggle pills, place cards = photo, icon row (flag = been, star = want, list = add to list), small caps location eyebrow ("TAIZ, OMAN"), bold title, short serif description, "ADDED BY" avatar + username.
**atlas_obscura/atlas_obscura_appstore_09_cluster_map.png**: world cluster map (reference only).

---

## Element map for Faves

One reference per element. Copy the structure and the measured values; swap in Faves content.

### 1. Place page
**Copy:** `google_maps/google_maps_place_page_troys_cafe.png` (the only full place page captured at measurable resolution, and the one every user already knows).
- Bottom sheet over the map: white, top radius about 30 pt, grabber 42x4 pt `#C7C7C7`.
- Header: name about 22 pt regular, 34 pt `#F2F2F2` circle buttons (share, close) 8 pt apart.
- Replace the star row with the **Locals Score badge** (element 2) + hidden-gem line (element 3); keep the text rows: "Coffee shop · $10–20" `#5D5D5D` about 16 pt, then the hours line (element 11).
- Action pill row, 42 pt tall, full radius, 8.6 pt gaps: first pill filled (Faves's "Add to day"), the rest tonal (Directions, Save, Share).
- Photo collage: big photo plus two stacked, 8 pt gaps, 17 pt radius.
- Tabs underneath (Overview / Reviews / Photos) with a 3 pt rounded underline under the active label.
- From Beli's place page (`beli/beli_place_page_top_news_vid.png`), take only the **section order**: name, tag line, actions, **Scores section**, popular items, member photos. That is the order to use; the Google sheet supplies the measurements.

### 2. Locals Score badge and breakdown
**Badge, copy:** `beli/beli_appstore_05_recs_list_reserve.png` score circle.
- 39 to 40 pt circle, white fill, 1 pt `#D3D3D3` ring, score in semibold green (`#009C61` on post, `#329966` in lists) about 15 pt, one decimal ("9.1").
- Count badge (Beli's "2k") as an 18 pt filled circle overlapping the bottom-right, white bold about 9 pt. Use it for the number of signals behind the score.
- On the map, use Beli's pin (`beli_appstore_02`): colored disc fused to a white 29 pt pill showing the score in black bold about 13 pt.

**Breakdown, copy:** `apple_maps/apple_maps_place_card_waterbar_web.jpg` stat strip.
- Four equal columns with thin vertical dividers.
- Uppercase gray label about 12 pt semibold `#7C7C7E`, one per source with its count: GOOGLE (2.1K), YELP (3.2K), REDDIT (41), TIKTOK (1.2M).
- Value about 20 pt semibold under each label, colored like Apple does ("Open" green, rating orange).
- Under the strip, the Beli Scores pairing (circle plus a one-line plain-English caption, e.g. "How much locals love it") per `beli_place_page_top_news_vid.png`.

### 3. Hidden-gem badge
**Copy:** `corner/corner_ai_search_results_hidden_gem_cards.png`.
- Outline gem icon + italic black text with the actual number: "only 22 saves on google", about 16 pt.
- It sits in the card's metadata stack, below a vibe line (purple dot `#A571ED` + gray `#868686` descriptor).
- This is the most persuasive hidden-gem pattern found: a quantified rarity claim, not a sticker. Beli's teal "Hidden Gem" tag in the place-page tag line is the fallback for list rows.

### 4. Explore map with category chips
**Copy:** `corner/corner_map_emoji_pins_categories_search.png`.
- Desaturated light basemap (`#ECECEC`).
- Pins = white-circle icon (about 23 pt) + name `#191919` semibold about 12 pt + italic gray descriptor ("open courts", "best hot pot").
- "search here" pill `#1C64FC`, 32 pt.
- White filter pills ("everyone ▾", "open now") with soft shadow.
- Bottom category row of icon-over-label items (about 36 pt icon, 13 pt label): Courts, Food, Views, Hidden gems, Cafes, Go out.
- Floating white tab-bar pill. The icons must come from real assets, not drawn ones.
- If icons are not ready on day one, fall back to the chip style in `google_maps_search_bar_category_chips_maptype_sheet.png`: white 32 pt chips, icon + `#1F1F1F` label about 15 pt, 8 pt gaps.

### 5. List/map toggle
**Copy:** `beli/beli_appstore_ipad_list_map_toggle.png`.
- Segmented control 32 pt tall, radius 8.5 pt, full width minus 16 pt margins on iPhone (448 pt on iPad).
- Selected half filled with the brand color, white icon + label about 16 pt; unselected half white with a 2 pt brand-color outline.
- On scrolled lists, add Beli's floating pill from `beli_appstore_05`: 41 pt, full radius, brand fill, map icon + "View Map", shadow, bottom-right.

### 6. Search bar
**Copy:** `corner/corner_map_emoji_pins_categories_search.png` search bar.
- Black `#1A1A1A` pill 47 pt tall, 14 pt side margins, white query text about 17 pt.
- Blue `#1870FF` 41 pt circular submit on the right.
- It reads as "ask for anything" ("spots to cowork from"), which is exactly Faves's natural-language "who's coming and what you're into" input.
- Results open as Corner's query bubble + answer line + tabs (for you / popular / trending / friends / saved).

### 7. Saved lists
**Copy:** `google_maps/google_maps_saved_list_sheet_nyc_restaurants.png`.
- Emoji + list title about 24 pt; avatar stack + "Adriana and 1 other • Shared list" `#5D5D5D` about 15 pt; description.
- Tonal 42 pt chips "Invite collaborators" / "+ Add places" (`#D2F7FF` / `#014F5B`, 8 pt gap).
- Divider `#E3E3E3`; "16 places" + "✓ Recently edited ▾" 34 pt dropdown chip (`#DEE4E4`).
- Photo row (148 pt tiles, 8 pt radius); list items on the map as emoji markers.
- Shared, collaborative lists are the right model for planning with friends.
- For the save action itself, use `atlas_obscura/atlas_obscura_save_to_list_sheet.png`: 64 pt rows, icon discs for Create new list / Been there / Want to go, then custom lists, lock icon on private ones.

### 8. Beli-style "which did you like more?" comparison
**Copy:** `beli/beli_rank_3_which_do_you_prefer_vid.jpg` (the flow: `beli_rank_1` to `beli_rank_5`).
- Step 1: "How was it?" with three 58 pt circles (green `#8ECEAC`, yellow `#F0CC70`, pink `#E8A4AC`), labels gray until selected (then black + white ✓).
- Step 2: "Which do you prefer?" with two 167x166 pt cards, 1 pt dark-teal border, about 7 pt radius, centered serif bold name + gray city, and the 29 pt "OR" disc (`#19444A`, white bold) on the 14 pt gap.
- Step 2 bottom row: "↶ Undo" left, outlined "Too tough" pill (109x35 pt) center, "Skip ↷" right.
- Step 3: dark toast "X ranked!" (`#212123`, 47 pt, about 11 pt radius) at the top.
- Optional detail rows (Who did you go with?, Add notes, Add photos…) as in `beli_rank_2`.

### 9. Rankings list
**Copy:** `beli/beli_ranked_list_numbered_vid.jpg`, with measured component values from `beli/beli_appstore_05_recs_list_reserve.png`.
- Numbered bold name "1. Gasoline Grill" about 18 to 19 pt; "$$ | Burgers" and neighborhood `#222428` about 16 pt; "1.2 mi • Open • Closes 8:00 PM" `#989AA2` about 16 pt.
- Score circle (39 pt) right-aligned at the top of the row; ⊕ and bookmark at the bottom-right; 1 pt `#F7F7FA` dividers.
- Optional 79x35 pt brand-fill time-slot buttons (5 pt radius, 8 pt gaps) for bookable spots.
- City-wide "top people" boards use `beli_leaderboard_vid.jpg`: 54 pt rows, rank `#848486`, 30 pt avatar, gray handle, bold count right, segmented filter on top.

### 10. Photo grid
**Copy:** `yelp/yelp_photos_videos_grid.png`.
- Tabs with counts ("All (57)", "Food (21)", "Outside"), active label dark + 4 pt underline in the brand color, inactive `#666472` about 17 pt.
- One full-width hero tile (about 369x274 pt), then 2 equal columns; 2.7 pt gutters, no radius.
- Caption white bold about 16 pt on a bottom gradient; small translucent action circle top-right.
- Optional outlined search field (40 pt) above.

### 11. Opening-hours display
**Copy:** `corner/corner_place_card_hours_vibe_vid.jpg`.
- One line: status word bold and colored ("closed" `#CE4E07`; open in green), then "Tuesday: 8:00 PM – 3:00 AM" black about 15 pt, then a ⌄ chevron that expands the full week.
- It names the day, which is what a day planner needs (will it be open when we get there).
- Use Google's compact form `Open · Closes 11 PM` (Open `#188438`, rest `#5E5E5E`) in list rows, from `google_maps_place_page_troys_cafe.png`.
- Add Google's popular-times chart (`google_maps_ipad_popular_times_directory.png`) as the expanded detail: `#7CACF8` bars, live-hour `#EA79BB`, "Live 1 PM: A little busy" callout.

### 12. Reviews / quotes display
**Copy:** `corner/corner_appstore_04_vibe_check_reviews.png`.
- One quote per bubble: round avatar with a light ring (`#B8D6F0`), bubble fill `#F7FBFE` with a generous radius, bold name, quote in regular `#232321` kept in the original casual voice.
- One or two emoji reaction pills (`#F4F9FD`, 1 px `#B7BABF`, count `#585858`).
- For Reddit and TikTok quotes, swap the name for the source handle + platform glyph.
- For first-party notes, the in-app equivalent is Beli's post (`beli_appstore_03_feed_post_ranked.png`): "**Notes:** …" about 17 pt black, `#989AA3` date, `#808080` like/reply meta.

### 13. Empty states
**Copy:** `beli/beli_empty_been_list_modal_vid.jpg`.
- White card, illustration = brand-color line art on a soft blob (`#DCE8E0`).
- Serif bold title about 30 pt ("Your "Been" List"); two short centered body lines `#454545` about 17 pt.
- Full-width brand pill CTA 50 pt tall ("Let's rank!").
- Use the same frame for locked states (`beli_recs_locked_state_vid.jpg`: "Rank more restaurants").
- For a search with zero results, use Yelp's recovery pattern (`yelp/yelp_empty_no_results_android_vid.png`): headline, one helper line ("Try widening the map search area…"), "People also search for" suggestion chips, and a contribution prompt ("Notice something missing? Add a spot").

---

# Plans, routes and groups: UI reference catalog

Captured 2026-10-24 for Faves. Group: PLANS, ROUTES AND GROUPS (Wanderlog, Citymapper, Apple Maps, Google Maps, Airbnb, Partiful; onboarding = Partiful first run).

Images live in `references/plans/<app>/` (local only: `references/` is excluded in `.git/info/exclude`). Every image listed here was opened and looked at. Every number below was measured with PIL from the saved file unless it says "(visual)".

## How to read the numbers

- `px` is pixels in the saved file at the width stated for that file. `pt` is px divided by the scale given.
- Scales used:
  - App Store, Airbnb (1290 w): screen 1116 px wide, Dynamic Island 350 px = 126 pt, so **2.78 px/pt** (402 pt device).
  - App Store, Apple Maps (1320 w): screen 1002 px wide, **2.49 px/pt** (402 pt device assumed).
  - App Store, Google Maps (1242 w): Dynamic Island 319 px, **2.53 px/pt**.
  - App Store, Wanderlog (1242 w): screen x100 to x1144 = 1045 px, **2.68 px/pt** (390 pt device).
  - App Store, Citymapper (1242 w): screen about 888 px, **2.26 px/pt**.
  - App Store, Partiful (1242 w): share sheet screen 998 px, **2.54 px/pt**. Find a Time screen 957 px, **2.44 px/pt**.
  - YouTube iOS screen recordings at 886x1920 (Citymapper, Partiful onboarding): full screen, **2.25 px/pt** (393 pt).
  - Partiful RSVP clips (500x1080 crops), **1.27 px/pt**. Google Maps clips (491x1044 crops), **1.25 px/pt**. Airbnb 2024 iOS clips (446x980), **1.19 px/pt** (375 pt device). Apple Maps dark clips (521x1080 with bezel), about **1.23 px/pt**.
  - Wanderlog iOS video (1080x1920): **zoomed and cropped** (no status bar, so the scale is unknown). Use its colors and structure only. Take sizes from the Wanderlog App Store shots.
  - Android clips (Wanderlog 502 w, Airbnb 330 w) are converted in dp at about 1.22 px/dp and 0.80 px/dp, so they are approximate.
- "ink h" is the height of the text glyphs. Cap-only words (no descenders) give cap height. Font size is roughly cap height / 0.70.
- In the App Store mockups, the colors are exact. The video colors are H.264 approximations, accurate to about ±6 per channel.

## Fonts and design tokens read from official CSS

| App | Source | Fonts | Tokens |
|---|---|---|---|
| Airbnb | airbnb.com + `a0.muscache.com/.../client.82f0d40697.css` | `'Airbnb Cereal VF', 'Circular', -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue'` | `--palette-bg-primary-core #FF385C`; CTA gradient `linear-gradient(to right,#E61E4D 0%,#E31C5F 50%,#D70466 100%)`; grey1000 `#222222`, foggy `#6A6A6A`, bobo `#B0B0B0`, deco `#DDDDDD`, bebe `#EBEBEB`, faint `#F7F7F7`, grey200 `#F2F2F2`, arches (error) `#C13515`; radii tokens 4 / 8 / 12 / 16 / 20 / 24 / 28 px; card-container radius 12 / 20 / 24 / 28 / 30; avatar 8 / 12 / 24 / 40 / 50% |
| Wanderlog | `itin-compiled.azureedge.net/webflow.css` | `"Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto` | `--primary #3F52E3` (links, "Optimize route"), `--orange #F75940` (active tab, CTA), `--red #E23E57`, `--green #17B978`, `--teal #46CDCF` (pins), `--yellow #EC9B3B`, `--purple #7045AF`, text `#212529`, muted `#6C757D`, border `#DEE2E6`, light `#F3F4F5`, dark `#343A40` |
| Citymapper | citymapper.com + Typekit `use.typekit.net/wrk4ssz.css` | `"proxima-soft", sans-serif` (web) | brand green `#37AB2F`; site accents `#FE9001`, `#F5C402`, `#D22020`, `#895A93` |
| Partiful | partiful.com (Framer) | Inter / Inter Variable, `"TWK Lausanne Pan 300/400"`, `"Partiful Janky Inter Display Regular"`, Manrope, Afacad, IBM Plex Mono; system stack `-apple-system, 'SF Pro Text'` | site grey `#777772` |
| Google Maps | google.com/maps/about | `Google Sans Text` 400/500/700 | (measured below) |
| Apple Maps | apple.com/maps (globalheader.css) | `SF Pro Text, SF Pro Icons, Helvetica Neue` | iOS system colors (measured below) |

---

## 1. Wanderlog

**Sources**
- App Store: https://apps.apple.com/us/app/wanderlog-travel-planner/id1476732439 (rating 4.90 from 36,075 ratings; 10 iPhone 6.5" screenshots at 1242x2688, pulled from the page JSON `product_media_phone_`)
- Video (iOS, official-style walkthrough, 127,904 views): https://www.youtube.com/watch?v=HFWgThplaLw "How to use the Wanderlog app to plan your next trip", 1080x1920
- Video (Android + mobile web, 1080p): https://www.youtube.com/watch?v=6GJj3I36C7s "Wanderlog APP Tutorial (2026)"
- Site/CSS: https://wanderlog.com, https://itin-compiled.azureedge.net/webflow.css (help.wanderlog.com returned 403)

**Screens**

- `appstore_01_trip_overview_map_export.png`: trip Overview with the map on top. Components: blue teardrop place pins; white "Export" pill with the Google Maps icon top-right; three 43 pt white circular map controls stacked on the right (search, layers, lodging); bottom sheet with tabs Overview (active, `#F75940`) / Itinerary / Explore / $ plus a hamburger; "Reservations and attachments" row of glyph+label tiles (Flights, Lodging, Rental cars, Attachment, Trains, Other) with small count badges; "Places to visit" header with a numbered pin row. Marketing bg `#F45C44`. Palette: `#FCFCFC #ECECEC #DCE4D4 #B4D4FC`.
- `appstore_02_overview_notes_places_list.png`: Overview list. Collapsible section headers ("Notes", "Places to visit", "Fooood 😋") with a chevron at left and ••• at right, bulleted notes, place rows (red numbered pin, bold name, gray "Closed Sun, Mon •" meta line, 3-line description, 82 pt rounded thumbnail at right). Gradient AI FAB, black map FAB and black + FAB stacked at bottom-right. Section dividers are 16 pt gray bands.
- `appstore_03_trip_header_share_reservations.png`: trip header card (cover photo, white card overlapping it, title "Oahu vacation", calendar glyph + "3/21 - 3/28", overlapping collaborator avatars + "+4" chip, black **Share** pill, •••). The callout shows "Forward email" and "Sync with Gmail" rows; flight card "SFO → HNL" with an ON SCHEDULE green badge and terminal times.
- `appstore_04_road_trip_route_map_numbered_stops.png` (**itinerary map reference**): map in the top about 40% with the sheet below. Measured: route polyline `#B29DD2` (the purple day color `#7044AC` at about 60% over the map), cross-section about 24 px (about 6 to 7 pt); numbered teardrop pins 70x100 px = **26x37 pt**, fill `#7044AC` with a white numeral; teal "attraction" pins `#46CDCF`; map controls about 43 pt white circles (115x120 px with shadow); sheet top edge at y1609, grabber 90x12 px = 34x4.5 pt `#DEE2E6`; "Select all" / "Optimize route" links `#3A4EE2` (ink h 9.3 / 11.2 pt); trip total "5 hr 30 min, 345 mi" `#677079`; stop title "Big Sur" `#1C2125` ink h 14.9 pt; toast "We saved you 15 minutes of driving and $3 of gas! — Undo" on a dark `#2C3434` card.
- `appstore_05_itinerary_day_travel_legs.png` (**leg-row reference**, 2.68 px/pt):
  - Nav: home glyph, centered title "Iceland trip" `#212529` (ink h 15.7 pt), •••.
  - Tabs: inactive `#6C757D` (ink h 10.8 pt, ≈17 pt semibold); active `#F75940` with a 3 px (≈1 pt) underline, 72 pt wide.
  - Day chips: selected fill `#343A40` + white text, **73.5x41.4 pt, radius ≈7.5 pt**; unselected `#F3F4F5`; gap ≈8.6 pt; first chip at 16 pt from the edge.
  - Day header "Sat, 3/21" `#212529` (ink h 21.3 pt, ≈26 pt bold), chevron left, ••• right; links "Add notes · Select all" `#3F52E3` (ink h 9 pt); divider 1 px `#E4E7EB`.
  - Stop: teal teardrop pin 19x26 pt `#44CCCC` with a white numeral at x 15 pt; title "Seljalandsfoss" `#212529` (ink h 15.7 pt, ≈19 pt bold) at x 50 pt; time pill "7:00am" **57.8x19 pt, fill `#EBEDFC`, text `#3F52E3`**; notes `#22262A`; italic placeholder "Add notes, links, etc here" `#707980`; thumbnail **82x82 pt, radius ≈7.5 pt**, right margin 16 pt.
  - **Leg row**: walk or car glyph `#6C757D`; text "5 min walk • 0.4mi" / "15 min • 2.1mi" `#6C757D` (ink h 10.8 pt, ≈15 pt regular) at x 40.7 pt; caret ▾; link "Directions" `#3F52E3` (ink h 10.4 pt); trailing dashed rule `#DEE2E6` (dash ≈1.5 pt on / 1 pt off) running to the right edge.
  - FABs: AI "magic" FAB 58.6 pt circle with gradient `#CD5362` → `#984C8E`; map FAB 58 pt `#212529`; + FAB `#212529`.
- `appstore_06_explore_categories_search.png`: Explore tab. Search field "Tokyo" (light gray), "Categories / See all" with 2x2 tiles (emoji + label: Restaurants, Attractions, Cafes, Photo spots) on `#F3F4F5`, guide card "Top places for Tokyo / Most often-seen on the web", "Travel information" glyph row, "Top searches" photo tiles. Marketing bg `#14BC7C`.
- `appstore_07_collaborators_avatars.png`: header card with 4 overlapping circular avatars (white ring) = the collaborators. Same tab bar and icon row as 01.
- `appstore_08_attachments_ticket_card.png` (**ticket**): ticket card "Marin Center": title bold, address `#6C757D`; labeled fields in small caps (SECTION / DATE / PRICE) with values below; "ORDER #1234567890"; a perforation (dashed line with semicircle notches at both edges) above a barcode. Attachment tile "tickets.pdf / Add notes" on `#F3F4F5`.
- `appstore_09_places_list_add_notes.png`: bucket-list sections with "Add notes • Select all" links `#3F52E3`, blue numbered pins `#349CDC`, italic "Add notes, links, etc here".
- `appstore_10_budget_expenses_add_expense.png`: budget header on navy `#2C345C` ("$2345.10", progress bar, "Budget: $8000 ✎", outlined white pills "Debt summary" / "View breakdown"); expense rows with a gray round glyph + title + subtitle + right-aligned amount; full-width coral **"+ Add expense"** pill `#F45C44` at the bottom.
- `ios_video_trip_header_share.png`: iOS trip header: cover photo, white rounded card, "Trip to London 👑", date chip, avatar, black **Share** pill, •••; Overview tab active `#EC543C`; "Reservations and attachments" glyph row; coral "+ New list" pill bottom-left; black map FAB.
- `ios_video_add_place_sheet_empty.png`: "Add a place" sheet, empty search, "Don't know where to start?" + coral pill "Explore guides and blogs", keyboard up.
- `ios_video_add_place_sheet_results.png` (**swap reference**, px @1080 w): scrim `#ADADAD` over the page (≈33% black on `#F7FAFA`); sheet `#F7FAFA`, top corners radius ≈38 px; centered bold title "Add a place" `#1A1C1C`; search field **880x115 px fill `#EDEFEF`** with a blue caret `#4468D4`; clear button ≈95 px circle `#D8DEDF` with an × in `#676E73`; result rows on a ≈166 px pitch: pin glyph `#303535`, title `#1A1C1C`, subtitle "Southwark Street, London, UK" `#787B7B`.
- `ios_video_day_add_place_recommended.png`: under each day: "Add a place" field (pin glyph + placeholder `#717474`, fill `#EDEFEF`) + "+ Other" button (same fill), then "Recommended places" (chevron, `#6B6D6D` bold small) with horizontally scrolling cards (thumb 162x157 px + name + round "+" add button).
- `ios_video_rearrange_sheet_drag.png`: "Rearrange" sheet with "Done" at the right; day rows as `#E4ECEC` rounded bars; the dragged item is lifted (white, blue 1 px border, shadow) with a ⋮⋮ handle.
- `ios_video_itinerary_day_legs_clean.png` (px @1080 w): bg `#F7FAFA`; calendar-edit black 115 px circle; day chips selected `#D4DFE0` / unselected `#EDEFEF`; day title `#060909`; subheading placeholder `#A6A8A8`; "Optimize route" `#3A3D97` + "· 36 mins, 3.0 km" gray; dashed divider `#E8EBEB`; teal pin `#40C8C4`; title `#040606`; "From the web:" description `#585A5A`; leg row "🚶 10 mins • 850 m ▾ Directions" (text `#696C6C`) with a dashed trail.
- `ios_video_leg_mode_sheet_loading.png` (**loading state, per leg**): the leg-mode sheet while fetching: rows "Driving — Loading driving info…", "Transit — Loading transit info…" in `#747676`, while "Walking — 25 mins • 2.1 km" is already filled.
- `ios_video_leg_mode_sheet_driving_transit_walking.png` (px @1080 w): sheet `#F7FAFA`, top radius ≈38 px; rows on a 122 px pitch: mode glyph (car / bus / walker) `#191E1E` 45 px; label "Driving" `#222525`; right-aligned "6 mins • 2.5 km" `#767878`; bottom rule `#E9ECEC`.
- `ios_video_directions_app_picker.png`: iOS action sheet "What app would you like to use?" with Apple Maps / Google Maps in system blue.
- `ios_video_day_context_menu.png`: day ••• menu sheet: Edit, Change color, Select all, Insert day after, Delete day (glyph + label rows).
- `ios_video_map_red_pins_selected_day.png`, `ios_video_map_plus_itinerary_split.png`: split view (map top, itinerary below). The selected day's pins turn red `#D83850` numbered; other days stay teal/blue.
- `ios_video_full_map_route_fit_all.png`: full-screen map. Day route `#E293A1` (red day color at ≈50%) about 16 px wide @1080; red numbered pins `#D83850` (90x130 px); blue category pins `#90B8F0`-ish; **"Fit all places" pill** fill `#EFEFEF`, text `#1A1C1C`, 92 px tall; locate button bottom-right.
- `ios_video_add_to_trip_sheet.png`: "Cancel / Add to trip" sheet: Overview lists (colored pins) + "+ New list", then the Itinerary days each with its own day-colored pin (red, purple, blue, green, orange, navy).
- `android_video_home_create_menu.png`: home "NEW FEATURE · Plan with an AI assistant" card (coral "Try it out" pill) + create menu with white rounded tiles "Trip plan" / "Guide" over a scrim; red × FAB.
- `android_video_plan_new_trip_empty.png` / `android_video_plan_new_trip_filled.png` (**form step**, ≈1.22 px/dp): × close in a circle, title "Plan a new trip" `#141719` (ink h ≈25 dp), centered subtitle `#6B6C6E`; bordered fields (1 px `#C8CACC`, radius ≈8 dp): "Where to?" with an inline + button, "Dates (optional)" with two calendar sub-fields; "+ Invite a tripmate" + "Friends ▾" visibility; coral pill **"Start planning"** fill `#F4583E`, about 248x59 dp, white bold label; "Or see an example for New York".
- `android_video_date_range_picker.png`: range calendar card: "September 2025 / Sep 8 – Sep 19", range fill coral `#F45C3C` with rounded ends, "Save" text button.
- `android_video_add_hotel_sheet.png`: "Add hotel or lodging" sheet: full-width `#ECECEC` rounded rows (Book hotels, Forward email, Sync with Gmail PRO), "or" divider, search field.
- `mobileweb_video_hotels_view_deal.png`: hotel results: coral **"View deal"** pills `#F45C3C`, "AIRBNB" source chips, DISCOUNT tag, floating dark "View map | Filters" pill.

---

## 2. Citymapper

**Sources**
- App Store: https://apps.apple.com/us/app/citymapper-all-live-transit/id469463298 (4.86, 110,036 ratings; 9 iPhone 6.5" shots 1242x2688)
- Video (iOS screen recording, 886x1920, Copenhagen): https://www.youtube.com/watch?v=FbTQ3Yh4Q-s "Citymapper app - FULL OVERVIEW & HOW TO USE" (10,865 views)
- Video (reviewed, not saved): https://www.youtube.com/watch?v=gDTyvmXYYRM
- Site: https://citymapper.com (Typekit proxima-soft; green `#37AB2F`)

**Screens**
- `appstore_01_brand_home_map.png`: brand panel, home "Get Me Somewhere / Get Me Home" card, mode tiles, Commute rows. Brand green `#34AC2C`, purple city panel `#8C5C94`.
- `appstore_02_transport_modes_icons.png`: transport-mode glyphs (train, bus, metro, tram, bike, scooter, taxi, walk) as white line icons in white-outlined circles on green.
- `appstore_03_route_options_start_end.png`: route options: Start/End block on navy `#3C6484` ("Start ○ Current Location" / "End ● Times Square", swap ⇅); a 2-column mode grid (Walk 30 min 124 cal, Cycles 17, Scooters 20 $7.40, Cabs ~24 $12+, Mopeds ~19, Carshare $9.80 29) with price chips; "Suggested" list rows: line badges (F orange, N Q R W yellow), live "rt" signal glyph + big minutes ("22 min"), "Every 5 min from 2 Av", "$2.75" price chips.
- `appstore_04_journey_go_button_legs.png` (**route map + GO**, 2.26 px/pt): transit line `#009D57` (≈7 px stroke); stops = white dots with a green ring; walk legs = navy dotted line, dots `#407090`; green flag labels "Start" / "End" `#37AB2F` (48x38 pt, white bold text); **GO button 135x73 pt, fully rounded, fill `#37AB2F`, white "GO" + circled arrow**; floating chip "in 6, 12, 15 min" (white, shadow); round white controls (back, share, star, locate). Below: summary bar (walk 6 · line 6 · walk 9 · "28 min" `#4A4A4A` ink h 17.3 pt; "Leave within 2 min · Arrive 17:04"); **leg row** "🚶 Walk to Ⓜ Grand Central - 42 St … 6 min": icon tile `#407090` with a white walker, text `#417193` (ink h 19 pt), minutes `#4A4A4A`; "Best Entrance" info box `#F8F8F8` with a green address `#37AB2F`; "6 Subway – Downtown & Brooklyn" with radio rows "Brooklyn Bridge - City Hall … 12 min".
- `appstore_05_step_list_get_off_alert.png`: in-journey step list ("Ride 4 stops to ② 2 Av 7 min", stop list with an orange line rail and ring stops, "Leave station 1 min", "Best Exit"), blue "Get off now" alarm bubble `#0C84FC`, red × close.
- `appstore_06_vehicle_options_map.png`: nearby vehicle pins (bike, scooter, car, taxi) in navy `#447494` teardrops with white glyphs, around a dashed radius circle.
- `appstore_07_turn_by_turn_banner.png`: blue speech-bubble banner `#1C8CFC` with white text, street label chip "↱ Astoria Ave", turn list sheet ("In 85 m / Turn right onto Astoria Avenue / 1 min"), navy square mode buttons.
- `appstore_08_awards.png`, `appstore_09_brand_tell_no_one.png`: brand panels (green `#34AC2C`, yellow `#FCD424`), no UI.
- `ios_video_home_get_me_somewhere.png`: home: settings cog, map with stop badges, card "Get Me Somewhere" (search circle) + "Get Me Home" with Work/Places icon buttons; green panel with mode tiles (All, Walk, Bike, Maps, Issues, Bus, Metro, S-train, Rail, More); purple "On Trip" strip.
- `ios_video_start_end_over_map.png`: Start/End fields floating over the map, mode grid below.
- `ios_video_route_options_suggested.png` (2.25 px/pt): page bg `#346288` (navy blue); Start/End block darker navy; white mode grid card (Walk 101 cal 25 min / Bikes 39 cal 10 min / Scooters ~29 min); "Suggested" label `#E8F4FF` on blue; route rows in a white card `#FEFCFF`, row ≈67 pt tall, separators 1 px `#E7E5E8`; line badge "M1" `#006448` circle; big minutes "22" (ink h 13.8 pt, `#5D5A5A`) + small "min"; "in 4, 9 min" `#525053` + "from Islands Brygge" `#A19FA2` (ink h ≈12 pt); bottom route-type bar `#254F6D` with circular icons and labels (Classic selected with a white ring, Bus+, Train+, Walk Less, Mixed, Simple).
- `ios_video_route_options_scrolled.png`, `ios_video_simple_mode_transfers.png`: the list grouped by "No transfers" / "1 Transfer" (Simple mode selected).
- `ios_video_leave_arrive_time_sheet.png` (2.25 px/pt): white sheet; segmented control Leave / Arrive, track `#DBDBDF` 31.5 pt tall, selected segment white; outlined chips "in 30 min / in 60 min / in 90 min / To…" (1 px `#D4D2D3`); wheel picker; **"Leave now" button 360x45.7 pt, fill `#25A020`, white label, small radius**.
- `ios_video_loading_next_departures.png` (**loading state, per row**): "All / Saved" tabs; stop cards (bus badge `#D8A733` circle, stop name `#646165` ink h 13.3 pt, "68", walk "2 min"); the row body reads **"Loading next departures"** in `#747175` with an iOS activity spinner (45 px) at right; "REMOVE ADS >" outlined chip.
- `ios_video_pick_city.png`: full green `#24A424` "Pick City" list with line-art mascots, "You are here!" in yellow, white search field.

---

## 3. Apple Maps

**Sources**
- App Store: https://apps.apple.com/us/app/apple-maps/id915056765 (6 iPhone 6.9" shots 1320x2868)
- Video (iOS, dark mode, transit + nav): https://www.youtube.com/watch?v=9F9oaN3e4Qo "How To Create A Route On Apple Maps On Your Iphone (2025 Guide)" (8,060 views)
- Videos reviewed, not saved: https://www.youtube.com/watch?v=_j-Uk1Mqnrs, https://www.youtube.com/watch?v=bkDPeasrNzg
- Site: https://www.apple.com/maps/ (SF Pro Text)

**Screens**
- `appstore_01_driving_nav_eta_bar.png`: nav banner (lane arrows, "0.2 mi", exit badge, "South to Cupertino") in a translucent blue-gray `#748CA4` card; round glass buttons; ETA bar "9:54 arrival · 13 min · 10 mi".
- `appstore_02_local_lists_guide_card.png`: guide card: photo hero, " Maps Local Lists", title "Trending Restaurants in Baton Rouge", two translucent buttons "Add to Guides" / "Share", description + "More", source row.
- `appstore_03_nearby_transit_sheet_chips.png` (**bottom-sheet reference**, 2.49 px/pt): sheet grouped bg **`#F2F2F6`**; top corner radius ≈100 px ≈ **40 pt**; centered title "Nearby Transit" `#000000` (ink h 14.4 pt, ≈17 pt semibold); circular close button top-right with a black ×; filter chips row: **selected "Suggested" 102x40 pt fill `#0285FB` white text** (ink h 13.6 pt), unselected chips white with a hairline border; section header "Washington & The Embarcadero" (≈17 pt semibold) + gray walk chip "🚶 2 min"; inset grouped cells white, radius ≈45 px ≈ 18 pt, separators 1 px `#DFDFE1`; rows "Inbound to Fisherman's Wharf … 3, 17 min" + live signal glyph (green), red line badges "F", "1", "12".
- `appstore_04_ar_walking_directions.png`: AR walking: giant 3D arrow + street name, white text card "In 0.4 mi ↑ Cross North…".
- `appstore_05_look_around.png`: Look Around full-bleed with "Done" glass pill and a compass.
- `appstore_06_offline_maps_cancel_download.png`: bottom glass panel: "Size of selected map: 286.1 MB" + two equal pills, **Cancel (translucent gray, black label)** and **Download (system blue, white label)**, about 172x42 pt each (visual).
- `ios_video_dark_place_card_actions.png`: dark place card: title "Walter Mart" + "Shopping Center", +, share and × circular buttons, action tiles (blue "🚌 25 min", Call, Website, More), HOURS / RATINGS / DISTANCE row, photos.
- `ios_video_dark_directions_transit_go.png`: dark "Directions" sheet: mode tabs (car / walk / **transit selected blue** / bike / rideshare), My Location → Walter Mart rows with reorder handles, "Now ⌄ / Prefer ⌄" menus, route card "25 min / 4:02 PM ETA · Scheduled every 30 min" with a **leg chain "🚶 12 min ▸ [22] 🚌 ▸ 🚶 2 min"** and a green **GO** square-ish button (≈60 pt, fill ≈`#64E757` in the compressed video); sheet `#26282C`, cells `#3B3B3F`.
- `ios_video_dark_nav_end_route.png`: nav: "60 m Turn left" banner, page dots; expanded card "To Walter Mart 21 min", rows, red **"End Route"** full-width button.
- `ios_video_dark_step_list.png`: step list "From My Location … The destination is on your left", with "Report an Issue" / "Share" links in blue.
- `ios_video_dark_change_stop_search.png`: the **"Change Stop"** search sheet, Apple's native naming for a swap. Components: "Cancel" in system blue at left, centered semibold title "Change Stop", a rounded search field with a magnifier and a clear ⓧ, and result rows on a ≈90 px (≈73 pt) pitch. Each row has a 32 pt category circle (yellow shopping bag, gray magnifier for "Search Nearby", blue "P" for parking), a bold white title, and a gray "5.4 km · Recently Viewed · Santa Maria…" subtitle, with inset hairline separators. The keyboard's return key is a blue "search" button.

---

## 4. Google Maps

**Sources**
- App Store: https://apps.apple.com/us/app/google-maps/id585027354 (4.67, 7.4M ratings; 9 iPhone 6.5" shots 1242x2688)
- Video (iOS screen recording): https://www.youtube.com/watch?v=G5YKioTOlE4 "How To Use Walking Directions In Google Maps" (90,011 views)
- Video (official Google, Ask Maps, 1920x1080): https://www.youtube.com/watch?v=5PPiXyAV-Ro "Introducing Ask Maps" (245,274 views)
- Video reviewed, not saved: https://www.youtube.com/watch?v=FfFy8qK93cI
- Site: https://www.google.com/maps/about/ (Google Sans Text)

**Screens**
- `appstore_01_nav_turn_banner_exit.png`: nav: green banner `#04644C` "↱ Newell Rd 500 ft", "Then ↰" tab, mic button; route blue; bottom "19 min / 2.7 mi · 10:00 AM" + fork button + red **Exit** pill.
- `appstore_02_ask_maps_sheet_drive_cards.png`: Ask Maps sheet: header "✧ Ask Maps" + new / history / × icons, user bubble (gray rounded), answer text with underlined place links, "Drive (Fastest)" header + light card "🚗 Typically 19-29 min" (green text) "via US-101 S" with a diamond directions button; "BART" card "46 min · $11.80". Map: route chips "🚗 19-29 min" (dark blue filled, selected) vs "46 min" (white).
- `appstore_03_traffic_route_reroute.png`: traffic route (blue with red segments), alt route light blue, time callouts "24 min / 22 min", incident "+5 min" chip, "Re-center" pill.
- `appstore_04_place_sheet_reserve_order.png` (**reserve buttons**, 2.53 px/pt): place sheet: title "Troy's Cafe" (≈24 pt regular `#1F1F1F`), meta "4.0 ★★★★ (523) · 🚌 30 min" `#1F1F1F`, "Open · Closes 11 PM" (green / `#5E5E5E`); **action pills 41.9 pt tall, fully rounded: primary "◆ Directions" fill `#007B8B`, white label (ink h 15.8 pt incl. icon); tonal "Start", "Order", 📅 fill `#D2F7FF`, label `#014F5B`**; gap ≈9.5 pt; photo grid; tabs Overview (active `#00696D`, underline 4 px) / Menu / Reviews / Photos / Updates; **"📅 Reserve a table" and "🍴 Order online" tonal pills, 42.3 pt tall, ≈170 pt wide each, fill `#D2F7FF`, label `#014F5B` (ink h 11.9 pt ≈ 14 pt medium), 12 pt gap**; description `#1E1E1E`.
- `appstore_05_shared_list_invite_collaborators.png`: shared list sheet "🍕 NYC Restaurants": share and × circles, "Adriana and 1 other • Shared list", description, tonal pills **"👤+ Invite collaborators"** and "+ Add places" (fill `#D4F4FC`), "16 places / ✓ Recently edited ▾" dropdown chip, photo row.
- `appstore_06_map_type_layers_sheet.png`: "Map type" sheet with 3 thumbnails (selected = teal 2 px ring + teal label), "Map details" 4-column tile grid.
- `appstore_07_results_sheet_filter_chips.png`: "Results" sheet: share and × circles; chips row **34 pt tall**: filter-settings glyph, "Sort By ▾" fill `#F2F2F2`, **selected "✓ Open Now" fill `#DCE3E9`**, "Price ▾", "To…"; result card: 3 photo tiles, name "Troy's Cafe" `#1F1F1F`, meta with an orange star, green "Open", description; tonal pills 42.3 pt "◆ Directions", "📞 Call", "Share", 🔖 (fill `#D2F7FF`, label `#014F59`).
- `appstore_08_lens_ar.png`, `appstore_09_carplay.png`: AR label "76th St" (blue `#1C74EC` tile) and the CarPlay layout.
- `ios_video_place_sheet_directions_pills.png` (1.25 px/pt): search bar with ×; place sheet: rating stars, blue **"◆ Directions"** pill (filled `#1A73E8`-ish), outlined "▲ Start", "📞 Call".
- `ios_video_choose_start_point.png`: "Choose starting point" field + list (Your location, Choose on map, recent places).
- `ios_video_directions_drive_mode_chips.png`, `ios_video_drive_routes_traffic_callouts.png` (**route sheet**): from/to fields with a dotted connector and a swap ⇅ (field text `#272527`); **mode chips row**: car 5 min (selected: light blue fill `#DBE3EC`, blue text `#205EA3`), transit 10 min, walk 13 min, ride 5 min, bike 4 min (icon + time, no label); route sheet: "5 min" in orange `#91561D` (traffic-adjusted) + "(0.8 mi)" `#706D72`, "Fastest route now due to traffic conditions" `#77767A`; **"≫ Preview" pill 101x37.6 pt fill `#1B72E7`, white label**; outlined **"☰ Steps"** and "📌 Pin" pills (1 px `#E6E3E6` border, label `#2364AB`); map route segments orange `#FCA000` / blue `#0C50FC`, selected callout box `#0420D0` "5 min" white.
- `ios_video_walk_route_dotted.png`: walk mode: **dotted blue route** (round dots) with alternates in gray dots, time callouts "13 min" (selected blue box) / "14 min" (white).
- `ios_video_route_preview_walk.png`: "Route preview" step header "↑ Head southeast on S Columbia St".
- `promo_video_ask_maps_chip.png`: home: search bar + **"✧ Ask Maps" chip, blue `#346CF4` filled with a glow**, then Home and Restaurants chips.
- `promo_video_ask_maps_sheet_streaming_greeting.png` / `promo_video_ask_maps_sheet_suggestions.png`: sheet "Ask Maps": greeting "Hi, Elise. Ask anything, about anywhere." streaming in; the leading words are light blue and settle to black; suggestion rows ("Plan a rainy day museum route stopping for bagels", …) appear one by one; "Ask a question" input at the bottom.
- `promo_video_ask_maps_prompt_glow.png` (**loading/streaming reference**, px @1920 w): prompt card white, radius ≈56 px; **gradient stroke ≈2 to 3 px going from gray `#94A7B3` (top-left) to blue `#005FCB`/`#0867D3` (bottom/right)**; **outer glow `#D5E5FE` → `#E8F0FF`** (≈60 to 80 px soft blur); typed text `#000000`; **newest typed words in blue `#3C7ED8`, the last characters fading to `#CFE0F5`**; mic glyph black; send button = arrow `#306CF0` in a `#F0F0FC` circle.
- `promo_video_ask_maps_answer_streaming_tail.png`: answer bubble streaming: settled text `#1B1B1B`, **streaming tail `#6C9FE2`**, 1 to 2 px stroke from light gray to blue at the bottom-right, the same blue glow; a map "Midway Meetups" card fades in below.
- `promo_video_ask_maps_answer_map.png`, `promo_video_ask_maps_place_card_times.png`: answer with a map card; place card "Willow Vegan Bistro" with photos, a floating note bubble "It's saved in your 'want to go' list…", and reservation time chips (6:30 PM … 7:30 PM).

---

## 5. Airbnb

**Sources**
- App Store: https://apps.apple.com/us/app/airbnb/id401626263 (4.76, 703,066 ratings; 7 iPhone 6.9" shots 1290x2796, 2025-05 set)
- Video (Android, 2025 app with Homes / Experiences / Services): https://www.youtube.com/watch?v=UcXkJn71sAE "How to Book Local Experiences Through the New Airbnb App (2025 Update)"
- Video (iOS 2024 booking flow): https://www.youtube.com/watch?v=nR2WdPEfovI "How to Book a Stay on the Airbnb App (2025 FULL GUIDE)"
- Mobile web frame (from the Wanderlog video): https://www.youtube.com/watch?v=6GJj3I36C7s
- Site/CSS: https://www.airbnb.com (fonts and tokens above)

**Screens**
- `appstore_01_home_search_category_tabs.png` (2.78 px/pt): **search pill "🔍 Start your search" 352.8x59 pt, white, fully rounded, soft shadow (`#E4E4E4` to `#EEEEEE` falloff)**, label `#222222` (ink h 13 pt, ≈15 pt medium); top tabs with 3D icons: Homes (selected, label `#222222`, **underline 2.9 pt `#222222`, 42 pt wide**), Experiences / Services (label `#6A6A69`) with dark "NEW" pills; section titles "Recently viewed homes >" `#222222` (≈20 pt semibold); listing cards (rounded photo, heart, "Guest favorite" pill, title, "2 beds · ★4.93" meta).
- `appstore_02_homes_results_card.png`: header pill "Homes in Mexico City / Anytime · 3 guests" with back and a filter circle; big listing card: photo radius ≈20 px, **"Guest favorite" badge 97x27 pt white pill, black semibold label**, heart, page dots; "Apartment in Mexico City ★ 4.92 (24)", gray lines, "$1,358 for 4 nights" (underlined price).
- `appstore_03_experiences_results_grid.png`: "Experiences in Paris" header pill; **filter chips "Type ⌄", "Duration ⌄" ≈32 pt tall, white, 1 px border `#E1E1E1`, fully rounded**; experience card: 2x2 photo mosaic radius ≈20 px with an "Original" badge, heart; "Make pastries with The French Bastards" (≈17 pt semibold), "Cooking class · 2 hours", "From $104 / guest · ★5.0 · 36 reviews".
- `appstore_04_services_category_scroller.png`: "Services in Los Angeles": category tiles (rounded photos; selected tile has a 2 px black ring) with "Chefs / 32 available"; "Chefs" section card with a "Popular" badge, "From $50 / guest".
- `appstore_05_messages_thread.png`: group thread header (avatar, name, "May 20, 11:00 AM · Make prints…", "Details" pill), gray incoming bubbles, video bubble with reactions ❤️👍, dark outgoing bubble "Looking forward to it!".
- `appstore_06_trips_day_by_day_timeline.png` (**itinerary timeline reference**, 2.78 px/pt):
  - Header "Trips" (large title) + "Los Angeles", list-view circle button.
  - Trip card 396 pt wide (screen inset ≈4 pt), white, large radius, soft shadow; photo radius ≈20 px with a "Today" white pill; title "Bungalow in Los Angeles" `#222222` (ink h 25.6 pt incl. descender, ≈28 pt semibold) at x 46 pt; "May 22 – 26 · Hosted by Erinn" `#6A6A6A` (≈17 pt); divider 1 px `#EBEBEB`; address `#6A6A6A`; **secondary "Get directions" button 143x40 pt, fill `#F2F2F2`, radius ≈8.6 pt, label `#222222` (≈15 pt medium)**.
  - **Timeline rail**: day label "Thu" `#222222` (ink h 9.7 pt, ≈14 pt semibold) above a **date badge 31 pt circle, gradient `#E51F54` → `#E21C5F`, white "22" (≈14 pt bold)**, badge center at x 39 pt; vertical rail **≈1 pt `#DDDDDD`**; next-day dot **12 pt circle `#EBEBEB`**.
  - **Stop cards**: start at x 66.6 pt, ≈310x82 pt, white, radius ≈18 pt, soft shadow; gap 12.6 pt; leading thumbnail 65x65 pt (bg `#F5F2ED`, radius ≈14 pt) with a 3D object (door) or a photo; title "Check in after 3:00 PM" / "Fusion workout" `#222222` (ink h 11.2 to 11.5 pt, ≈16 pt medium) at x 158 pt; subline "5:00 PM · By Steve" `#6A6A6A` (≈15 pt).
- `appstore_07_host_question_flow_cards.png` (**question-flow reference**, 2.78 px/pt): full-screen modal (black status area, white sheet with large top radius); **× at top-right (12 pt glyph, 18 pt from the edge)**; question **"What would you like to host?" `#222222`, cap h 18.7 pt (≈26 pt semibold), left 27 pt**; **option cards 345x148 pt, radius ≈16 pt, gap 12.7 pt, side margins 23 pt; selected = ≈1.5 pt (4 px) border `#222222`; unselected = ≈1 pt (3 px) border `#C1C1C1`**; label "Home / Experience / Service" `#222222`, cap h 13 pt (≈19 pt medium), inset 25 pt, vertically centered; 3D illustration ≈64x54 pt right-aligned.
- `ios_video_2024_explore_categories_map_pill.png`: 2024 explore: "Where to? / Anywhere · Any week · Add guests" pill + filter circle; category tabs (Trending selected with an underline); big listing card; floating dark **"Map 🗺" pill**; tab bar Explore (red) / Wishlists / Trips / Inbox / Profile.
- `ios_video_2024_listing_reserve_bar.png` (1.19 px/pt): listing: photo with back / share / heart white circles, "1/71"; footer bar "€ 85 night / 18–23 Feb" + **Reserve button 148x48 pt, Rausch red (video shows `#B0143B` to `#AB1244`; the CSS gradient is `#E61E4D` → `#D70466`), white label, radius ≈8 pt**.
- `ios_video_2024_date_range_calendar_save.png`: "5 nights / Thu, 7 Mar - Tue, 12 Mar", × and "Clear dates"; range = black filled circles on the ends + `#F7F7F7` band; **Save button 150x50 pt, `#19171A` (≈`#222222`), radius ≈8 pt**.
- `ios_video_2024_guests_stepper_sheet.png`: Guests sheet: rows Adults / Children / Infants / Pets with **− n + steppers (32 pt outlined circles, `#BBBBBB` 1 px)**; "Cancel" underlined text button + **Save** black (83x46 pt).
- `ios_video_2024_confirm_and_pay.png`, `ios_video_2024_price_details.png`: "Confirm and pay": sections split by 8 pt gray bands; "Add" outlined small button; radio rows (selected = black filled ring); price details lines + "Total (EUR)".
- `android_video_2025_home_tabs_trip_card.png`, `android_video_2025_experiences_originals.png`, `android_video_2025_experience_results.png`: 2025 app (the blue band at the edges is the phone case, not UI). Homes / Experiences / Services tabs; upcoming-trip card "View details of your Budapest trip" with a 3D calendar "74"; "Airbnb Originals" rail; "Popular experiences in Budapest" cards with a "Popular" badge and a heart.
- `android_video_2025_filters_chips_sheet.png` (**primary + text secondary pair**): "Filters" sheet: experience-type chips (outlined, fully rounded, glyph + label); footer **"Clear all" (underlined text) + "Show 65 results" (black `#1C1C1C`, ≈55 dp tall, radius ≈8 dp, white label)**.
- `android_video_2025_filters_price_duration.png`: price histogram with a range slider, Minimum/Maximum pill fields, Duration slider, "Time of day" checkboxes.
- `android_video_2025_experience_detail_show_dates.png`, `android_video_2025_experience_what_youll_do.png`: experience page: photo collage, title "Explore Budapest's history and culture", ★5.0 · 1,456 reviews, host row, "What you'll do" **itinerary list (square photo + bold step title + 2-line description: "Ride the metro / Meet at the start / Learn history / Feel the culture")**; sticky footer "From £55 / guest · Free cancellation" + **"Show dates" button `#E7224D`, ≈47 dp tall, radius ≈8 dp**.
- `android_video_2025_select_a_time_sheet.png`: "Select a time": "2 adults − 2 +", "August 2025", time-slot card "10:00–14:00 / £63 / guest / 6 spots left" (outlined, radius ≈12).
- `mobileweb_video_listing_reserve_gradient.png`: mobile web listing: **Reserve pill gradient measured `#E41C4C` → `#E0195E` → `#D70666`** (matches the CSS gradient), ≈51 dp tall.

---

## 6. Partiful (also the onboarding reference)

**Sources**
- App Store: https://apps.apple.com/us/app/partiful-party-invite-maker/id1662982304 (4.95, 275,051 ratings; 9 iPhone 6.5" shots 1242x2688 + video poster 886x1920)
- Video (iOS first run, 886x1920 screen recording): https://www.youtube.com/watch?v=0VhJb3zZsRI "Partiful app - free party invites - overview"
- Video (Partiful-style getting started, iPhone mockups 1440x1080): https://www.youtube.com/watch?v=wCh_C844GOM "Partiful Tutorial: Getting Started" (11,925 views)
- Video (RSVP flow, iPhone screen in 1920x1080): https://www.youtube.com/watch?v=h889qddBAME "How to RSVP to an Event on Partiful"
- Videos reviewed, not saved (web app): https://www.youtube.com/watch?v=K6EhjKSq67Y, https://www.youtube.com/watch?v=mzRR1D2vln8
- Help center (text, used for behavior): https://help.partiful.com/en-us/articles/15525423-using-find-a-time-to-poll-guests-on-date-and-time (Find a Time: guests vote Yes / No / Maybe; host taps "Pick this"; votes become RSVPs), https://help.partiful.com/en-us/articles/15525421 (guests can see each other's poll answers), https://help.partiful.com/en-us/articles/15525324-how-do-i-invite-guests-to-my-event (Invite: past guests + mutuals)
- Site: https://partiful.com (fonts above)

**Screens**
- `appstore_01_video_poster_brand.png`: brand poster ("Fun Party Invites", balloons, logo).
- `appstore_02_event_page_going_button.png`: event page on a neon theme: logo, title "lexi's 26th", poster art, date "Wed, January 22 / 9:30pm – 11:30pm", "Hosted by Lexi", location; **floating circular "👍 Going" button with an iridescent gradient** (≈90 pt, visual).
- `appstore_03_theme_image_picker_chips.png`: image picker sheet: grabber, search "Find an image", **category chips (emoji + label: Dancing, Birthday, Chill, Dinner) white pills on dark**, masonry grid of poster images.
- `appstore_04_share_link_sheet.png` (**share sheet reference**, 2.54 px/pt): sheet with a pastel gradient top (`#F5F0F6` to white); grabber; title **"Share Link" `#000000` (ink h 18.5 pt ≈ 22 pt bold)**; subtitle "Anyone with the link can RSVP" `#807D81` (≈15 pt); link-preview card (poster image + "RSVP to My Birthday" black semibold + "partiful.com" `#656565`, white, radius ≈9.5 pt); page dots `#E8E6E9`; **share targets row: 4 circles 48 pt (121 px), centers 94.6 pt apart: Copy Link `#171D1D` with a white link glyph · Messages `#38E754` · WhatsApp `#32D852` · More = white circle with a light ring and a black share glyph; labels `#656565` below (≈13 pt)**.
- `appstore_05_text_blast_imessage.png`: an iMessage rich link card (dark, event art, "Book Club / Make memories", blue "View" pill) + the text blast bubble.
- `appstore_06_explore_curated_events.png`: dark explore list: "Trending in LA", event cards (thumb, "👋 Meet new people!" tag pill, bold title, time, description, avatar stack "+32 are Interested", ★).
- `appstore_07_photo_album_activity_feed.png`: "Photo Album" + grid/Upload pills, "Activity Feed / View all", feed items with emoji reaction pills (counts) + "Reply".
- `appstore_08_tickets_payouts.png`: "Cost per person": Request Money / Sell Tickets tabs, ticket rows with status dots, "+ New ticket type" pill, Payouts stats.
- `appstore_09_organization_profile.png`: org profile: **"Follow" (white fill, black label) + "Message" (dark fill `#1C1C1C`, white label, hairline border)** equal-width buttons, ≈47 pt (visual); "Upcoming events" cards.
- `appstore_10_find_a_time_poll_responses.png` (**group voting reference**, 2.44 px/pt): nav "‹ Find a Time •••" white on a purple gradient (`#7E00F7` top → `#2C0190` → `#010039`); **horizontally scrolling option cards: center (focused) card ≈220x117 pt, white `#FFFFFF`, radius ≈6 pt, title 2 lines "House party 🪩🕺 / This Saturday" `#000000` (ink h 20.9 pt ≈ 20 pt semibold), tally "8 Will Go · 1 Maybe" `#666666` (≈17 pt); side cards `#F1F7F7`, smaller, cut off at the edges**; a small notch pointer under the focused card; "Responses" white semibold (ink h 11.9 pt) + "🏆 Most Popular" sort in muted lavender; divider 1 px lighter purple; **response rows: 51 pt circular avatar with a 👍 badge at the bottom-right, name ≈17 pt semibold white, "+1" muted, 37 pt circular comment button with a 1 px translucent ring**.
- `ios_video_onboarding_invite_carousel.png` → `ios_video_onboarding_youre_invited.png` → `ios_video_onboarding_splash_get_started.png` (**onboarding**, 2.25 px/pt): animated sunset scene (`#CC7C74`), pixel cursor and envelope, flying invite cards, "Skip" glass pill top-right; splash = 3D chrome logo + "partiful" wordmark; **"Get started" full-width translucent white button ≈360x47 pt** with legal text "By tapping 'Get Started', you agree to our Privacy Policy and Terms of Service" (white with bold links).
- `ios_video_onboarding_phone_number.png`: bg **`#0B0B0F`** with a purple/green aurora at the top; title **"Join the party" white (ink h 22.2 pt ≈ 24 pt bold), centered**; subtitle "Just for event updates. No spam 🤞" `#D2D3DE` (≈16 pt); country picker (flag ▾) + **phone input ≈45 pt tall, fill `#111114`, 1 px border `#707074`, radius ≈3 pt, placeholder `#747478`**; helper "Message & data rates may apply" `#9E9EA1` (≈12 pt); legal paragraph centered `#9E9EA1`; **disabled "Send code" 360.6x47 pt, fill `#68686B`, label `#6C6C6E`, radius ≈3 pt, 16.4 pt side margins**; iOS number pad with "Done".
- `ios_video_onboarding_verify_code.png`: "Verify your phone / We just sent a code to +45…", 6-digit "000000" field, "Next", SMS autofill.
- `ios_video_onboarding_name_empty.png` / `ios_video_onboarding_name_next.png`: "What's your name? / So your friends know it's you 🫶"; labels "First name" / "Last name" `#CFD0D3` (≈13 pt) above inputs (**359.7x44.8 pt, fill `#111114`, 1 px `#707074`**; placeholders "Beyoncé" / "Knowles"; entered text white ≈20 pt); **enabled "Next" 360.6x47.5 pt, fill `#FEFCFF`, label `#000001` semibold, radius ≈3 pt**.
- `ios_video_onboarding_profile_pic.png`: "Add a profile pic / Especially if your name is Andre Gor 👊", 120 pt gradient initials avatar "AG" with a camera badge, "Skip", gray "Next".
- `ios_video_onboarding_birthday_picker.png`: "Add your birthday / We'll send inspo when it's time to make plans", date field, "ⓘ Your birth year is kept private", wheel picker, "Done".
- `ios_video_home_welcome.png`: "Welcome to Partiful, Andre!", "🔮 Need inspo? Ask the Party Genie" (link in blue/purple), filter pills "Upcoming 0 / Hosting 0 / Open invite 0" (selected = outlined pill), dashed placeholder card with a "+ New event" white pill; tab bar home / + / avatar.
- `ios_video_home_dark_event_card.png`: "It's Taco Tuesday, JC 🌮", list + search glyphs, "Upcoming 1" pill, event poster card with a "Fri 4/11 · 8pm" white chip and a "👑 HOSTING" label.
- `ios_video_new_event_top.png`, `ios_video_new_event_editor.png`, `ios_video_new_event_rsvp_options.png`: "Cancel · New Event · Save" nav; huge "Untitled Event" display title on a frosted band; poster with an edit pencil circle; **"Set a date… ▾" + "Can't decide when? Poll your guests →"** (the entry point for voting); "Hosted by (optional) host nickname", place field, cost, spots; "RSVP Options" with three ≈80 pt glass circles 👍 Going / 🤔 Maybe / 😢 Can't Go; "Quick actions for hosts" outlined pills (Add Questionnaire, Reminders, Require Guest Approval, ••• More); floating glass toolbar Theme / Effect / Settings.
- `ios_video_date_time_sheet.png`, `ios_video_theme_picker_sheet.png`: date/time sheet (start / optional end, calendar, time list, "PT Pacific Time", black "Done"); theme swatch circles (selected = ring).
- `ios_video_publish_share_sheet.png`: "Publish & Share" sheet: "This event is a draft…", info row, **white gradient-edged "Publish & share invite" button**.
- `ios_video_invite_share_link_dark.png`, `ios_video_invite_share_targets_zoom.png` (**group invite**): "Invite" screen (dark): 🐣 emoji, "Invite Contacts or Share Link", "Add your phone contacts to invite them, or share the link with anyone!", **white "👤+ Add contacts" button**, then the share-target circles Copy Link (white) / Messages (green) / WhatsApp (green) / More (outlined).
- `ios_video_event_page_rsvp_buttons.png` (1.27 px/pt): event page (green clover theme): date range title, hosted-by row, location in blue, description, **three ≈96 pt circles 🍀 Going / 🌈 Maybe / 🌧 Can't Go** (pastel radial gradients), "Photo Album / Share album" outlined pill, Capture (outlined) + **Upload (black)** buttons; bottom glass action bar Edit / Text Blast / [0 Going] / Invite / More.
- `ios_video_rsvp_sheet_going_maybe_cant.png` (**vote input**, 1.27 px/pt): sheet `#F0F4EC` → `#FBFBF9`; "Cancel" `#21271A`; **three choice circles ≈96 to 107 pt incl. glow (Going selected = ring + green radial `#CAFFC9` center; Maybe `#E5F9FF`; Can't Go `#ECFAFF`), labels ≈13 pt**; "RSVPING AS 🐶 JC ✎" row (47 pt, slightly darker band, label `#575D51` caps); "Attendee count" select 47 pt (1 px `#A9ADA5`, value `#2D3129`, ▾); "Add a comment (optional)" textarea (placeholder "Write something fun!" `#7E857C`), "GIF Add a GIF"; **"Continue" 358x46.4 pt, `#040005` black, white label, radius ≈3 pt**.
- `ios_video_rsvp_sheet_dark.png`: the same sheet on a dark theme (gradient circles 👍 / 🤔 / 😢).
- `ios_video_youre_going_takeover.png`: full-screen confirmation, animated stacked "YOU'RE GOING" type.
- `ios_video_guest_list_your_rsvp.png` (**guest list**): "Guest List / 1 Going" + **"View all" outlined pill (1 px `#9DAC86`)**, avatar row; "Your RSVP" card (clover avatar, "Going / Edit your RSVP", chat and send circles); glass action bar with the center "1 Going" white circle.
- `ios_video_event_page_action_bar.png`: dark event page with Guest List, a center RSVP emoji button flanked by chat and send circles, Photo Roll, Activity, toolbar.

---

## Element map for Faves

One best screen per element. Copy what is listed, at the values listed.

1. **Plan builder (question flow)**: `airbnb/appstore_07_host_question_flow_cards.png`. Copy one question per screen in a full-screen modal: × top-right, a big left-aligned question (cap 18.7 pt ≈ 26 pt semibold `#222222`, left 27 pt), and stacked tappable option cards 345x148 pt, radius 16 pt, 12.7 pt apart, 23 pt side margins. The label (≈19 pt medium `#222222`, inset 25 pt) sits left, a 3D illustration (≈64x54 pt) sits right. Selected card = 1.5 pt `#222222` border; unselected = 1 pt `#C1C1C1`. Font Airbnb Cereal style (use a Cereal-like sans). For the free-text step ("where / when / who"), use the field + coral CTA layout of `wanderlog/android_video_plan_new_trip_filled.png` (bordered 1 px `#C8CACC` fields, pill CTA).
2. **Itinerary timeline**: `airbnb/appstore_06_trips_day_by_day_timeline.png`. Copy the left rail: day label "Thu" (≈14 pt semibold) over a 31 pt date badge (gradient `#E51F54` → `#E21C5F`, white bold number) centered at x 39 pt, a 1 pt `#DDDDDD` vertical rail, and a 12 pt `#EBEBEB` dot for the next day. Each stop is a white card from x 66.6 pt, ≈310x82 pt, radius 18 pt, soft shadow, 12.6 pt gap. The card holds a 65 pt square thumb (radius 14, bg `#F5F2ED`) + title (≈16 pt medium `#222222`) + "5:00 PM · By Steve" (≈15 pt `#6A6A6A`).
3. **Travel leg rows (walk / bus / car + duration)**: `wanderlog/appstore_05_itinerary_day_travel_legs.png`. Copy the leg row placed between stop cards: mode glyph `#6C757D` (walker / car; add a bus glyph), text "5 min walk • 0.4mi" (≈15 pt regular `#6C757D`) at x 40.7 pt, a ▾ caret, "Directions" link `#3F52E3`, and a dashed `#DEE2E6` trail to the right edge. On tap, open the mode chooser from `wanderlog/ios_video_leg_mode_sheet_driving_transit_walking.png`: one row per mode (glyph `#191E1E`, label `#222525`, right-aligned "6 mins • 2.5 km" `#767878`, rows ≈44 pt, hairline `#E9ECEC`).
4. **Itinerary map with route line and numbered stops**: `wanderlog/appstore_04_road_trip_route_map_numbered_stops.png`. Copy the map on the top ≈40% with the sheet below (grabber 34x4.5 pt `#DEE2E6`). The route polyline is the day color at ≈60% (`#7044AC` → `#B29DD2` over the map), ≈6 pt wide. Numbered teardrop pins are 26x37 pt in the day color with a white numeral. Map controls are 43 pt white circles stacked at the right. Draw walk legs as navy dots `#407090` like `citymapper/appstore_04_journey_go_button_legs.png`; ride legs stay solid.
5. **Swap-a-stop sheet**: `wanderlog/ios_video_add_place_sheet_results.png`. Copy the half-height sheet over a ≈33% black scrim: bg `#F7FAFA`, top radius ≈14 pt, centered bold title (rename it "Swap stop", as Apple calls it "Change Stop" in `apple-maps/ios_video_dark_change_stop_search.png`). Below it: a search field (fill `#EDEFEF`, ≈42 pt tall, blue caret, a 35 pt `#D8DEDF` clear circle with an × in `#676E73`) and result rows (pin glyph `#303535`, title `#1A1C1C` ≈17 pt, subtitle `#787B7B` ≈13 pt, ≈60 pt pitch). Show the alternatives above the search as the "Recommended places" horizontal card rail from `wanderlog/ios_video_day_add_place_recommended.png`.
6. **Reserve / ticket buttons**: `google-maps/appstore_04_place_sheet_reserve_order.png`. Copy the tonal action pills inside the stop card: 42 pt tall, fully rounded, fill `#D2F7FF`, label `#014F5B` ≈14 pt medium with a leading glyph ("📅 Reserve a table", "🍴 Order online", for us "Get tickets"), ≈170 pt wide, 12 pt gap. The one primary on the card ("Directions") is the filled version: `#007B8B` with a white label. For a booked ticket, show the stub from `wanderlog/appstore_08_attachments_ticket_card.png` (SECTION / DATE / PRICE fields + perforation + barcode).
7. **Share sheet**: `partiful/appstore_04_share_link_sheet.png`. Copy the grabber, the title "Share Link" (≈22 pt bold black), the subtitle "Anyone with the link can …" `#807D81`, and the link-preview card (cover image + title + domain `#656565`, radius ≈9.5 pt). Then the row of 4 share targets: 48 pt circles, centers 94.6 pt apart, labels `#656565` ≈13 pt. Copy Link = `#171D1D` circle with a white link glyph; Messages `#38E754`; WhatsApp `#32D852`; More = white circle with a light ring and a share glyph.
8. **Group invite and voting**: `partiful/appstore_10_find_a_time_poll_responses.png`. Copy the horizontally scrolling plan-option cards: the focused card ≈220x117 pt, white, radius ≈6 pt, a 2-line title (≈20 pt semibold black) and the tally "8 Will Go · 1 Maybe" in `#666666`; side cards are `#F1F7F7` and peek in from the edges. Below them: a "Responses / 🏆 Most Popular" header, then rows with a 51 pt avatar with a 👍 vote badge, the name ≈17 pt semibold, and a 37 pt ring button at right. The vote input is `partiful/ios_video_rsvp_sheet_going_maybe_cant.png`: three ≈96 pt choice circles (selected gets a ring) and a full-width 46 pt black "Continue". Behavior (Partiful help): voters see each other's votes; the host taps "Pick this" and the votes become RSVPs.
9. **Onboarding screens**: `partiful/ios_video_onboarding_phone_number.png` (with `_splash_get_started`, `_name_next`, `_profile_pic`, `_birthday_picker`). Copy one ask per screen on near-black `#0B0B0F` with a soft aurora at the top. The title is centered ≈24 pt bold white with a short subtitle + emoji `#D2D3DE`. Inputs are ≈45 pt tall, fill `#111114`, 1 px `#707074`, radius ≈3 pt, placeholder `#747478`. The full-width button is 360x47 pt with 16.4 pt margins: disabled `#68686B` / label `#6C6C6E`, enabled white `#FEFCFF` / black label. Add a "Skip" at top-right on optional steps. The splash is a hero animation + a translucent "Get started" + a one-line legal note.
10. **Primary and secondary buttons**: `airbnb/android_video_2025_filters_chips_sheet.png` (primary + text secondary side by side), with values from the sharper Airbnb frames:
    - Primary = `#222222` fill, white ≈16 pt semibold label, ≈48 to 50 pt tall, radius 8 pt (Save 150x50 pt in `ios_video_2024_date_range_calendar_save.png`).
    - Brand CTA (Reserve) = gradient `#E61E4D` → `#E31C5F` → `#D70466` (measured `#E41C4C` / `#E0195E` / `#D70666`), radius 8 pt.
    - Secondary = `#F2F2F2` fill, `#222222` label, 40 pt tall, radius ≈8.6 pt ("Get directions" in `appstore_06`).
    - Tertiary = underlined `#222222` text ("Clear all", "Cancel").
11. **Bottom sheet**: `apple-maps/appstore_03_nearby_transit_sheet_chips.png`. Copy the native iOS sheet: grouped bg `#F2F2F6`, top radius ≈40 pt, grabber, a centered ≈17 pt semibold title, and a circular close button at top-right. Under the title goes a chip row: selected `#0285FB` fill with a white label, 40 pt tall; unselected white with a hairline border. Content goes in inset white cells, radius ≈18 pt, with 1 px `#DFDFE1` separators.
12. **Loading state while the plan is generated**: `google-maps/promo_video_ask_maps_prompt_glow.png` + `promo_video_ask_maps_answer_streaming_tail.png`. Copy the streaming answer:
    - Settled text is `#1B1B1B`; the newest words arrive in blue `#6C9FE2` / `#3C7ED8` and the very last characters fade from `#CFE0F5`.
    - The card has a 2 to 3 px gradient stroke from gray `#94A7B3` (top-left) to blue `#005FCB` (bottom-right) and a soft blue outer glow (`#D5E5FE` → `#E8F0FF`).
    - Stream the plan's stops in one by one the way Ask Maps streams its suggestion rows.
    - For any row still waiting on data (travel times), use the inline placeholder from `wanderlog/ios_video_leg_mode_sheet_loading.png` ("Loading driving info…" in `#747676`), not a spinner screen.

---

# Faves UI references: home feed + social apps

Captured 2026-10-24. Group: HOME FEED AND SOCIAL (DoorDash, Uber Eats, Strava, Instagram, Letterboxd, Spotify Wrapped, Beli).
Images live in `references/social/<app>/` (local only, never committed). 97 images, every kept image was opened and looked at.

## How to read the numbers

- Every value was measured with PIL on the saved file, at the file's own pixel width. `px` = pixels in that file. `pt` = iOS points, computed as px ÷ the scale given for that file.
- App Store screenshots are marketing frames: the phone sits inside a mockup, so the scale is not 3x. Scale was calibrated per file from the phone screen's pixel width ÷ device width in points (393 pt for Dynamic Island phones, 414 pt for the Uber Eats 6.5" frame, 375 pt for the Letterboxd iPhone X frame), cross-checked against the status-bar clock digits (SF 17 pt, about 12 pt cap height).
- YouTube frames are screen recordings at 480p or less. Beli's recording is a clean 590x1280 iPhone capture (1.5 px/pt, checked against the 37 pt Dynamic Island = 55 px). Other video frames are filmed phones at 145 to 320 px wide: use them for layout and wording, not exact sizes.
- Font sizes are estimated from cap height (font size ≈ cap height ÷ 0.7). Colors are sampled pixels (anti-aliased text read darker/lighter than the true token, so CSS tokens are listed where the site exposes them).

---

## 1. DoorDash

**Sources**
- App Store (current set, 1179x2556): https://apps.apple.com/us/app/doordash-food-delivery/id719972451
- App Store 2025 set (1320x2868), pulled from the Wayback snapshot of the same page on 2025-05-02: https://web.archive.org/web/20250502014024/https://apps.apple.com/us/app/doordash-food-delivery/id719972451 (the current set no longer shows the home feed, the 2025 set does)
- YouTube: "How to Order Food on DoorDash (2026)" https://www.youtube.com/watch?v=3de0bvmBL7Y ; "How to Order Food Using DoorDash? Beginner's Guide" (2025-06-15) https://www.youtube.com/watch?v=o5REIJwaz2g
- Design tokens from site CSS: https://about.doordash.com/en-us

**Design tokens (about.doordash.com CSS)**
- Font: `--base-font-family-default: DD Norms`, brand also DD Norms (files served as TTNorms-Bold/Medium from img.cdn4dd.com).
- Font sizes (px): 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48. Line heights: 16, 20, 22, 24, 26, 28, 30, 32, 36. Title-large and display use weight "strong".
- Brand red `--base-color-brand-doordash-60: #EB1700` (scale: -0 #FFF7F5, -10 #FFE0DB, -30 #FDA294, -50 #F54323, -60 #EB1700, -70 #D91400, -80 #B71000).
- Text default `#191919` (neutral-100), text subdued `#606060` (neutral-70), border default `#E4E4E4`, background strong `#F1F1F1` (neutral-5), subdued `#F7F7F7`, overlay `#19191980`.
- Radius tokens: x-small 2, small 4, medium 8, large 12, x-large 16, xx-large 24, xxx-large 32, full 9999 px. Spacing: 2, 4, 8, 12, 16, 24, 32, 40, 48 px (base-size-N = 4N px).

**Screens**

`doordash/appstore2025_02_home_feed_categories_chips_carousel.png` (1320x2868; phone screen x189-1095 = 907 px, **2.31 px/pt**). The home feed.
- Section order top to bottom: address row → search pill + map button → category icon row → filter chips → promo banner carousel → titled store carousel ("Groceries, snacks & drinks") → tab bar.
- Address row: pin icon + "283 Hayes St" bold + chevron (cap 23 px = 10 pt, about 15 pt bold, #000). Right: profile, bell, cart outline icons (about 24 pt).
- Search pill: white with a soft drop shadow, about 300x45 pt (y 1205-1308 px), fully rounded, magnifier left, placeholder "Search DoorDash" in grey. Separate white circular map button beside it, about 48 pt.
- Category row: horizontally scrolling illustrated food icons (about 32 pt) with label under (Pizza, Burrito, Bowls, Bakery, Smoothie, Chick...), label cap 23 px, about 14 pt; 6th item cut off to show it scrolls.
- Filter chips: white fill, 1 pt border #E3E3E3-#EAEAEA (token #E4E4E4), height 34 pt (outer y 1542-1620 px), full round, leading icon + label (cap 24 px, about 14-15 pt), "Ratings" has a trailing chevron. Gap about 8 pt.
- Promo banner: peach-to-yellow gradient card, corner radius 18 px = 8 pt, heading "Grocery delivery, exactly how you want it." about 16 pt bold, body about 14 pt, red pill CTA "Shop Groceries" #EB1701 with white bold text. Next banner peeks at the right edge.
- Section header: "Groceries, snacks & drinks" cap 38 px = 16.5 pt, about 24 pt bold #000; right-aligned arrow button, grey circle #E7E7E7 33 pt (76 px) with black →.
- Store card: image 307x149 pt (708x344 px, 2.06:1), corner radius about 9 px = 4 pt, brand logo centred on a lifestyle image. Under it: DashPass icon + name "ALDI" (cap 26 px, about 16 pt bold), meta "1.5 mi • 30 min • $0 delivery fee over $25" (digit cap 24 px, about 14-15 pt, grey #6B6B6B sampled / token #606060), rating "4.9 ★ (1,200+)" with a yellow star. Next card peeks about 40 pt.
- Tab bar: white, 1 px hairline #E4E4E4 on top, 5 items Home / Grocery / Retail / Orders / Browse, icons about 20 pt, labels cap 21 px = 9 pt (about 12-13 pt). Selected = red icon + red label; others near-black.

`doordash/appstore2025_04_home_dashpass_deals_carousel.png` (2.31 px/pt). Home feed further down.
- "DashPass Exclusive Deals" section with the grey → button, then the same store card. Card image here: corner radius about 5 px = 2 pt.
- Promo badge on the image, top-left: teal #068089 rounded tag "⊃ $10 off $20+", white bold text.
- Favourite: filled red heart #EA2F1E (38x34 px = 16 pt) right-aligned on the name row.
- Sections are separated by a #F7F7F7 band 14 px = 6 pt tall. Next section "Easter Prep".

`doordash/appstore2026_05_order_it_again_reorder.png` (1179x2556; screen x58-1119 = 1062 px, **2.70 px/pt**). "Order it again" page.
- Big left-aligned page title "Order it again", then per-order blocks: category title ("Groceries", "Pharmacy") about 24 pt bold, hairline, "45 items" grey, item list joined with " • ".
- Action row: two icon-only grey circles (add photo, edit) + text pills "Reorder" and "View receipt". Pill fill #F1F1F1-#F2F2F2, height 68 px = 25 pt, text #181818 bold (cap 24 px, about 13 pt), full radius. The marketing callout shows the same row enlarged.

Other App Store screens (context, not measured): `appstore2026_02_search_results_store_card.png` (search results with store cards), `appstore2026_03_browse_cuisine_grid.png`, `appstore2026_04_checkout_summary.png`, `appstore2026_06_order_tracking_map.png`, `appstore2025_01_grocery_tab_chips.png`, `appstore2025_03_order_tracking_add_from_store.png`, `appstore2025_05_cart.png`.

Video frames (filmed phone, 168-177 px wide, layout only):
- `yt_o5REIJwaz2g_t006_home_us_2025.png`: US home 2025. Address pill + bell + cart (badge). Search placeholder rotates real examples: "Search "Candy"" and, a few seconds later, "Search "Allergy Medicine"". Two rows of category icons (Meal Box, Late Night, Convenience, Alcohol, DashMart / Fast Food, Pizza, Chicken, Burgers, Mexican). Outline chips "Delivery Fees ⌄", "Pickup", "Deals". Red promo banner. "Stores you might like" with → button. A floating red full-width "VIEW CART / McDonald's / 1" bar above the tab bar. Tab bar Home / Grocery / Shopping / Browse / Me, selected Home sits in a light grey rounded square with red icon and label.
- `yt_3de0bvmBL7Y_t016_home_fastest_near_you.png`: "Fastest Near You" carousel, card with "Spend $30, save $5" badge, "Ad" tag, heart.
- `yt_3de0bvmBL7Y_t026_store_page_featured_most_liked.png`: store page. Tabs "Popular Items / Entree / Side / Drink", segmented "Delivery 19 min | Pickup 14 min" (selected black pill), "Group Order" pill, promo card, "Featured Items" carousel with a teal "#1 Most Liked" badge on the first item, "What people are saying 4.6 ★ 7,900+ ratings • 52 public reviews".
- `yt_o5REIJwaz2g_t040_store_most_ordered_tab_thumbs_pct.png`: McDonald's store page, "Most Ordered" is the first menu tab (underlined), "Featured Items" 2-up carousel: image, circular "+" add button overlapping the image corner, name bold, price, social proof "👍 63% (103)" and a red "Free on $15+" tag.
- `yt_o5REIJwaz2g_t034_store_header_welcome.png`: store header photo, "Welcome to McDonald's", ratings line, Delivery/Pickup toggle, "Deals & benefits".
- `yt_3de0bvmBL7Y_t056_cart_most_ordered_items.png`: cart with a "Most Ordered Items" upsell list and a full-width red "Continue $18.32" button.

---

## 2. Uber Eats

**Sources**
- App Store (1242x2688): https://apps.apple.com/us/app/uber-eats-food-delivery/id1058959277
- Font from site CSS: https://www.uber.com/us/en/about/ (`font-family: UberMove, UberMoveText, system-ui`; body `UberMoveText`)
- YouTube "How to Order Uber Eats | Easy Guide" (G3yB88dbRHg) was downloaded; no frames kept (App Store shots were better).

**Screens**

`ubereats/appstore_03_home_feed_special_offers_carousel.png` (screen x189-1053 = 865 px, **2.09 px/pt** for a 414 pt frame). Home feed.
- Top: centred "Now • 1725 3rd St ⌄" (cap 21 px, about 15 pt medium).
- Section heading "Special Offers": cap 46 px = 22 pt, about 30 pt bold, black, left-aligned. Subtitle "Limited availability" (cap 22 px, about 15 pt, #535353). "See all" right-aligned on the subtitle line, about 15 pt bold black.
- Card: image 295x130 pt (616x272 px, 2.26:1), **square corners**. Green promo flag #048847, 92x24 pt, flush with the image's left edge, white text "Spend $30, Save $10" (about 14 pt medium). White outline heart top-right on the image. Below: store name about 16 pt medium black, small brand logo right; meta "$1.99 Delivery fee • 20-30 min" about 15 pt #535353.
- Card gap 20 px = 10 pt, the next card peeks. Sections separated by a #F6F6F6 band 14 px = 7 pt.
- Floating tab bar: separate white circles with a soft shadow (Home, map pin, cart, about 48 pt) and a wide "Search" pill (about 153x50 pt) in the middle. Selected Home = solid black icon; others grey outline #5E5E5E.

`ubereats/appstore_07_rate_order_thumbs_chips_stars.png` (screen x170-1044 = 874 px, **2.11 px/pt**). Post-order rating.
- Title "Rate your order" cap 52 px, about 34 pt bold; sub "Chipotle Mexican Grill • Thur, Sep 18 at 10:15 PM" about 16 pt #717171; store logo + courier avatar overlap at right.
- "Rate your courier" about 22 pt bold; question "How was your experience with Alex?" about 16 pt #717171.
- Thumbs: two circles 62 pt (131 px). Thumbs down = #F3F3F3 fill, #727272 outline icon. Thumbs up (selected) = #000000 fill, white filled icon. Gap 18 pt (37 px).
- Reason chips after a thumb: height 38 pt (81 px), full round, label about 16 pt medium. Selected #000000 / white text; unselected #F3F3F3 / black text. Horizontal gap 8 pt, row gap about 16 pt. Chips: Good communication, Followed instructions, Friendly, Handled with care, Above and beyond.
- "Rate this store": 5 stars, each 47 pt wide (98 px), gap 19 pt, gold #F6BC2F. Free-text box #F3F3F3, placeholder "You can mention things you ordered." Then "Rate items".

Other (context): `appstore_01_home_chips_store_logos.png` (home chips "All / Grocery / Rides / Convenience" with emoji icons + round store-logo row + → circle), `appstore_04_cart_bundled_order.png`, `appstore_05_tracking_courier.png`, `appstore_06_delivered_enjoy.png`.

---

## 3. Strava

**Sources**
- App Store (1242x2688): https://apps.apple.com/us/app/strava-run-bike-walk/id426826309
- YouTube: "How to Manage Activity Feed on Strava | 2026" (2025-11-26) https://www.youtube.com/watch?v=hwpjKgtY1Ws ; "Breaking Down My Strava Year in Sport 2025" (2025-12-09) https://www.youtube.com/watch?v=e1DDHqJURk4
- Font from site CSS (strava.com): `font-family: Boathouse, Segoe UI, Helvetica Neue, -apple-system...`
- Help page (no usable images): https://support.strava.com/hc/en-us/articles/22067973274509-Your-Year-in-Sport

**Screens**

`strava/appstore_06_home_feed_activity_post.png` (screen x197-1043 = 847 px, **2.16 px/pt**). Dark-mode home feed, one activity post.
- Top bar: own avatar + search left, "Home" centred, chat + bell right.
- Post header: athlete avatar in Strava's shield frame with orange border (about 30 pt), name semibold (cap 20 px = 9.3 pt, about 13-14 pt) #F2F2F0, meta "👟 Today at 8:05 AM · San Francisco, CA" about 13 pt, ••• menu right.
- Title "Squad Run": cap 38 px = 17.5 pt, about 24 pt bold.
- Stat row: 4 columns, label "Distance / Time / Elevation / Achievements" about 13 pt, value "6.75 mi / 57m 56s / 124 ft" about 20 pt (cap 26 px), achievements = medal icons + count.
- Photo: 343x249 pt (740x538 px, 1.38:1), corner radius 17 px = 8 pt.
- Kudos row: facepile of 3 avatars + "12 gave kudos" (about 14 pt) left, "1 comment" right.
- Action row: thumbs-up (kudos), comment, share icons evenly spread, icons about 22 pt (48 px). Then a 1 px #43423E divider and the newest comment inline: avatar, "Maeve Macintosh • Great to see you out!", "♡ 1 Like", then "Add a comment..." field.
- Colours: post background #141414, top/tab bars #21211F, text #F2F2F0, Strava orange #FC5200 (sampled #FD5300).
- Tab bar: Home (selected, orange filled icon + orange label), Maps, Record, Groups, You; labels white about 11 pt.

`strava/appstore_02_activity_discussion_kudos_comments.png` (2.16 px/pt). Activity discussion.
- Map strip, title "Squad Run" about 22 pt, "Arby Isabelle Abrahan · 1 day ago · 9.56 mi".
- Kudos line: outline thumbs-up (50 px = 23 pt) + count "5" + facepile of 5 circular avatars, each 62 px = 29 pt, step 59 px = 27 pt (2 pt overlap, thin dark ring separates them).
- Comment: shield avatar, "Kim Cooper · 1 day ago" (about 16 pt), body about 16 pt, like row: filled orange heart #FD5300 (31x28 px) + "1 Like" when liked, outline heart when not.
- Bottom "Add a comment" / "Send".

`strava/appstore_07_progress_stats_chart.png`: "Progress" page. Filter chips are outlined pills: selected = orange outline + orange text ("Ride ⌄", "Distance"), unselected = grey outline + white text ("Time", "Elevation"). Big stat "384.6 mi ▲ 12%" vs "292.1 mi", orange area line chart against a teal prior-period line, "Prior 3 months ✕" pill, "Your progress at a glance" card.

Year in Sport 2025 (video e1DDHqJURk4, 200x360 crops, proportions only):
- `yt_e1DDHqJURk4_t026_yis2025_summary_card.png`: the shareable summary card. Card about 0.62 width:height, corner radius about 6% of width, left padding about 6%. Top: "Top Sport" + orange outline shoe icon, athlete photo in orange shield at right. Then four label/value pairs stacked: "Total Days Active 181", "Total Distance 1,748 km", "Total Time 207 hrs", "Total Elevation 11,192 m" (value cap ≈ 1.75x label cap, white bold geometric sans). Footer: orange band (#FD7A3B sampled) with a scrolling marquee "STRAVA YEAR IN SPORT 2025 STRAVA ...". Background dark #1A1A1A over a black-to-orange glow.
- `t036_yis2025_badge_summary.png`: final slide, orange scalloped "STRAVA YEAR IN SPORT 2025" badge over the same 4 stats centred.
- `t044_yis2025_top_fans_kudos.png`: "TOP FANS" podium of the people who gave the most kudos (Tino 168, Nathan 113, Gerald 112), thumbs-up confetti.
- `t088_yis2025_days_active_bars.png`: "DAYS ACTIVE 181", yellow horizontal bar per month, best month highlighted white, caption "You're in the top 9% for days active. Impressive!".
- `t100_yis2025_hours_chart.png`: "HOURS ACTIVE 207" orange line chart with peak label "33 h", caption "Kudos! You're in the top 7% for hours active."
- `t116_yis2025_standout_activity.png`: "A STANDOUT ACTIVITY" full-photo card with title + Distance/Elevation/Time, caption "Remember this highlight?".
- `t142_yis2025_trophy_case.png`: "TROPHY CASE", orange PR badges + best times.

Home feed video (hwpjKgtY1Ws, 145x360, layout only): `yt_hwpjKgtY1Ws_t016_home_feed_kudos_facepile.png` (photo post, facepile + "69 gave kudos", 3 action icons, "Who to Follow" carousel cards), `yt_hwpjKgtY1Ws_t018_home_feed_post_actions.png` (club post "ARC 60 🏆", same actions; "Suggested Challenges" card with full-width orange "Join Challenge" button).

Other (context): `appstore_01_award_home_feed_watch.png`, `appstore_03_record_choose_sport.png`, `appstore_04_weight_training_activity.png`, `appstore_05_routes_map_search.png`, `appstore_08_routes_detail_card.png`, `appstore_09_activity_map_watch.png`.

---

## 4. Instagram

**Sources**
- App Store (1284x2778): https://apps.apple.com/us/app/instagram/id389801252
- YouTube: "How To Change Instagram Grid Layout" (2025-11-26) https://www.youtube.com/watch?v=_-Q0f5lRc_g ; "How to Rearrange Posts on Instagram NEW Profile Layout" (2025-12-17) https://www.youtube.com/watch?v=H2jCqtgENc4
- Site CSS (instagram.com): `--font-family-system-prism: "Instagram Sans UI", -apple-system...`; light tokens: primary text rgb(12,16,20) #0C1014, secondary text rgb(106,113,122) #6A717A, primary button rgb(74,93,249) #4A5DF9, badge rgb(255,48,64) #FF3040, separator rgb(219,223,228) #DBDFE4, secondary background rgb(243,245,247) #F3F5F7, destructive rgb(237,73,86) #ED4956. Dark: background #0C1014, secondary background #25292E, separator #2B3036.

**Screens**

`instagram/appstore_05_home_feed_post.png` (screen x183-1099 = 917 px, **2.33 px/pt**). Home feed post, 2025 design.
- "Instagram" wordmark centred. Stories row: avatars about 66 pt with rings: green #1CD264 ring (close friends), pink-to-purple gradient ring (#FE2561 → #D902BA → #FF0666), "+" badge on your own.
- Post: handle row, then edge-to-edge photo 393x408 pt.
- Action row: heart + "36.2K", comment + "749", repost + "370", send + "41.6K", bookmark far right. Icons 54 px = 23 pt; counts semibold (cap 24 px, about 14 pt).
- Caption: bold handle + text (about 15 pt), "1 day ago" grey.
- Floating tab bar: one rounded translucent pill over the content with Home (selected: dark filled icon inside a light grey capsule #E4E4E6), Reels, Send, Search, Profile; red notification dots #FD1D37, 14 px = 6 pt.

Profile (video, 250x480, layout only):
- `yt_-Q0f5lRc_g_t100_profile_header_light.png`: username in the top bar with a dropdown, avatar left with "What's on your mind?" note bubble, name, stats "126 posts / 446 followers / 151 following" in a row to the right, bio, two equal grey buttons "Edit profile" / "Share profile" + a small add-person button, "Discover people" cards with blue "Follow" buttons, Highlights.
- `yt_-Q0f5lRc_g_t026_profile_grid_3x4_light.png` and `yt_H2jCqtgENc4_t010_profile_grid_3x4_dark.png`: profile tabs (grid / reels / reposts / tagged) with an underline under the active tab, 3-column grid of **3:4 portrait cells** (measured 0.76) with about 1 pt gutters; video posts carry a small play icon top-right.

Other (context): `appstore_01_reels.png`, `appstore_02_comments_sheet.png`, `appstore_03_story_share_close_friends.png`, `appstore_04_direct_messages.png`, `appstore_06_close_friends_sheet.png`, `appstore_07_notes_compose.png`.

---

## 5. Letterboxd

**Sources**
- App Store (1242x2688): https://apps.apple.com/us/app/letterboxd/id1054271011
- YouTube: "How to Log Movies & Build Your Film Diary on Letterboxd" https://www.youtube.com/watch?v=jpogqfsFMKw (iPad app recording)
- Site CSS (letterboxd.com stylesheets): `font-family: var(--font-stack-graphik)` / GraphikWeb (UI), Tiempos Text, Pitch Sans.

**Screens**

`letterboxd/appstore_03_diary.png` (screen x155-1129 = 975 px, **2.6 px/pt** for a 375 pt frame). The Diary, the closest thing to a "past days" list.
- Nav: "‹ Jack", centred "Diary", filter icon right.
- Month band "SEPTEMBER 2019": #273039 background, 30 pt tall (77 px), uppercase letter-spaced label about 12 pt, #95A6B7.
- Row (about 56 pt pitch): day-of-month numeral inside an outlined square (about 34x37 pt), poster thumbnail 2:3 (about 25x37 pt), title semibold white about 16 pt + year smaller grey, then a meta line: green half-star rating, orange heart (liked), ↻ (rewatch) and ≡ (has review) glyphs in grey.
- Colours: background #181C22, stars Letterboxd green #00E054 (sampled 8,220,80), liked heart orange #FF8000 (sampled 252,128,0).
- Tab bar: films, search (blue selected), green "+" (log), activity bolt, profile.

`letterboxd/appstore_02_film_log_actions_rate.png`: film page (Logan). Bottom row of four large icon actions with labels: "Logged" (green eye with a count badge "2"), "Liked" (orange heart), "Rated" (star with "4.0" under it), "Watchlist" (clock +).

`letterboxd/appstore_09_share_to_instagram_story.png`: a single-item share card inside Instagram's story composer: big poster with rounded corners, title bold white centred (3 lines), "Directed by Cathy Yan", then an "ON" divider and the "●●● Letterboxd" lockup. Dark slate gradient background.

iPad video frames: `yt_jpogqfsFMKw_t024_ipad_film_action_sheet.png` (action sheet: Watch / Like / Watchlist icons, "Rate" 5 empty stars, Review or log, Add to lists, Change poster/backdrop, Share to Instagram Stories, Share, Done), `t028_ipad_i_watched_log_stars.png` ("I Watched…" sheet: Cancel / Save (green), Date, "Rated" 5 green stars + "Like" heart, Add review, Add tags), `t040_ipad_diary.png` (diary with the new entry on top).

Other (context): `appstore_01_film_detail_ratings_histogram.png`, `appstore_04_review.png`, `appstore_05_list_detail.png`, `appstore_06_streaming_service_filter.png`, `appstore_07_change_backdrop.png`, `appstore_08_video_store_shelves.png`.

---

## 6. Spotify (app + Wrapped 2025 share cards)

**Sources**
- App Store (1284x2778): https://apps.apple.com/us/app/spotify-music-and-podcasts/id324684580
- Newsroom, Wrapped 2025 user experience (2025-12-03): https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/
- Newsroom media kit: https://newsroom.spotify.com/media-kit/2025-wrapped
- Fonts from open.spotify.com CSS: SpotifyMixUI (Regular, Bold), SpotifyMixUITitleVariable, SpotifyMixMono (encore.scdn.co).
- Wrapped walkthrough videos (fAeCfIaKTOY, ssSKn6wZRaM) were downloaded and scanned; no frames kept because the newsroom images show the same slides cleanly.

**Screens**

`spotify/wrapped2025_newsroom_summary_share_cards.png` (3840x2160). The four colourways of the 2025 summary share card.
- Card 806x1435 px = **9:16** (0.562). Corner radius 57 px = 7.1% of card width (= 76 px on a 1080x1920 export). Text inset 60 px = 7.4% of width.
- Layout: top half = artist photo; then two columns "Top Artists" / "Top Songs" with numbered 1-5 lists; then two big stats "Minutes Listened" + "Top Genre" (stat value about 4x the list cap height); footer = Spotify logo + "SPOTIFY.COM/WRAPPED".
- Colourways (sampled): yellow #DAB503, violet #9691FF, red-orange #FF4834, lime #95C90D; each paired with ink #272727 (near-black) and paper #EFEFEA / #FDFDE7. Two of the four are dark cards (#272727) with light text.

`spotify/wrapped2025_newsroom_minutes_story_share_button.png`: in-story slide "Minutes listened" with the huge number and a white pill "Share" button (share icon + label, #EFEFEA fill, black text) under the slide; pill is 3.7:1 (348x93 px in a 704 px-wide screen, about 194x52 pt).
`spotify/wrapped2025_newsroom_top_genres_story.png`, `..._top_podcasts_story.png`, `..._audiobooks_story.png`: one-insight-per-slide story format with oversized type. `..._home_entry_points.png`: how Wrapped is surfaced on Home.
`spotify/wrapped2025_artist_sharecard_badbunny.png` (2160x2700, 4:5) and `wrapped2025_top10_songs_globally.png` (1080x1350, 4:5): feed-format share graphics.

`spotify/appstore_01_home_chips_shortcuts.png` (screen x139-1145 = 1007 px, **2.56 px/pt**): home. Profile avatar then filter chips "All / Music / Podcasts / Audiobooks": height about 33 pt (85 px), full round, selected #1ED760 with black text, unselected #2A2A2A with white text (about 15 pt), background #121212.
`spotify/appstore_05_blend_playlist_friends.png`: Blend (a playlist made from two friends' taste), relevant to "plan a day with a friend".
Other (context): `appstore_02_podcast_player.png`, `appstore_03_lyrics.png`, `appstore_04_playlist_header.png`, `appstore_06_audiobook.png`, `appstore_07_search_browse_tiles.png`, `appstore_08_your_library.png`, `appstore_09_playlist_add.png`.

---

## 7. Beli (social restaurant feed)

**Sources**
- App Store (1284x2778): https://apps.apple.com/us/app/beli/id1478375386
- YouTube: "BELI APP - your top restaurants, ranked - how to use" https://www.youtube.com/watch?v=GlMma4eXe18 (clean iPhone screen recording, 590x1280, **1.5 px/pt**)
- Site CSS (beliapp.com): `font-family: Playfair Display` for headings. In the app the big moments ("Leaderboard", "Wooo! You ranked your first spot!", "Invite your friends", restaurant names in sheets) are set in this serif; UI text is SF Pro.

**Screens**

`beli/yt_GlMma4eXe18_t160_feed_home_chips_featured_lists.png` (1.5 px/pt). Feed tab, top.
- Header: "beli" serif wordmark (#163E44) left; calendar (red dot), bell, menu right.
- Search: full-width grey field #EBEBED, 37 pt tall (55 px), 22 pt side margins, placeholder "Search a restaurant, member, etc." #727073.
- Chips: height about 32 pt, full round, icon + label. Selected "↗ Trending" #134456 fill + white; unselected "Recs Nearby", "Friend recs" #9DB3B7 fill + white. Selected chip 100 pt wide.
- Invite card: white, 1 px #CDCDCD border, radius about 8 pt; title "You have 4 invites left!" bold teal #153A3F, sub grey #89898B, full-width button "Invite friends" #144554, 43 pt tall (65 px), white bold.
- "FEATURED LISTS" (uppercase, about 14 pt bold black) + "See all" (bold #18383C). Carousel of square list cards 165x165 pt (247 px), radius 12 px = 8 pt, gap 16 pt; full-bleed food photo with dark bottom gradient, white bold title 2 lines (about 18 pt) "Top 10 NYC Walk-in Only", sub "You've been to 0 of 10" white.
- "YOUR FEED" then "Suggested for you" people carousel.
- Tab bar: Feed, Your Lists, Search (centre filled teal circle #12424D with white +, about 36-40 pt), Leaderboard, Profile. Labels about 11 pt; selected label bold black.

`beli/yt_GlMma4eXe18_t174_feed_post_ranked_with_photos.png` (1.5 px/pt) and `beli/appstore_03_feed_post_ranked_share.png` (screen x106-1168 = 1063 px, **2.70 px/pt**). The feed post. App Store values:
- Avatar circle 60 pt (162 px), 20 pt left margin.
- Headline sentence, 2 lines: "**Judy** ranked **Rosario's** / with **Eliot Frost**", names bold, verbs regular, #000 (cap 32 px, about 16-17 pt).
- Meta lines: "🍴 • Astoria, Queens", "↻ 1 visit", #989AA3, about 14 pt.
- Score bubble right: 40 pt circle (108 px), 1 pt #D3D3D3 border, white fill, number "9.0" bold in #009C61 (colour moves with the score: 7.7 reads teal-grey in the video).
- Photos: horizontal carousel of square photos 156 pt, radius 19 px = 7 pt, gap 8 pt; third photo peeks.
- "**Notes:** Top 5 rated slice shop in NYC. Really enjoyed." about 16 pt.
- Counts row: red heart #F90B0C (15 pt) + "131" left, "422 bookmarks" right, about 13 pt #323232.
- Action row: heart, send (left); ⊕ add, bookmark (right). Icons 22 pt (61 px), about 34 pt pitch.
- Date "January 17" #9B9DA6 about 13 pt, then threaded comments: avatar, bold name + text, "1 like · Reply", small heart right.

`beli/yt_GlMma4eXe18_t144_how_was_it_rating_sheet.png` (1.5 px/pt). Rate-a-spot sheet, stacked white cards (radius 26 px = 17 pt) on a dimmed background.
- Card 1: restaurant name in Playfair Display bold (cap 28 px) + "$$$ | Delicatessen, Diner, Sandwiches" grey, ✕.
- Card 2: "Add to my list of [🍴 Restaurants ▾]" outlined dropdown.
- Card 3 "How was it?": three circles 56 pt (84 px): "I liked it!" #8CC3A7 green, "It was fine" #F6CB68 yellow (selected, white ✓, black label), "I didn't like it" #EFABAD pink; unselected labels grey #8C8C8E.
- Card 4: rows with outline icons + chevrons: Who did you go with?, Add labels (good for, etc.), Add notes, Add favorite dishes, Add photos, Add visit date, Stealth mode toggle ("Hide this activity from newsfeed"). Rows about 46 pt, 1 px #EFEFEF dividers. Bottom "Okay" bold.
`beli/yt_GlMma4eXe18_t208_which_do_you_prefer_compare.png`: pairwise ranking: "Which do you prefer?" two outlined cards side by side with a dark teal "OR" circle between, "Undo", outlined "Too tough", "Skip".
`beli/yt_GlMma4eXe18_t146_ranked_first_spot_success.png`: success modal: illustration, serif "Wooo! You ranked your first spot!", explainer text, full-width dark teal pill "Let's rank another!".
`beli/yt_GlMma4eXe18_t188_leaderboard.png`: "Leaderboard" serif title (cap 32 px = 21 pt, about 30 pt Playfair bold); segmented control Been / Influence / Notes / Photos (selected white segment on #F5F3FA track); filter pills "All Members ▾", "New York, NY ▾"; rows: rank number, 30 pt avatar, @handle, score right-aligned bold.
`beli/yt_GlMma4eXe18_t192_profile_new_user.png`: own profile (empty state): initials avatar, @handle, "Member since August 2025", Edit profile / Share profile, Followers / Following / Rank on Beli, list rows, "Set your 2025 goal" chips 20 / 50 / 100 / Customize.
`beli/yt_GlMma4eXe18_t134_my_lists_progress.png`: My Lists: "Restaurants ▾", tabs Been / Want to Try / 🔒Recs / More, progress track card "Your progress to Personalized Recs!", list of spots with ⊕ / bookmark / ✕.
`beli/yt_GlMma4eXe18_t176_search_tabs_chips.png`: search: Restaurants / Members tabs, "Search restaurant, cuisine, occasion", "Current Location", chips Recs / Trending / Friend recs, "Places you may have been in Copenhagen".
`beli/yt_GlMma4eXe18_t100_ios_share_sheet_invite.png`: serif "Invite your friends" page + iOS share sheet with the "Join me on Beli / beliapp.co" link preview.

`beli/appstore_06_profile_stats.png` (2.70 px/pt). Another user's profile.
- Nav: ‹ + "Judy Thelen" bold, bell, share, •••.
- Avatar centred 96 pt (260 px) with 1 px #D3D3D3 ring; "@judy" bold (cap 37 px) + "SC" badge; "Member since August 2019" #989AA3; "+28% Match" #009C61 · "4 Meals Together" bold; quoted bio; "🎓 Beli University '26"; two round outlined social buttons (Instagram, TikTok).
- Stats row: 3 centred columns "1.0m Followers / 967 Following / #1064 Rank on Beli": value about 16 pt semibold #222427 (cap 25 px), label about 16 pt #989AA3.
- "Following" outlined button: 1 px #D3D3D3, radius 13 px = 5 pt, 33 pt tall (90 px), plus a square ▾ button.
- List rows (43 pt pitch, 117 px between dividers): icon, bold label "Been" / "Want to Try" / "Places you both want to try" (cap 28 px, about 17 pt), bold count right ("1336"), chevron, 1 px dividers #D0CFD3-#D6D5D9.
- Stat cards (2-up): 1 px #E5E5E5 border, radius 32 px = 12 pt, teal icon, grey label "Rank on Beli" / "Current Streak" (#8D8C8C), teal bold value "#1064" / "148 weeks" (#004F5E).

Other (context): `appstore_01_tilted_home_feed.png` (marketing "100M restaurant rankings"; home feed tilted: Reserve now / Recs Nearby / Trending chips, FEATURED LISTS, YOUR FEED post "Judy ranked 4 Charles Prime Rib" with 10.0 bubble), `appstore_02_my_lists_map_chips.png`, `appstore_04_featured_lists.png` (Featured Lists / My Challenges tabs, rows: square photo + "Top 10 NYC Date Night Restaurants" + description + "You've been to 2 of 10"), `appstore_05_recs_list_reserve_chips.png`.

---

## Element map for Faves

One pick per element. Copy it exactly; values are from the measurements above.

| Element | Copy this | Exactly what to copy | Measured values |
|---|---|---|---|
| Home screen layout and section order | `doordash/appstore2025_02_home_feed_categories_chips_carousel.png` | DoorDash's stack, top to bottom: location row with icons right → search pill + round map button → horizontal icon row → outline filter chips → one promo banner (peeking) → titled carousels, each with a grey round → button → tab bar. Faves: location → "What are we doing?" pill → occasion row → filters (Open now, Free, Outdoors) → banner → "Most-done days this week" → "Hidden gems near you" → "Open now". | 2.31 px/pt. Section title about 24 pt bold (cap 16.5 pt). → button 33 pt circle #E7E7E7. Store-card carousel peeks about 40 pt. Sections separated by a 6 pt #F7F7F7 band (appstore2025_04). |
| Big prompt / search entry | same DoorDash home file + `doordash/yt_o5REIJwaz2g_t006_home_us_2025.png` for the rotating placeholder | White pill with soft shadow, magnifier left, 48 pt round map button to its right. Placeholder rotates real examples the way DoorDash cycles "Search "Candy"" → "Search "Allergy Medicine"" (Faves: "What are we doing?" → "first date in Williamsburg" → "pickleball + tacos"). | About 300x45 pt pill, full radius. Placeholder grey (DD token #606060), 16 pt. Map button about 48 pt. |
| Occasion chips | `ubereats/appstore_07_rate_order_thumbs_chips_stars.png` | Uber Eats reason chips: text-only pills, black when on, light grey when off, wrap or scroll. Use for Date / Friends / Family / Solo / Catch-up. | 2.11 px/pt. Height 38 pt, full radius, label about 16 pt medium. On #000000 + white; off #F3F3F3 + #000000. Gap 8 pt horizontal, about 16 pt between rows. |
| "Most-done days" carousel card | `beli/yt_GlMma4eXe18_t160_feed_home_chips_featured_lists.png` (Featured Lists cards) | Beli's square list card: full-bleed photo, dark bottom gradient, white 2-line title, white progress sub-line. A Faves day is a list of places, so it maps 1:1: "Saturday in Silver Lake" / "4 stops · done by 212 people". Add DoorDash's "#1 Most Liked" badge (`yt_3de0bvmBL7Y_t026`) on the first card. | 165x165 pt, radius 8 pt, gap 16 pt, title about 18 pt bold white (2 lines), sub about 14 pt white. Header "FEATURED LISTS" uppercase about 14 pt bold + "See all" bold #18383C. |
| Place carousel card | `doordash/appstore2025_04_home_dashpass_deals_carousel.png` (card spec from `appstore2025_02`) | DoorDash store card: wide photo, small promo tag on the image top-left, name row with heart at right, grey meta line with "•" separators, rating line. Faves: "Locals Score 9.2" in the rating slot, "0.4 mi • Open till 11 • $$" as meta, "Hidden gem" tag. | Image 307x149 pt (2.06:1), radius 4 pt (2 pt on the deals card). Name 16 pt bold, meta 14-15 pt #606060, heart 16 pt #EA2F1E, tag teal #068089 white bold. |
| Tab bar | `beli/yt_GlMma4eXe18_t174_feed_post_ranked_with_photos.png` (bottom) | Beli's 5 tabs with a filled circle "+" in the centre: Home, Feed, ⊕ Plan a day, Saved, Profile. Outline icons, label under each, selected label bold black. | 1.5 px/pt. Centre circle about 36-40 pt, fill #12424D, white +. Icons about 26 pt, labels about 11 pt; unselected #393939. |
| Community feed post | `beli/appstore_03_feed_post_ranked_share.png` (+ video `t174`) | Beli post anatomy: avatar, sentence headline with bold names ("**Maya** did **Date night in Williamsburg** with **Sam**"), grey meta lines (neighbourhood, "↻ 2 times"), score bubble right, horizontal photo carousel (one per stop), "**Notes:**" line, counts row, action row, date, threaded comments. | 2.70 px/pt. Avatar 60 pt, margin 20 pt, headline about 16-17 pt, meta 14 pt #989AA3, score bubble 40 pt with 1 pt #D3D3D3 border, number #009C61 bold. Photos 156 pt square, radius 7 pt, gap 8 pt. Icons 22 pt, about 34 pt pitch. Counts 13 pt #323232, date 13 pt #9B9DA6. |
| Like / kudos interaction | `strava/appstore_02_activity_discussion_kudos_comments.png` (+ `appstore_06` for the feed row) | Strava kudos: thumbs-up + count + facepile of who gave it, and in the feed the sentence "12 gave kudos". Comment likes are a small heart that fills orange. Faves: "👍 48 · [faces]" / "48 people loved this day". | 2.16 px/pt. Thumb icon 23 pt. Facepile avatars 29 pt, step 27 pt (2 pt overlap, thin dark ring). Liked heart filled #FC5200 (sampled #FD5300), "1 Like" about 13 pt. Feed row: 3 faces + "12 gave kudos" 14 pt. |
| "Do this day" action | `doordash/appstore2026_05_order_it_again_reorder.png` | DoorDash "Reorder" pill: the "redo someone's thing in one tap" action. Grey pill with bold label, paired with a secondary "View receipt" pill. Faves: "Do this day" + "See stops". | 2.70 px/pt. Pill 25 pt tall (68 px), full radius, fill #F1F1F1, label about 13 pt bold #181818. Icon-only grey circles at the same height beside it. |
| End-of-day recap | `strava/yt_e1DDHqJURk4_t026_yis2025_summary_card.png` (sequence `t044`-`t142`) | Strava Year in Sport, shrunk to one day: one stat per slide (stops, miles walked, hours out, top-rated spot), then a summary card of stacked label/value pairs with a marquee footer band. "Top Fans" slide = the friends who came. | Proportions from 480p: card about 0.62 W:H, radius about 6% of width, left padding about 6%, value cap ≈ 1.75x label cap, white on #1A1A1A with black-to-orange glow; footer band orange #FD7A3B about 5.7% of card height with a scrolling wordmark. |
| Thumbs up/down rating | `ubereats/appstore_07_rate_order_thumbs_chips_stars.png` | Uber Eats courier rating: two big round buttons, then reason chips appear. Use per stop: "How was Tacos El Gordo?" 👎 / 👍 → chips "Worth the wait", "Great for groups"... | 2.11 px/pt. Circles 62 pt, gap 18 pt. Off: #F3F3F3 + #727272 outline icon. On: #000000 + white filled icon. Heading about 22 pt bold, question about 16 pt #717171. |
| Share card | `spotify/wrapped2025_newsroom_summary_share_cards.png` | Spotify Wrapped 2025 summary card: 9:16, photo top half, two numbered top-5 columns, two big stats, logo + URL footer; four colourways. Faves: hero photo of the best stop, "Stops" / "Loved most" columns, "Miles walked" + "Locals Score avg", "daymaker.app/username". Saved/shared from a white "Share" pill (`..._minutes_story_share_button.png`). | Card 9:16 (806x1435 px at source). Radius 7.1% of width (76 px at 1080x1920). Inset 7.4% of width. Colours: #DAB503, #9691FF, #FF4834, #95C90D with ink #272727 and paper #EFEFEA/#FDFDE7. Share pill #EFEFEA, about 3.7:1. |
| Profile header and stats | `beli/appstore_06_profile_stats.png` | Beli profile top to bottom: centred avatar, @handle + badge, "Member since", match line, bio, social buttons, 3-column stats, outlined Follow button, rows with counts (Been / Want to Try / Both want to try), 2-up stat cards (Rank, Streak). Faves: "Days done 37 / Followers / #212 in Brooklyn", rows "Days done", "Want to do", cards "Rank" + "Weekend streak". | 2.70 px/pt. Avatar 96 pt, 1 pt #D3D3D3 ring. Stat value 16 pt semibold #222427, label 16 pt #989AA3. Button 33 pt tall, 1 pt #D3D3D3, radius 5 pt. Rows 43 pt, bold 17 pt label + bold count + chevron, 1 px #D3D3D3-ish dividers. Cards radius 12 pt, 1 pt #E5E5E5, label #8D8C8C, value bold #004F5E. Match green #009C61. |
| Typography scale | DoorDash home (`appstore2025_02`) + about.doordash.com CSS tokens | DoorDash's verified scale, one geometric sans (DD Norms is theirs; pick a licensed equivalent of the same family shape). Sizes in use on the home feed: 24 bold section titles, 16 bold names, 14-15 regular meta, 14 chip labels, 12-13 tab labels. | Token font sizes 10/12/14/16/18/20/22/24/28/32/36/40/48 px; line heights 16/20/22/24/26/28/30/32/36 px. Text #191919, subdued #606060. Measured: title cap 16.5 pt, name cap 11 pt, meta cap 10.4 pt, tab cap 9 pt (2.31 px/pt). |
| Color palette | Beli (`appstore_06_profile_stats.png`, `appstore_03_feed_post_ranked_share.png`, video `t160`/`t144`) | Beli's restrained palette: white canvas, one deep teal for every primary action, green for scores, soft pastels only for the rating circles. It reads "taste" not "delivery", which is Faves's lane. | Primary teal #134452 (chips, buttons, + tab; buttons sampled #144554). Deep teal value text #004F5E. Score/match green #009C61. Unselected chip #9DB3B7. Field fill #EBE8EC. Text #000000 / #222427, secondary #989AA3, borders #D3D3D3 and #E5E5E5. Like heart #F90B0C. Rating trio #8CC3A7 / #F6CB68 / #EFABAD. |


---

# Moments, wallet, paywall and states: UI reference catalog

Captured 2026-10-24 for Faves. Group: SPOT MOMENTS (TikTok, Instagram, Snapchat, BeReal), SPOT REWARDS WALLET (Ibotta, Rakuten, Venmo, DoorDash Dasher, Uber Driver, Cash App, TikTok Studio), FAVES PLUS PAYWALL (Meetup, Timeleft, Duolingo, Letterboxd, Snapchat+, Strava) and STATES (offline, error, loading, no results).

Images live in `references/moments/<app>/`, `references/wallet/<app>/`, `references/paywall/<app>/` and `references/states/<app>/` (local only, never committed). 50 images; every kept image was opened and looked at. Every number below was measured with PIL on the saved file unless it says "visual" or "layout only".

## How to read the numbers

- `px` = pixels in the saved file. `pt` (iOS) or `dp` (Android) = px divided by the scale given for that file.
- App Store screenshots are marketing frames. The phone screen was found by run-length edges and tied to a device width (393 pt for modern iPhones, 375 pt for notch iPhone X frames, 414 pt for the pre-notch frames with a centered clock). Marketing frames draw UI a little larger than a phone does, so treat their font sizes as +/-15% and their proportions as exact.
- The paywall screenshots come from paywallscreens.com, which publishes real iPhone screenshots of App Store paywalls at full resolution (1170 px = 390 pt, 1206 px = 402 pt). These are exact 3x: the best-measured files in this section.
- Video frames are H.264: colors +/-6 per channel, edges soft. Frames from filmed phones (not screen recordings) are marked "layout only".
- Font size is about cap height / 0.72. Where a word has no capital in reach, the size is "about" and visual.

| Source set | Scale used |
|---|---|
| Instagram App Store (1242x2208) | 1.95 px/pt (screen 767 px = 393 pt) |
| Snapchat App Store (1242x2208, pre-notch status bar) | 2.33 px/pt (screen 966 px = 414 pt) |
| BeReal App Store (1260x2736) | about 2.70 px/pt (screen about 1060 px = 393 pt; black screen on a black bezel) |
| TikTok press image (TechCrunch copy of TikTok's Local Feed launch image), 400x870 crop | 0.95 px/pt (screen 374 px = 393 pt) |
| Instagram location page video q2ASzVtL0YE (Android, 640x1080 crops) | 1.235 px/dp (map width 509 px = 412 dp; tile check: 168 px = 136 dp = (412 - 4) / 3) |
| Snap Map video wizASv52Zgk (iPhone, 540x1080 crops) | about 1.3 px/pt, structure only |
| BeReal iOS video FMZgxjwSkfo (533x1080 crops, Dynamic Island) | 1.25 px/pt (screen 490 px = 393 pt; clock digit 16 px = 12 pt cap) |
| BeReal Android videos KXVIqgEsm64 (filmed) and deB84cb-Jsw (recording) | about 1.08 px/dp, layout only |
| Ibotta App Store (1290x2796, no status bar) | 2.47 px/pt (screen card 969 px = 393 pt) |
| Rakuten App Store (1242x2208) | 1.94 px/pt (screen 728 px = 375 pt) |
| Uber Driver App Store (1242x2208) | 2.35 px/pt (screen 924 px = 393 pt) |
| Venmo video wHGzOIg7ayA (iPhone X, 615x1080 crops) | 1.315 px/pt (screen 493 px = 375 pt; notch 280 px = 213 pt, iPhone X notch is 209 pt) |
| DoorDash Dasher video QtNGm8n4OdE (560x1080 crops) | 1.23 px/pt (screen 480 px = 390 pt). The editor dimmed the video (white reads `#BBBBBB`): sizes usable, colors not |
| Cash App video AA6w50jncDM | layout only |
| paywallscreens.com (1170 and 1206 px wide) | 3.0 px/pt exact |
| TikTok and Spotify offline videos (filmed phones) | layout and wording only |

---

## 1. Spot Moments: TikTok location (POI) page

**Sources**
- TikTok Local Feed launch images (US launch, 2026-02-11), as published by TechCrunch: https://techcrunch.com/wp-content/uploads/2026/02/tiktok-local-feed-us.jpg and https://techcrunch.com/wp-content/uploads/2026/02/TikTok-Local-Feed.jpg (article https://techcrunch.com/?p=3091882). The same images appear in "TikTok Launches Local Feed in the US" https://www.youtube.com/watch?v=I5IDVpj39AY.
- App Store: https://apps.apple.com/us/app/tiktok/id835599320 (4.72 stars, 18,404,584 ratings, v47.4.0).
- Searched and rejected: 3GKcD49FN70 (Nearby search results only), PST3tlJCa98, Tr1dEtCJ8dM (content blurred), s31ziEd5JqU, 1iOvEcRQ2hw (filmed, no POI page), QNiSAel5UjU, iol_WJ-QIrk. No public recording showed the POI page's video grid cleanly.

**Screens**

`tiktok/press_01_poi_page_favorite_write_review.png` (0.95 px/pt; the page sits behind a 40% black scrim, so sampled colors are dark). A TikTok place page:
- Full-bleed photo carousel header, about 220 pt tall, with a "1/27" counter bottom-right and round back / share / ••• buttons over the photo.
- Place name "The New Yorker by Lotte Hotels" bold, about 20 pt, left-aligned; under it a tinted "Top Hotel >" badge and "100 favorites" grey; an amenity row (Infinity pool, Kids club, Delicious food) with line icons and a chevron; rating "4.5" with stars.
- **Bottom action bar: two equal buttons, "✎ Write review" (light grey fill) and "🔖 Favorite" (TikTok red), each about half the width, about 44 pt tall, small radius (about 4 pt).** Under the scrim the red samples `#991A30`, which is TikTok red `#FE2C55` at 60%.
- The location prompt over it: white card "See relevant content and places nearby / Open your device settings and go to Locations > While Using the App. You can turn this off at any time.", a mini illustration of the Settings row, and two text buttons "Cancel" / "Open settings".

`tiktok/press_02_local_feed_grid_place_video.jpg` (2122x1158, four phones, proportions only): the Local tab (tabs "STEM · Local · Friends · Following") as a 2-column masonry grid of portrait tiles with a caption under each; a "See what's new around you" banner; and a full-screen video with a place anchor above the caption ("Caffe · New York") that opens the place page.

`tiktok/appstore_05_camera_record_button.png`: the TikTok camera (AI art template open): record button bottom-center, "Camera / Templates" mode labels under it, right-side tool rail, "Add sound" pill at the top.

---

## 2. Spot Moments: Instagram location page (Top / Recent) and story viewer

**Sources**
- Video (Android, 2026): "Instagram Places Tab Not Showing Problem | How to Search for Places by Location on Instagram 2026" https://www.youtube.com/watch?v=q2ASzVtL0YE
- App Store: https://apps.apple.com/us/app/instagram/id389801252 (4.69 stars, 29,630,143 ratings, v452.0.0). 5.5" screenshot set via the iTunes lookup API.
- Rejected: eLZ1Z4J7IuE (friends map list only).

**Screens**

`instagram/yt_q2ASzVtL0YE_t080_location_page_top_recent_grid.png` (**the Moments reference**, 1.235 px/dp):
- Map header 180 dp tall. Centered place story bubble: **108 dp circle with the story gradient ring (orange `#ED9E1A` on the left to magenta `#BA1AAA` on the right)**, place label "Kampala" black under it (cap 10.5 dp, about 15 sp). Round white back button top-left and a round locate button top-right (about 48 dp with a soft shadow).
- Bottom sheet over the map: grabber 39x6 dp `#6E6F78`, rounded top corners (about 16 dp, visual).
- Title "Kampala, Uganda, East Africa": regular, `#0D0D0D`, cap 17 dp (about 24 sp), two lines, 16 dp from the left. "•••" and "✕" (20 dp glyph) on the right of the title.
- Status line: "Open" green `#196C49` + " • 24 hours" `#555555` (cap 16 dp). Share (paper plane) and save (bookmark) outline icons, 21 to 24 dp, right-aligned under the title.
- **Tabs "Top" / "Recent"**: two equal halves, labels centered. Active "Top" black, cap 14.6 dp (about 20 sp); inactive "Recent" grey `#44494C` to `#54595C`. **Active underline 2.4 dp tall (3 px), 78 dp wide, near-black `#1B181E`, centered under the label (not the full half width).** No divider line under the tabs.
- **Grid: 3 columns edge to edge, square 1:1 tiles 136x136 dp, 1.6 dp white gutters (2 px), no side margins.** Video posts carry a white reel glyph (about 24 dp) in the top-right corner of the tile.

`instagram/yt_q2ASzVtL0YE_t097_map_place_bubbles_popular_nearby.png`: the Instagram map: places drawn as round photo bubbles with a white ring and a "+5 more" count under the label; "Search This Area" white pill at the top; sheet "Popular nearby" with a search icon; rows: round photo, bold place name, "Country/region • 15M posts", distance, then a horizontal row of recent photos.

`instagram/yt_q2ASzVtL0YE_t009_search_places_tab.png`: search with tabs Accounts / Reels / Audio / Tags / **Places** (active, black underline); each result row is a pin icon in a light circle + place name.

`instagram/appstore_07_story_viewer_close_friends.png` (**the moment viewer reference**, 1.95 px/pt):
- Media is 9:16 full width (767x1365 px = 393x700 pt), starting under the 55 pt status bar. Background `#0C0F14` (Instagram's dark token `#0C1014`).
- **Progress bar: 2 pt tall (4 px), inset 6.7 pt left and right, played part `#F9F9F9`, unplayed part white at about 50% (`#A0A0A0` over the photo).** One segment per clip, thin gaps between segments.
- Header row about 26 pt below the bar: round avatar about 40 pt (with ring), name white semibold (about 15 pt), time "2h" light grey right after the name; right side: green close-friends pill 44x26 pt `#1CD264` with a white star and chevron, "•••", and **"✕" 18 pt glyph**.
- **Reply bar under the media, on `#0C0F14`: outlined pill 280x45 pt, 1 pt `#4B4F52` outline, full radius, placeholder "Send message" `#F8FAF9` (cap 12.3 pt, about 17 pt), then a heart (24 pt) and a send icon (22.5 pt) to its right.**
- The Close Friends sheet on top: white card, radius about 16 pt, green star badge overlapping the poster's avatar, "Close Friends only" bold, three-line grey body, blue action "Add alex.anyway18 to Your List", rows "Edit Close Friends list" / "Done".

`instagram/appstore_04_story_composer_share_bar.png`: story composer: tool rail on the right, text "meet my best friend" on the photo, bottom bar with two pills "Your story" and "Close friends" (green star) and a blue round send button.

---

## 3. Spot Moments: Snapchat (Snap Map, place stories, portrait story cards)

**Sources**
- App Store: https://apps.apple.com/us/app/snapchat/id447188370 (4.51 stars, 6,006,021 ratings, v14.29). 5.5" set via the iTunes lookup API.
- Video (iPhone, 2025): "Snap Map Explore Feature on Snapchat: How to Use 2025" https://www.youtube.com/watch?v=wizASv52Zgk
- Snap's own launch film "Introducing Snap Map" https://www.youtube.com/watch?v=4Q-gjHtttGQ (official; 1920x1080 composite of real map and story screens).
- Rejected: TAk7a5agR0M, _SPjajrwrNA, SUtTHuwoliw (dark, small, or settings only).

**Screens**

`snapchat/appstore_04_stories_portrait_cards.png` (2.33 px/pt): Stories page.
- "Friends" row: round story bubbles **84 pt** with a purple ring `#A15DCC` and a white gap, name under each (about 17 pt).
- **"Subscriptions >" row of portrait cards: 111x182 pt (w:h 0.61), radius 7.3 pt, gap 9.4 pt, first card 8 pt from the edge, next card peeks. White bold title bottom-left (two lines max, about 17 pt) over the photo, small meta line ("⭐ 17h ago").** Section headers bold, about 17 pt (cap 12.4 pt).
- "Discover" row: bigger square cards.

`snapchat/appstore_07_snap_map_friends.png`: Snap Map: city name "Madison" in a centered pill at the top with round avatar / search / add-friend / settings buttons; Bitmoji on the map with "Sam 2h"; bottom sheet "Find Your Friends" (avatars with times) and "Recent Moves".

`snapchat/yt_wizASv52Zgk_t025_snap_map_heat_top_picks.png`: 2025 Snap Map: blue to yellow heat blobs where many public Snaps are posted; places as photo bubbles labeled "Top Pick"; "2.5% Explored" purple pill; bottom chips "Memories / Footsteps / Visited / Popular".

`snapchat/yt_wizASv52Zgk_t030_place_category_list_hearts.png`: category sheet "☕ Cafes / 30 Places" with ✕; rows: round place photo, bold name, category, "1.8 mi" or "Open Now" green, and a right-aligned "♡ 52" count pill (place likes), about 79 pt row pitch (visual).

`snapchat/yt_4Q-gjHtttGQ_t030_place_story_header_5m_ago.png` (Snap's official film): **a place story shows the place, not a person, in the header: "The Bootleg Theater" bold white over "5m ago" regular white, top-left, no avatar.** Captions and stickers sit on the video. `yt_4Q-gjHtttGQ_t015_map_place_story_bubbles.png`: on the map, the place appears as a round thumbnail with a white ring and a white label tag "Black Rabbit Rose" over the heat map; tapping it plays that place's Snaps.

`snapchat/appstore_01_snap_capture_send_to.png`: a taken Snap with the right tool rail (text, draw, stickers, scissors, music, paperclip, timer), bottom-left save / story icons and a yellow-ringed blue "Send To ▸" pill bottom-right. `snapchat/appstore_05_spotlight_viewer.png`: full-screen vertical video viewer (Spotlight): creator row bottom-left, hashtag pills, right-side heart / share / more.

---

## 4. Spot Moments: BeReal (camera, location stamp, "post to see")

**Sources**
- App Store: https://apps.apple.com/us/app/bereal-photos-friends-daily/id1459645446 (4.77 stars, 1,161,190 ratings, v4.97.2).
- iOS screen recording (2026): "How To Post A Late BeReal In BeReal (Quick Guide)" https://www.youtube.com/watch?v=FMZgxjwSkfo
- Android: "How To View a BeReal Post (Step-by-Step Guide 2026)" https://www.youtube.com/watch?v=KXVIqgEsm64 (filmed) and "How to Post a BeReal (Full Beginners Guide)" https://www.youtube.com/watch?v=deB84cb-Jsw (screen recording, older 2022 design).
- Rejected: T11NvCu04EM (filmed, too small).

**Screens**

`bereal/yt_FMZgxjwSkfo_t030_camera_photo_video_shutter.png` (**the camera reference**, 1.25 px/pt):
- Black screen. Top bar: round "⌄" close button 45 pt, fill `#101012`, top-left; "BeReal." wordmark centered (cap 16.8 pt).
- **Viewfinder 3:4 (390x530 pt), full width minus a hair, rounded corners**, starting under the top bar.
- On the viewfinder's bottom edge: flash icon bottom-left, flip-camera icon bottom-right, **"1x" chip: black circle about 35 pt, white bold "1x", centered.**
- Under the viewfinder: **mode labels "VIDEO" (white) and "PHOTO" (selected, yellow `#DEE532`), bold caps (cap 11 pt), centered as a pair.**
- **Shutter: white ring 77.6 pt outer diameter, ring stroke about 4 pt, a 2.4 pt black gap, then a white disc 61.6 pt; center 75 pt above the screen bottom.**

`bereal/yt_FMZgxjwSkfo_t062_post_preview_location_on_send.png`: after capture: "Add a caption..." grey placeholder top-left; photo with the front-camera inset top-left; **a chip row along the photo's bottom edge: tag-friends circle, "🔒 My Friends" audience pill, "➤ On" location pill, music circle**; and a huge bold white "SEND ▸" text button below the photo.

`bereal/yt_FMZgxjwSkfo_t020_empty_feed_take_your_bereal.png`: empty feed: "Wow, it's really calm in here!" bold white centered + "Your friends haven't posted their BeReal yet. Be the first one." grey + white pill "Take your BeReal." Tab bar Home / Friends / (camera in a white circle) / Chat / Profile.

`bereal/yt_KXVIqgEsm64_t012_post_location_pill_3h_late.png` (**the "Taken here" stamp reference**, about 1.08 px/dp, filmed):
- Post header: avatar, username bold white, and under it **"3h late" in grey `#A7A5B7`, small (ink 11 px, about 13 sp)**.
- Photo card with rounded corners (about 16 dp), front-camera inset top-left 3:4 with rounded corners, "👤+ TAG" and "♫" glass chips on the photo's bottom edge.
- Under the photo: "Add a caption..." bold white, then **the location pill: fully rounded, about 30 dp tall, fill `#18181C` to `#1F1B28` on black, "➤" arrow glyph + "Kathmandu, Nepal" white bold (cap 12 dp, about 17 sp), centered under the caption.**

`bereal/yt_deB84cb-Jsw_t020_hidden_content_location_1h_late.png` (older design): post header "pollyanamelissa" bold with **"Buenos Aires, Argentina" as a small white line under the name** and **"1h Late 🌐" at the right**; the friend's photo blurred with an eye-slash icon, "Hidden Content / Post a BeReal to discover the picture!" and an outlined "POST A BEREAL" button. `bereal/yt_deB84cb-Jsw_t088_send_options_share_my_position.png`: "Send options" page: "Send to..." My friends only / Everyone (Discovery) with checkmarks, "Other options": "📍 Share my position" (checked), "Save my BeReal on the device"; full-width "Send ▸" bar at the bottom.

`bereal/appstore_05_share_to_view_post_a_bereal.png` (**the blocked-state reference**, about 2.70 px/pt):
- Header: avatar 24 pt, "tstizzy" white bold, "5 min late" grey `#BABABD` under it.
- Post card about 356 pt wide, **radius 16.4 pt (44 px)**, the photo blurred heavily.
- Centered on the blur: **eye-slash icon 33x22 pt, "Share to view" white bold (cap 10.7 pt, about 15 pt), "To view your friend's BeReal, post an update." white regular (about 13 pt), then a white button 117x35 pt, radius about 11 pt (29 px), label "Post a BeReal." black semibold.**
- A music bar at the bottom of the card ("Golden - Huntrix", green "OPEN" pill, ✕), then two comment lines and "View 7 comments" grey centered.

`bereal/appstore_06_post_realmojis_comments.png`: a post with the RealMoji stack (round selfies + "3+") bottom-right of the photo, send / comment counts, comments with "5 min ago" grey stamps.

---

## 5. Spot rewards wallet: earnings summary and feed

**Sources (App Store)**
- Ibotta: https://apps.apple.com/us/app/ibotta-save-earn-cash-back/id559887125 (4.80 stars, 1,974,502 ratings, v6.359.0). 6.9" set (1290x2796).
- Rakuten: https://apps.apple.com/us/app/rakuten-cash-back-deals/id723134859 (4.82 stars, 361,949 ratings, v13.20.0).
- Uber Driver: https://apps.apple.com/us/app/uber-driver-drive-deliver/id1131342792 (4.42 stars, 657,668 ratings).
- TikTok Studio: https://apps.apple.com/us/app/tiktok-studio/id6478151677 (4.83 stars, 39,546 ratings).
- Also checked, not kept: Lyft Driver (weekly earnings chart only), Venmo, PayPal, Cash App, Fetch (App Store sets have no earnings or payout screen).

**Screens**

`ibotta/appstore_05_earnings_withdraw_transactions.png` (**the wallet reference**, 2.47 px/pt):
- Nav: back chevron left, "Help" link right in teal `#005C65`. Title **"Earnings" bold, centered, `#282F37`, cap 23.1 pt (about 32 pt)**.
- **Balance box: 330 pt wide, 31 pt side margins, radius 9.7 pt, 1 pt `#C2C2C2` border.**
  - Top band 41 pt tall, teal `#06A39C`: "Lifetime earnings" left and "$153.23" right, both white (cap 13.4 pt, about 19 pt; the amount bold).
  - White body 103 pt: "Current earnings" regular black (cap 13.8 pt, about 19 pt) with a teal outlined ⓘ at the right; **"$37.44" bold near-black, cap 34 pt (about 47 pt)**, 21 pt from the box's left edge.
  - Bottom strip 15 pt, same teal.
- **"Withdraw" button 30 pt under the box: 343x40 pt, full pill, fill `#0D7888`, white semibold label (cap 13.8 pt, about 19 pt).**
- Section header **"Transactions" semibold, cap 17.4 pt (about 24 pt), `#010300`**, 41 pt under the button.
- **Transaction row: pitch 70.5 pt; store logo in a 33 pt circle 25 pt from the screen edge; store name bold `#050A0E` (cap 13 pt, about 18 pt) 66 pt from the edge; amount "$1.85" bold, right-aligned 23.5 pt from the edge; divider 1 pt `#E4E4E4` to `#E8E8E8`, inset 21.5 pt left and 22 pt right.** No dates or sub-lines on the row.
- Tab bar: floating glass pill (Home selected in teal, Redeem, Bonuses, Arcade) plus a separate round search button.

`rakuten/appstore_04_confirmed_pending_cash_back.png` (1.94 px/pt): profile header "Mark Robinson" bold + "$1,234.56 Lifetime Cash Back" on a lavender band; **balance card fill `#8529CD`, white text: "Confirmed Cash Back" bold (cap 15 pt, about 21 pt), "$60.34" light and large (digits 43 pt tall), then "Pending" bold over "$50.10", and "See Activity →" bold at the right.** Under it a promo card "Get paid instantly / You have $60.34 available to redeem for a gift card."

`rakuten/appstore_03_cha_ching_you_got_paid.png`: payout success card: "Cha-ching! You just got paid." bold, "$32.50" purple, "is on its way to your PayPal account", then a referral block with four round share buttons.

`uber-driver/appstore_06_earnings_balance_cash_out.png` (2.35 px/pt): "Earnings" bold (cap 27.7 pt), "Feb 4 - Feb 10", **"CA$645.99" regular, cap 27.2 pt, with a 7-day mini bar chart in Uber blue `#276EF1` to its right**; rows "Online 23h 32m / 54 Trips / 73 Points" (about 17 pt, label and value on opposite sides); full-width "See details" button `#EEEEEE`; then **"Balance: CA$155.00" (cap 20 pt), "Next payment scheduled for Feb 11" `#545454`, and a black "Cash out" pill 119x52 pt with a white label (cap 14.5 pt)**; "Drive Pass" card below.

`tiktok-studio/appstore_07_monetization_rewards_balance.png`: "Monetization" page: dark card "Estimated rewards in the last 7 days $4,305.28 / Balance: $11,568.75 · View >", "Rewards analytics" two stat tiles with green +% deltas, "Programs for you" rows with a red "Apply" pill.

---

## 6. Spot rewards wallet: payout screen, method rows, confirm and success

**Sources**
- Venmo, iOS: "How To Instant Transfer Money From Venmo To Bank Account (2026)" https://www.youtube.com/watch?v=wHGzOIg7ayA. App Store https://apps.apple.com/us/app/venmo/id351727428 (4.85 stars, 15,473,393 ratings).
- DoorDash Dasher, iOS: "How to Cash Out DoorDash (2025)" https://www.youtube.com/watch?v=QtNGm8n4OdE. App Store https://apps.apple.com/us/app/doordash-dasher/id1451754591 (4.68 stars, 2,464,717 ratings).
- Cash App: "How to Withdraw Money from Cash App to Your Bank, Standard or Instant" https://www.youtube.com/watch?v=AA6w50jncDM. App Store https://apps.apple.com/us/app/cash-app/id711923939 (4.79 stars, 8,771,502 ratings).
- Rakuten method screen: App Store set above.
- Rejected: YmN_oaBRUEw (website only), hAPya6gAqyo (filmed, unreadable), uDw8APgLYVM (text slides), SESMzIFCTGY and KjZYRUrl3V8 (web pages), QGOgUuF8gJw (older DoorDash, small).

**Screens**

`venmo/yt_wHGzOIg7ayA_t043_instant_selected_fee.png` (**the payout screen reference**, 1.315 px/pt; the creator blacked out the bank name and drew a red arrow):
- Nav: blue "✕" left, "Transfer Balance" centered (about 17 pt semibold), hairline under the nav.
- **Amount: "$75" very large, black (about 55 pt), with a small raised "$", centered, and a grey ⊗ clear button to its right.**
- **Two method cards side by side: each 172x160 pt, gap 16 pt, about 8 pt side margins, radius about 7.6 pt. Selected: 1 pt Venmo-blue border, icon circle 58 pt filled blue (`#1171B4` to `#2069B8` sampled) with a white bolt, "Instant" bold black (about 17 pt), "In a few minutes" grey. Unselected: 1 pt `#ACACAC` border, grey icon circle (`#929498`) with a bank glyph, "1-3 biz days" bold grey.**
- Rows: "Fee ............ $1.31" (label left, value right), then "Transfer to" with a bank logo, the masked account and "›".
- **Confirm button: 359x47 pt, full pill, fill `#137D69` (sampled `#126C5A` to `#137D69`), white bold "Transfer" label**, pinned near the bottom.

`venmo/yt_wHGzOIg7ayA_t028_transfer_balance_instant_or_standard.png`: the same screen with "1-3 biz days" selected: no fee row, the bank icon circle turns blue, the bolt circle turns grey.

`rakuten/appstore_05_choose_how_you_get_paid.png` (**the method rows reference**, 1.94 px/pt):
- Back chevron in a white circle; title **"Choose how you get paid" bold `#252525` (cap 16.5 pt, about 23 pt)**; subtitle "We'll send your Cash Back every 3 months." `#464356` (about 14 pt).
- **Method cards: 333 pt wide, 20.6 pt side margins, 92.6 pt tall, gap 17 pt, 1 pt `#DDDDDD` border, radius 7 pt. Inside: logo 22.7 pt at the left, name bold `#22202D` (cap 11.8 pt, about 16 pt), and under it a "Select" link, purple `#8529CD` semibold.** Selected method: the link becomes **"✓ Selected" in green `#33823F`** (the selected PayPal card is drawn enlarged as a marketing callout).
- Methods: PayPal, American Express Membership Rewards Points (two-line name), Bilt points, Big Fat Check.

`doordash-dasher/yt_QtNGm8n4OdE_t017_earnings_this_week.png` (1.23 px/pt, layout only): Earnings tab: "This week" label, **"$24.69 ›" large bold**, "Active 35 min · Dashed 1 hr, 18 min" grey, full-width grey pill "View payout details", a promo card, "Past weeks" weekly bar chart (labels Nov / Jan / Mar, axis $0.00 to $129.64), then week rows "Mar 24 - Mar 30 ... $24.69 ›".
`doordash-dasher/yt_QtNGm8n4OdE_t020_payout_menu.png`: rows with chevrons: Change payout method / **Cash out with Fast Pay** / Recent payout history ("Last 90 days of transfers") / Earnings statements / Tax documents.
`doordash-dasher/yt_QtNGm8n4OdE_t023_fast_pay_confirm.png` (**confirm pattern**): centered "Available for Fast Pay" over **"$24.69" in green**; rows "Fast Pay Fee $1.99" and "Transfer Total $22.70"; a centered two-line note "Funds should arrive in 30 minutes to one day, depending on your bank."; **full-width red pill whose label carries the amount: "Transfer $22.70" (47 pt tall, 349 pt wide)**.
`doordash-dasher/yt_QtNGm8n4OdE_t038_fast_pay_in_progress.png` (**success pattern**): bank glyph in a ring with a check, **"$22.70" large green, "Fast Pay transfer in progress!"**, and at the bottom "Details about this transfer have been sent to your email."

`cash-app/yt_AA6w50jncDM_t027_withdraw_standard_or_instant_sheet.png` (layout only): dark "Withdraw" screen, "$20" large green, "Cash balance: $50.00" pill, green "Continue" pill, and a sheet "How do you want to withdraw $20?" with two rows: "Standard / Arrives in a few business days ›" and "Instant / Arrives faster ... Fee ›".

---

## 7. Faves Plus paywall

**Beli first:** no Beli Supper Club or Beli premium screen is public. YouTube searches "beli supper club app", "beli app premium", "beli supper club membership" returned nothing from the app, and beliapp.com has no Supper Club page (the paths /supperclub, /supper-club and /premium all fall back to the home page). The catalog's Beli recordings (GlMma4eXe18 and others) show no paywall.

**Sources** (all screenshots from https://www.paywallscreens.com, exact iPhone captures)
- Meetup+: https://www.paywallscreens.com/apps/meetup-social-events-groups-mobile-paywall-aff8. App Store https://apps.apple.com/us/app/meetup-social-events-groups/id375990038 (4.72 stars, 272,668 ratings).
- Timeleft: https://www.paywallscreens.com/apps/timeleft-meet-new-people-mobile-paywall-a071. App Store https://apps.apple.com/us/app/timeleft-make-new-friends-irl/id6466442949 (4.62 stars, 8,829 ratings).
- Duolingo Super: https://www.paywallscreens.com/apps/duolingo-mobile-paywall-4820 (App Store 4.72 stars, 5,528,062 ratings).
- Letterboxd Pro / Patron: https://www.paywallscreens.com/apps/letterboxd-by-letterboxd-mobile-paywall-7514 (4.82 stars, 88,376 ratings).
- Snapchat+: https://www.paywallscreens.com/apps/snapchat-mobile-paywall-c966 (4.51 stars).
- Strava (web plans page, from "Strava Free vs. Paid: Is It Worth the Upgrade?" https://www.youtube.com/watch?v=ho0oWvjUaeY). No in-app Strava or AllTrails paywall was found in a clean capture (eKm3mBt-SCc and Mf9Se0LYF08 are web pages and slides).

**Pick: Meetup+ is THE paywall reference.** It is a social events app selling exactly what Faves Plus sells (better access to real-world events and the people there), it shows every part Faves needs on one white screen with one brand color (feature checklist, free-trial switch, two plan rows with a "MOST POPULAR" badge, one big CTA), and the file is an exact 3x capture. Its screenshot shows no legal line, so the legal line comes from Timeleft, whose product (members-only dinners every Wednesday) is the closest match to Faves Nights.

**Screens**

`meetup/paywallscreens_02_weekly_yearly_rows_free_trial.png` (**the paywall reference**, 1206x2622, 3.0 px/pt, 402 pt):
- "✕" top-left, 14 pt glyph `#424242`, 23 pt from the edge.
- Brand logo 80x93 pt centered; **title two lines, centered, bold black, cap 20 pt (about 28 pt): "Connect more / with Meetup+", the product name in the brand pink.**
- **Feature list: three rows, 36 pt pitch, each a filled purple check circle 18.7 pt (`#7767CA`, white check) + one line semibold black (cap 10 pt, about 14 pt).** No sub-lines.
- **Free-trial row: card 355x75 pt, radius 16 pt, 1 pt `#CECECE` border, "Not sure yet?" semibold (cap 11.3 pt, about 16 pt) over "Enable free access" `#484848` (cap 10 pt, about 14 pt), empty radio circle 28.7 pt `#A9A9A9` at the right.**
- **Plan rows: each 355x65 pt, radius 16 pt, 11 pt apart, 24 pt side margins. Unselected: white, 1 pt `#CACACA` border. Selected: fill `#F4F3FB`, 1 pt `#776CB0` border. Plan name left, semibold black (cap 11.3 pt, about 16 pt); price right "$9.99/week" regular `#393840` (cap 10 pt, about 14 pt).** Badge **"MOST POPULAR": orange `#D8884B` pill about 22 pt tall, white caps, sitting on the selected row's top border at the left (x 40 pt).**
- **CTA "Continue": 62 pt tall, full pill, 24 pt side margins, fill `#D34E6B` (iOS 26 glass gradient), white semibold label (cap 14 pt, about 19 pt).**

`meetup/paywallscreens_01_join_meetup_plus_toggle_features.png` (390 pt): the other Meetup variant: title "Join Meetup+", **Weekly / Yearly segmented toggle (grey track, white selected segment) with an orange "67% OFF" tag on Yearly**, a photo card "Meetup+ $4.99/7 days" with the logo tile, feature rows with a black icon + bold title + grey sub-line, the free-trial row, and a red-pink "Continue" bar.

`timeleft/paywallscreens_01_unlimited_dinners_plan_cards.png` (**the legal line reference**, 1170x2532, 3.0 px/pt, 390 pt):
- Photo header with dots: "UNLIMITED ACCESS" serif caps + "All dinners, every Wednesday" (the copy closest to Faves Nights).
- Three plan cards on cream `#FFF2DD`: about 111x132 pt each, 14 pt apart; a 19 pt tag band on top ("Discover" grey `#D1D1D1`, **"Save 28%" orange `#F75936` on the selected card**, "Save 45%" grey); "1 Month / $26.00/m", "3 Months / $18.67/m", "6 Months / $14.33/m"; the selected card has a dark outline about 1.5 pt.
- **Legal line: five centered lines, about 11 pt regular (cap 7.7 pt), 13 pt line pitch, near-black `#060000` on the page color, 30 pt side margins, "Terms" underlined: "By selecting Subscribe, you will be charged, your subscription will auto-renew for the same price and package length until you cancel via settings, and you agree to our Terms..."** It sits directly above the CTA.
- **CTA: 358x56 pt pill, fill `#E35F46`, 1 pt dark outline `#220000`, white semibold label carrying the price: "Get 3 months for $56.00"**; under it "Restore" bold underlined.

`timeleft/paywallscreens_02_our_plans_radio_rows.png`: "Our plans" with radio rows (1 Month $19.99 / 3 Months $46.99 with a strikethrough $59.97 and a green "Save 22%" tag, selected / 6 Months), "Members are up to 93% more likely to find long lasting connections", "$46.99 every 3 months" and a black gradient "Continue" pill.

`duolingo/paywallscreens_01_free_week_plan_cards.png`: purple gradient, mascot, "Get started with a **7 day free trial** on Super"; plan cards Family Plan / Individual (selected, "MOST POPULAR" teal tag, white check badge), each with "12 mo • $95.99" and "$7.99 / MO"; "Cancel anytime in the App Store"; white CTA "START MY FREE WEEK"; "VIEW ALL PLANS"; legal paragraph with "automatically renews" in bold.

`letterboxd/paywallscreens_01_pro_patron_upgrade.png`: dark slate "Upgrade Account" sheet with "Close"; two tier cards, each with a colored badge ("PRO" orange, "PATRON" blue), a centered feature paragraph, and a footer row "1 year of Pro ... $18.99" with an outlined price chip; legal text and "ENTER CODE" / "RESTORE PURCHASES" outlined buttons.

`snapchat/paywallscreens_01_snapchat_plus_plans.png`: dark "Save 60% on Snapchat+": a gold "SPECIAL OFFER" header on the selected Monthly card with a check list, then Annual ("BEST VALUE" tag), Friends & Family, Platinum rows; yellow "Subscribe" pill `#FFF90D`; tiny legal text.

`strava/yt_ho0oWvjUaeY_t086_web_plan_cards.png` (web, context only): "Choose the best subscription payment plan for you": a dark selected card with an Annual / Monthly toggle and "US$11.99 /month", plus Student Discount and Family Plan cards, each with a "Try It Free" or "Choose Plan" button and a billing line.

---

## 8. States: offline, error with retry, loading, no results

**Sources**
- TikTok: "How To FIX TikTok "No Internet Connection" on iPhone" https://www.youtube.com/watch?v=spo0PbcgeOo (filmed iPhone; the editor added a zoomed inset of the message).
- Spotify: "Spotify Error Fix: You're in Offline Mode" https://www.youtube.com/watch?v=6wqjRrRBzTQ (filmed Android).
- Instagram and Snapchat loading frames come from q2ASzVtL0YE and wizASv52Zgk above.
- Searched, nothing usable: Google Maps "You're offline" (iVO92glj_YQ shows a 2018 Android build, ejGtFrPq_OI only offline-map downloads), Instagram not loading (gO9QxzrvblE, spinner only), eoLlSPUS4tc and rp1NDgZxyoI (Spotify, unreadable), RoXGKH3xi7A (Uber Eats, App Store pages only), x0U_-2ous0c (DoorDash, App Store page only), krb2Xwthbcc (download blocked).

**Screens**

`tiktok/yt_spo0PbcgeOo_t004_no_internet_tap_to_retry.png` (**the error + retry reference**, layout and wording only): on the black For You feed, centered: a circular-arrow retry icon, then **"No internet connection. Tap to retry." white semibold**, then **"Connect to the internet and try again." grey, smaller**. There is no button: the whole message is the tap target. The top tabs ("Following / For You") and the tab bar stay in place, so the user is not thrown out of the screen.

`spotify/yt_6wqjRrRBzTQ_t013_offline_bar_above_tab_bar.png` (**the offline banner reference**, layout only): a full-width dark bar sitting directly on top of the tab bar, one bold white line **"Spotify is currently set to offline"** centered; the content above stays visible and scrollable.

`instagram/yt_q2ASzVtL0YE_t089_loading_pill_skeleton_rows.png` (**the skeleton reference**, 1.235 px/dp): while the "Popular nearby" sheet loads:
- The map's "Search This Area" pill turns into **"· Loading"**.
- **Skeleton row: a 58 dp circle at the left, three bars stacked to its right (each about 10 dp tall with round ends; widths about 174, 226 and 121 dp, the longest in the middle), then a full-width rounded block 378x121 dp below (the photo row). Fill `#F8F8F8` on white `#FFFFFF`: very low contrast, no shimmer visible in the frame.** The pattern repeats down the sheet with about 24 dp between groups.

`snapchat/yt_wizASv52Zgk_t035_loading_places.png`: Snap list loading: the sheet title stays ("🔍 Cafes") and the sub-line reads **"Loading Places..."** with a small spinner below. `snapchat/yt_wizASv52Zgk_t028_list_placeholder_thumbnails.png`: rows already show real names and counts while thumbnails are grey rounded squares with a generic cup icon (text first, images fill in later).

**No results:** nothing new captured; the catalog's Yelp frame (`discovery/yelp/yelp_empty_no_results_android_vid.png`) stays the reference.

**Search and city picker:** not captured again. The catalog's `beli_search_restaurants_members_vid.jpg`, `beli_onboarding_city_pick_vid.jpg` and Citymapper's city pick already cover them; the only new piece is Instagram's Places search tab (`moments/instagram/yt_q2ASzVtL0YE_t009_search_places_tab.png`): a "Places" tab whose result rows are a pin icon in a light circle + place name.

---

## Element map for Faves

One pick per element. Copy it exactly; values are from the measurements above. Where a reference's color is a brand color, Faves swaps in its own token (`brand`, `score`, etc. in `docs/design_system.md`) and keeps everything else.

| Element | Copy this | Exactly what to copy | Measured values |
|---|---|---|---|
| Spot Moments reel on the place page (tiles + tabs Highlights / Right now) | `moments/instagram/yt_q2ASzVtL0YE_t080_location_page_top_recent_grid.png` | Instagram's location page: "Top" / "Recent" becomes "Highlights" / "Right now". Two equal tab halves, labels centered, a short dark underline under the active label only, no divider. Under it a 3-column edge-to-edge grid of square tiles; video tiles carry a reel glyph top-right. Tap a tile to open the viewer at that clip. | 1.235 px/dp. Tab label cap 14.6 dp (about 20 sp); active black, inactive `#44494C`. Underline 2.4 dp tall, 78 dp wide, `#1B181E`, centered on the label. Tiles 1:1, 136x136 dp on a 412 dp screen (1/3 width), 1.6 dp white gutters, no side margin. Reel glyph about 24 dp white. |
| Full-screen moment viewer | `moments/instagram/appstore_07_story_viewer_close_friends.png` | Instagram's story viewer: one progress segment per clip at the top, header row (avatar, name, time), ✕ top-right, tap right half for next, left half for back; reply pill + heart + send under the media. Faves: the header shows the poster and "2h" exactly like Instagram; for a place's Right now reel, put the place name in the name slot and the relative time after it, the way Snap does for place stories (`snapchat/yt_4Q-gjHtttGQ_t030_...`: "The Bootleg Theater / 5m ago"). | 1.95 px/pt. Media 9:16 full width under the status bar, background `#0C0F14`. Progress bar 2 pt tall, 6.7 pt side insets, played `#F9F9F9`, unplayed white at 50%. Avatar about 40 pt, name white semibold about 15 pt, time light grey. ✕ 18 pt. Reply pill 280x45 pt, 1 pt `#4B4F52` outline, full radius, placeholder `#F8FAF9` about 17 pt; heart 24 pt, send 22.5 pt. |
| "Taken here" stamp | `moments/bereal/yt_KXVIqgEsm64_t012_post_location_pill_3h_late.png` | BeReal's location pill under the caption plus its grey time line under the username. Faves: "➤ Taken here · Tartine Bakery" in the pill, and "12m ago" (or "Right now") in the grey line. Only clips posted on site get the pill, the way BeReal only shows a location when "Share my position" was on. | About 1.08 px/dp (filmed). Pill fully rounded, about 30 dp tall, fill `#18181C` to `#1F1B28` on dark (on a white Faves screen use `field` `#EBE8EC` with `text`), arrow glyph + bold label (cap 12 dp, about 17 sp), centered under the caption. Time line grey `#A7A5B7`, about 13 sp. |
| Post-a-moment camera screen | `moments/bereal/yt_FMZgxjwSkfo_t030_camera_photo_video_shutter.png` | BeReal's camera: black screen, round ⌄ close top-left, wordmark centered, 3:4 rounded viewfinder, flash and flip on the viewfinder's bottom corners, "1x" chip centered on its bottom edge, VIDEO / PHOTO labels under it (Faves: VIDEO selected by default), big white ring shutter. After capture, copy the preview chips from `t062` (audience pill, "➤ On" location pill, music) and the "SEND ▸" text button. | 1.25 px/pt. Close button 45 pt, fill `#101012`. Viewfinder 390x530 pt (3:4). "1x" chip about 35 pt black circle. Mode labels bold caps, cap 11 pt; selected yellow `#DEE532` (Faves: `brand` would vanish on black, keep the yellow), unselected white. Shutter ring 77.6 pt outer, 4 pt stroke, 2.4 pt gap, 61.6 pt white disc, center 75 pt above the screen bottom. |
| "You need to be here to post" blocked state | `moments/bereal/appstore_05_share_to_view_post_a_bereal.png` | BeReal's "Share to view": the content stays visible but blurred, with an eye-slash icon, a short bold title, one plain line, and one white button. Faves: blur the Right now reel's posting entry, title "Be here to post", line "Moments can only be posted from Tartine Bakery (within 150 m)", button "Get directions". If location permission is off, show TikTok's prompt pattern instead (`moments/tiktok/press_01_...`: "Cancel" / "Open settings"). | About 2.70 px/pt. Card radius 16.4 pt. Icon 33x22 pt white. Title white bold, cap 10.7 pt (about 15 pt). Line white regular about 13 pt, centered. Button 117x35 pt, white, radius 11 pt, label black semibold about 13 pt. |
| Rewards wallet summary | `wallet/ibotta/appstore_05_earnings_withdraw_transactions.png` | Ibotta's Earnings page: centered title, one bordered balance box (colored "Lifetime earnings" band on top, big "Current earnings" number in the white body, thin colored strip at the bottom), a full-width Withdraw pill under it, then "Transactions". Faves: "Lifetime earned $48.20" in the band, "Ready to cash out $12.40" big, button "Cash out" (disabled under $5 with "Cash out at $5" as the label). | 2.47 px/pt. Title bold cap 23.1 pt (about 32 pt) `#282F37`. Box 330 pt wide, 31 pt margins, radius 9.7 pt, 1 pt `#C2C2C2`. Band 41 pt `#06A39C` (Faves: `brand`), white labels about 19 pt. Body 103 pt; amount bold cap 34 pt (about 47 pt). Strip 15 pt. Button 30 pt below: 343x40 pt pill `#0D7888` (Faves: `brand`), white semibold about 19 pt. |
| Earnings feed row | same Ibotta file, "Transactions" | Ibotta's transaction row: logo circle, bold name, bold amount at the right, inset divider, nothing else. Faves: the spot's photo in the circle, "Sunset in Bernal · 3 people did your day" as the name, "+$1.20" at the right. | 2.47 px/pt. Pitch 70.5 pt. Logo 33 pt circle, 25 pt from the edge. Name bold `#050A0E` cap 13 pt (about 18 pt), 66 pt from the edge. Amount bold, right edge 23.5 pt in. Divider 1 pt `#E4E4E4` to `#E8E8E8`, inset 21.5 pt left and 22 pt right. Header "Transactions" semibold cap 17.4 pt (about 24 pt), 41 pt under the button. |
| Payout screen | `wallet/venmo/yt_wHGzOIg7ayA_t043_instant_selected_fee.png` | Venmo's Transfer Balance: ✕ + centered title, the amount huge in the middle with a clear button, two side-by-side method cards (icon circle, bold label, grey speed line), a "Fee" row, a "Transfer to" row with "›", one full-width pill pinned at the bottom. Faves: cards "Gift card / Instant" and "Bank / 1-3 days". | 1.315 px/pt. Amount about 55 pt black. Cards 172x160 pt, 16 pt gap, radius 7.6 pt; selected 1 pt blue border + 58 pt filled icon circle (Faves: `brand`), unselected 1 pt `#ACACAC` + grey `#929498` circle. Labels bold about 17 pt, speed line grey about 15 pt. |
| Payout method rows | `wallet/rakuten/appstore_05_choose_how_you_get_paid.png` | Rakuten's "Choose how you get paid": one bordered card per method (gift cards, bank, PayPal), logo + bold name + a "Select" link; the chosen one reads "✓ Selected" in green. Used for "Change payout method". | 1.94 px/pt. Title bold cap 16.5 pt (about 23 pt) `#252525`, subtitle `#464356` about 14 pt. Cards 333 pt wide, 20.6 pt margins, 92.6 pt tall, 17 pt gap, 1 pt `#DDDDDD`, radius 7 pt. Logo 22.7 pt. Name bold `#22202D` about 16 pt. "Select" `#8529CD` semibold (Faves: `brand`). Selected `#33823F` with a check. |
| Payout confirm button | same Venmo file (+ DoorDash `wallet/doordash-dasher/yt_QtNGm8n4OdE_t023_fast_pay_confirm.png` for the label) | Venmo's bottom pill, with DoorDash's habit of putting the amount in the label and a one-line arrival note above it: "Cash out $12.40" / "Gift cards arrive in minutes. Bank transfers take 1-3 business days." Success screen copies DoorDash `t038`: icon in a ring, big amount, "Cash out in progress!", "Details were sent to your email." | Venmo: 359x47 pt, full pill, `#137D69` (Faves: `brand`), white bold label. DoorDash: fee and total rows above the note, note centered two lines, button 47 pt tall. |
| Faves Plus paywall (plan cards, feature list, CTA) | `paywall/meetup/paywallscreens_02_weekly_yearly_rows_free_trial.png` | Meetup+: ✕, logo, two-line title with the product name in the brand color, a 3 to 5 row check list, the "Not sure yet? Enable free trial" switch card, two plan rows ("Monthly $5.79/month" and "Yearly $42.90/year" with the "MOST POPULAR" badge on Yearly, selected by default), one big "Continue" pill. | 3.0 px/pt exact. ✕ 14 pt `#424242`. Logo 80 pt. Title cap 20 pt (about 28 pt) bold. Check circles 18.7 pt `#7767CA` (Faves: `brand`), feature text semibold about 14 pt, 36 pt pitch. Trial card 355x75 pt, radius 16, 1 pt `#CECECE`, radio 28.7 pt `#A9A9A9`. Plan rows 355x65 pt, radius 16, 11 pt gap, 24 pt margins; unselected 1 pt `#CACACA`; selected fill `#F4F3FB` + 1 pt `#776CB0`; name semibold about 16 pt, price `#393840` about 14 pt. Badge `#D8884B`, 22 pt, white caps. CTA 62 pt full pill `#D34E6B` (Faves: `brand`), white semibold about 19 pt. |
| Paywall legal line | `paywall/timeleft/paywallscreens_01_unlimited_dinners_plan_cards.png` | Timeleft's legal paragraph directly above the CTA, centered, with "Terms" underlined, and "Restore" as an underlined text button under the CTA. | 3.0 px/pt exact. About 11 pt regular (cap 7.7 pt), 13 pt line pitch, 30 pt side margins, `#060000` (Faves: `textMuted` on white). |
| Offline banner | `states/spotify/yt_6wqjRrRBzTQ_t013_offline_bar_above_tab_bar.png` | Spotify's bar: full width, dark, sitting right on top of the tab bar, one bold centered line; the screen above keeps working from cache. Faves: "You're offline. Showing saved spots." | Layout only (filmed). Use `text` `#222427` for the bar and white bold 14 pt text (DoorDash scale) since the frame cannot be measured. |
| Error state with retry | `states/tiktok/yt_spo0PbcgeOo_t004_no_internet_tap_to_retry.png` | TikTok's centered message: retry-arrow icon, one bold line that already says the fix ("No internet connection. Tap to retry."), one grey helper line; the whole block is the button, the screen's chrome stays. Faves: "Couldn't load this plan. Tap to retry." / "Check your connection and try again." | Layout and wording only (filmed). Icon above, bold line, smaller grey line, centered vertically in the content area. |
| Loading skeleton | `states/instagram/yt_q2ASzVtL0YE_t089_loading_pill_skeleton_rows.png` | Instagram's skeleton: grey shapes in the exact layout of the coming rows (circle + three bars + a wide photo block), no spinner; a "Loading" label replaces the map's search pill. Faves: same shapes for place rows and plan stops. | 1.235 px/dp. Circle 58 dp. Bars about 10 dp tall, round ends, widths about 174 / 226 / 121 dp (middle longest). Block 378x121 dp, rounded. Fill `#F8F8F8` on `#FFFFFF`. About 24 dp between groups. |
| No-results state | `discovery/yelp/yelp_empty_no_results_android_vid.png` (already in the catalog) | Yelp's recovery pattern, unchanged: headline, one helper line, "People also search for" chips, "Notice something missing? Add a spot". | See the Discovery catalog, Yelp. |

---

# Brand mark: the Faves logo

Added 2026-10-24. The app icon, splash and adaptive icon use "01 Heart Pin" (Morgan's pick for now; he may swap it). It lives in one place: `assets/brand/heart_pin.svg` plus `assets/brand/brand.json` (background `#FF4F6D`, glyph `#FFFFFF`). `scripts/make-icons.mjs` renders every icon size from that file, and `app.config.js` and `src/theme/tokens.ts` (`logo`) read the colors from `brand.json`. The iOS icon is exported full bleed (corner radius removed) because iOS masks it.

## References

| File | What it shows | Measured |
|---|---|---|
| `brand/airbnb_app_icon_belo_mark.jpg` (App Store artwork, 512 px, Airbnb id401626263) | Airbnb's Bélo: one continuous white line on a coral-pink field | Field gradient `#F31C57` (bottom left) to `#FF5A7A` (top right). Stroke 25 px on a 512 px icon (4.9% of the width), round joins, the mark spans about 56% of the icon width. |
| `brand/google_maps_app_icon_pin.jpg` (App Store artwork, 512 px, Google Maps id585027354) | Google Maps' pin with a round hole | Hole 155 px across on a 308 px wide pin head (about 50% of the pin), centered in the head. |

## What the Faves mark takes from each

- From Airbnb: a single continuous line drawn in white on one warm pink-coral field, round joins, a stroke about 5% of the icon width (ours: 8 units in a 70% group on a 100 unit canvas, 5.6%).
- From Google Maps: the round hole that reads as "a place on a map". Ours is a filled white dot inside the heart, about a quarter of the heart's width.
- The field color `#FF4F6D` sits inside Airbnb's measured gradient range. In the app it is used only for the logo, the splash and the DoorDash-style banner CTA; the interface itself keeps Beli's teal (`brand`).

---

# Video-first Home and itinerary: UI reference catalog

Captured 2026-10-24 for Faves, for the video-first Home (Top 10 row, video card rows, most-done day card) and the video itinerary (stop clip tiles, full-screen swipe viewer, place page hero).

Images live in `references/video/<app>/` (local only, never committed). 12 images; every kept image was opened and looked at. Every number below was measured with PIL on the saved file unless it says "visual".

## How to read the numbers

- `px` = pixels in the saved file. `pt` (iOS) or `dp` (Android) = px divided by the scale given for that file. Android dp and iOS pt are the same size on screen, so dp values copy straight to pt.
- App Store screenshots are marketing frames. The phone screen was found by edge scan and tied to 393 pt. Treat their font sizes as +/-15% and their proportions as exact.
- Video frames are H.264: colors +/-6 per channel, edges soft.
- Font size is about cap height / 0.72.

| Source set | Scale used |
|---|---|
| Netflix Android screen recording PXo3QCmgWB4 (576x1280, a 1080x2400 phone at 360 dp) | 1.6 px/dp (screen 576 px = 360 dp) |
| Netflix App Store (1242x2688) | 2.445 px/pt (screen 961 px, x 141 to 1102 = 393 pt) |
| YouTube Android recording Y6V9qRAan6U (crop 536x1080) | 1.308 px/pt (screen 514 px, x 11.5 to 525.5 of the crop = 393 pt; proportions exact, sizes +/-5%) |
| YouTube App Store (1284x2778) | 2.63 px/pt (screen 1033 px = 393 pt) |
| TikTok App Store (1242x2688) | 2.484 px/pt (screen 976 px, x 132 to 1108 = 393 pt) |
| Instagram App Store (1284x2778) | 2.336 px/pt (screen 918 px, x 183 to 1101 = 393 pt) |

---

## 1. Netflix "Top 10" row (rank numeral + card)

**Sources**
- Screen recording (Android, real app): "Need to Find Netflix's Top 10? Watch This Simple Guide!" https://www.youtube.com/watch?v=PXo3QCmgWB4
- App Store: https://apps.apple.com/us/app/netflix/id363590051 (iPhone 6.5" set). The App Store set does not show a Top 10 row.
- Searched and rejected: nb1OKEgwmjk (phone too small in a 1080p frame, never scrolls to the row), mLRbltNrEBk (TV app), AFgeL8dPL2g and 6JTVYVUC68c (tablet).

**Screens**

`netflix/yt_PXo3QCmgWB4_t037_top10_tv_row_1_2_3.png` (**the Top 10 reference**, 1.6 px/dp):
- Background `#000000`.
- Row title "Top 10 TV Shows in Indonesia Today": white bold, cap 22 px = **13.75 dp (about 19 sp)**, 12.5 dp from the left edge, wraps to two lines at 25.6 dp line pitch. Title baseline to card top about 14 dp.
- **Card: 100 x 141 dp (160 x 226 px), aspect 0.71, corner radius about 2.5 dp.** Card 1 starts 36 dp from the screen edge. Card pitch 132 dp: the gap between cards is **32 dp (51 px)**, and the numeral sits in that gap.
- **Numeral: 72 dp tall for "1", 75 dp for "2" and "3" (115 to 120 px), which is 53% of the card height and 0.75 of the card width. Its bottom sits flush with the card bottom (within 1 px).** Numeral 1 starts 10.6 dp from the screen edge.
- **Numeral style: solid fill `#1A1A1A` (26, 26, 26), outlined with a light grey stroke about 2 dp wide (3 to 4 px; core `#CDCDCD` to `#D4D4D4`, anti-aliased edge `#A9A9A9`).** A soft dark shadow fades out to the left of each stroke (values rise from 1 to 22 over about 30 px).
- **The numeral is drawn ON TOP of the card's left edge**: its fill covers the poster. Overlap onto the card: 8.5 dp for "1", 16 dp for "2". Typeface: Netflix Sans Bold, a heavy geometric sans.
- Under each card: "New Season" red pill, see section 2.
- Next row ("My List") title cap top sits 31 dp under the Top 10 cards.

`netflix/yt_PXo3QCmgWB4_t042_top10_row_9_10_double_digit.png`: the end of the row, "9" and "10". **The gap stays 32 dp for "10"; the two digits simply overlap the next card much more** (the "1" sits in the gap, the "0" is drawn almost entirely over card 10: about 58 dp of overlap). Cards stay 100 dp wide.

---

## 2. Netflix regular poster rows, tall "Only on Netflix" cards, row badges

**Screens**

`netflix/yt_PXo3QCmgWB4_t051_only_on_netflix_tall_cards_trending_row.png` (1.6 px/dp):
- **Tall card row "Only on Netflix": cards 154 x 307 dp (247 x 491 px), aspect 1:2, gap 7.8 dp, 11.6 dp left margin.** Title "Only on Netflix" white bold, cap 14 dp (about 19 sp); title to card 13.4 dp.
- **Regular row "Trending Now": cards 100 x 141 dp, gap 7.5 dp, 12 dp left margin**, same title style. "My List" in the t037 frame measures the same 100 x 141 dp with a 7.5 dp gap.
- **"TOP 10" flag: red `#E81A1E`, flush with the card's top-right corner, white "TOP" small over a bigger "10". 16 x 21 dp on a regular card, 22.5 x 30.6 dp on a tall card.**
- **"New Season" pill: red `#E1050B`, white bold label, 64 x 15 dp, centered on the card's bottom edge.**
- Bottom tab bar: Home (white, active), Games, New & Hot (red "1" badge), Downloads.

`netflix/appstore_06_home_hero_only_on_netflix_row.jpg` (**iPhone, current 2025 Home**, 2.445 px/pt):
- **Background `#110F15` (17, 16, 21), not pure black.**
- Header "N Home" + cast / download / bell icons; glass category chips (Shows, Movies, Podcasts, New & Hot).
- Hero card 344 x 459 pt, rounded (about 12 pt, visual), title art, "Period Piece • Drama • Critically Acclaimed", white "Play" and grey "+ My List" buttons side by side.
- **"Only on Netflix" row: posters about 110 pt wide, 8 pt gap, 11.7 pt left margin; title cap about 12.7 pt (about 18 pt) white; title baseline to poster top 10.6 pt.**
- Floating glass tab bar: Home, Clips, Search, My Netflix.

---

## 3. Vertical video cards on a home feed: YouTube Shorts shelf

**Sources**
- Screen recording (Android, real app, dark mode): "YouTube Shorts Not Showing on Homepage | How to Fix" https://www.youtube.com/watch?v=Y6V9qRAan6U (frame at 100 s, phone crop).
- App Store: https://apps.apple.com/us/app/youtube-watch-listen-stream/id544007664. Its "Create" screenshot shows the iPhone shelf only behind a sheet (the shelf header and the top of two cards, with a third card peeking at the right edge: on iPhone the shelf scrolls sideways).
- Searched and rejected: vweJKhonU-k (desktop web), MUvFRDD2OiY and 0lbxHl0MfAU (settings only), arg4tSo7UBw (phone too small).

**Screen**

`youtube/yt_Y6V9qRAan6U_t100_home_shorts_shelf.png` (**the video card reference**, 1.308 px/pt):
- Background `#0F0F0F` (15, 15, 15).
- **Shelf header: red Shorts logo 21 x 26 pt, then "Shorts" white medium, cap 11.5 pt (about 16 pt); "⋮" at the right edge.**
- **Card: 183 x 273 pt (239 x 358 px), 46.5% of the screen width, aspect 2:3 (the 9:16 video is center-cropped into it). Corner radius about 6 pt (8 px). 10.3 pt side margin, 6.9 pt gap between cards.**
- **Title overlay: white, 2 lines max, about 12 pt regular, 12.2 pt line pitch, inset 7 pt from the left and 10 pt from the bottom, then "…" truncation.** A dark gradient covers about the bottom quarter of the card (the image darkens from 141 to 60 in luminance over the last 30 pt) so the white title reads on any clip.
- "⋮" white, top-right of every card, about 9 pt in.
- No view count or creator name on this card (the title is the only text).

---

## 4. Full-screen vertical swipe viewer

**Sources**
- App Store screenshots: Netflix "Browse clips to discover your next watch" (Clips tab, iPhone), TikTok "Follow your favourite teams." (For You), Instagram "Discover entertaining videos with Reels".

**Screens**

`netflix/appstore_04_clips_vertical_viewer_mute.jpg` (**the viewer reference**, 2.445 px/pt). Netflix Clips: one vertical clip fills the screen, swipe up for the next.
- **Right rail: three round translucent buttons, 48 pt diameter, pitch 64 pt, light glass fill (white at about 20% over the clip), white line icons about 22 pt: mute (speaker with ×) on top, then "+" (My List), then share (paper plane). The rail's right edge sits 28 pt from the screen edge.**
- **Title block bottom-left, 17.4 pt from the left edge:** title "KPop Demon Hunters" white bold, cap 13.9 pt (**about 19 pt**); genre line "Music, Family Movies, Kids & Family Movies" white semibold, cap 8.2 pt (**about 11.5 pt**); one-line description "When K-pop superstars Rumi, Mira" white regular, cap 9.4 pt (**about 13 pt**) ending in bold "…more".
- **Title art circle 71 pt with a thin white ring, right of the title block** (opens the title page).
- **Progress bar: 2 pt tall (5 px), full width, directly on top of the tab bar; played part `#A5A5A5` grey, unplayed part dark `#2D2729`.**

`tiktok/appstore_14_for_you_rail_handle_sound.png` (2.484 px/pt). TikTok For You:
- Video area 754 pt tall above an 80 pt black tab bar (Home, Friends, ✚, Inbox, Profile).
- Top: "LIVE" icon left, "Following • For You" centered (active white bold, inactive white at about 60%), search icon right.
- **Right rail, centered 33 pt from the right edge: avatar 51.5 pt with a white ring and a 21 pt red "+" disc on its bottom edge; then heart 32 x 29 pt, comment 32 x 31 pt, bookmark 25 x 28 pt, share 33 x 26 pt, each with a white count under it (cap 8.5 pt, about 12 pt semibold, soft shadow). Pitch 72 pt.**
- **Bottom-left, about 22 pt in: handle "oddlysatisfying" white semibold (about 16 pt), then "♫ original sound - oddlysatisfying" white regular (about 14 pt).** Spinning sound disc bottom-right, about 34 pt.

`instagram/appstore_14_reels_viewer_progress_bar.jpg` (2.336 px/pt). Instagram Reels (2025 layout):
- Top: "+" left, "Reels  Friends" tabs centered, filter icon right.
- Rail: heart 26 x 22 pt with "823K" (cap 8.1 pt, about 11.5 pt), comment, repost, share; centered about 26 pt from the right edge.
- Bottom-left: 22 pt avatar + handle "marijmusa" white semibold (about 14 pt) + verified tick; caption "made a new friend today" white regular (about 14 pt).
- **Progress bar: 2 pt tall (4 to 5 px), starts 17 pt from the left edge, ends under the rail; played `#FCFBF7`, unplayed white at about 30%.** It sits just above the floating glass tab bar.

`youtube/appstore_03_shorts_full_screen_viewer.jpg` (layout only): YouTube Shorts full screen: rail with like / dislike / comment / share / remix, channel avatar + name + red "Subscribe" pill bottom-left, title line above it.

---

## 5. Video hero at the top of a detail page

`netflix/appstore_02_title_page_trailer_hero.jpg` (**the hero reference**, 2.445 px/pt; the screenshot has a dimming rating overlay on top, so sizes are usable and colors are not):
- **The trailer plays full width directly under the status bar: 393 x 212 pt (961 x 518 px), aspect 1.85:1 (about 16:9).** The status bar area above it is black.
- **Two round dark buttons top-right of the video: cast and ✕, each 30 pt (74 px), near-black fill, white icons, 44 pt center to center, 10 pt below the top of the video, the ✕ about 28 pt from the right edge.** A large round play button sits centered on the video while paused.
- Under the video: "NETFLIX" red wordmark, title "Stranger Things" (about 24 pt), meta "2025 TV-14 5 Seasons HD", "Watch the Complete Series Now", a full-width white "Play" button and a full-width grey "Download S5:E1" button, synopsis, then My List / Rate / Share / Download icon buttons.

`netflix/appstore_04_clips_vertical_viewer_mute.jpg` gives the mute control: the 48 pt glass circle with the speaker-× icon (see section 4).

---

## 6. Small video tile beside text in a list

`youtube/appstore_05_playlist_rows_thumb_duration.jpg` (**the list tile reference**, 2.63 px/pt). YouTube's playlist sheet under the player:
- **Row: thumbnail left, text right, "⋮" far right. Thumbnail 134.6 x 75.3 pt (354 x 198 px, 16:9), corner radius about 7 pt (visual), 14 pt from the left edge; text starts 16 pt right of the thumbnail.** Rows are about 90 pt apart with no dividers.
- **Duration badge: bottom-right inside the thumbnail, about 4 pt in from the right and bottom edges, black about 80%, 17.5 pt tall, white digits "3:11" cap 7.6 pt (about 11 pt semibold).**
- **Watched bar: red `#FE0000`, 3.4 pt tall, across the bottom of the thumbnail, length = share watched.**
- Title black regular, 2 lines, cap 9.1 pt (about 13 pt); channel line "Dua Lipa" grey, then "89M views • 1 year ago" grey (visual).
- The playing row is highlighted with a pale tint `#EADCDC` across the full width.

`netflix/appstore_03_moments_saved_clip_tiles.jpg` (2.445 px/pt): Netflix "Moments You've Saved" row: 16:9 clip tiles (video part 132.5 pt tall) with a round play button and the length ("15s", "2m") bottom-left, a share icon bottom-right, and a dark `#161616` caption box under each clip (51 pt tall, two centered lines: "Starts at 49:20" white, "Bridgerton | S4:E1" grey). Tiles 8 pt apart.

---

## Element map for Faves

One pick per element. Copy it exactly; values are from the measurements above. Where a reference's color is a brand color, Faves swaps in its own token (`brand`, `score`, etc. in `docs/design_system.md`) and keeps everything else. The video-first screens are dark like their references: use Netflix's iPhone background `#110F15` for Home and the viewer.

| Element | Copy this | Exactly what to copy | Measured values |
|---|---|---|---|
| Top 10 row (rank numeral + 9:16 card) | `video/netflix/yt_PXo3QCmgWB4_t037_top10_tv_row_1_2_3.png` (+ `t042` for 10) | Netflix's Top 10 row: big outlined rank numeral in the gap before each card, bottom-aligned with the card, drawn on top of the card's left edge. Title "Top 10 in San Francisco today" in the row title style. Faves keeps Netflix's card width and swaps the poster for a 9:16 clip (first frame as poster, autoplay muted when the row is centered). "10" keeps the same gap and overlaps the card more, as Netflix does. | Card 100 pt wide, 9:16 = 100 x 178 pt (Netflix's own card is 100 x 141), radius 2.5 pt. Gap 32 pt, so pitch 132 pt; first card 36 pt from the edge, numeral "1" 10.6 pt from the edge. Numeral 75 pt tall (0.75 of the card width), fill `#1A1A1A`, stroke 2 pt `#D0D0D0`, overlap onto the card 8.5 pt ("1") to 16 pt ("2"), about 58 pt for "10". Typeface: Netflix Sans Bold is proprietary, so use the iOS system font at heavy weight. Row title white bold 19 pt, 12.5 pt in, 14 pt above the cards; 31 pt from card bottom to the next row title. |
| Regular video card row ("Tonight", "This weekend", "Hidden gems") | Row rhythm: `video/netflix/appstore_06_home_hero_only_on_netflix_row.jpg` + `t051` Trending Now. Card overlay: `video/youtube/yt_Y6V9qRAan6U_t100_home_shorts_shelf.png` | Netflix's row: bold white title, cards in one sideways-scrolling line, the next card peeking at the right edge. Each card is a 9:16 clip with YouTube Shorts' overlay: bottom gradient, white 2-line title, "⋮" top-right. | Cards 110 pt wide (Netflix iPhone poster width), 9:16 = 110 x 196 pt, gap 8 pt, left margin 12 pt. Radius 6 pt (YouTube card). Title overlay white 12 pt, 12.2 pt line pitch, 2 lines max, 7 pt left / 10 pt bottom inset, gradient over the bottom 25%. Row title white bold 19 pt (cap 13.75), 14 pt above the cards. |
| Most-done day story card (vertical, first stop's clip) | `video/netflix/yt_PXo3QCmgWB4_t051_only_on_netflix_tall_cards_trending_row.png` ("Only on Netflix") | Netflix's tall card row: the one big card per row, its corner flag and its bottom pill. Faves: the day's first stop plays in the card; the red "TOP 10" flag becomes a "MOST DONE" flag; the "New Season" pill becomes the day's count ("Done 214 times"). | Card 154 pt wide (Netflix measures 154 x 307, 1:2); Faves 9:16 = 154 x 274 pt, gap 7.8 pt, 11.6 pt margin. Flag flush top-right, 22.5 x 30.6 pt, `#E81A1E` (Faves: `brand`). Pill centered on the bottom edge, 15 pt tall, about 64 pt wide, `#E1050B` (Faves: `brand`), white bold label. |
| Plan prompt between rows | `plans/google-maps/promo_video_ask_maps_sheet_suggestions.png` (already in the catalog) | Keep the existing Ask Maps prompt card exactly as built; it sits between two video rows like any other row. | See "Plan builder prompt" in `docs/design_system.md`. |
| Itinerary stop video tile | `video/youtube/appstore_05_playlist_rows_thumb_duration.jpg` | YouTube's playlist row: clip thumbnail left with the length badge bottom-right and the watched bar at its bottom, text right, "⋮" far right. Faves crops the thumbnail to the 2:3 YouTube Shorts card shape so vertical clips fit, and keeps YouTube's thumbnail height. Tap opens the full-screen viewer at that stop. | Thumbnail 75 pt tall; 2:3 = 50 x 75 pt (YouTube's own is 134.6 x 75.3 at 16:9), radius 7 pt, 14 pt from the left (or from the time rail), text 16 pt right of it. Badge 4 pt in from right and bottom, 17.5 pt tall, black 80%, white 11 pt semibold ("0:12"). Watched bar 3.4 pt `#FE0000` (Faves: `brand`). Title 13 pt, 2 lines; grey meta line. |
| Full-screen swipe viewer for a day's stops | `video/netflix/appstore_04_clips_vertical_viewer_mute.jpg` | Netflix Clips: one clip per screen, swipe up for the next stop. Title block bottom-left (stop name, meta line, one-line description with "…more"), a round art circle to its right (Faves: the place photo, opens the place page), a right rail of three glass circles (mute, save, share), a 2 pt progress bar right above the tab bar. | Rail circles 48 pt, pitch 64 pt, white about 20% fill, icons 22 pt, rail 28 pt from the right edge. Title white bold 19 pt, 17.4 pt from the left; meta white semibold 11.5 pt ("Stop 2 of 5 · 10 min walk"); description white 13 pt + bold "…more". Art circle 71 pt, thin white ring. Progress bar 2 pt, full width, played `#A5A5A5`, unplayed `#2D2729`. |
| Place page hero video with mute control (replaced 2026-10-24 by the full-screen player, see "Place page as a full-screen player") | `video/netflix/appstore_02_title_page_trailer_hero.jpg` (+ the mute icon from `appstore_04`) | Netflix's title page: the clip plays muted, full width, directly under the status bar; round dark buttons in its top-right corner. Faves puts ✕ (or back) and share there, and the mute button in the hero's bottom-right corner in the same 30 pt dark circle, with Netflix Clips' speaker-× icon. Tap the hero to open the full-screen viewer. | Hero 393 x 212 pt (1.85:1), black status area above. Buttons 30 pt circles, near-black fill, white icons, 44 pt center to center, 10 pt from the video's top, ✕ 28 pt from the right edge. Mute: same 30 pt circle, 10 pt from the hero's bottom and 28 pt from its right edge. |
| Fallback when a spot has no clip | `video/netflix/yt_PXo3QCmgWB4_t051_...` (Trending Now) + `moments/instagram/yt_q2ASzVtL0YE_t080_location_page_top_recent_grid.png` | Netflix rows mix titles freely: a still poster sits in the exact same card frame as everything else. Faves shows the spot's best photo in the same 9:16 frame, same radius and overlay. Instagram's rule marks the difference: only video tiles carry the reel glyph top-right; photo tiles carry none. | Same card size, radius and title overlay as the row. Reel glyph about 24 pt white, top-right, on clip cards only. No play button and no length badge on a photo. |
| Small poster line on a video card | `video/tiktok/appstore_14_for_you_rail_handle_sound.png` (content) + `video/youtube/yt_Y6V9qRAan6U_t100_home_shorts_shelf.png` (size) + the initial disc from `video/tiktok/yt_XDmV5t6Y-0Y_t061_...` | TikTok's bottom-left username line, scaled to the YouTube Shorts card text: every clip reads as a Faves user's post. On a card: the title, then the disc and "@handle" under it. In the full-screen viewer: disc, "@handle" and "· 2w ago". No platform name anywhere (Morgan, 2026-10-24). | Card: white regular 12 pt (YouTube card text size), one line, truncate with "…", same 7 pt left inset, sits under the title inside the bottom gradient. Viewer: handle white semibold 16 pt, second line white regular 14 pt, 22 pt from the left, above the progress bar. |

---

# Place page as a full-screen player: UI reference catalog

Captured 2026-10-24 after Morgan's note on the place page ("i dont like how this looks like google maps"). The place page becomes a full-screen vertical player, dark like Home; Spot Moments becomes a location page with a grid; details move into a dark sheet. Images are in `references/video/tiktok/` (local only). Every frame below was opened and looked at, and every number was measured with PIL on the saved file.

| File | What it shows | Scale |
|---|---|---|
| `yt_l4HrrhqS7NY_t045_video_location_anchor_caption_rail.png` | TikTok iPhone screen recording, a video opened from search: location anchor above the username, caption, right rail, progress line, black "Add comment..." bar | 666 x 1440 px for 390 x 844 pt = 1.71 px/pt |
| `yt_l4HrrhqS7NY_t055_location_page_reviews_posts_favorite.png` | TikTok's location (POI) page: name, rating line, category chip with "More", address with a round directions button, Reviews with "View all", Posts grid, bottom bar "37 favorited / Share / Favorite" | 1.71 px/pt |
| `yt_l4HrrhqS7NY_t029_grid_play_counts.png` | TikTok's 3-column grid: 3:4 tiles, 1 pt gutters, play counts bottom left, red "Pinned" labels top left | 1.71 px/pt |
| `yt_XDmV5t6Y-0Y_t061_comments_sheet_tabs_add_comment.png` | TikTok's comments sheet on iPhone: tabs with counts, filter and close, comment rows with initial discs, "Add comment..." bar | 484 x 1080 px for 390 x 870 pt = 1.24 px/pt |
| `yt_a3cZ5jYXnnc_t058_dark_mode_tokens.png` | TikTok in dark mode (settings screen): page, primary and secondary text colors, TikTok red | 498 px wide for 393 pt = 1.27 px/pt |
| `../../moments/tiktok/appstore_05_camera_record_button.png` (already in the catalog) | TikTok's record button: red disc in a lighter red ring | App Store frame |
| `../../moments/tiktok/press_02_local_feed_grid_place_video.jpg` (already in the catalog) | TikTok's photo-mode "1/7" counter top right, the place pill on a video | press image |

## 1. The player (place page)

From `t045`: video full screen under the status bar; the black bottom bar starts at 765 pt (79 pt tall with the home indicator) and holds the "Add comment..." pill: 37 pt tall, fully rounded, `#363336` on near-black `#020002`, 12 pt side margins, placeholder light grey 15 pt. The progress line is 2 pt, 3 pt above the video's bottom, 12 pt side margins, played white with a 6 pt scrub dot.

Caption block, 12 pt from the left, bottom about 10 pt above the video's bottom:
- Location anchor: 26 pt tall, 4 pt radius, translucent dark fill (`#3B3638` measured over the video), an 18 pt green square `#40B49A` with a white pin, label 13 pt white ("Mount Apo White Boulders · Davao City"). 688 pt from the top (center).
- Username: about 17 pt bold white with "· 1d ago" in grey after it. 720 pt (center).
- Caption: 15 pt white regular, one line here. 747 pt (center).

Right rail, centered 29 pt from the right edge:
- Avatar 44 pt with a 1 pt white ring, its top at 398 pt; a 20 pt red `#FE2C55` plus centered on its bottom edge.
- Heart (top 470 pt), comment bubble (530 pt), bookmark (593 pt), share arrow (651 pt): glyphs about 27 to 30 pt, white; counts 13 pt semibold white, 3 pt under the glyph. About 60 pt per item.

Top right in photo mode (`press_02`): "1/7" white 13 pt semibold.

## 2. The comments sheet (details)

From `t061` (1.24 px/pt): the sheet's top is at 278 pt (the video shrinks into the space above), radius about 10 pt, white in light mode. Tab row 44 pt: "Comments 1" black 14 pt semibold, "Likes 2" and "Views 1" grey `#8A8A8A`, 16 pt apart, the active tab underlined 2 pt black as wide as its label; a filter glyph and an 18 pt × at the right; a hairline under the row. Comment rows: 32 pt initial disc 10 pt from the left (teal `#0299A8` "M", green `#2E6716` "m"), name grey `#7A7A7A` 13 pt with "· Creator" in teal, text 15 pt black, then "3d ago" grey `#A4A4A4` 12 pt and a bold grey "Reply"; heart `#FE2A56` with its count at the right. The "Add comment..." bar is pinned to the bottom: your 32 pt disc, then a 36 pt pill `#F1F1F1`.

Dark mode (`t058`): page `#111111`, primary text `#F8F8F8`, secondary `#959595`, captions `#878787`, red `#FF3B5F` (TikTok red `#FE2C55` after compression).

## 3. The location page and grid (Spot Moments)

From `t055` and `t029` (1.71 px/pt): back chevron and a faded title in the 44 pt nav; name 26 pt heavy, 16 pt from the left; rating line 15 pt ("★ 5.0 on TikTok (276 reviews) ›"); grey chip `#F1F1F2`, 3 pt radius, 13 pt, with "More ›" 15 pt grey at the right; address 15 pt grey with a 36 pt round directions button at the right; 8 pt grey bands between sections; section titles 17 pt bold; one review row and a full-width 38 pt "View all" button (4 pt radius). Posts: 3 columns, 1 pt gutters, tiles 3:4 (220 x 295 px), play count bottom left (outline play glyph + 13 pt semibold white, 6 pt in), red "Pinned" label top left (2 pt radius, 12 pt semibold white, 5 pt in). Bottom bar: "37 favorited" 15 pt at the left, a grey Share button and a red Favorite button (40 pt tall, 4 pt radius, icon + 15 pt semibold).

Record button (`appstore_05`): a red disc in a translucent red ring, the disc about 78% of the ring.

## Element map for Faves (place page)

| Element | Copy this | Faves | Measured values |
|---|---|---|---|
| Place page | `t045` | The spot's clips fill the screen, muted and looping; swipe up through its other clips, then posts from this phone, then its photos (slow zoom when there is no clip) | Pages fill the screen above the bottom bar; scrim over the bottom 300 pt |
| Location anchor | `t045` | "Spot Moments · 3 posts", opens the Spot Moments page | 26 pt, 4 pt radius, 18 pt `#40B49A` pin square, 13 pt white |
| Name line | `t045` username | The spot's name 17 pt bold, the Locals Score as a small green pill where TikTok puts "· 1d ago" | Pill 18 pt tall, 3 pt radius (the "Pinned" label shape), Home's score green `#7FE0B0`, 12 pt heavy dark text |
| Caption lines | `t045` caption | "City park · Free · Russian Hill"; "Open · Closes 12 AM" (open green `#7FE0B0`, closed orange `#FC8C00`); one real Reddit quote with "r/AskSF"; the poster's line (initial disc, @handle, "· 1y ago · Taken here") | 15 pt white; quote 14 pt, 2 lines; poster 13 pt semibold |
| Right rail | `t045` rail | Avatar slot: the spot's photo with the red plus = Add to a day; comment bubble with the quote count = What locals say; bookmark = Save; share arrow = Share; navigate = Go | 44 pt avatar, 20 pt plus, 30 pt glyphs, 13 pt semibold labels, centered 29 pt from the right |
| Progress line | `t045` | Plays over each clip's length and loops | 2 pt, 3 pt above the bottom, 12 pt margins, 6 pt dot |
| Bottom bar | `t045` "Add comment..." | "Been here? Rank it" opens the rank flow | 37 pt pill `#363336` on black |
| Counter | `press_02` "1/7" | "1/3" when a spot has more than one page | 13 pt semibold white, top right |
| Details sheet | `t061` + `t058` | Tabs "Locals say 3 / Details / Scores"; Reddit quotes as comment rows; visit facts as rows; the score breakdown (Google, Yelp, Reddit, TikTok); "Been here? Rank it" in the "Add comment..." bar | Top at 278/844 of the screen, 10 pt radius, `#110F15` (Home), text `#F8F8F8`, grey `#959595`, 2 pt underline, 32 pt discs |
| Initial disc | `t061` | Every clip's poster and you: the first letter on a colored disc | Teal `#0299A8`, green `#2E6716`, plus the Faves pink; white letter |
| Spot Moments page | `t055` | Dark; name, Locals Score line, kind chip with "More ›" (opens Details), address with directions, What locals say with "View all", Posts with Highlights / Right now tabs | As measured in section 3, colors from `t058` and Home |
| Post tiles | `t029` | 3:4 tiles of clips and photos; play counts; "Taken here" in the "Pinned" label; a photo glyph on photos | 1 pt gutters, 13 pt counts, 12 pt label |
| Bottom bar | `t055` + `appstore_05` | The record button with "Post a moment" and the be-here line ("You're here" / "Be here to post"), Share (grey), Save (red) | Ring 44 pt, disc 34 pt `#FE2C55`; buttons 40 pt, 4 pt radius |
