// Video-first Home rows (docs/design_references.md, "Video-first Home and itinerary"):
// - Top 10: Netflix's ranked row (video/netflix/yt_PXo3QCmgWB4_t037): a 100 pt card every
//   132 pt, the first at 36 pt, a ~75 pt outlined numeral (fill = the #110F15 background,
//   2 pt #D0D0D0 stroke) bottom-aligned and drawn over the card's left edge; the card is
//   9:16 (100 x 178) so the spot's clip fits.
// - Regular rows: Netflix's row rhythm with YouTube Shorts' card overlay
//   (video/youtube/yt_Y6V9qRAan6U_t100): 110 x 196 pt, radius 6, 8 pt gap, 12 pt margin,
//   gradient over the bottom, white 12 pt title, then the @handle credit line (TikTok).
// - Most-done days: Netflix's tall "Only on Netflix" card (t051): 154 x 274 pt with the corner
//   flag and the bottom pill in the brand color.
// Only clip cards carry Instagram's reel glyph; photo fallbacks sit in the same frame bare.
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { type ReactElement } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Text as SvgText } from "react-native-svg";
import type { City, Place } from "@/data/types";
import type { CommunityDay } from "@/lib/community";
import { scoreOutOf10 } from "@/lib/score";
import { color, font } from "@/theme/tokens";
import { Icon, SampleTag } from "../ui";
import { SpotMedia, clipFor } from "./SpotMedia";
import { useRowVisible, useVisibleItems } from "./viewport";

export const DARK = { bg: "#110F15", text: "#FFFFFF", sub: "#A3A3A3" };
export const TOP = { w: 100, h: 178, pitch: 132, first: 36, radius: 2.5 };
export const CARD = { w: 110, h: 196, radius: 6, gap: 8, margin: 12 };
export const STORY = { w: 154, h: 274, radius: 4 };

// A horizontal row whose on-screen cards play.
export function VideoRow<T>({ data, keyOf, render, gap = CARD.gap, testID, inset = CARD.margin }: { data: T[]; keyOf: (t: T) => string; render: (t: T, index: number, active: boolean) => ReactElement; gap?: number; testID?: string; inset?: number }) {
  const row = useRowVisible();
  const items = useVisibleItems();
  return (
    <View onLayout={row.onLayout} testID={testID}>
      <FlatList
        horizontal
        data={data}
        keyExtractor={keyOf}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: inset, gap }}
        onViewableItemsChanged={items.onViewableItemsChanged}
        viewabilityConfig={items.viewabilityConfig}
        renderItem={({ item, index }) => render(item, index, row.visible && items.ids.has(keyOf(item)))}
      />
    </View>
  );
}

const openPlace = (p: Place) => router.push(`/place/${encodeURIComponent(p.id)}`);

