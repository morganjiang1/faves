# Faves design system

Every value here comes from a measured reference in `docs/design_references.md`. Where references disagree, Beli wins: it is the closest product to Faves and the reference the social catalog picked for color ("it reads as taste rather than delivery").

## Color

From Beli (`social/beli/appstore_06_profile_stats.png`, `appstore_03_feed_post_ranked_share.png`) unless noted.

| Token | Value | Use | Source |
|---|---|---|---|
| `bg` | `#FFFFFF` | screens | Beli |
| `brand` | `#134452` | primary buttons, tab "+", selected toggles | Beli teal |
| `brandDeep` | `#004F5E` | stat values, links on light | Beli |
| `score` | `#009C61` | Locals Score number | Beli score circle |
| `text` | `#222427` | body text | Beli |
| `textMuted` | `#989AA3` | meta lines, labels | Beli |
| `border` | `#D3D3D3` | score ring, avatar ring | Beli |
| `hairline` | `#E5E5E5` | card borders, dividers | Beli |
| `field` | `#EBE8EC` | text field fill | Beli |
| `chipOff` | `#F3F3F3` | unselected occasion chip | Uber Eats (`social/ubereats/appstore_07`) |
| `chipOn` | `#000000` | selected occasion chip | Uber Eats |
| `like` | `#F90B0C` | heart / like | Beli |
| `gem` | `#A571ED` | hidden-gem vibe dot | Corner (`discovery/corner/corner_ai_search_results_hidden_gem_cards.png`) |
| `open` | `#188438` | "Open" status | Google Maps |
| `closed` | `#CE4E07` | "Closed" status | Corner |
| `rateGreat` / `rateOk` / `rateBad` | `#8CC3A7` / `#F6CB68` / `#EFABAD` | "How was it?" circles | Beli |
| `sectionBand` | `#F7F7F7` | 6 pt band between home sections | DoorDash |

## Type

