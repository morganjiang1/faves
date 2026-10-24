// Explore map. Copies Corner's map (corner_map_emoji_pins_categories_search.png): desaturated
// basemap, emoji pins with a name and an italic descriptor, white shadowed filter pills, a
// blue "search here" pill, the category row (object icon over label) and the black search
// bar with a blue circle. List mode is Beli's recs list with its "View Map" pill and the
// List | Map toggle from beli_appstore_ipad_list_map_toggle.
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CornerCard, PlaceRow } from "@/components/cards";
import FavesMap from "@/components/map/FavesMap";
import type { MapPin } from "@/components/map/types";
import { EmptyState, ErrorState, Icon, OfflineBanner, Skeleton } from "@/components/ui";
import type { Place } from "@/data/types";
import { metersBetween, type LatLng } from "@/lib/geo";
import { isOpenAt } from "@/lib/hours";
import { keywordStrength } from "@/lib/planner";
import { vibeLine } from "@/lib/score";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { useStore } from "@/state/store";
import { CATEGORIES, categoryInfo, color, font, shadow, type CategoryId } from "@/theme/tokens";

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
  const [selected, setSelected] = useState<string | null>(null);

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
    const out: MapPin[] = results.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: "spot", emoji: categoryInfo(p.category).emoji, label: p.name, sub: vibeLine(p), selected: p.id === selected, saved: saved.includes(p.id), priority: p.unrated ? 30 : p.locals }));
    if (here) out.push({ id: "you", lat: here.lat, lng: here.lng, kind: "you" });
    return out;
  }, [results, selected, here, saved]);

  const sel = selected && city ? city.byId.get(selected) ?? null : null;
  const pickCat = (c: CategoryId | "top") => { setCat(c); setSport(null); setSelected(null); };

  if (status === "error") return <SafeAreaView style={{ flex: 1, justifyContent: "center" }}><ErrorState body={error ?? "We couldn't load this city."} onRetry={retry} /></SafeAreaView>;
  if (!city || !start) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }} testID="explore-loading">
        <Skeleton style={{ flex: 1, borderRadius: 0 }} />
      </SafeAreaView>
    );
  }

  // Map mode: Corner's white shadowed pills. List mode: Beli's outlined 32 pt chips.
  const P = mode === "list" ? BeliChip : Pill;
  const filterPills = (
    <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills} keyboardShouldPersistTaps="handled">
      <P testID="pill-open" icon="time-outline" label={mode === "list" ? "Open now" : "open now"} on={open} onPress={() => setOpen((v) => !v)} />
      <P testID="pill-gems" icon="diamond-outline" label={mode === "list" ? "Hidden gems" : "hidden gems"} on={gems} onPress={() => setGems((v) => !v)} />
      <P testID="pill-moments" icon="play-circle-outline" label={mode === "list" ? "Moments" : "moments"} on={moments} onPress={() => setMoments((v) => !v)} />
      {cat === "courts" ? SPORTS.map((s) => <P key={s} testID={`pill-${s}`} label={s} on={sport === s} onPress={() => setSport((v) => (v === s ? null : s))} />) : null}
    </ScrollView>
  );

  const categoryRow = (
    <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0 }} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats} keyboardShouldPersistTaps="handled">
      <CatItem testID="explore-cat-top" emoji="⭐" label="top picks" on={cat === "top"} onPress={() => pickCat("top")} />
      {CATEGORIES.map((c) => <CatItem key={c.id} testID={`explore-cat-${c.id}`} emoji={c.emoji} label={c.short} on={cat === c.id} onPress={() => pickCat(c.id)} />)}
    </ScrollView>
  );

  const searchBar = (
    <View style={[styles.search, shadow.soft]}>
      <TextInput testID="explore-search" value={query} onChangeText={setQuery} placeholder="hot pot, lit courts, rooftop" placeholderTextColor="#9A9A9A" style={styles.searchInput} returnKeyType="search" />
      <Pressable accessibilityLabel="Ask the planner" onPress={() => router.push(query.trim() ? `/builder?q=${encodeURIComponent(query)}` : "/builder")} style={styles.searchGo}>
        <Icon name="sparkles" size={20} tint="#fff" />
      </Pressable>
    </View>
  );

  const toggle = (
    <View style={styles.toggle}>
      <Pressable testID="toggle-list" onPress={() => setMode("list")} style={[styles.toggleHalf, mode === "list" ? styles.toggleOn : styles.toggleOff]}>
        <Icon name="list" size={16} tint={mode === "list" ? "#fff" : color.brand} />
        <Text style={[styles.toggleText, { color: mode === "list" ? "#fff" : color.brand }]}>List</Text>
      </Pressable>
      <Pressable testID="toggle-map" onPress={() => setMode("map")} style={[styles.toggleHalf, mode === "map" ? styles.toggleOn : styles.toggleOff]}>
        <Icon name="map-outline" size={16} tint={mode === "map" ? "#fff" : color.brand} />
        <Text style={[styles.toggleText, { color: mode === "map" ? "#fff" : color.brand }]}>Map</Text>
      </Pressable>
    </View>
  );

  if (mode === "list") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]} testID="explore-list">
        <View style={styles.listHeader}>
          <Pressable accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} hitSlop={10}><Icon name="chevron-back" size={26} /></Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>{toggle}</View>
          <View style={{ width: 26 }} />
        </View>
        {filterPills}
        {categoryRow}
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => <PlaceRow testID={`explore-row-${index}`} place={item} clock={clock} from={start} />}
          ListEmptyComponent={<View style={{ paddingTop: 30 }}><EmptyState icon="search-outline" title="Nothing here yet" body="Try another category, turn off a filter, or search a different word." cta="Clear filters" onCta={() => { setOpen(false); setGems(false); setMoments(false); setQuery(""); setSport(null); }} /></View>}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
        <Pressable testID="view-map" onPress={() => setMode("map")} style={[styles.viewMap, shadow.soft, { bottom: insets.bottom + 20 }]}>
          <Icon name="map-outline" size={20} tint="#fff" />
          <Text style={styles.viewMapText}>View Map</Text>
        </Pressable>
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
        onPinPress={(id) => id !== "you" && setSelected(id)}
        onMove={setCenter}
      />
      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.top}>
        <View style={styles.topRow} pointerEvents="box-none">
          <Pressable testID="explore-back" accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={[styles.round, shadow.soft]}>
            <Icon name="chevron-back" size={22} tint="#000" />
          </Pressable>
          {toggle}
          <Pressable testID="explore-locate" accessibilityLabel="Back to start" onPress={() => { setSearchCenter(null); setSelected(null); }} style={[styles.round, shadow.soft]}>
            <Icon name="navigate" size={20} tint="#000" />
          </Pressable>
        </View>
        {moved ? (
          <Pressable testID="search-here" onPress={() => { setSearchCenter(center); setSelected(null); }} style={styles.searchHere}>
            <Icon name="refresh" size={17} tint="#fff" />
            <Text style={styles.searchHereText}>search here</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
        {sel ? (
          <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
            <CornerCard testID="selected-card" place={sel} />
            <Pressable accessibilityLabel="Close" onPress={() => setSelected(null)} style={styles.cardClose}><Icon name="close" size={16} tint="#000" /></Pressable>
          </View>
        ) : null}
        {!results.length ? (
          <View style={styles.noResults}><Text style={styles.noResultsText}>No spots match here. Try another filter or move the map.</Text></View>
        ) : null}
        {filterPills}
        {categoryRow}
        <View style={{ paddingHorizontal: 14 }}>{searchBar}</View>
        {!online ? <View style={{ marginTop: 8 }}><OfflineBanner /></View> : null}
      </View>
    </View>
  );
}

