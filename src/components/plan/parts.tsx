// Itinerary parts.
// - Timeline and stop cards: Airbnb Trips (appstore_06_trips_day_by_day_timeline.png): day label
//   over a 31 pt gradient date badge, a 1 pt #DDDDDD rail, white cards radius 18 with a soft
//   shadow, a 65 pt thumbnail (radius 14, #F5F2ED), title ~16 pt medium, "5:00 PM · ..." line.
// - Leg rows: Wanderlog (appstore_05_itinerary_day_travel_legs.png): mode glyph #6C757D,
//   "5 min walk • 0.4 mi", caret, "Directions" in #3F52E3, dashed #DEE2E6 trail.
// - Leg mode sheet: Wanderlog (ios_video_leg_mode_sheet_driving_transit_walking.png).
// - Swap sheet: Wanderlog's "Add a place" (ios_video_add_place_sheet_results.png) titled like
//   Apple Maps' "Change Stop" (ios_video_dark_change_stop_search.png), with the "Recommended
//   places" rail (ios_video_day_add_place_recommended.png) on top.
// - Reserve / directions pills inside a stop: Google Maps tonal pills (appstore_04_place_sheet_reserve_order.png).
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { City, Place } from "@/data/types";
import { formatLeg, legFor, metersBetween, type Leg, type Mode } from "@/lib/geo";
import { keywordStrength, type Candidate, type PlanStop } from "@/lib/planner";
import { costOf, scoreOutOf10 } from "@/lib/score";
import { formatClock, formatPillTime } from "@/lib/time";
import { color, font } from "@/theme/tokens";
import { Sheet } from "../Sheet";
import { ActionPill, Icon, PlaceImage, type IconName } from "../ui";
import { StopClip } from "../video/StopClip";

const MODE_ICON: Record<Mode, IconName> = { walk: "walk", transit: "bus", drive: "car", bike: "bicycle" };

export function DateBadge({ dayShort, date }: { dayShort: string; date: number }) {
  return (
    <View style={{ alignItems: "center", width: 44 }}>
      <Text style={styles.dayShort}>{dayShort}</Text>
      <LinearGradient colors={[color.airbnbBadgeA, color.airbnbBadgeB]} style={styles.badge}>
        <Text style={styles.badgeText}>{date}</Text>
      </LinearGradient>
    </View>
  );
}

export function LegRow({ leg, loading, onModes, onDirections, testID }: { leg: Leg; loading?: boolean; onModes: () => void; onDirections: () => void; testID?: string }) {
  return (
    <View style={styles.legRow} testID={testID}>
      <Icon name={MODE_ICON[leg.mode]} size={18} tint={color.wanderMuted} />
      <Pressable accessibilityRole="button" accessibilityLabel="Change how you get there" onPress={onModes} style={styles.legTap}>
        <Text style={styles.legText}>{loading ? "Loading travel time…" : formatLeg(leg)}</Text>
        <Icon name="caret-down" size={12} tint={color.wanderMuted} />
      </Pressable>
      <Pressable accessibilityRole="link" onPress={onDirections} hitSlop={6}><Text style={styles.legLink}>Directions</Text></Pressable>
      <View style={styles.legDash} />
    </View>
  );
}