- **Headings:** Playfair Display (read from Beli's site CSS; Beli's comparison cards and empty states use a serif bold).
- **Body:** the iOS system font (Beli's in-app body text), Inter-style system stack on the web.
- **Scale** (DoorDash type tokens): 10, 12, 14, 16, 18, 20, 22, 24, 28, 32.
- Home section titles 24 bold; place names 16 bold; meta 14 regular `textMuted`; chips 16 medium; tab labels 11.

## Components

| Component | Follows | Key values |
|---|---|---|
| Primary button | Beli empty-state CTA (`discovery/beli/beli_empty_been_list_modal_vid.jpg`) | full-width pill, 50 pt, `brand` fill, white label |
| Secondary button | Beli list/map toggle, unselected half (`discovery/beli/beli_appstore_ipad_list_map_toggle.png`) | white, 2 pt `brand` outline |
| Tertiary action | Airbnb "Clear all" (`plans/airbnb/android_video_2025_filters_chips_sheet.png`) | underlined `text` |
| Search / prompt | DoorDash search pill (`social/doordash/appstore2025_02_...`) | white pill ~45 pt, soft shadow, cycling example placeholder |
| Occasion chips | Uber Eats rating chips | 38 pt pills, 8 pt gap |
| Place card | DoorDash deals card (`social/doordash/appstore2025_04_...`) | 2.06:1 photo, 16 bold name, meta line, Locals Score in the rating line |
| Locals Score badge | Beli score circle (`discovery/beli/beli_appstore_05_recs_list_reserve.png`) | 39–40 pt white circle, 1 pt `border`, score ~15 pt semibold `score` |
| Score breakdown | Apple Maps stat strip (`discovery/apple_maps/apple_maps_place_card_waterbar_web.jpg`) | 4 columns: Google / Yelp / Reddit / TikTok |
| Hidden-gem line | Corner (`discovery/corner/...hidden_gem_cards.png`) | gem icon + a number ("only 22 reviews on Google") |
| Place page | Google Maps place sheet (`discovery/google_maps/google_maps_place_page_troys_cafe.png`) | sheet radius ~30, 42 pt action pills, photo collage |
| Bottom sheet | Apple Maps (`plans/apple-maps/appstore_03_nearby_transit_sheet_chips.png`) | native iOS sheet, grabber, inset white cells |
| Plan builder | Airbnb question flow (`plans/airbnb/appstore_07_host_question_flow_cards.png`) | one question per screen, 345×148 option cards, radius 16 |
| Itinerary timeline | Airbnb Trips (`plans/airbnb/appstore_06_trips_day_by_day_timeline.png`) | left time rail, white stop cards radius ~18, 65 pt thumbnail |
| Travel legs | Wanderlog (`plans/wanderlog/appstore_05_itinerary_day_travel_legs.png`) | "5 min walk • 0.4 mi" rows between stops |
| Route map | Wanderlog numbered pins (`plans/wanderlog/appstore_04_...`) | 26×37 teardrop pins, route line ~6 pt at 60% |
| Swap stop | Apple Maps "Change Stop" + Wanderlog recommended rail | search sheet with alternatives on top |
| Group vote | Partiful poll (`plans/partiful/appstore_10_find_a_time_poll_responses.png`) | option cards, Going / Maybe / Can't |
| Share | Partiful share sheet (`plans/partiful/appstore_04_share_link_sheet.png`) | link preview + 4 circles |
| Onboarding | Partiful (`plans/partiful/ios_video_onboarding_*`) | one question per screen |
| Plan loading | Google "Ask Maps" streaming (`plans/google-maps/promo_video_ask_maps_*`) | stops stream in, newest words blue, gradient stroke |
| Feed post | Beli feed post (`social/beli/appstore_03_feed_post_ranked_share.png`) | 60 pt avatar, bold-name headline, photo row, score bubble |
| Likes | Strava kudos (`social/strava/appstore_02_...`) | faces + count |
| "Do this day" | DoorDash "Reorder" pill (`social/doordash/appstore2026_05_order_it_again_reorder.png`) | 25 pt `#F1F1F1` pill |
| Day recap | Strava Year in Sport, one day (`social/strava/yt_e1DDHqJURk4_t026_...`) | one stat per slide, summary card |
| Thumbs up / down | Uber Eats rating (`social/ubereats/appstore_07_...`) | 62 pt circles |
| Share card | Spotify Wrapped 2025 (`social/spotify/wrapped2025_newsroom_summary_share_cards.png`) | 9:16, 4 color versions |
| Profile | Beli profile (`social/beli/appstore_06_profile_stats.png`) | 96 pt avatar, 3-column stats, Rank / Streak cards |
| "Which did you like more?" | Beli rank flow (`discovery/beli/beli_rank_3_which_do_you_prefer_vid.jpg`) | two 167×166 cards with an "OR" disc |
| Tab bar | Beli (`social/beli/yt_GlMma4eXe18_t174`) | 5 tabs, filled "+" center: Home, Feed, Plan, Saved, Profile |
| Empty states | Beli (`discovery/beli/beli_empty_been_list_modal_vid.jpg`) | line art on a soft blob, serif title, pill CTA |
| Spot Moments (place page) | Instagram location page (`moments/instagram/yt_q2ASzVtL0YE_t080_location_page_top_recent_grid.png`) | tabs Highlights / Right now, 2.4 dp × 78 dp underline under the active label; 3-column 1:1 grid, 1.6 dp gutters, reel glyph top-right |
| Moment viewer | Instagram story viewer (`moments/instagram/appstore_07_story_viewer_close_friends.png`) | 9:16 media, 2 pt progress bar, avatar + name + "2h", 18 pt ✕; 280×45 pt outlined reply pill |
| "Taken here" stamp | BeReal location pill (`moments/bereal/yt_KXVIqgEsm64_t012_post_location_pill_3h_late.png`) | full-radius pill ~30 pt, arrow glyph + bold place name, under the caption; grey "3h late" style time under the name |
| Post a moment | BeReal camera (`moments/bereal/yt_FMZgxjwSkfo_t030_camera_photo_video_shutter.png`) | 3:4 viewfinder, "1x" chip, VIDEO / PHOTO labels, 77.6 pt ring shutter with a 61.6 pt disc |
| Be here to post | BeReal "Share to view" (`moments/bereal/appstore_05_share_to_view_post_a_bereal.png`) | blurred content, eye-slash icon, bold title + one line, white 117×35 pt button radius 11 |
| Wallet summary | Ibotta Earnings (`wallet/ibotta/appstore_05_earnings_withdraw_transactions.png`) | bordered box: 41 pt `brand` "Lifetime" band, ~47 pt bold balance; 343×40 pt `brand` pill 30 pt below |
| Earnings row | Ibotta transaction row (same file) | 70.5 pt pitch, 33 pt circle, bold name + bold amount right, 1 pt `#E8E8E8` inset divider |
| Payout screen | Venmo Transfer Balance (`wallet/venmo/yt_wHGzOIg7ayA_t043_instant_selected_fee.png`) | huge amount, two 172×160 pt method cards (58 pt icon circle), Fee row, "Transfer to" row |
| Payout method rows | Rakuten (`wallet/rakuten/appstore_05_choose_how_you_get_paid.png`) | 333×93 pt cards, 1 pt `#DDDDDD`, radius 7, 17 pt gap; `brand` "Select" link, green "✓ Selected" |
| Payout confirm | Venmo pill + DoorDash Fast Pay label (`wallet/doordash-dasher/yt_QtNGm8n4OdE_t023_fast_pay_confirm.png`) | 47 pt full-width `brand` pill, amount in the label ("Cash out $12.40"), arrival note above |
| Plus paywall | Meetup+ (`paywall/meetup/paywallscreens_02_weekly_yearly_rows_free_trial.png`) | check list (18.7 pt circles), 355×75 pt trial card, two 355×65 pt plan rows radius 16, MOST POPULAR badge, 62 pt CTA |
| Paywall legal line | Timeleft (`paywall/timeleft/paywallscreens_01_unlimited_dinners_plan_cards.png`) | ~11 pt, 13 pt line pitch, centered above the CTA, "Terms" underlined, "Restore" under the CTA |
| Offline banner | Spotify (`states/spotify/yt_6wqjRrRBzTQ_t013_offline_bar_above_tab_bar.png`) | full-width dark bar on top of the tab bar, one bold centered line |
| Error + retry | TikTok (`states/tiktok/yt_spo0PbcgeOo_t004_no_internet_tap_to_retry.png`) | centered retry icon, bold line with the fix, grey helper line; whole block is the tap target |
| Loading skeleton | Instagram (`states/instagram/yt_q2ASzVtL0YE_t089_loading_pill_skeleton_rows.png`) | `#F8F8F8` on white: 58 dp circle, ~10 dp round-end bars, 378×121 dp block; no spinner |
| No results | Yelp (`discovery/yelp/yelp_empty_no_results_android_vid.png`) | headline, one helper line, suggestion chips, "Add a spot" prompt |
