// Explore: the city's spots on a map (OpenStreetMap under a paper wash, emoji pins with
// names) or as a list. Search sits on top with one row of filters under it: a Category chip
// (opens the categories), open now, hidden gems and moments. A floating pill switches
// between the map and the list.
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PlaceRow } from "@/components/cards";
import FavesMap from "@/components/map/FavesMap";
import type { MapPin } from "@/components/map/types";
import { Sheet } from "@/components/Sheet";
import { EmptyState, ErrorState, Icon, OfflineBanner, Skeleton } from "@/components/ui";
import type { Place } from "@/data/types";
import { metersBetween, type LatLng } from "@/lib/geo";
import { isOpenAt } from "@/lib/hours";
import { keywordStrength } from "@/lib/planner";
import { vibeLine } from "@/lib/score";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { useStore } from "@/state/store";
import { CATEGORIES, categoryInfo, font, palette, shadow, type CategoryId } from "@/theme/tokens";

const SPORTS = ["pickleball", "tennis", "basketball"] as const;

export default function Explore() {
  const params = useLocalSearchParams<{ category?: string; gems?: string; open?: string; moments?: string; q?: string; view?: string }>();
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const here = useKnownLocation();
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const saved = useStore((s) => s.saved);
  const [mode, setMode] = useState<"map" | "list">(params.view === "list" ? "list" : "map");
  const [cat, setCat] = useState<CategoryId | "top">((params.category as CategoryId) ?? "top");
  const [open, setOpen] = useState(params.open === "1");
  const [gems, setGems] = useState(params.gems === "1");
  const [moments, setMoments] = useState(params.moments === "1");
  const [sport, setSport] = useState<(typeof SPORTS)[number] | null>(null);
  const [query, setQuery] = useState(params.q ?? "");
  const [center, setCenter] = useState<LatLng | null>(null);
  const [searchCenter, setSearchCenter] = useState<LatLng | null>(null);
  const [catsOpen, setCatsOpen] = useState(false);

  const start = useMemo(() => (city ? (here && metersBetween(here, city.center) < 60_000 ? here : city.center) : null), [city, here]);
  const focus = searchCenter ?? start;
  const moved = center && focus && metersBetween(center, focus) > 900;

  const results = useMemo(() => {
    if (!city || !focus) return [];
    const words = query.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const list = city.places.filter((p) => {
      if (p.temporarilyClosed) return false;
      if (cat !== "top" && p.category !== cat) return false;
      if (cat === "top" && (p.unrated || p.locals < 55)) return false;
      if (sport && !(p.court?.sport === sport || (p.kind ?? "").toLowerCase().includes(sport))) return false;
      if (open && isOpenAt(p.hours, clock.day, clock.minutes) !== true && !(p.hours == null && (p.court || p.free))) return false;
      if (gems && !p.hiddenGem) return false;
      if (moments && !p.moments.length) return false;
      if (words.length && keywordStrength(p, words) < 2 && !words.every((w) => p.name.toLowerCase().includes(w))) return false;
      return true;
    });
    const scored = list.map((p) => ({ p, d: metersBetween(focus, p) }));
    // Nearby first, better-scored first among the nearby ones.
    scored.sort((a, b) => a.d / 400 - (a.p.unrated ? 40 : a.p.locals) / 12 - (b.d / 400 - (b.p.unrated ? 40 : b.p.locals) / 12));
    const near = scored.slice(0, mode === "map" ? 60 : 120).map((x) => x.p);
    // The list reads like Beli's: best Locals Score first among the nearby ones.
    return mode === "list" ? near.sort((a, b) => (b.unrated ? 30 : b.locals) - (a.unrated ? 30 : a.locals)) : near;
  }, [city, focus, cat, sport, open, gems, moments, query, clock.day, clock.minutes, mode]);

  const pins: MapPin[] = useMemo(() => {
    const out: MapPin[] = results.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: "spot", emoji: categoryInfo(p.category).emoji, label: p.name, sub: vibeLine(p), saved: saved.includes(p.id), priority: p.unrated ? 30 : p.locals }));
    if (here) out.push({ id: "you", lat: here.lat, lng: here.lng, kind: "you" });
    return out;
  }, [results, here, saved]);

  const pickCat = (c: CategoryId | "top") => { setCat(c); setSport(null); setCatsOpen(false); };
  const catLabel = cat === "top" ? "Top picks" : CATEGORIES.find((c) => c.id === cat)?.short ?? "Category";
  const catEmoji = cat === "top" ? "⭐" : categoryInfo(cat).emoji;

  if (status === "error") return <SafeAreaView style={{ flex: 1, justifyContent: "center" }}><ErrorState body={error ?? "We couldn't load this city."} onRetry={retry} /></SafeAreaView>;
  if (!city || !start) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }} testID="explore-loading">
        <Skeleton style={{ flex: 1, borderRadius: 0 }} />
      </SafeAreaView>
    );
  }

  // One row of filters: the category (a sheet of them), then open now, hidden gems, moments.
  const filterPills = (
    <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills} keyboardShouldPersistTaps="handled">
      <Pressable testID="explore-category" accessibilityRole="button" accessibilityLabel={`Category: ${catLabel}`} onPress={() => setCatsOpen(true)} style={[styles.pill, shadow.soft, cat !== "top" && styles.pillOn]}>
        <Text style={{ fontSize: 15 }}>{catEmoji}</Text>
        <Text style={[styles.pillText, cat !== "top" && { color: palette.cream }]}>{catLabel}</Text>
        <Icon name="chevron-down" size={14} tint={cat !== "top" ? palette.cream : palette.ink} />
      </Pressable>
      <Pill testID="pill-open" icon="time-outline" label="Open now" on={open} onPress={() => setOpen((v) => !v)} />
      <Pill testID="pill-gems" icon="diamond-outline" label="Hidden gems" on={gems} onPress={() => setGems((v) => !v)} />
      <Pill testID="pill-moments" icon="play-circle-outline" label="Moments" on={moments} onPress={() => setMoments((v) => !v)} />
      {cat === "courts" ? SPORTS.map((s) => <Pill key={s} testID={`pill-${s}`} label={s} on={sport === s} onPress={() => setSport((v) => (v === s ? null : s))} />) : null}
    </ScrollView>
  );

  const searchBar = (
    <View style={[styles.search, shadow.soft]}>
      <Icon name="search" size={18} tint={palette.inkMuted} />
      <TextInput testID="explore-search" value={query} onChangeText={setQuery} placeholder="hot pot, lit courts, rooftop" placeholderTextColor={palette.inkMuted} style={styles.searchInput} returnKeyType="search" />
      {query ? <Pressable accessibilityLabel="Clear" hitSlop={8} onPress={() => setQuery("")}><Icon name="close-circle" size={18} tint={palette.inkMuted} /></Pressable> : null}
    </View>
  );

  const categories = (
    <Sheet open={catsOpen} onClose={() => setCatsOpen(false)} title="Category" testID="explore-categories" background={palette.paper}>
      <CatRow testID="explore-cat-top" emoji="⭐" label="Top picks" on={cat === "top"} onPress={() => pickCat("top")} />
      {CATEGORIES.map((c) => <CatRow key={c.id} testID={`explore-cat-${c.id}`} emoji={c.emoji} label={c.label} on={cat === c.id} onPress={() => pickCat(c.id)} />)}
    </Sheet>
  );

  // The floating switch between the map and the list.
  const switcher = (
    <Pressable testID={mode === "map" ? "toggle-list" : "view-map"} accessibilityRole="button" onPress={() => setMode(mode === "map" ? "list" : "map")} style={[styles.viewMap, shadow.card, { bottom: insets.bottom + 18 }]}>
      <Icon name={mode === "map" ? "list" : "map-outline"} size={18} tint={palette.cream} />
      <Text style={styles.viewMapText}>{mode === "map" ? "List" : "Map"}</Text>
    </Pressable>
  );

  if (mode === "list") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]} testID="explore-list">
        <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>{searchBar}</View>
        {filterPills}
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => <PlaceRow testID={`explore-row-${index}`} place={item} clock={clock} from={start} />}
          ListEmptyComponent={<View style={{ paddingTop: 30 }}><EmptyState icon="search-outline" title="Nothing here yet" body="Try another word or filter." cta="Clear filters" onCta={() => { setOpen(false); setGems(false); setMoments(false); setQuery(""); setSport(null); setCat("top"); }} /></View>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        {switcher}
        {categories}
        {!online ? <OfflineBanner /> : null}
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }} testID="explore-map">
      <FavesMap
        testID="map"
        style={StyleSheet.absoluteFill}
        center={start}
        span={0.05}
        pins={pins}
        fitKey={`${cat}|${sport}|${open}|${gems}|${moments}|${query}|${searchCenter?.lat ?? ""}`}
        onPinPress={(id) => { if (id !== "you") router.push(`/place/${encodeURIComponent(id)}`); }}
        onMove={setCenter}
      />
      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.top}>
        <View style={styles.topRow} pointerEvents="box-none">
          <View style={{ flex: 1 }}>{searchBar}</View>
          <Pressable testID="explore-locate" accessibilityLabel="Back to start" onPress={() => setSearchCenter(null)} style={[styles.round, shadow.soft]}>
            <Icon name="navigate" size={20} tint={palette.ink} />
          </Pressable>
        </View>
        {filterPills}
        {moved ? (
          <Pressable testID="search-here" onPress={() => setSearchCenter(center)} style={styles.searchHere}>
            <Icon name="refresh" size={16} tint={palette.cream} />
            <Text style={styles.searchHereText}>Search here</Text>
          </Pressable>
        ) : null}
        {!results.length ? (
          <View style={styles.noResults}><Text style={styles.noResultsText}>No spots here. Try another filter.</Text></View>
        ) : null}
      </SafeAreaView>
      {switcher}
      {categories}
      {!online ? <View style={{ position: "absolute", left: 0, right: 0, bottom: insets.bottom + 70 }}><OfflineBanner /></View> : null}
    </View>
  );
}

