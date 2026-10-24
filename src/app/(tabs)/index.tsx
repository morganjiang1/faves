// Home, video first, in the order people want on open ("what is there to do this week"):
// Netflix's Top 10 row with outlined rank numerals and 9:16 cards that play a muted clip
// while on screen, the "What are we doing?" plan prompt (DoorDash's search pill with its
// rotating examples, kept from the first Home), plain text occasion chips (Uber Eats),
// then Netflix-style rows of video cards: Tonight, This weekend, the most-done days as
// vertical story cards (YouTube Shorts / Reels), and hidden gems. References:
// references/video/* and docs/design_references.md "Video-first Home and itinerary".
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Chip, ErrorState, Icon, SampleTag, Skeleton } from "@/components/ui";
import { CARD, DayStoryCard, RankCard, STORY, VideoCard, VideoRow } from "@/components/video/cards";
import { ViewportProvider, useViewport } from "@/components/video/viewport";
import { CITY_INDEX } from "@/data/cities";
import type { Place } from "@/data/types";
import { communityDays, type CommunityDay } from "@/lib/community";
import { hiddenGems, thisWeekend, tonight, topTen } from "@/lib/home";
import { closesAt } from "@/lib/hours";
import { formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { useCityClock } from "@/state/device";
import { useStore } from "@/state/store";
import { color, font, shadow } from "@/theme/tokens";

const PROMPTS = ["What are we doing?", "first date in the Mission", "pickleball then hot pot", "rainy day with the kids", "sunset and tacos", "my friend loves Gundam"];
export const OCCASIONS = [
  { id: "date", label: "Date", prompt: "date day: something fun, dinner and a view" },
  { id: "friends", label: "Friends", prompt: "me and 3 friends: something fun, food and drinks" },
  { id: "sports", label: "Sports", prompt: "with friends: pickleball then food" },
  { id: "night", label: "Night out", prompt: "tonight: dinner and drinks with a view" },
  { id: "rainy", label: "Rainy day", prompt: "rainy day: a museum, coffee and something fun" },
  { id: "cheap", label: "Cheap", prompt: "cheap day: a park, tacos and dessert" },
  { id: "daytrip", label: "Day trip", prompt: "all day by car: a hike, lunch and a view" },
];

export default function Home() {
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const name = useStore((s) => s.profile.name);
  const [prompt, setPrompt] = useState(0);
  const [days, setDays] = useState<CommunityDay[] | null>(null);
  const { vp, onScroll, onLayout } = useViewport();

  // DoorDash rotates real example searches in the placeholder.
  useEffect(() => {
    const t = setInterval(() => setPrompt((n) => (n + 1) % PROMPTS.length), 2600);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!city) return;
    setDays(null);
    const t = setTimeout(() => setDays(communityDays(city)), 30);
    return () => clearTimeout(t);
  }, [city]);

  const rows = useMemo(() => {
    if (!city) return null;
    const top = topTen(city);
    const seen = new Set(top.map((p) => p.id));
    const night = tonight(city, new Date(), seen);
    night.places.forEach((p) => seen.add(p.id));
    const weekend = thisWeekend(city, seen);
    weekend.forEach((p) => seen.add(p.id));
    return { top, night, weekend, gems: hiddenGems(city, seen) };
    // Recompute when the hour changes (open now / tonight).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, Math.floor(clock.minutes / 60)]);

  const cityName = CITY_INDEX.find((c) => c.slug === city?.slug)?.name ?? "your city";
  const tonightLine = (p: Place) => {
    if (p.category === "views" && rows?.night.sunset != null) return `Sunset ${formatClock(rows.night.sunset, { compact: true })}`;
    const c = closesAt(p.hours, clock.day, rows?.night.from ?? 1200);
    return c ? `Open till ${formatClock(c, { compact: true })}` : p.hood ?? "";
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      <View style={styles.topRow}>
        <Pressable testID="city-switcher" accessibilityRole="button" accessibilityLabel={`City: ${cityName}`} onPress={() => router.push("/city")} style={styles.location}>
          <Icon name="location-outline" size={22} tint="#000" />
          <Text style={styles.locationText}>{city?.name ?? cityName}</Text>
          <Icon name="chevron-down" size={18} tint="#000" />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 18 }}>
          <Pressable testID="open-wallet" accessibilityLabel="Spot rewards" hitSlop={8} onPress={() => router.push("/wallet")}><Icon name="wallet-outline" size={25} tint="#000" /></Pressable>
          <Pressable testID="open-plus" accessibilityLabel="Faves Plus" hitSlop={8} onPress={() => router.push("/plus")}><Icon name="diamond-outline" size={24} tint="#000" /></Pressable>
          <Pressable testID="open-search" accessibilityLabel="Search" hitSlop={8} onPress={() => router.push("/search")}><Icon name="search" size={24} tint="#000" /></Pressable>
        </View>
      </View>

      <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }} onScroll={onScroll} scrollEventThrottle={64} onLayout={onLayout}>
        <ViewportProvider vp={vp}>
          {status === "error" ? (
            <View style={{ paddingTop: 40 }}><ErrorState body={error ?? "We couldn't load this city."} onRetry={retry} /></View>
          ) : !rows || !city ? (
            <HomeSkeleton />
          ) : (
            <>
              <RowTitle title={`Top 10 this week in ${city.name}`} testID="title-top10" />
              <VideoRow testID="row-top10" data={rows.top} keyOf={(p) => p.id} gap={6} render={(p, i, active) => <RankCard testID={`top10-${i}`} place={p} rank={i + 1} active={active} />} />

              {/* The one plan prompt, with the map one tap away. */}
              <View style={styles.searchRow}>
                <Pressable testID="home-prompt" accessibilityRole="button" accessibilityLabel="What are we doing?" onPress={() => router.push("/builder")} style={[styles.searchPill, shadow.soft]}>
                  <Icon name="sparkles-outline" size={20} tint="#000" />
                  <Text numberOfLines={1} style={[styles.searchText, prompt === 0 && { color: "#000", fontWeight: "600" }]}>{prompt === 0 ? PROMPTS[0] : `"${PROMPTS[prompt]}"`}</Text>
                </Pressable>
                <Pressable testID="open-map" accessibilityLabel="Map" onPress={() => router.push("/explore")} style={[styles.mapButton, shadow.soft]}>
                  <Icon name="map-outline" size={22} tint="#000" />
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {OCCASIONS.map((o) => <Chip key={o.id} testID={`occasion-${o.id}`} label={o.label} onPress={() => router.push(`/builder?q=${encodeURIComponent(o.prompt)}`)} />)}
              </ScrollView>

              {rows.night.places.length ? (
                <>
                  <RowTitle title="Tonight" subtitle={`Open from ${formatClock(rows.night.from, { compact: true })}${rows.night.sunset != null ? `, sunset at ${formatClock(rows.night.sunset, { compact: true })}` : ""}`} onMore={() => router.push("/explore?open=1")} testID="title-tonight" />
                  <VideoRow testID="row-tonight" data={rows.night.places} keyOf={(p) => p.id} render={(p, i, active) => <VideoCard testID={`tonight-${i}`} place={p} active={active} line={tonightLine(p)} />} />
                </>
              ) : null}

              <RowTitle title="This weekend" subtitle="Open Saturday afternoon" onMore={() => router.push("/explore")} testID="title-weekend" />
              <VideoRow testID="row-weekend" data={rows.weekend} keyOf={(p) => p.id} render={(p, i, active) => <VideoCard testID={`weekend-${i}`} place={p} active={active} />} />

              <RowTitle title="Most-done days this week" subtitle={`Popular days in ${city.name}`} onMore={() => router.push("/feed")} testID="more-days" />
              <View style={styles.sampleLine}>
                <SampleTag text="Sample people" />
                <Text style={styles.sampleText}>Real spots, placeholder people until real days are posted</Text>
              </View>
              {days ? (
                <VideoRow testID="row-days" data={days.slice(0, 8)} keyOf={(d) => d.id} gap={10} render={(d, i, active) => <DayStoryCard testID={`day-card-${i}`} day={d} city={city} first={i === 0} active={active} />} />
              ) : (
                <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16 }}>{[0, 1, 2].map((i) => <Skeleton key={i} style={{ width: STORY.w, height: STORY.h }} />)}</View>
              )}

              {rows.gems.length ? (
                <>
                  <RowTitle title={`Hidden gems in ${city.name}`} subtitle="Locals love them, tourists haven't found them" onMore={() => router.push("/explore?gems=1")} testID="more-gems" />
                  <VideoRow testID="section-gems" data={rows.gems} keyOf={(p) => p.id} render={(p, i, active) => <VideoCard testID={`gems-${i}`} place={p} active={active} />} />
                </>
              ) : null}
              <Text style={styles.footer}>{name ? `Made for ${name}. ` : ""}Rankings use Google, Yelp, Reddit and TikTok. Clips are credited to their creators.</Text>
            </>
          )}
        </ViewportProvider>
      </ScrollView>
    </SafeAreaView>
  );
}

