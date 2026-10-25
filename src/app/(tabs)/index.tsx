// Home, on cream paper: "this week in <city>" as a hand-dealt deck of postcards (each plays
// its clip), the plan prompt with a row of quick starts, your plans as tickets (only when
// there are some), a row for tonight (this weekend when tonight is empty), hidden gems, and a
// link to the days people loved this week.
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Postcard } from "@/components/postcard/Postcard";
import { PostcardDeck } from "@/components/postcard/PostcardDeck";
import { Ticket } from "@/components/ticket/Ticket";
import { Chip, ErrorState, Icon, SectionHeader, Skeleton } from "@/components/ui";
import { VideoRow } from "@/components/video/cards";
import { ViewportProvider, useRowVisible, useViewport } from "@/components/video/viewport";
import { CITY_INDEX } from "@/data/cities";
import type { Place } from "@/data/types";
import { hiddenGems, thisWeekend, tonight, topTen } from "@/lib/home";
import { closesAt } from "@/lib/hours";
import { formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { useCityClock } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { font, palette, shadow } from "@/theme/tokens";

// The date example names a neighborhood the planner knows in each city.
const DATE_HOOD: Record<string, string> = {
  "san-francisco": "the Mission", "new-york": "Williamsburg", "los-angeles": "Silver Lake", chicago: "Wicker Park", seattle: "Capitol Hill",
  boston: "the North End", austin: "East Austin", miami: "Wynwood", "washington-dc": "Penn Quarter", "san-diego": "North Park",
};
const promptsFor = (slug: string | undefined) => ["what are we doing?", `first date in ${DATE_HOOD[slug ?? ""] ?? "the city"}`, "pickleball then hot pot", "rainy day with the kids", "sunset and tacos", "my friend loves Gundam"];
const PROMPT_COUNT = promptsFor(undefined).length;
export const OCCASIONS = [
  { id: "date", label: "Date", prompt: "date day: something fun, dinner and a view" },
  { id: "friends", label: "Friends", prompt: "me and 3 friends: something fun, food and drinks" },
  { id: "sports", label: "Sports", prompt: "with friends: pickleball then food" },
  { id: "night", label: "Night out", prompt: "tonight: dinner and drinks with a view" },
  { id: "rainy", label: "Rainy day", prompt: "rainy day: a museum, coffee and something fun" },
  { id: "cheap", label: "Cheap", prompt: "cheap day: a park, tacos and dessert" },
];

export default function Home() {
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const currentCity = useStore((s) => s.profile.city);
  const plans = useStore((s) => s.plans);
  const planOrder = useStore((s) => s.planOrder);
  // Links can open Home in a given city: /?city=san-francisco
  const { city: cityParam } = useLocalSearchParams<{ city?: string }>();
  useEffect(() => {
    if (cityParam && cityParam !== currentCity && CITY_INDEX.some((c) => c.slug === cityParam)) actions.updateProfile({ city: String(cityParam) });
  }, [cityParam, currentCity]);
  const [prompt, setPrompt] = useState(0);
  const { vp, onScroll, onLayout } = useViewport();

  useEffect(() => {
    const t = setInterval(() => setPrompt((n) => (n + 1) % PROMPT_COUNT), 2600);
    return () => clearInterval(t);
  }, []);

  const rows = useMemo(() => {
    if (!city) return null;
    const top = topTen(city);
    const seen = new Set(top.map((p) => p.id));
    const night = tonight(city, new Date(), seen);
    night.places.forEach((p) => seen.add(p.id));
    const weekend = thisWeekend(city, seen);
    weekend.forEach((p) => seen.add(p.id));
    return { top, night, weekend, gems: hiddenGems(city, seen) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, Math.floor(clock.minutes / 60)]);

  // Your plans, soonest first (today and later), from the builder and from group chats.
  const mine = useMemo(() => {
    if (!city) return [];
    const today = new Date().toISOString().slice(0, 10);
    return planOrder.map((id) => plans[id]).filter((p) => p && p.citySlug === city.slug && p.dateISO >= today).sort((a, b) => a.dateISO.localeCompare(b.dateISO) || a.start - b.start).slice(0, 4);
  }, [plans, planOrder, city]);

  const cityName = CITY_INDEX.find((c) => c.slug === city?.slug)?.name ?? "your city";
  const tonightLine = (p: Place) => {
    if (p.category === "views" && rows?.night.sunset != null) return `sunset ${formatClock(rows.night.sunset, { compact: true })}`;
    const c = closesAt(p.hours, clock.day, rows?.night.from ?? 1200);
    return c ? `open till ${formatClock(c, { compact: true })}` : "";
  };
  const prompts = promptsFor(city?.slug);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="home">
      <StatusBar style="dark" />
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.wordmark}>faves</Text>
          <Pressable testID="city-switcher" accessibilityRole="button" accessibilityLabel={`City: ${cityName}`} onPress={() => router.push("/city")} style={styles.location}>
            <Text style={styles.locationText}>this week in <Text style={styles.cityWord}>{(city?.name ?? cityName).toLowerCase()}</Text></Text>
            <Icon name="chevron-down" size={16} tint={palette.roseInk} />
          </Pressable>
        </View>
      </View>

      <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }} onScroll={onScroll} scrollEventThrottle={64} onLayout={onLayout}>
        <ViewportProvider vp={vp}>
          {status === "error" ? (
            <View style={{ paddingTop: 40 }}><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></View>
          ) : !city || !rows ? (
            <View style={{ alignItems: "center", paddingTop: 30, gap: 18 }} testID="home-loading">
              <Skeleton style={{ width: 272, height: 380, borderRadius: 18, transform: [{ rotate: "-2deg" }] }} />
              <Skeleton style={{ width: "90%", height: 60, borderRadius: 16 }} />
            </View>
          ) : (
            <>
              <DeckSection places={rows.top} />

              <View style={styles.promptWrap}>
                <Pressable testID="home-prompt" accessibilityRole="button" accessibilityLabel="What are we doing?" onPress={() => router.push("/builder")} style={[styles.prompt, shadow.soft]}>
                  <View style={styles.promptIcon}><Icon name="sparkles" size={18} tint={palette.cream} /></View>
                  <Text numberOfLines={1} style={[styles.promptText, prompt === 0 && styles.promptFirst]}>{prompt === 0 ? prompts[0] : `"${prompts[prompt]}"`}</Text>
                  <Icon name="arrow-forward" size={20} tint={palette.roseInk} />
                </Pressable>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {OCCASIONS.map((o) => <Chip key={o.id} testID={`occasion-${o.id}`} label={o.label} onPress={() => router.push(`/builder?q=${encodeURIComponent(o.prompt)}`)} />)}
                </ScrollView>
              </View>

              {mine.length ? (
                <>
                  <SectionHeader title="your plans" />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ticketRow} testID="row-plans">
                    {mine.map((p, i) => <View key={p.id} style={{ width: 318 }}><Ticket testID={`plan-ticket-${i}`} plan={p} city={city} compact /></View>)}
                  </ScrollView>
                </>
              ) : null}

              {rows.night.places.length ? (
                <>
                  <SectionHeader title="tonight" onMore={() => router.push("/explore?open=1")} testID="title-tonight" />
                  <PostcardRow testID="row-tonight" places={rows.night.places} line={tonightLine} prefix="tonight" />
                </>
              ) : (
                <>
                  <SectionHeader title="this weekend" onMore={() => router.push("/explore")} testID="title-weekend" />
                  <PostcardRow testID="row-weekend" places={rows.weekend} prefix="weekend" />
                </>
              )}

              {rows.gems.length ? (
                <>
                  <SectionHeader title="hidden gems" subtitle="Locals love them, few visitors yet" onMore={() => router.push("/explore?gems=1")} testID="more-gems" />
                  <PostcardRow testID="section-gems" places={rows.gems} prefix="gems" gem />
                </>
              ) : null}

              <Pressable testID="more-days" accessibilityRole="button" onPress={() => router.push("/feed")} style={styles.daysLink}>
                <Icon name="flame-outline" size={20} tint={palette.roseInk} />
                <Text style={styles.daysLinkText}>Popular days in {city.name}</Text>
                <Icon name="chevron-forward" size={18} tint={palette.inkMuted} />
              </Pressable>
            </>
          )}
        </ViewportProvider>
      </ScrollView>
    </SafeAreaView>
  );
}