function Overlay({ place, line, small, top }: { place: Place; line?: string; small?: boolean; top?: boolean }) {
  const clip = clipFor(place.id);
  return (
    <>
      <LinearGradient colors={top ? ["rgba(0,0,0,0.8)", "rgba(0,0,0,0)"] : ["rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]} locations={top ? [0, 0.5] : [0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      {clip ? <View style={top ? styles.reelBottom : styles.reel} pointerEvents="none"><Icon name="play" size={small ? 14 : 18} tint="#fff" /></View> : null}
      <View style={top ? styles.textTop : styles.text} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>{place.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {place.unrated ? "" : <Text style={styles.score}>{scoreOutOf10(place.locals)} </Text>}
          {line ?? place.hood ?? place.kind ?? ""}
        </Text>
        {clip?.creator ? <Text style={styles.handle} numberOfLines={1}>{clip.creator}</Text> : null}
      </View>
    </>
  );
}

// Netflix draws the numeral over the card's left edge: 8.5 pt for "1", 16 pt for the
// rounder digits and about 58 pt for "10".
const OVERLAP: Record<number, number> = { 1: 8.5, 10: 58 };

export function RankCard({ place, rank, active, testID }: { place: Place; rank: number; active: boolean; testID?: string }) {
  const overlap = OVERLAP[rank] ?? 16;
  const numW = TOP.pitch - TOP.w + overlap;
  return (
    <View style={{ width: TOP.pitch, height: TOP.h }} testID={testID}>
      <SpotMedia place={place} active={active} radius={TOP.radius} credit={false} style={{ position: "absolute", left: TOP.pitch - TOP.w, top: 0, width: TOP.w, height: TOP.h }} onPress={() => openPlace(place)}>
        {/* The numeral covers the card's bottom left, so the name sits at the top. */}
        <Overlay place={place} small top />
      </SpotMedia>
      <View pointerEvents="none" style={{ position: "absolute", left: 0, bottom: -2, width: numW, height: 92, overflow: "visible" }}>
        <Svg width={numW} height={92} style={{ overflow: "visible" }}>
          <SvgText x={numW} y={88} textAnchor="end" fontSize={104} fontWeight="900" fontFamily={Platform.select({ web: "-apple-system, 'Helvetica Neue', Arial, sans-serif", default: undefined })} fill={DARK.bg} stroke="#D0D0D0" strokeWidth={2} letterSpacing={rank === 10 ? -10 : 0}>
            {String(rank)}
          </SvgText>
        </Svg>
      </View>
    </View>
  );
}

export function VideoCard({ place, active, line, testID }: { place: Place; active: boolean; line?: string; testID?: string }) {
  return (
    <SpotMedia testID={testID} place={place} active={active} radius={CARD.radius} credit={false} style={{ width: CARD.w, height: CARD.h }} onPress={() => openPlace(place)}>
      <Overlay place={place} line={line} />
    </SpotMedia>
  );
}

export function DayStoryCard({ day, city, active, first, testID }: { day: CommunityDay; city: City; active: boolean; first?: boolean; testID?: string }) {
  const lead = day.plan.stops.map((s) => city.byId.get(s.placeId)).find(Boolean) ?? null;
  return (
    <SpotMedia testID={testID} place={lead} active={active} radius={STORY.radius} credit={false} style={{ width: STORY.w, height: STORY.h }} onPress={() => router.push(`/day/${encodeURIComponent(day.id)}`)}>
      <LinearGradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]} locations={[0, 0.2, 0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.storyTag} pointerEvents="none"><SampleTag /></View>
      {first ? (
        <View style={styles.flag} pointerEvents="none"><Text style={styles.flagText}>#1</Text></View>
      ) : null}
      <View style={[styles.text, { bottom: 24 }]} pointerEvents="none">
        <Text style={[styles.title, { fontSize: 16, lineHeight: 19 }]} numberOfLines={2}>{day.plan.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>{day.plan.stops.length} stops · {day.author.name}'s day</Text>
      </View>
      <View style={styles.pill} pointerEvents="none"><Text style={styles.pillText} numberOfLines={1}>Done {day.doneCount}</Text></View>
    </SpotMedia>
  );
}

const styles = StyleSheet.create({
  text: { position: "absolute", left: 7, right: 7, bottom: 10, gap: 2 },
  title: { fontFamily: font.sans, color: "#fff", fontSize: 12.5, lineHeight: 15, fontWeight: "800" },
  meta: { fontFamily: font.sans, color: "rgba(255,255,255,0.9)", fontSize: 11 },
  score: { fontWeight: "800", color: "#7FE0B0" },
  handle: { fontFamily: font.sans, color: "#fff", fontSize: 11, fontWeight: "600", opacity: 0.85 },
  reel: { position: "absolute", top: 6, right: 6 },
  reelBottom: { position: "absolute", bottom: 6, right: 6 },
  textTop: { position: "absolute", left: 7, right: 7, top: 8, gap: 2 },
  storyTag: { position: "absolute", top: 8, left: 8 },
  flag: { position: "absolute", top: 0, right: 0, width: 22.5, height: 30.6, backgroundColor: color.brand, alignItems: "center", justifyContent: "center", borderBottomLeftRadius: 2 },
  flagText: { fontFamily: font.sans, color: "#fff", fontSize: 10, fontWeight: "900" },
  pill: { position: "absolute", bottom: 0, alignSelf: "center", left: (STORY.w - 64) / 2, width: 64, height: 15, backgroundColor: color.brand, borderTopLeftRadius: 2, borderTopRightRadius: 2, alignItems: "center", justifyContent: "center" },
  pillText: { fontFamily: font.sans, color: "#fff", fontSize: 9, fontWeight: "800" },
});
