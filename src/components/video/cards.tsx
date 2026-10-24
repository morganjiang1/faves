// Video-first Home rows. Netflix's Top 10 row (big outlined rank numerals beside portrait
// cards) and its regular poster rows, with YouTube Shorts / Instagram Reels-style 9:16 cards
// that play a muted clip while on screen (references/video/*, docs/design_references.md
// "Video-first Home and itinerary").
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { type ReactElement } from "react";
import { FlatList, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Text as SvgText } from "react-native-svg";
import type { City, Place } from "@/data/types";
import type { CommunityDay } from "@/lib/community";
import { scoreOutOf10 } from "@/lib/score";
import { color, font } from "@/theme/tokens";
import { SampleTag } from "../ui";
import { SpotMedia } from "./SpotMedia";
import { useRowVisible, useVisibleItems } from "./viewport";

export const CARD = { w: 128, h: 228, radius: 6 };
export const STORY = { w: 150, h: 267, radius: 8 };

// A horizontal row whose on-screen cards play.
export function VideoRow<T>({ data, keyOf, render, gap = 8, testID, inset = 16 }: { data: T[]; keyOf: (t: T) => string; render: (t: T, index: number, active: boolean) => ReactElement; gap?: number; testID?: string; inset?: number }) {
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

function CardText({ place, line }: { place: Place; line?: string }) {
  return (
    <>
      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.cardText} pointerEvents="none">
        <Text style={styles.cardName} numberOfLines={2}>{place.name}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {place.unrated ? "" : <Text style={styles.cardScore}>{scoreOutOf10(place.locals)} </Text>}
          {line ?? place.hood ?? place.kind ?? ""}
        </Text>
      </View>
    </>
  );
}

// Netflix Top 10: the outlined numeral sits behind the card's left edge.
export function RankCard({ place, rank, active, testID }: { place: Place; rank: number; active: boolean; testID?: string }) {
  const numW = rank === 10 ? 104 : 64;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", width: numW + CARD.w - 18 }} testID={testID}>
      <Svg width={numW} height={150} style={{ marginRight: -18 }}>
        <SvgText x={numW - 4} y={140} textAnchor="end" fontSize={150} fontWeight="900" fontFamily={Platform.select({ web: "Helvetica Neue, Arial, sans-serif", default: undefined })} fill="#FFFFFF" stroke="#3B3B3B" strokeWidth={4} letterSpacing={-8}>
          {String(rank)}
        </SvgText>
      </Svg>
      <SpotMedia place={place} active={active} radius={CARD.radius} style={{ width: CARD.w, height: CARD.h }} onPress={() => openPlace(place)}>
        <CardText place={place} />
      </SpotMedia>
    </View>
  );
}

export function VideoCard({ place, active, line, testID, width = CARD.w, height = CARD.h }: { place: Place; active: boolean; line?: string; testID?: string; width?: number; height?: number }) {
  return (
    <SpotMedia testID={testID} place={place} active={active} radius={CARD.radius} style={{ width, height }} onPress={() => openPlace(place)}>
      {place.hiddenGem ? <View style={styles.badge}><Text style={styles.badgeText}>Hidden gem</Text></View> : null}
      <CardText place={place} line={line} />
    </SpotMedia>
  );
}

// A most-done day as a vertical story card: the first stop's clip, the day's title, its size.
export function DayStoryCard({ day, city, active, first, testID }: { day: CommunityDay; city: City; active: boolean; first?: boolean; testID?: string }) {
  const lead = day.plan.stops.map((s) => city.byId.get(s.placeId)).find(Boolean) ?? null;
  return (
    <SpotMedia testID={testID} place={lead} active={active} radius={STORY.radius} style={{ width: STORY.w, height: STORY.h }} onPress={() => router.push(`/day/${encodeURIComponent(day.id)}`)}>
      <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)", "rgba(0,0,0,0)", "rgba(0,0,0,0.8)"]} locations={[0, 0.25, 0.5, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <View style={styles.storyTop} pointerEvents="none">
        {first ? <View style={[styles.badge, { position: "relative", top: 0, left: 0 }]}><Text style={styles.badgeText}>#1 Most done</Text></View> : <View />}
        <SampleTag />
      </View>
      <View style={styles.cardText} pointerEvents="none">
        <Text style={[styles.cardName, { fontSize: 16, lineHeight: 20 }]} numberOfLines={2}>{day.plan.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>{day.plan.stops.length} stops · done by {day.doneCount}</Text>
        <Text style={styles.storyBy} numberOfLines={1}>{day.author.name}'s day</Text>
      </View>
    </SpotMedia>
  );
}

const styles = StyleSheet.create({
  cardText: { position: "absolute", left: 8, right: 8, bottom: 22, gap: 2 },
  cardName: { fontFamily: font.sans, color: "#fff", fontSize: 14, lineHeight: 17, fontWeight: "800" },
  cardMeta: { fontFamily: font.sans, color: "rgba(255,255,255,0.92)", fontSize: 12 },
  cardScore: { fontWeight: "800", color: "#7FE0B0" },
  badge: { position: "absolute", top: 8, left: 8, backgroundColor: color.dashTag, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: font.sans, color: "#fff", fontSize: 11, fontWeight: "700" },
  storyTop: { position: "absolute", top: 8, left: 8, right: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  storyBy: { fontFamily: font.sans, color: "rgba(255,255,255,0.8)", fontSize: 11 },
});
