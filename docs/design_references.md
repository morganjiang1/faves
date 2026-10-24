# Faves design references

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
