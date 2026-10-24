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

export function metaLine(p: Place, clock: CityClock, from: LatLng | null): string {
  const bits: string[] = [];
  const d = distanceLabel(from, p);
  if (d) bits.push(d);
  const st = statusAt(p, clock.day, clock.minutes);
  if (st.state !== "unknown") bits.push(st.state === "open" ? (st.detail.startsWith("Closes") ? `Open, ${st.detail.toLowerCase()}` : "Open 24 hours") : st.detail || "Closed");
  const c = costOf(p);
  if (c.dollars) bits.push(c.dollars);
  else if (c.perPerson === 0 && !c.estimated) bits.push("Free");
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

// Beli ranked/recs list row (beli_appstore_05 + beli_ranked_list_numbered_vid): bold name,
// "$$ | Burgers" and hood, grey status line, score circle right, add + bookmark under it.
export function PlaceRow({ place, clock, from, rank, onPress, right, testID }: { place: Place; clock: CityClock; from: LatLng | null; rank?: number; onPress?: () => void; right?: React.ReactNode; testID?: string }) {
  const saved = useStore((s) => s.saved.includes(place.id));
  const c = costOf(place);
  const kind = place.kind ?? place.category;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={place.name} onPress={onPress ?? (() => router.push(`/place/${encodeURIComponent(place.id)}`))} style={styles.row}>
      <PlaceImage uri={place.image} category={place.category} style={styles.rowThumb} emojiSize={24} />
      <View style={{ flex: 1, gap: 2 }}>
        <T v="bodyStrong" numberOfLines={2} style={{ fontSize: 17, fontWeight: "700", color: "#000" }}>{rank ? `${rank}. ` : ""}{place.name}</T>
        <T v="body" numberOfLines={1} style={{ fontSize: 15, color: color.text }}>{c.dollars ? `${c.dollars} | ` : ""}{kind}</T>
        {place.hood ? <T v="body" numberOfLines={1} style={{ fontSize: 15, color: color.text }}>{place.hood}</T> : null}
        <T v="meta" numberOfLines={1} style={{ color: "#989AA2" }}>{metaLine(place, clock, from)}</T>
        {place.hiddenGem ? (
          <View style={[styles.gemRow, { marginTop: 2 }]}>
            <Icon name="diamond-outline" size={13} tint="#000" />
            <Text style={[styles.gemText, { fontSize: 14 }]} numberOfLines={1}>{gemLine(place)}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ alignItems: "center", justifyContent: "space-between", alignSelf: "stretch" }}>
        {place.unrated ? <ScoreBadge score="–" muted size={39} /> : <ScoreBadge score={scoreOutOf10(place.locals)} count={compact(signalCount(place))} tint={color.scoreList} size={39} />}
        {right ?? (
          <Pressable accessibilityLabel={saved ? "Unsave" : "Save"} hitSlop={8} onPress={() => actions.toggleSave(place.id)}>
            <Icon name={saved ? "bookmark" : "bookmark-outline"} size={24} tint={saved ? color.brand : "#000"} />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

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
        <Text style={styles.dayTitle} numberOfLines={2}>{day.plan.title}</Text>
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
  row: { flexDirection: "row", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F7F7FA" },
  rowThumb: { width: 64, height: 64, borderRadius: 6 },
  mostBadge: { position: "absolute", top: 8, left: 8, backgroundColor: color.dashTag, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  dayTitle: { fontFamily: font.sans, color: "#fff", fontSize: 18, lineHeight: 22, fontWeight: "700" },
  daySub: { fontFamily: font.sans, color: "#fff", fontSize: 14, marginTop: 3 },
});