function Pill({ label, icon, on, onPress, testID }: { label: string; icon?: Parameters<typeof Icon>[0]["name"]; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.pill, shadow.soft, on && styles.pillOn]}>
      {icon ? <Icon name={icon} size={16} tint={on ? palette.cream : palette.ink} /> : null}
      <Text style={[styles.pillText, on && { color: palette.cream }]}>{label}</Text>
    </Pressable>
  );
}

function CatRow({ emoji, label, on, onPress, testID }: { emoji: string; label: string; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={styles.catRow}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <Text style={[styles.catLabel, on && { fontWeight: "800" }]} numberOfLines={1}>{label}</Text>
      {on ? <Icon name="checkmark" size={20} tint={palette.roseInk} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 6 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.card, alignItems: "center", justifyContent: "center" },
  searchHere: { alignSelf: "center", marginTop: 6, height: 34, borderRadius: 17, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14 },
  searchHereText: { fontFamily: font.sans, color: palette.cream, fontSize: 15, fontWeight: "700" },
  pills: { paddingHorizontal: 14, gap: 8, paddingVertical: 8 },
  pill: { height: 36, borderRadius: 18, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13 },
  pillOn: { backgroundColor: palette.ink, borderColor: palette.ink },
  pillText: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: palette.ink },
  catRow: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 52, paddingHorizontal: 18 },
  catLabel: { flex: 1, fontFamily: font.sans, fontSize: 16, color: palette.ink },
  search: { height: 46, borderRadius: 23, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 },
  searchInput: { flex: 1, color: palette.ink, fontSize: 16, fontFamily: font.sans, height: 46 },
  noResults: { alignSelf: "center", marginTop: 6, backgroundColor: palette.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  noResultsText: { fontFamily: font.sans, fontSize: 15, color: palette.ink },
  viewMap: { position: "absolute", alignSelf: "center", height: 44, borderRadius: 22, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20 },
  viewMapText: { fontFamily: font.sans, color: palette.cream, fontSize: 16, fontWeight: "700" },
});
