// Home. Layout copies DoorDash's home feed (appstore2025_02): location row with icons,
// search pill + round map button, category icon row, chips, a promo banner, then titled
// carousels with a grey arrow button, split by 6 pt bands (appstore2025_04).
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DayCard, PlaceCard } from "@/components/cards";
import { Band, Chip, ErrorState, FilterChip, Icon, SampleTag, SectionHeader, Skeleton, T } from "@/components/ui";
import { CITY_INDEX } from "@/data/cities";
import type { Place } from "@/data/types";
import { communityDays, type CommunityDay } from "@/lib/community";
import { metersBetween } from "@/lib/geo";
import { isOpenAt } from "@/lib/hours";
import { sunTimes } from "@/lib/sunset";
import { formatClock, offsetHours } from "@/lib/time";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation } from "@/state/device";
import { useStore } from "@/state/store";
import { CATEGORIES, color, font, logo, shadow } from "@/theme/tokens";

const PROMPTS = ["What are we doing?", "first date in the Mission", "pickleball then hot pot", "rainy day with the kids", "sunset and tacos", "my friend loves Gundam"];
export const OCCASIONS = [
  { id: "date", label: "Date", emoji: "💘", prompt: "date day: something fun, dinner and a view" },
  { id: "friends", label: "Friends", emoji: "👯", prompt: "me and 3 friends: something fun, food and drinks" },
  { id: "sports", label: "Sports", emoji: "🏀", prompt: "with friends: pickleball then food" },
  { id: "night", label: "Night", emoji: "🌃", prompt: "tonight: dinner and drinks with a view" },
  { id: "daytrip", label: "Day trip", emoji: "🚗", prompt: "all day by car: a hike, lunch and a view" },
  { id: "rainy", label: "Rainy day", emoji: "🌧️", prompt: "rainy day: a museum, coffee and something fun" },
  { id: "cheap", label: "Cheap", emoji: "💸", prompt: "cheap day: a park, tacos and dessert" },
];
type Filter = "open" | "free" | "outdoors";