// The deck plays only while it is on screen.
function DeckSection({ places }: { places: Place[] }) {
  const row = useRowVisible();
  return (
    <View onLayout={row.onLayout} style={{ paddingTop: 4 }}>
      <PostcardDeck testID="top10" places={places} active={row.visible} />
    </View>
  );
}

function PostcardRow({ places, prefix, testID, line, gem }: { places: Place[]; prefix: string; testID: string; line?: (p: Place) => string; gem?: boolean }) {
  return (
    <VideoRow testID={testID} data={places} keyOf={(p) => p.id} gap={14} inset={18} render={(p, i, active) => (
      <View style={{ paddingTop: 12, paddingBottom: 14 }}>
        <Postcard testID={`${prefix}-${i}`} place={p} active={active} size="row" tilt={i % 2 ? 2 : -2} line={line?.(p)} />
        {gem ? <View style={styles.gem} pointerEvents="none"><Text style={styles.gemText}>gem</Text></View> : null}
      </View>
    )} />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 4 },
  wordmark: { fontFamily: font.displayHeavy, fontSize: 30, color: palette.roseInk, letterSpacing: -1, lineHeight: 32 },
  location: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  locationText: { fontFamily: font.display, fontSize: 18, color: palette.ink },
  cityWord: { color: palette.roseInk },
  promptWrap: { paddingHorizontal: 18, paddingTop: 22, gap: 12 },
  prompt: { height: 60, borderRadius: 18, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12 },
  promptIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }] },
  promptText: { flex: 1, fontFamily: font.sans, fontSize: 17, color: palette.inkMuted },
  promptFirst: { fontFamily: font.display, fontSize: 19, color: palette.ink },
  chipRow: { gap: 8, paddingRight: 18 },
  ticketRow: { paddingHorizontal: 18, gap: 14, paddingBottom: 6 },
  daysLink: { marginHorizontal: 18, marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56, paddingHorizontal: 16, borderRadius: 16, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  daysLinkText: { flex: 1, fontFamily: font.display, fontSize: 17, color: palette.ink },
  gem: { position: "absolute", left: 10, top: 4, backgroundColor: palette.lavInk, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, transform: [{ rotate: "-8deg" }] },
  gemText: { fontFamily: font.sans, fontSize: 11, fontWeight: "800", color: palette.cream, letterSpacing: 0.5 },
});
