// A spot's details in a dark bottom sheet that is inspired by TikTok's comments sheet
// (video/tiktok/yt_XDmV5t6Y-0Y_t061_comments_sheet_tabs_add_comment.png, 1.24 px/pt): it rises
// to 278 pt from the top (two thirds of the screen) with a 10 pt top radius and no scrim, so
// the clip keeps playing above it; a 44 pt row of text tabs with counts ("Comments 1 Likes 2
// Views 1": 14 pt semibold, the active one with a 2 pt underline as wide as its label), a
// filter glyph and an 18 pt close at the right, a hairline under it; comment rows with a 32 pt
// initial disc, the name in grey 13 pt, the text in 15 pt, then a grey 13 pt time and a bold
// "Reply"; and the "Add comment..." bar pinned to the bottom (your disc + a 36 pt pill).
// Dark colors are TikTok's dark mode (video/tiktok/yt_a3cZ5jYXnnc_t058_dark_mode_tokens.png:
// text #F8F8F8, grey #959595) on the app's dark page color (#110F15, the Home page).
// Tabs: Locals say (the real quotes, with their source), Details (hours, cost, address,
// phone, website, booking) and Scores (where the Locals Score comes from).
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Place } from "@/data/types";
import { dayHoursText, statusAt, weekLines } from "@/lib/hours";
import { openUrl } from "@/lib/links";
import { compact, costOf, scoreOutOf10, signalCount } from "@/lib/score";
import { DAY_NAMES } from "@/lib/time";
import { color, font } from "@/theme/tokens";
import { Icon, UserDisc, type IconName } from "../ui";

export type DetailsTab = "locals" | "details" | "scores";

export const SPOT_DARK = {
  bg: "#110F15", // the Home page
  text: "#F8F8F8", // TikTok dark mode
  sub: "#959595",
  faint: "#6E6B72",
  line: "rgba(255,255,255,0.1)",
  raised: "#2A282C", // TikTok's "Add comment" pill on black (#363336), a step darker
  green: "#7FE0B0", // Home's score green on dark
  orange: color.appleOrange,
  red: "#FE2C55", // TikTok red (hearts, Favorite, record)
};