function Pill({ label, icon, on, onPress, testID }: { label: string; icon?: Parameters<typeof Icon>[0]["name"]; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.pill, shadow.soft, on && { backgroundColor: "#000" }]}>
      {icon ? <Icon name={icon} size={17} tint={on ? "#fff" : "#000"} /> : null}
      <Text style={[styles.pillText, on && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

function BeliChip({ label, icon, on, onPress, testID }: { label: string; icon?: Parameters<typeof Icon>[0]["name"]; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.beliChip, on && styles.beliChipOn]}>
      {icon ? <Icon name={icon} size={16} tint={on ? "#0F3F49" : "#424242"} /> : null}
      <Text style={[styles.beliChipText, on && { color: "#0F3F49" }]}>{label}</Text>
    </Pressable>
  );
}

function CatItem({ emoji, label, on, onPress, testID }: { emoji: string; label: string; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={styles.cat}>
      <View style={[styles.catIcon, on && styles.catIconOn]}><Text style={{ fontSize: 30 }}>{emoji}</Text></View>
      <Text style={[styles.catLabel, on && { fontWeight: "700" }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0, right: 0 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingTop: 6 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  searchHere: { alignSelf: "center", marginTop: 12, height: 32, borderRadius: 16, backgroundColor: color.cornerSearchHere, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14 },
  searchHereText: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "600" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0 },
  pills: { paddingHorizontal: 14, gap: 8, paddingVertical: 6 },
  pill: { height: 30, borderRadius: 15, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12 },
  pillText: { fontFamily: font.sans, fontSize: 16, color: "#000" },
  beliChip: { height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#424242", backgroundColor: "#fff", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13 },
  beliChipOn: { backgroundColor: "#EAEDEF", borderColor: "#A2ABC8" },
  beliChipText: { fontFamily: font.sans, fontSize: 16, color: "#424242" },
  cats: { paddingHorizontal: 8, gap: 2, paddingVertical: 6 },
  cat: { width: 70, alignItems: "center", gap: 2 },
  catIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  catIconOn: { backgroundColor: "rgba(255,255,255,0.95)", borderWidth: 2, borderColor: "#000" },
  catLabel: { fontFamily: font.sans, fontSize: 13, color: "#000", textShadowColor: "#fff", textShadowRadius: 4 },
  search: { height: 47, borderRadius: 24, backgroundColor: color.cornerSearch, flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 3, marginTop: 4 },
  searchInput: { flex: 1, color: "#fff", fontSize: 17, fontFamily: font.sans, height: 47 },
  searchGo: { width: 41, height: 41, borderRadius: 21, backgroundColor: color.cornerBlue, alignItems: "center", justifyContent: "center" },
  cardClose: { position: "absolute", right: 22, top: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center" },
  noResults: { marginHorizontal: 14, marginBottom: 6, backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  noResultsText: { fontFamily: font.sans, fontSize: 15, color: "#333" },
  toggle: { flexDirection: "row", width: 200, height: 32 },
  toggleHalf: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  toggleOn: { backgroundColor: color.brand, borderRadius: 8.5 },
  toggleOff: { backgroundColor: "#fff", borderWidth: 2, borderColor: color.brand, borderRadius: 8.5 },
  toggleText: { fontFamily: font.sans, fontSize: 16, fontWeight: "600" },
  listHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 },
  viewMap: { position: "absolute", right: 16, height: 41, borderRadius: 21, backgroundColor: color.brand, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 },
  viewMapText: { fontFamily: font.sans, color: "#fff", fontSize: 17, fontWeight: "600" },
});
