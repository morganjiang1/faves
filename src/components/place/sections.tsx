// Place page sections.
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Moment, Place } from "@/data/types";
import { dayHoursText, statusAt, weekLines } from "@/lib/hours";
import { openUrl } from "@/lib/links";
import { compact, costOf, scoreOutOf10, signalCount } from "@/lib/score";
import { formatClock, timeAgo, DAY_NAMES } from "@/lib/time";
import { color, font } from "@/theme/tokens";
import { Icon, PlaceImage, ScoreBadge, T, type IconName } from "../ui";

// --- Spot Moments: Instagram's location page tabs ("Top / Recent" -> "Highlights / Right now")
// and its 3-column edge-to-edge grid of square tiles with a reel glyph.
export function MomentsSection({ place, mine, canPost, onPost }: { place: Place; mine: Moment[]; canPost: boolean; onPost: () => void }) {
  const [tab, setTab] = useState<"highlights" | "now">("highlights");
  const dayAgo = Date.now() - 24 * 3600_000;
  const highlights = [...mine, ...place.moments].sort((a, b) => b.likes - a.likes);
  const now = mine.filter((m) => m.postedAt && new Date(m.postedAt).getTime() > dayAgo);
  const list = tab === "highlights" ? highlights : now;
  const open = (i: number) => router.push(`/moments/${encodeURIComponent(place.id)}?tab=${tab}&i=${i}`);
  return (
    <View testID="moments-section" style={{ marginTop: 8 }}>
      <View style={styles.sectionTitleRow}>
        <T v="h2" style={{ fontSize: 22 }}>Spot Moments</T>
        <Text style={styles.sectionHint}>{highlights.length ? `${highlights.length} ${highlights.length === 1 ? "clip" : "clips"} taken here` : "No clips yet"}</Text>
      </View>
      <View style={styles.tabs}>
        {(["highlights", "now"] as const).map((t) => (
          <Pressable key={t} testID={`moments-tab-${t}`} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={styles.tab}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === "highlights" ? "Highlights" : "Right now"}</Text>
            {tab === t ? <View style={styles.tabLine} /> : null}
          </Pressable>
        ))}
      </View>
      {list.length ? (
        <View style={styles.grid}>
          {list.slice(0, 9).map((m, i) => (
            <Pressable key={`${m.source}-${m.id}`} testID={`moment-tile-${i}`} accessibilityLabel={`Moment by ${m.creator}`} onPress={() => open(i)} style={styles.tile}>
              <PlaceImage uri={m.uri && m.kind === "photo" ? m.uri : m.cover ?? place.photos[i % Math.max(1, place.photos.length)] ?? place.image} category={place.category} style={StyleSheet.absoluteFill} />
              <View style={styles.tileGlyph}><Icon name={m.kind === "photo" ? "image" : "play"} size={18} tint="#fff" /></View>
              {m.source === "faves" ? <View style={styles.tileHere}><Icon name="navigate" size={10} tint="#fff" /><Text style={styles.tileHereText}>Taken here</Text></View> : null}
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.momentsEmpty} testID="moments-empty">
          <Text style={styles.momentsEmptyTitle}>{tab === "now" ? "Nothing from the last few hours" : "No moments yet"}</Text>
          <Text style={styles.momentsEmptyBody}>{tab === "now" ? "Right now shows clips from the last 24 hours, so you can see if it's busy or dead tonight." : "Be the first to show what it's really like."}</Text>
        </View>
      )}
      <Pressable testID="post-moment" accessibilityRole="button" onPress={onPost} style={styles.postRow}>
        <View style={styles.postIcon}><Icon name="camera" size={18} tint="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postTitle}>Post a moment from here</Text>
          <Text style={styles.postSub}>{canPost ? "You're here. Clips you post get the Taken here stamp." : "Only clips taken here, while it's open, can be posted."}</Text>
        </View>
        <Icon name="chevron-forward" size={18} tint="#BFBFBF" />
      </Pressable>
      {place.moments.length ? <Text style={styles.credit}>Highlights include public TikTok videos tagged at this place, played through TikTok's embed and credited to each creator.</Text> : null}
    </View>
  );
}

// --- Scores: Beli's "Scores" pairing (circle + one-line meaning) and Apple Maps' stat strip
// for where the score comes from (GOOGLE / YELP / REDDIT / TIKTOK).
export function ScoresSection({ place, subreddit }: { place: Place; subreddit: string }) {
  if (place.unrated) {
    return (
      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        <T v="h2" style={{ fontSize: 22 }}>Scores</T>
        <T v="meta" style={{ marginTop: 6 }}>No ratings yet. This court comes from OpenStreetMap, so it has facts but no reviews.</T>
      </View>
    );
  }
  const cols: { label: string; value: string; sub: string; tint: string; star?: boolean; testID: string }[] = [
    { label: "GOOGLE", value: place.google ? place.google.rating.toFixed(1) : "–", sub: place.google ? `${compact(place.google.count)} reviews` : "not rated", tint: color.appleOrange, star: Boolean(place.google), testID: "src-google" },
    { label: "YELP", value: place.yelp ? place.yelp.rating.toFixed(1) : "–", sub: place.yelp ? `${compact(place.yelp.count)} reviews` : "not listed", tint: color.appleOrange, star: Boolean(place.yelp), testID: "src-yelp" },
    { label: "REDDIT", value: place.reddit.mentions ? `${place.reddit.mentions}` : "–", sub: place.reddit.mentions ? (place.reddit.mentions === 1 ? "mention" : "mentions") : "no mentions", tint: "#FF4500", testID: "src-reddit" },
    { label: "TIKTOK", value: place.tiktok.views ? compact(place.tiktok.views) : "–", sub: place.tiktok.mentions ? "views" : "no posts", tint: "#000", testID: "src-tiktok" },
  ];
  return (
    <View testID="scores-section" style={{ marginTop: 22 }}>
      <View style={{ paddingHorizontal: 16 }}><T v="h2" style={{ fontSize: 22 }}>Scores</T></View>
      <View style={styles.scorePair}>
        <View style={styles.scoreItem}>
          <ScoreBadge score={scoreOutOf10(place.locals)} count={compact(signalCount(place))} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreName}>Locals Score</Text>
            <Text style={styles.scoreMeaning}>How much locals love it</Text>
          </View>
        </View>
        <View style={styles.scoreItem}>
          <ScoreBadge score={scoreOutOf10(place.quality)} size={46} tint={color.brandDeep} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scoreName}>Ratings</Text>
            <Text style={styles.scoreMeaning}>Stars, adjusted for how many rated it</Text>
          </View>
        </View>
      </View>
      <View style={styles.strip}>
        {cols.map((c, i) => (
          <View key={c.label} testID={c.testID} style={[styles.stripCol, i > 0 && styles.stripDivider]}>
            <Text style={styles.stripLabel} numberOfLines={1}>{c.label}</Text>
            <Text style={[styles.stripValue, { color: c.value === "–" ? color.textMuted : c.tint }]}>{c.star ? "★ " : ""}{c.value}</Text>
            <Text style={styles.stripSub} numberOfLines={1}>{c.sub}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.stripNote}>
        {place.reddit.mentions ? `Named ${place.reddit.mentions} ${place.reddit.mentions === 1 ? "time" : "times"} on r/${subreddit}${place.reddit.votes ? ` (${place.reddit.votes} upvotes)` : ""}. ` : ""}
        {place.tiktok.mentions ? `In ${place.tiktok.mentions} TikTok ${place.tiktok.mentions === 1 ? "post" : "posts"}. ` : ""}
        {place.hiddenGem ? "Hidden gem: rated well, loved by locals, light on tourists." : ""}
      </Text>
    </View>
  );
}

// --- What locals say: Corner's review bubbles (round avatar with a light blue ring, #F7FBFE
// bubble, bold name, the quote in its own casual voice), with the source and a link to it.
export function QuotesSection({ place, subreddit }: { place: Place; subreddit: string }) {
  if (!place.quotes.length) return null;
  return (
    <View testID="quotes-section" style={{ marginTop: 22, paddingHorizontal: 16 }}>
      <T v="h2" style={{ fontSize: 22 }}>What locals say</T>
      <View style={{ gap: 14, marginTop: 12 }}>
        {place.quotes.map((q, i) => (
          <Pressable key={i} testID={`quote-${i}`} accessibilityRole="link" onPress={() => openUrl(q.url)} style={styles.quoteRow}>
            <View style={styles.quoteAvatar}><Icon name={q.source === "reddit" ? "logo-reddit" : "logo-tiktok"} size={22} tint={q.source === "reddit" ? "#FF4500" : "#000"} /></View>
            <View style={styles.bubble}>
              <Text style={styles.quoteName}>{q.source === "reddit" ? `r/${subreddit}` : "TikTok"}</Text>
              <Text style={styles.quoteText}>{q.text}</Text>
              <Text style={styles.quoteSource}>Open on {q.source === "reddit" ? "Reddit" : "TikTok"} ›</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// --- Photos: Google Maps' collage (big photo + two stacked, 8 pt gaps, 17 pt radius).
export function PhotoCollage({ place }: { place: Place }) {
  const photos = [place.image, ...place.photos].filter(Boolean) as string[];
  if (!photos.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginTop: 18 }} testID="photo-collage">
      <PlaceImage uri={photos[0]} category={place.category} style={{ width: 268, height: 334, borderRadius: 17 }} />
      {photos.length > 1 ? (
        <View style={{ gap: 8 }}>
          {photos.slice(1, 3).map((u) => <PlaceImage key={u} uri={u} category={place.category} style={{ width: 160, height: 163, borderRadius: 17 }} />)}
        </View>
      ) : null}
      {photos.length > 3 ? <PlaceImage uri={photos[3]} category={place.category} style={{ width: 200, height: 334, borderRadius: 17 }} /> : null}
    </ScrollView>
  );
}

// --- Details: Corner's hours line (status word, today's hours, chevron to the whole week)
// and Google Maps-style info rows for cost, address, phone, website and booking.
export function DetailsSection({ place, day, minute, onDirections, onCall, onReserve }: { place: Place; day: number; minute: number; onDirections: () => void; onCall: () => void; onReserve: () => void }) {
  const [week, setWeek] = useState(false);
  const st = statusAt(place, day, minute);
  const cost = costOf(place);
  return (
    <View testID="details-section" style={{ marginTop: 22 }}>
      <View style={{ paddingHorizontal: 16 }}><T v="h2" style={{ fontSize: 22 }}>Plan your visit</T></View>
      <Pressable testID="hours-row" onPress={() => setWeek((w) => !w)} style={styles.infoRow}>
        <Icon name="time-outline" size={22} tint="#444" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoText}>
            {st.state !== "unknown" ? <Text style={{ fontWeight: "700", color: st.state === "open" ? color.open : color.closed }}>{st.state === "open" ? "open" : "closed"}  </Text> : null}
            {place.hours ? `${DAY_NAMES[day]}: ${dayHoursText(place.hours, day)}` : place.court ? "No posted hours. Public courts are usually open dawn to dusk." : "Hours not listed. Call ahead."}
          </Text>
          {week && place.hours ? (
            <View style={{ marginTop: 8, gap: 4 }}>
              {weekLines(place.hours).map((l, i) => (
                <View key={l.day} style={{ flexDirection: "row" }}>
                  <Text style={[styles.weekDay, i === day && { fontWeight: "700" }]}>{l.day}</Text>
                  <Text style={[styles.weekText, i === day && { fontWeight: "700" }]}>{l.text}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        {place.hours ? <Icon name={week ? "chevron-up" : "chevron-down"} size={18} tint="#666" /> : null}
      </Pressable>
      {place.court ? (
        <InfoRow icon="tennisball-outline" testID="court-row" text={`${place.court.count} ${place.court.sport} ${place.court.count === 1 ? "court" : "courts"}${place.court.surface ? `, ${place.court.surface}` : ""}${place.court.lit ? ", lit at night" : ", no lights"}${place.court.access === "yes" ? ", public" : ""}`} />
      ) : null}
      <InfoRow icon="cash-outline" testID="cost-row" text={cost.label} sub={cost.estimated ? `We estimate about $${cost.perPerson} per person for planning.` : cost.dollars ? "Price level from Yelp" : undefined} />
      {place.address ? <InfoRow icon="location-outline" testID="address-row" text={place.address} action="Directions" onPress={onDirections} /> : <InfoRow icon="location-outline" text={`${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} action="Directions" onPress={onDirections} />}
      {place.phone ? <InfoRow icon="call-outline" testID="phone-row" text={place.phone} action="Call" onPress={onCall} /> : null}
      {place.website ? <InfoRow icon="globe-outline" testID="website-row" text={place.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} action="Open" onPress={() => openUrl(place.website)} /> : null}
      {place.reserveUrl ? <InfoRow icon="calendar-outline" testID="reserve-row" text="Book a table" action="Reserve" onPress={onReserve} /> : null}
      {place.googleUrl ? <InfoRow icon="map-outline" text="See it on Google Maps" action="Open" onPress={() => openUrl(place.googleUrl)} /> : null}
      {place.description ? <Text style={styles.description}>{place.description}</Text> : null}
    </View>
  );
}

function InfoRow({ icon, text, sub, action, onPress, testID }: { icon: IconName; text: string; sub?: string; action?: string; onPress?: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} disabled={!onPress} onPress={onPress} style={styles.infoRow}>
      <Icon name={icon} size={22} tint="#444" />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoText}>{text}</Text>
        {sub ? <Text style={styles.infoSub}>{sub}</Text> : null}
      </View>
      {action ? <Text style={styles.infoAction}>{action}</Text> : null}
    </Pressable>
  );
}

export function openStatusLine(place: Place, day: number, minute: number): { word: string; rest: string; open: boolean | null } {
  const st = statusAt(place, day, minute);
  if (st.state === "unknown") return { word: "", rest: place.court ? (place.court.lit ? "Lit at night" : "Daylight only") : "Hours not listed", open: null };
  return { word: st.word, rest: st.detail, open: st.state === "open" };
}

export const clockText = formatClock;
export { timeAgo };

const styles = StyleSheet.create({
  sectionTitleRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 8 },
  sectionHint: { fontFamily: font.sans, fontSize: 14, color: color.textSub },
  tabs: { flexDirection: "row" },
  tab: { flex: 1, alignItems: "center", paddingTop: 8 },
  tabText: { fontFamily: font.sans, fontSize: 18, color: "#44494C", paddingBottom: 9 },
  tabTextOn: { color: "#000", fontWeight: "600" },
  tabLine: { width: 78, height: 2.4, backgroundColor: "#1B181E", borderRadius: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1.6, marginTop: 1 },
  tile: { width: "33.0%", aspectRatio: 1, overflow: "hidden", backgroundColor: "#EEE" },
  tileGlyph: { position: "absolute", top: 6, right: 6 },
  tileHere: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(24,24,28,0.75)", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  tileHereText: { fontFamily: font.sans, color: "#fff", fontSize: 10, fontWeight: "700" },
  momentsEmpty: { paddingHorizontal: 16, paddingVertical: 22, alignItems: "center", backgroundColor: "#FAFAFA" },
  momentsEmptyTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#000" },
  momentsEmptyBody: { fontFamily: font.sans, fontSize: 14, color: color.textSub, textAlign: "center", marginTop: 4 },
  postRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.divider },
  postIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  postTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: "#000" },
  postSub: { fontFamily: font.sans, fontSize: 13, color: color.textSub, marginTop: 1 },
  credit: { fontFamily: font.sans, fontSize: 12, color: color.textMuted, paddingHorizontal: 16, paddingTop: 8 },
  scorePair: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginTop: 12 },
  scoreItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  scoreName: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#000" },
  scoreMeaning: { fontFamily: font.sans, fontSize: 13, color: color.textSub },
  strip: { flexDirection: "row", marginTop: 16, marginHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#EEE" },
  stripCol: { flex: 1, paddingHorizontal: 6, gap: 2 },
  stripDivider: { borderLeftWidth: 1, borderLeftColor: "#E3E3E3" },
  stripLabel: { fontFamily: font.sans, fontSize: 12, fontWeight: "600", color: color.appleLabel },
  stripSub: { fontFamily: font.sans, fontSize: 11, color: color.appleLabel },
  stripValue: { fontFamily: font.sans, fontSize: 20, fontWeight: "600" },
  stripNote: { fontFamily: font.sans, fontSize: 14, color: color.textSub, paddingHorizontal: 16, marginTop: 10, lineHeight: 19 },
  quoteRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  quoteAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: color.quoteRing, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  bubble: { flex: 1, backgroundColor: color.quoteBubble, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: "#E6EEF5" },
  quoteName: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: "#232321" },
  quoteText: { fontFamily: font.sans, fontSize: 15, color: "#232321", marginTop: 2, lineHeight: 20 },
  quoteSource: { fontFamily: font.sans, fontSize: 13, color: color.textSub, marginTop: 6 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },
  infoText: { fontFamily: font.sans, fontSize: 15, color: "#1D1D1D", lineHeight: 20 },
  infoSub: { fontFamily: font.sans, fontSize: 13, color: color.textSub, marginTop: 2 },
  infoAction: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: color.gmapsPrimary },
  weekDay: { fontFamily: font.sans, fontSize: 14, color: "#333", width: 100 },
  weekText: { fontFamily: font.sans, fontSize: 14, color: "#333", flex: 1 },
  description: { fontFamily: font.sans, fontSize: 15, color: "#1D1D1D", lineHeight: 21, paddingHorizontal: 16, paddingTop: 14 },
});