export default function Home() {
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const here = useKnownLocation();
  const name = useStore((s) => s.profile.name);
  const [prompt, setPrompt] = useState(0);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [days, setDays] = useState<CommunityDay[] | null>(null);

  // DoorDash rotates real example searches in the placeholder.
  useEffect(() => {
    const t = setInterval(() => setPrompt((n) => (n + 1) % PROMPTS.length), 2600);
    return () => clearInterval(t);
  }, []);
  // Popular days are built by the planner; do it after first paint.
  useEffect(() => {
    if (!city) return;
    setDays(null);
    const t = setTimeout(() => setDays(communityDays(city)), 30);
    return () => clearTimeout(t);
  }, [city]);

  const from = useMemo(() => {
    if (!city) return null;
    // Your location when you're in this city; otherwise downtown.
    if (here && metersBetween(here, city.center) < 60_000) return here;
    return city.center;
  }, [city, here]);
  const nearYou = Boolean(here && city && metersBetween(here, city.center) < 60_000);

  const pass = (p: Place) =>
    !p.temporarilyClosed &&
    (!filters.includes("open") || isOpenAt(p.hours, clock.day, clock.minutes) === true || (p.hours == null && (p.free || p.category === "views"))) &&
    (!filters.includes("free") || p.free) &&
    (!filters.includes("outdoors") || p.category === "views" || p.category === "courts" || /park|beach|trail|garden|outdoor/i.test(p.kind ?? ""));

  const sections = useMemo(() => {
    if (!city || !from) return null;
    const near = (p: Place) => metersBetween(from, p) < (nearYou ? 6000 : 9000);
    const byScore = (a: Place, b: Place) => b.locals - a.locals;
    const gems = city.places.filter((p) => p.hiddenGem && pass(p) && near(p)).sort(byScore).slice(0, 12);
    const open = city.places.filter((p) => !p.unrated && p.image && isOpenAt(p.hours, clock.day, clock.minutes) && pass(p) && near(p)).sort(byScore).slice(0, 12);
    const courts = city.places.filter((p) => p.category === "courts" && pass(p)).sort((a, b) => metersBetween(from, a) - metersBetween(from, b) - (b.locals - a.locals) * 30).slice(0, 12);
    const sun = sunTimes(city.center.lat, city.center.lng, clock.wall, offsetHours(city.utcOffset));
    const views = city.places.filter((p) => p.category === "views" && !p.court && p.image && pass(p)).sort(byScore).slice(0, 12);
    const moments = city.places.filter((p) => p.moments.length && pass(p)).sort((a, b) => b.moments.length - a.moments.length || byScore(a, b)).slice(0, 12);
    return { gems, open, courts, views, sun, moments };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, from, filters, clock.day, Math.floor(clock.minutes / 15)]);

  const cityName = CITY_INDEX.find((c) => c.slug === city?.slug)?.name ?? "Your city";
  const toggle = (f: Filter) => setFilters((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      {/* Location row */}
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

      <ScrollView testID="home-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Search pill + map button */}
        <View style={styles.searchRow}>
          <Pressable testID="home-prompt" accessibilityRole="button" accessibilityLabel="What are we doing?" onPress={() => router.push("/builder")} style={[styles.searchPill, shadow.soft]}>
            <Icon name="sparkles-outline" size={20} tint="#000" />
            <Text numberOfLines={1} style={[styles.searchText, prompt === 0 && { color: "#000", fontWeight: "600" }]}>{prompt === 0 ? PROMPTS[0] : `"${PROMPTS[prompt]}"`}</Text>
          </Pressable>
          <Pressable testID="open-map" accessibilityLabel="Map" onPress={() => router.push("/explore")} style={[styles.mapButton, shadow.soft]}>
            <Icon name="map-outline" size={22} tint="#000" />
          </Pressable>
        </View>

        {/* Category icon row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.id} testID={`cat-${c.id}`} accessibilityRole="button" accessibilityLabel={c.label} onPress={() => router.push(`/explore?category=${c.id}`)} style={styles.catItem}>
              <Text style={{ fontSize: 34 }}>{c.emoji}</Text>
              <Text style={styles.catLabel} numberOfLines={1}>{c.short[0].toUpperCase() + c.short.slice(1)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Occasion chips (Uber Eats) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {OCCASIONS.map((o) => (
            <Chip key={o.id} testID={`occasion-${o.id}`} label={o.label} icon={o.emoji} onPress={() => router.push(`/builder?q=${encodeURIComponent(o.prompt)}`)} />
          ))}
        </ScrollView>

        {/* Filter chips (DoorDash) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, { paddingTop: 0 }]}>
          <FilterChip testID="filter-open" label="Open now" icon="time-outline" on={filters.includes("open")} onPress={() => toggle("open")} />
          <FilterChip testID="filter-free" label="Free" icon="pricetag-outline" on={filters.includes("free")} onPress={() => toggle("free")} />
          <FilterChip testID="filter-outdoors" label="Outdoors" icon="leaf-outline" on={filters.includes("outdoors")} onPress={() => toggle("outdoors")} />
        </ScrollView>

        {/* Promo banner (DoorDash gradient card) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={328} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <Banner title="A whole day, planned in 30 seconds." body={`Tell us who's coming and what they're into${name ? `, ${name}` : ""}.`} cta="Plan a day" onPress={() => router.push("/builder")} testID="banner-plan" />
          <Banner title="Get paid for not gatekeeping." body="Your spots earn when people save them and do your days." cta="See rewards" onPress={() => router.push("/wallet")} testID="banner-rewards" />
          <Banner title="Faves Plus: members-only nights." body="Live Plan B, busy-now levels and 2x spot rewards." cta="Try Plus" onPress={() => router.push("/plus")} testID="banner-plus" />
        </ScrollView>

        {status === "loading" || !sections ? (
          status === "error" ? <View style={{ paddingTop: 24 }}><ErrorState body={error ?? "We couldn't load this city."} onRetry={retry} /></View> : <HomeSkeleton />
        ) : (
          <>
            <View style={{ height: 18 }} />
            <Band />
            <SectionHeader title="Most-done days this week" subtitle={`Popular days in ${city!.name}`} onMore={() => router.push("/feed")} testID="more-days" />
            <View style={{ paddingHorizontal: 16, marginTop: -6, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <SampleTag text="Sample people" />
              <T v="caption">Real spots, placeholder people until real days are posted</T>
            </View>
            {days ? (
              <FlatList horizontal data={days.slice(0, 8)} keyExtractor={(d) => d.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }} renderItem={({ item, index }) => <DayCard testID={`day-card-${index}`} day={item} city={city!} first={index === 0} />} />
            ) : (
              <View style={{ flexDirection: "row", gap: 16, paddingHorizontal: 16 }}>{[0, 1, 2].map((i) => <Skeleton key={i} style={{ width: 165, height: 165 }} />)}</View>
            )}

            <Carousel title={nearYou ? "Hidden gems near you" : `Hidden gems in ${city!.name}`} subtitle="Locals love them, tourists haven't found them" places={sections.gems} clock={clock} from={from} more={() => router.push("/explore?gems=1")} testID="gems" />
            <Carousel title="Open now" subtitle={`It's ${formatClock(clock.minutes)} in ${city!.name}`} places={sections.open} clock={clock} from={from} more={() => router.push("/explore?open=1")} testID="open" />
            {sections.sun ? (
              <Carousel title={`Sunset tonight: ${formatClock(sections.sun.sunset)}`} subtitle="Views locals rate highest" places={sections.views} clock={clock} from={from} more={() => router.push("/explore?category=views")} testID="views" />
            ) : null}
            <Carousel title="Courts near you" subtitle="Pickleball, tennis and basketball" places={sections.courts} clock={clock} from={from} more={() => router.push("/explore?category=courts")} testID="courts" />
            <Carousel title="Spot Moments" subtitle="See what it's really like before you go" places={sections.moments} clock={clock} from={from} more={() => router.push("/explore?moments=1")} testID="moments" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Banner({ title, body, cta, onPress, testID }: { title: string; body: string; cta: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={{ width: 320, borderRadius: 8, overflow: "hidden" }}>
      <LinearGradient colors={["#FAC4AA", "#FEDBA3", "#FAEA9C"]} style={{ padding: 16, minHeight: 132, justifyContent: "space-between" }}>
        <View>
          <Text style={styles.bannerTitle}>{title}</Text>
          <Text style={styles.bannerBody}>{body}</Text>
        </View>
        <View style={styles.bannerCta}><Text style={styles.bannerCtaText}>{cta}</Text></View>
      </LinearGradient>
    </Pressable>
  );
}

function Carousel({ title, subtitle, places, clock, from, more, testID }: { title: string; subtitle?: string; places: Place[]; clock: ReturnType<typeof useCityClock>; from: { lat: number; lng: number } | null; more: () => void; testID: string }) {
  if (!places.length) return null;
  return (
    <View testID={`section-${testID}`}>
      <View style={{ height: 22 }} />
      <Band />
      <SectionHeader title={title} subtitle={subtitle} onMore={more} testID={`more-${testID}`} />
      <FlatList horizontal data={places} keyExtractor={(p) => p.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} renderItem={({ item, index }) => <PlaceCard testID={`${testID}-card-${index}`} place={item} clock={clock} from={from} />} />
    </View>
  );
}

function HomeSkeleton() {
  return (
    <View testID="home-loading" style={{ padding: 16, gap: 14, marginTop: 18 }}>
      <Skeleton style={{ width: 240, height: 26 }} />
      <View style={{ flexDirection: "row", gap: 16 }}>{[0, 1].map((i) => <Skeleton key={i} style={{ width: 165, height: 165 }} />)}</View>
      <Skeleton style={{ width: 200, height: 26, marginTop: 12 }} />
      <Skeleton style={{ width: 307, height: 149 }} />
      <Skeleton style={{ width: 180, height: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
  location: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#000" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 4 },
  searchPill: { flex: 1, height: 46, borderRadius: 23, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 },
  searchText: { fontFamily: font.sans, fontSize: 16, color: color.textSub, flex: 1 },
  mapButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  catRow: { paddingHorizontal: 12, paddingTop: 16, gap: 4 },
  catItem: { width: 68, alignItems: "center", gap: 4 },
  catLabel: { fontFamily: font.sans, fontSize: 14, color: "#000" },
  chipRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  bannerTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#000", lineHeight: 21 },
  bannerBody: { fontFamily: font.sans, fontSize: 14, color: "#000", marginTop: 4, lineHeight: 19 },
  bannerCta: { alignSelf: "flex-start", backgroundColor: logo.color, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, marginTop: 10 },
  bannerCtaText: { fontFamily: font.sans, color: "#fff", fontSize: 14, fontWeight: "700" },
});