export function DetailsSheet({ open, place, subreddit, day, minute, tab: startTab, me, onClose, onDirections, onCall, onReserve, onRank }: {
  open: boolean; place: Place; subreddit: string; day: number; minute: number; tab: DetailsTab; me: string;
  onClose: () => void; onDirections: () => void; onCall: () => void; onReserve: () => void; onRank: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [tab, setTab] = useState<DetailsTab>(startTab);
  useEffect(() => { if (open) setTab(startTab); }, [open, startTab]);
  const quotes = place.quotes;
  const tabs: { id: DetailsTab; label: string }[] = [
    { id: "locals", label: `Locals say${quotes.length ? ` ${quotes.length}` : ""}` },
    { id: "details", label: "Details" },
    { id: "scores", label: "Scores" },
  ];
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Pressable accessibilityLabel="Close details" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View testID="details-sheet" style={[styles.sheet, { height: Math.round(height * (566 / 844)) }]}>
          <View style={styles.tabs}>
            {tabs.map((t) => (
              <Pressable key={t.id} testID={`details-tab-${t.id}`} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} onPress={() => setTab(t.id)} style={styles.tab}>
                <Text style={[styles.tabText, tab === t.id && styles.tabTextOn]}>{t.label}</Text>
                <View style={[styles.tabLine, tab !== t.id && { backgroundColor: "transparent" }]} />
              </Pressable>
            ))}
            <View style={{ flex: 1 }} />
            <Pressable testID="details-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={onClose} style={styles.close}>
              <Icon name="close" size={22} tint={SPOT_DARK.text} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>
            {tab === "locals" ? <LocalsTab place={place} subreddit={subreddit} /> : null}
            {tab === "details" ? <DetailsTabBody place={place} day={day} minute={minute} onDirections={onDirections} onCall={onCall} onReserve={onReserve} /> : null}
            {tab === "scores" ? <ScoresTab place={place} subreddit={subreddit} builtAt={null} /> : null}
          </ScrollView>
          {/* TikTok's "Add comment..." bar: here, rank the spot once you've been. */}
          <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            <UserDisc name={me || "you"} size={32} />
            <Pressable testID="details-rank" accessibilityRole="button" onPress={onRank} style={styles.input}>
              <Text style={styles.inputText}>Been here? Rank it</Text>
              <Icon name="ribbon-outline" size={20} tint={SPOT_DARK.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// --- Locals say: TikTok's comment rows, one per real quote, with where it was said.
function LocalsTab({ place, subreddit }: { place: Place; subreddit: string }) {
  if (!place.quotes.length) {
    return (
      <View style={styles.empty} testID="quotes-empty">
        <Text style={styles.emptyTitle}>No local quotes yet</Text>
        <Text style={styles.emptyBody}>{place.unrated ? "This court comes from OpenStreetMap, so it has facts but no reviews." : `Nobody on r/${subreddit} has named it yet.`}</Text>
      </View>
    );
  }
  return (
    <View testID="quotes-section">
      {place.quotes.map((q, i) => (
        <View key={i} testID={`quote-${i}`} style={styles.comment}>
          <View style={[styles.sourceDisc, { backgroundColor: "#FF4500" }]}><Icon name="logo-reddit" size={19} tint="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.commentName}>r/{subreddit}<Text style={styles.commentTag}>{" · Local"}</Text></Text>
            <Text style={styles.commentText}>{q.text}</Text>
            {q.url ? (
              <Pressable accessibilityRole="link" hitSlop={6} onPress={() => openUrl(q.url)}>
                <Text style={styles.commentMeta}>Open on Reddit</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

// --- Details: the visit facts as rows (icon, text, an action on the right).
function DetailsTabBody({ place, day, minute, onDirections, onCall, onReserve }: { place: Place; day: number; minute: number; onDirections: () => void; onCall: () => void; onReserve: () => void }) {
  const [week, setWeek] = useState(false);
  const st = statusAt(place, day, minute);
  const cost = costOf(place);
  return (
    <View testID="details-section">
      <Pressable testID="hours-row" onPress={() => setWeek((w) => !w)} style={styles.row}>
        <Icon name="time-outline" size={21} tint={SPOT_DARK.sub} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowText}>
            {st.state !== "unknown" ? <Text style={{ fontWeight: "700", color: st.state === "open" ? SPOT_DARK.green : SPOT_DARK.orange }}>{st.state === "open" ? "Open" : "Closed"}  </Text> : null}
            {place.hours ? `${DAY_NAMES[day]}: ${dayHoursText(place.hours, day)}` : place.court ? "No posted hours. Public courts are usually open dawn to dusk." : "Hours not listed. Call ahead."}
          </Text>
          {week && place.hours ? (
            <View style={{ marginTop: 8, gap: 4 }}>
              {weekLines(place.hours).map((l, i) => (
                <View key={l.day} style={{ flexDirection: "row" }}>
                  <Text style={[styles.week, { width: 100 }, i === day && styles.weekToday]}>{l.day}</Text>
                  <Text style={[styles.week, { flex: 1 }, i === day && styles.weekToday]}>{l.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {place.hours ? <Icon name={week ? "chevron-up" : "chevron-down"} size={18} tint={SPOT_DARK.sub} /> : null}
      </Pressable>
      {place.court ? <Row icon="tennisball-outline" testID="court-row" text={`${place.court.count} ${place.court.sport} ${place.court.count === 1 ? "court" : "courts"}${place.court.surface ? `, ${place.court.surface}` : ""}${place.court.lit ? ", lit at night" : ", no lights"}${place.court.access === "yes" ? ", public" : ""}`} /> : null}
      <Row icon="cash-outline" testID="cost-row" text={cost.label} sub={cost.estimated ? `About $${cost.perPerson} per person, our estimate for planning.` : cost.dollars ? "Price level from Yelp" : undefined} />
      <Row icon="location-outline" testID="address-row" text={place.address ?? `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} action="Directions" onPress={onDirections} />
      {place.phone ? <Row icon="call-outline" testID="phone-row" text={place.phone} action="Call" onPress={onCall} /> : null}
      {place.website ? <Row icon="globe-outline" testID="website-row" text={place.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} action="Open" onPress={() => openUrl(place.website)} /> : null}
      {place.reserveUrl ? <Row icon="calendar-outline" testID="reserve-row" text="Book a table" action="Reserve" onPress={onReserve} /> : null}
      {place.description ? <Text style={styles.description}>{place.description}</Text> : null}
    </View>
  );
}

function Row({ icon, text, sub, action, onPress, testID }: { icon: IconName; text: string; sub?: string; action?: string; onPress?: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} disabled={!onPress} onPress={onPress} style={styles.row}>
      <Icon name={icon} size={21} tint={SPOT_DARK.sub} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowText}>{text}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {action ? <Text style={styles.rowAction}>{action}</Text> : null}
    </Pressable>
  );
}

// --- Scores: the Locals Score and where it comes from (Google, Yelp, Reddit, TikTok).
export function ScoresTab({ place, subreddit }: { place: Place; subreddit: string; builtAt: string | null }) {
  if (place.unrated) {
    return (
      <View style={styles.empty} testID="scores-section">
        <Text style={styles.emptyTitle}>No ratings yet</Text>
        <Text style={styles.emptyBody}>This court comes from OpenStreetMap, so it has facts but no reviews.</Text>
      </View>
    );
  }
  const cols: { label: string; value: string; sub: string; star?: boolean; testID: string }[] = [
    { label: "GOOGLE", value: place.google ? place.google.rating.toFixed(1) : "-", sub: place.google ? `${compact(place.google.count)} reviews` : "not rated", star: Boolean(place.google), testID: "src-google" },
    { label: "YELP", value: place.yelp ? place.yelp.rating.toFixed(1) : "-", sub: place.yelp ? `${compact(place.yelp.count)} reviews` : "not listed", star: Boolean(place.yelp), testID: "src-yelp" },
    { label: "REDDIT", value: place.reddit.mentions ? `${place.reddit.mentions}` : "-", sub: place.reddit.mentions ? (place.reddit.mentions === 1 ? "mention" : "mentions") : "no mentions", testID: "src-reddit" },
    { label: "TIKTOK", value: place.tiktok.views ? compact(place.tiktok.views) : "-", sub: place.tiktok.mentions ? "views" : "no posts", testID: "src-tiktok" },
  ];
  return (
    <View testID="scores-section" style={{ paddingTop: 14 }}>
      <View style={styles.scoreHead}>
        <View style={styles.scoreBig}><Text style={styles.scoreBigText}>{scoreOutOf10(place.locals)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scoreName}>Locals Score</Text>
          <Text style={styles.rowSub}>How much locals love it, from {compact(signalCount(place))} ratings and mentions</Text>
        </View>
      </View>
      <View style={styles.strip}>
        {cols.map((c, i) => (
          <View key={c.label} testID={c.testID} style={[styles.stripCol, i > 0 && styles.stripDivider]}>
            <Text style={styles.stripLabel} numberOfLines={1}>{c.label}</Text>
            <Text style={[styles.stripValue, c.value === "-" && { color: SPOT_DARK.faint }]}>{c.star ? "★ " : ""}{c.value}</Text>
            <Text style={styles.stripSub} numberOfLines={1}>{c.sub}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        {place.reddit.mentions ? `Named ${place.reddit.mentions} ${place.reddit.mentions === 1 ? "time" : "times"} on r/${subreddit}${place.reddit.votes ? ` (${place.reddit.votes} upvotes)` : ""}. ` : ""}
        {place.tiktok.mentions ? `In ${place.tiktok.mentions} TikTok ${place.tiktok.mentions === 1 ? "post" : "posts"}. ` : ""}
        {place.hiddenGem ? "Hidden gem: rated well, loved by locals, light on tourists. " : ""}
        Ratings from Google, Yelp and TripAdvisor; local mentions from r/{subreddit} and TikTok.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  sheet: { width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined, backgroundColor: SPOT_DARK.bg, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: "hidden" },
  tabs: { height: 44, flexDirection: "row", alignItems: "flex-end", paddingLeft: 18, paddingRight: 12, gap: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SPOT_DARK.line },
  tab: { alignItems: "stretch" },
  tabText: { fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: SPOT_DARK.sub, paddingBottom: 10 },
  tabTextOn: { color: SPOT_DARK.text },
  tabLine: { height: 2, backgroundColor: SPOT_DARK.text },
  close: { alignSelf: "center", paddingTop: 2 },
  comment: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 4, alignItems: "flex-start" },
  sourceDisc: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  commentName: { fontFamily: font.sans, fontSize: 13, color: SPOT_DARK.sub },
  commentTag: { color: "#2BC4C4", fontWeight: "600" },
  commentText: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: SPOT_DARK.text, marginTop: 2 },
  commentMeta: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: SPOT_DARK.sub, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SPOT_DARK.line },
  rowText: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: SPOT_DARK.text },
  rowSub: { fontFamily: font.sans, fontSize: 13, color: SPOT_DARK.sub, marginTop: 2 },
  rowAction: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: SPOT_DARK.text },
  week: { fontFamily: font.sans, fontSize: 14, color: SPOT_DARK.sub },
  weekToday: { color: SPOT_DARK.text, fontWeight: "700" },
  description: { fontFamily: font.sans, fontSize: 15, lineHeight: 21, color: SPOT_DARK.text, paddingHorizontal: 16, paddingTop: 14 },
  empty: { alignItems: "center", paddingHorizontal: 28, paddingVertical: 36, gap: 6 },
  emptyTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: SPOT_DARK.text },
  emptyBody: { fontFamily: font.sans, fontSize: 14, color: SPOT_DARK.sub, textAlign: "center" },
  scoreHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16 },
  scoreBig: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: SPOT_DARK.green, alignItems: "center", justifyContent: "center" },
  scoreBigText: { fontFamily: font.sans, fontSize: 17, fontWeight: "800", color: SPOT_DARK.green },
  scoreName: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: SPOT_DARK.text },
  strip: { flexDirection: "row", marginTop: 16, marginHorizontal: 16, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: SPOT_DARK.line },
  stripCol: { flex: 1, paddingHorizontal: 6, gap: 2 },
  stripDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: SPOT_DARK.line },
  stripLabel: { fontFamily: font.sans, fontSize: 12, fontWeight: "600", color: SPOT_DARK.sub },
  stripValue: { fontFamily: font.sans, fontSize: 20, fontWeight: "600", color: SPOT_DARK.text },
  stripSub: { fontFamily: font.sans, fontSize: 11, color: SPOT_DARK.sub },
  note: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: SPOT_DARK.sub, paddingHorizontal: 16, marginTop: 10 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SPOT_DARK.line, backgroundColor: SPOT_DARK.bg },
  input: { flex: 1, height: 36, borderRadius: 18, backgroundColor: SPOT_DARK.raised, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 14, paddingRight: 12 },
  inputText: { fontFamily: font.sans, fontSize: 15, color: SPOT_DARK.sub },
});
