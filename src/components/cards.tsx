// Place and day cards.
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { City, Place } from "@/data/types";
import type { CityClock } from "@/lib/time";
import { distanceLabel, type LatLng } from "@/lib/geo";
import { statusAt } from "@/lib/hours";
import { compact, costOf, gemLine, scoreOutOf10, signalCount, vibeLine } from "@/lib/score";
import type { CommunityDay } from "@/lib/community";
import { actions, useStore } from "@/state/store";
import { color, font } from "@/theme/tokens";
import { Icon, PlaceImage, ScoreBadge, T } from "./ui";

export function metaLine(p: Place, clock: CityClock, from: LatLng | null, withPrice = true): string {
  const bits: string[] = [];
  const d = distanceLabel(from, p);
  if (d) bits.push(d);
  const st = statusAt(p, clock.day, clock.minutes);
  if (st.state !== "unknown") bits.push(st.state === "open" ? (st.detail.startsWith("Closes") ? `Open, ${st.detail.toLowerCase()}` : "Open 24 hours") : st.detail || "Closed");
  const c = costOf(p);
  if (withPrice && c.dollars) bits.push(c.dollars);
  else if (withPrice && c.perPerson === 0 && !c.estimated) bits.push("Free");
  return bits.join(" • ");
}

// DoorDash store card (appstore2025_02 / _04): 2.06:1 photo, teal tag top-left, bold name
// with a heart at the right, grey meta line, rating line (our Locals Score).
export function PlaceCard({ place, clock, from, width = 307, testID }: { place: Place; clock: CityClock; from: LatLng | null; width?: number; testID?: string }) {
  const saved = useStore((s) => s.saved.includes(place.id));
  const tag = place.hiddenGem ? "Hidden gem" : place.localPick ? "Locals pick" : place.moments.length ? `${place.moments.length} moments` : null;
  const gem = gemLine(place);
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={place.name} onPress={() => router.push(`/place/${encodeURIComponent(place.id)}`)} style={{ width }}>
      <View>
        <PlaceImage uri={place.image} category={place.category} style={{ width, height: Math.round(width / 2.06), borderRadius: 4 }} />
        {tag ? (
          <View style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
        ) : null}
      </View>
      <View style={styles.nameRow}>
        <T v="title" numberOfLines={1} style={{ flex: 1 }}>{place.name}</T>
        <Pressable accessibilityLabel={saved ? "Unsave" : "Save"} hitSlop={10} onPress={() => actions.toggleSave(place.id)}>
          <Icon name={saved ? "heart" : "heart-outline"} size={18} tint={saved ? color.dashHeart : "#000"} />
        </Pressable>
      </View>
      <T v="meta" numberOfLines={1} style={{ marginTop: 2 }}>{metaLine(place, clock, from)}</T>
      {gem ? (
        <View style={styles.gemRow}>
          <Icon name="diamond-outline" size={14} tint="#000" />
          <Text style={styles.gemText} numberOfLines={1}>{gem}</Text>
        </View>
      ) : (
        <View style={styles.rating}>
          {place.unrated ? <Text style={styles.ratingMuted}>No ratings yet</Text> : (
            <>
              <Text style={styles.ratingNum}>{scoreOutOf10(place.locals)}</Text>
              <Text style={styles.ratingLabel}>Locals Score</Text>
              <Text style={styles.ratingMuted}>({compact(signalCount(place))})</Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}

// Beli ranked/recs list row (beli_appstore_05_recs_list_reserve + beli_ranked_list_numbered_vid):
// bold name, "$$ | Kind", hood, optional teal reserve button, grey status line with the
// add and bookmark icons at the right, score circle with its count badge top right.
export function PlaceRow({ place, clock, from, rank, onPress, onAdd, testID }: { place: Place; clock: CityClock; from: LatLng | null; rank?: number; onPress?: () => void; onAdd?: () => void; testID?: string }) {
  const saved = useStore((s) => s.saved.includes(place.id));
  const c = costOf(place);
  const kind = place.kind ?? place.category;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={place.name} onPress={onPress ?? (() => router.push(`/place/${encodeURIComponent(place.id)}`))} style={styles.row}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={styles.rowName} numberOfLines={2}>{rank ? `${rank}. ` : ""}{place.name}</Text>
          <Text style={styles.rowLine} numberOfLines={1}>{c.dollars ? `${c.dollars} | ` : ""}{kind}</Text>
          {place.hood ? <Text style={styles.rowLine} numberOfLines={1}>{place.hood}</Text> : null}
          {place.hiddenGem ? (
            <View style={[styles.gemRow, { marginTop: 4 }]}>
              <Icon name="diamond-outline" size={13} tint="#000" />
              <Text style={[styles.gemText, { fontSize: 14 }]} numberOfLines={1}>{gemLine(place)}</Text>
            </View>
          ) : null}
        </View>
        {place.unrated ? <ScoreBadge score="-" muted size={39} /> : <ScoreBadge score={scoreOutOf10(place.locals)} count={compact(signalCount(place))} tint={color.scoreList} size={39} />}
      </View>
      {place.reserveUrl ? (
        <Pressable accessibilityRole="link" onPress={() => router.push(`/place/${encodeURIComponent(place.id)}?reserve=1`)} style={styles.slot}>
          <Text style={styles.slotTop}>Reserve</Text>
          <Text style={styles.slotSub}>TABLE</Text>
        </Pressable>
      ) : null}
      <View style={styles.rowBottom}>
        <Text style={styles.rowMeta} numberOfLines={1}>{metaLine(place, clock, from, false)}</Text>
        <Pressable accessibilityLabel="Add to a day" hitSlop={8} onPress={onAdd ?? (() => router.push(`/builder?place=${encodeURIComponent(place.id)}`))}>
          <Icon name="add-circle-outline" size={27} tint="#000" />
        </Pressable>
        <Pressable accessibilityLabel={saved ? "Unsave" : "Save"} hitSlop={8} onPress={() => actions.toggleSave(place.id)}>
          <Icon name={saved ? "bookmark" : "bookmark-outline"} size={25} tint={saved ? color.brand : "#000"} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// Card titles drop the trailing "in <neighborhood>" when enough title is left ("Saturday in SF" stays).
const shortTitle = (t: string) => {
  const m = t.match(/^(.*) in [^,]+$/);
  return m && m[1].trim().split(/\s+/).length >= 2 ? m[1] : t;
};

// Beli featured-list card (yt_GlMma4eXe18_t160): 165 pt square photo, dark bottom gradient,
// white 2-line title, white sub line. First card carries DoorDash's "#1 Most Liked" badge.
export function DayCard({ day, city, first, size = 165, testID }: { day: CommunityDay; city: City; first?: boolean; size?: number; testID?: string }) {
  const cover = day.plan.stops.map((s) => city.byId.get(s.placeId)).find((p) => p?.image);
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={day.plan.title} onPress={() => router.push(`/day/${encodeURIComponent(day.id)}`)} style={{ width: size, height: size, borderRadius: 8, overflow: "hidden" }}>
      <PlaceImage uri={cover?.image} category={cover?.category ?? "views"} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.72)"]} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
      {first ? <View style={styles.mostBadge}><Text style={styles.tagText}>#1 Most done</Text></View> : null}
      <View style={{ position: "absolute", left: 10, right: 10, bottom: 10 }}>
        <Text style={styles.dayTitle} numberOfLines={2}>{shortTitle(day.plan.title)}</Text>
        <Text style={styles.daySub} numberOfLines={1}>{day.plan.stops.length} stops · done by {day.doneCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: { position: "absolute", top: 8, left: 8, backgroundColor: color.dashTag, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { fontFamily: font.sans, color: "#fff", fontSize: 13, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  rating: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  ratingNum: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: color.score },
  ratingLabel: { fontFamily: font.sans, fontSize: 14, color: "#000" },
  ratingMuted: { fontFamily: font.sans, fontSize: 14, color: color.textSub },
  gemRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  gemText: { fontFamily: font.sans, fontSize: 15, fontStyle: "italic", color: "#000", flexShrink: 1 },
  row: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 6, borderBottomColor: "#F7F7FA", backgroundColor: "#fff" },
  rowName: { fontFamily: font.sans, fontSize: 19, lineHeight: 24, fontWeight: "700", color: "#000" },
  rowLine: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: color.text },
  rowBottom: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 },
  rowMeta: { fontFamily: font.sans, fontSize: 15, color: "#989AA2", flex: 1 },
  slot: { marginTop: 10, width: 79, height: 35, borderRadius: 5, backgroundColor: color.brand, alignItems: "center", justifyContent: "center" },
  slotTop: { fontFamily: font.sans, color: "#fff", fontSize: 13, fontWeight: "600" },
  slotSub: { fontFamily: font.sans, color: "#fff", fontSize: 9, fontWeight: "700", letterSpacing: 0.4 },
  mostBadge: { position: "absolute", top: 8, left: 8, backgroundColor: color.dashTag, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  dayTitle: { fontFamily: font.sans, color: "#fff", fontSize: 18, lineHeight: 22, fontWeight: "700" },
  daySub: { fontFamily: font.sans, color: "#fff", fontSize: 14, marginTop: 3 },
});

// Corner's AI-search result card (corner_ai_search_results_hidden_gem_cards.png): white,
// radius 17, soft shadow, 90 x 131 photo radius 14, bold name, grey hood, purple vibe dot
// line, gem line, "saved N times" pill, white bookmark circle.
export function CornerCard({ place, onPress, testID, savedCount }: { place: Place; onPress?: () => void; testID?: string; savedCount?: number }) {
  const saved = useStore((s) => s.saved.includes(place.id));
  const c = costOf(place);
  const gem = gemLine(place);
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={place.name} onPress={onPress ?? (() => router.push(`/place/${encodeURIComponent(place.id)}`))} style={cornerStyles.corner}>
      <PlaceImage uri={place.image} category={place.category} style={cornerStyles.cornerThumb} emojiSize={36} />
      <View style={{ flex: 1, gap: 4, paddingVertical: 2 }}>
        <Text style={cornerStyles.cornerName} numberOfLines={2}>{place.name}</Text>
        <Text style={cornerStyles.cornerHood} numberOfLines={1}>{[place.hood, c.dollars].filter(Boolean).join(" • ") || place.kind}</Text>
        <View style={cornerStyles.vibe}>
          <View style={cornerStyles.vibeDot} />
          <Text style={cornerStyles.vibeText} numberOfLines={1}>{vibeLine(place)}</Text>
        </View>
        {gem ? (
          <View style={styles.gemRow}>
            <Icon name="diamond-outline" size={14} tint="#000" />
            <Text style={styles.gemText} numberOfLines={1}>{gem}</Text>
          </View>
        ) : (
          <View style={styles.gemRow}>
            <Text style={[styles.ratingNum, { fontSize: 15 }]}>{place.unrated ? "-" : scoreOutOf10(place.locals)}</Text>
            <Text style={[styles.ratingLabel, { fontSize: 15 }]}>Locals Score</Text>
          </View>
        )}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <View style={cornerStyles.savedPill}><Text style={cornerStyles.savedPillText}>{savedCount != null ? `saved ${savedCount} times` : `${compact(signalCount(place))} ${signalCount(place) === 1 ? "rating" : "ratings"}`}</Text></View>
          <Pressable accessibilityLabel={saved ? "Unsave" : "Save"} hitSlop={8} onPress={() => actions.toggleSave(place.id)} style={cornerStyles.cornerBookmark}>
            <Icon name={saved ? "bookmark" : "bookmark-outline"} size={17} tint="#0077FF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const cornerStyles = StyleSheet.create({
  corner: { flexDirection: "row", gap: 12, backgroundColor: "#fff", borderRadius: 17, padding: 12, shadowColor: "#4A5A7A", shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  cornerThumb: { width: 90, height: 131, borderRadius: 14 },
  cornerName: { fontFamily: font.sans, fontSize: 18, lineHeight: 22, fontWeight: "800", color: "#000", letterSpacing: -0.3 },
  cornerHood: { fontFamily: font.sans, fontSize: 16, color: "#868686" },
  vibe: { flexDirection: "row", alignItems: "center", gap: 7 },
  vibeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.gem },
  vibeText: { fontFamily: font.sans, fontSize: 15, color: "#868686", flexShrink: 1 },
  savedPill: { height: 24, borderRadius: 12, backgroundColor: "#EFEFEF", paddingHorizontal: 10, justifyContent: "center" },
  savedPillText: { fontFamily: font.sans, fontSize: 13, color: "#8C8C8C" },
  cornerBookmark: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
});