function RowTitle({ title, subtitle, onMore, testID }: { title: string; subtitle?: string; onMore?: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} disabled={!onMore} onPress={onMore} style={styles.rowTitle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitleText} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {onMore ? <Icon name="chevron-forward" size={20} tint="#000" /> : null}
    </Pressable>
  );
}

function HomeSkeleton() {
  return (
    <View testID="home-loading" style={{ padding: 16, gap: 14 }}>
      <Skeleton style={{ width: 240, height: 22 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>{[0, 1, 2].map((i) => <Skeleton key={i} style={{ width: CARD.w, height: CARD.h }} />)}</View>
      <Skeleton style={{ height: 46, borderRadius: 23 }} />
      <Skeleton style={{ width: 160, height: 22, marginTop: 10 }} />
      <View style={{ flexDirection: "row", gap: 10 }}>{[0, 1, 2].map((i) => <Skeleton key={i} style={{ width: CARD.w, height: CARD.h }} />)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 },
  location: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#000" },
  rowTitle: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
  rowTitleText: { fontFamily: font.sans, fontSize: 20, fontWeight: "800", color: "#000" },
  rowSub: { fontFamily: font.sans, fontSize: 14, color: color.textSub, marginTop: 2 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 18 },
  searchPill: { flex: 1, height: 46, borderRadius: 23, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  searchText: { fontFamily: font.sans, fontSize: 16, color: color.textSub, flex: 1 },
  mapButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  chipRow: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  sampleLine: { paddingHorizontal: 16, marginTop: -4, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  sampleText: { fontFamily: font.sans, fontSize: 13, color: color.textMuted, flex: 1 },
  footer: { fontFamily: font.sans, fontSize: 12, color: color.textMuted, paddingHorizontal: 16, paddingTop: 22, lineHeight: 17 },
});