export function StopCard({ stop, place, index, live, onOpen, onSwap, onPlanB, onDirections, onReserve, planBName, reel, testID }: {
  stop: PlanStop; place: Place; index: number; live?: "now" | "next" | null; onOpen: () => void; onSwap: () => void; onPlanB: () => void; onDirections: () => void; onReserve: () => void; planBName: string | null; reel: string; testID?: string;
}) {
  const cost = costOf(place);
  const role = stop.slot.label === "something to do" ? (place.kind ?? "").toLowerCase() || stop.slot.label : stop.slot.label;
  return (
    <View testID={testID} style={{ gap: 8 }}>
      <View style={[styles.card, live === "now" && styles.cardLive]}>
        {/* The stop's clip (4:5) plays while on screen; tap it for the full-screen viewer. */}
        <View>
          <StopClip testID={`${testID}-clip`} place={place} reel={reel} width={76} height={95} radius={14} />
          <View style={styles.thumbNum} pointerEvents="none"><Text style={styles.thumbNumText}>{index + 1}</Text></View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={place.name} onPress={onOpen} style={{ flex: 1, gap: 3 }}>
          {live ? <Text style={[styles.livePill, live === "next" && { backgroundColor: color.wanderPill, color: color.wanderBlue }]}>{live === "now" ? "Now" : "Up next"}</Text> : null}
          <Text style={styles.cardTitle} numberOfLines={2}>{place.name}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>{formatClock(stop.start)} to {formatClock(stop.end)} · {role}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={styles.timePill}><Text style={styles.timePillText}>{formatPillTime(stop.start)}</Text></View>
            {!place.unrated ? <Text style={styles.score}>{scoreOutOf10(place.locals)}</Text> : null}
            <Text style={styles.cardMeta} numberOfLines={1}>{[cost.dollars ?? (cost.perPerson === 0 && !cost.estimated ? "Free" : null), place.hiddenGem ? "Hidden gem" : null].filter(Boolean).join(" · ")}</Text>
          </View>
        </Pressable>
      </View>
      <Text style={styles.why}>{stop.why}</Text>
      {stop.warnings.map((w) => (
        <View key={w} style={styles.warning}><Icon name="alert-circle-outline" size={15} tint={color.closed} /><Text style={styles.warningText}>{w}</Text></View>
      ))}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <ActionPill small filled testID={`${testID}-directions`} icon="navigate" label="Directions" onPress={onDirections} />
        {place.reserveUrl ? <ActionPill small testID={`${testID}-reserve`} icon="calendar-outline" label="Reserve a table" onPress={onReserve} /> : null}
        {place.category === "culture" || place.category === "night" || place.category === "classes" ? (place.website ? <ActionPill small testID={`${testID}-tickets`} icon="ticket-outline" label="Get tickets" onPress={onReserve} /> : null) : null}
        <ActionPill small testID={`${testID}-swap`} icon="swap-horizontal" label="Swap" onPress={onSwap} />
      </ScrollView>
      {planBName ? (
        <Pressable testID={`${testID}-planb`} onPress={onPlanB} style={styles.planB}>
          <Text style={styles.planBText}>Plan B: <Text style={{ fontWeight: "700" }}>{planBName}</Text></Text>
          <Text style={styles.planBLink}>Use it</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LegModeSheet({ open, onClose, from, to, current, onPick }: { open: boolean; onClose: () => void; from: Place | null; to: Place | null; current: Mode; onPick: (m: Mode) => void }) {
  const rows = from && to ? (["drive", "transit", "walk", "bike"] as Mode[]).map((m) => ({ m, leg: legFor(from, to, m) })) : [];
  const label = { drive: "Driving", transit: "Transit", walk: "Walking", bike: "Biking" } as const;
  return (
    <Sheet open={open} onClose={onClose} title="How are you getting there?" background="#F7FAFA" testID="leg-sheet">
      {rows.map(({ m, leg }) => (
        <Pressable key={m} testID={`leg-mode-${m}`} onPress={() => onPick(m)} style={styles.modeRow}>
          <Icon name={MODE_ICON[m]} size={22} tint="#191E1E" />
          <Text style={[styles.modeLabel, current === m && { fontWeight: "700" }]}>{label[m]}</Text>
          <Text style={styles.modeValue}>{leg.minutes} mins • {leg.miles < 10 ? leg.miles.toFixed(1) : Math.round(leg.miles)} mi</Text>
          {current === m ? <Icon name="checkmark" size={18} tint={color.wanderBlue} /> : <View style={{ width: 18 }} />}
        </Pressable>
      ))}
      <Text style={styles.modeNote}>Estimated from distance and typical city speeds.</Text>
    </Sheet>
  );
}

export function SwapSheet({ open, onClose, city, stop, alternatives, onPick }: { open: boolean; onClose: () => void; city: City; stop: PlanStop | null; alternatives: Candidate[]; onPick: (placeId: string) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    if (!words.length || !stop) return [];
    const near = city.byId.get(stop.placeId);
    return city.places
      .filter((p) => !p.temporarilyClosed && p.id !== stop.placeId && (keywordStrength(p, words) >= 2 || words.every((w) => p.name.toLowerCase().includes(w))))
      .sort((a, b) => (near ? metersBetween(near, a) - metersBetween(near, b) : 0) / 500 - (b.locals - a.locals) / 10)
      .slice(0, 12);
  }, [q, city, stop]);
  return (
    <Sheet open={open} onClose={() => { setQ(""); onClose(); }} title="Swap stop" background="#F7FAFA" testID="swap-sheet">
      <Text style={styles.recHeader}>⌄  Recommended places</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {alternatives.map((c, i) => (
          <Pressable key={c.place.id} testID={`swap-rec-${i}`} onPress={() => onPick(c.place.id)} style={styles.recCard}>
            <PlaceImage uri={c.place.image} category={c.place.category} style={styles.recThumb} />
            <View style={{ flex: 1, padding: 10, gap: 3 }}>
              <Text style={styles.recName} numberOfLines={2}>{c.place.name}</Text>
              <Text style={styles.recMeta} numberOfLines={1}>{c.place.unrated ? "No ratings yet" : `${scoreOutOf10(c.place.locals)} Locals Score`}</Text>
              <Text style={styles.recMeta} numberOfLines={1}>{c.leg ? `${c.leg.minutes} min ${c.leg.mode}` : c.place.hood ?? ""}</Text>
            </View>
            <View style={styles.recAdd}><Icon name="add" size={18} tint="#000" /></View>
          </Pressable>
        ))}
        {!alternatives.length ? <Text style={styles.recEmpty}>No other spots of this kind are open then. Search for one below.</Text> : null}
      </ScrollView>
      <View style={styles.searchField}>
        <TextInput testID="swap-search" value={q} onChangeText={setQ} placeholder="Search any spot" placeholderTextColor="#717474" style={styles.searchInput} />
        {q ? <Pressable accessibilityLabel="Clear" onPress={() => setQ("")} style={styles.clear}><Icon name="close" size={16} tint="#676E73" /></Pressable> : null}
      </View>
      {results.map((p, i) => (
        <Pressable key={p.id} testID={`swap-result-${i}`} onPress={() => { setQ(""); onPick(p.id); }} style={styles.resultRow}>
          <Icon name="location" size={22} tint="#303535" />
          <View style={{ flex: 1 }}>
            <Text style={styles.resultTitle} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.resultSub} numberOfLines={1}>{[p.kind, p.hood, p.unrated ? null : `${scoreOutOf10(p.locals)} Locals Score`].filter(Boolean).join(" · ")}</Text>
          </View>
        </Pressable>
      ))}
      {q.trim().length > 1 && !results.length ? <Text style={styles.recEmpty}>No spots match "{q}". Try another word.</Text> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  dayShort: { fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: color.airbnbText, marginBottom: 4 },
  badge: { width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: font.sans, color: "#fff", fontWeight: "700", fontSize: 14 },
  legRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  legTap: { flexDirection: "row", alignItems: "center", gap: 6 },
  legText: { fontFamily: font.sans, fontSize: 15, color: color.wanderMuted },
  legLink: { fontFamily: font.sans, fontSize: 15, color: color.wanderBlue },
  legDash: { flex: 1, borderBottomWidth: 1.5, borderColor: color.wanderDash, borderStyle: "dashed", marginLeft: 4 },
  card: { flexDirection: "row", gap: 14, backgroundColor: "#fff", borderRadius: 18, padding: 10, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardLive: { borderWidth: 1.5, borderColor: color.airbnbText },
  thumb: { width: 65, height: 65, borderRadius: 14 },
  thumbNum: { position: "absolute", top: -6, left: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: color.dayColor, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  thumbNumText: { fontFamily: font.sans, color: "#fff", fontSize: 11, fontWeight: "800" },
  cardTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: color.airbnbText },
  cardSub: { fontFamily: font.sans, fontSize: 14, color: color.airbnbSub },
  timePill: { backgroundColor: color.wanderPill, borderRadius: 5, paddingHorizontal: 7, height: 19, justifyContent: "center" },
  timePillText: { fontFamily: font.sans, fontSize: 12, fontWeight: "700", color: color.wanderBlue },
  score: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: color.score },
  cardMeta: { fontFamily: font.sans, fontSize: 13, color: color.airbnbSub, flexShrink: 1 },
  livePill: { alignSelf: "flex-start", overflow: "hidden", backgroundColor: "#000", color: "#fff", fontFamily: font.sans, fontSize: 11, fontWeight: "700", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  why: { fontFamily: font.sans, fontSize: 15, lineHeight: 21, color: "#22262A" },
  warning: { flexDirection: "row", alignItems: "center", gap: 6 },
  warningText: { fontFamily: font.sans, fontSize: 13, color: color.closed, flexShrink: 1 },
  planB: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F7F7F7", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  planBText: { fontFamily: font.sans, fontSize: 14, color: "#333", flexShrink: 1 },
  planBLink: { fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: color.wanderBlue, marginLeft: 8 },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, height: 54, borderBottomWidth: 1, borderBottomColor: "#E9ECEC" },
  modeLabel: { fontFamily: font.sans, fontSize: 17, color: "#222525", flex: 1 },
  modeValue: { fontFamily: font.sans, fontSize: 16, color: "#767878" },
  modeNote: { fontFamily: font.sans, fontSize: 13, color: color.textMuted, paddingHorizontal: 18, paddingTop: 10 },
  recHeader: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: "#6B6D6D", paddingHorizontal: 16, paddingBottom: 10 },
  recCard: { width: 270, height: 92, flexDirection: "row", backgroundColor: "#fff", borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "#E4E7EB", borderStyle: "dashed" },
  recThumb: { width: 92, height: 92 },
  recName: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: "#1A1C1C" },
  recMeta: { fontFamily: font.sans, fontSize: 13, color: "#787B7B" },
  recAdd: { position: "absolute", right: 8, bottom: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "#EDEFEF", alignItems: "center", justifyContent: "center" },
  recEmpty: { fontFamily: font.sans, fontSize: 14, color: "#787B7B", paddingHorizontal: 16, paddingVertical: 10, maxWidth: 320 },
  searchField: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 16, marginBottom: 6, height: 44, borderRadius: 10, backgroundColor: "#EDEFEF", paddingLeft: 14, paddingRight: 4 },
  searchInput: { flex: 1, fontFamily: font.sans, fontSize: 17, color: "#1A1C1C", height: 44 },
  clear: { width: 35, height: 35, borderRadius: 18, backgroundColor: "#D8DEDF", alignItems: "center", justifyContent: "center" },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 12 },
  resultTitle: { fontFamily: font.sans, fontSize: 17, color: "#1A1C1C" },
  resultSub: { fontFamily: font.sans, fontSize: 13, color: "#787B7B", marginTop: 1 },
});
