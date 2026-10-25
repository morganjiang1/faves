// Saved. The Spots | Days switch copies Beli's List | Map toggle (discovery/beli/
// beli_appstore_ipad_list_map_toggle.png: 32 pt, radius 8.5, 2 pt teal outline, selected half
// teal). Spots copies Google Maps' saved list sheet (discovery/google_maps/
// google_maps_saved_list_sheet_nyc_restaurants.png, element map #7): emoji + 24 pt list title
// with grey share / map circles, avatar stack + "You • Private list", a description, tonal 42 pt
// chips "Invite collaborators" / "+ Add places" (#D2F7FF / #014F5B), a #E3E3E3 divider, "N places"
// + a 34 pt "✓ Recently saved ▾" chip (#DEE4E4), a 148 pt photo row (radius 8), then the spots
// as Beli list rows; the map toggle shows the list on the map with white emoji markers under
// a 30 pt-radius sheet. Days copies Letterboxd's Diary (social/letterboxd/appstore_03_diary.png).
// Empty states are Beli's empty card; loading is Instagram's skeleton; offline is the tab bar's
// Spotify bar.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PlaceRow } from "@/components/cards";
import FavesMap from "@/components/map/FavesMap";
import type { MapPin } from "@/components/map/types";
import { ShareSheet } from "@/components/ShareSheet";
import { Sheet } from "@/components/Sheet";
import { BrandToggle } from "@/components/social/controls";
import { copiedFrom } from "@/components/social/dayPost";
import { DaysDiary } from "@/components/social/Diary";
import { useCommunityPosts } from "@/components/social/useDays";
import { ActionPill, Avatar, CircleButton, EmptyState, ErrorState, Grabber, Icon, PlaceImage, SkeletonRows, Skeleton, type IconName } from "@/components/ui";
import type { Place } from "@/data/types";
import { metersBetween } from "@/lib/geo";
import type { Plan } from "@/lib/planner";
import { shareUrl } from "@/lib/links";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation } from "@/state/device";
import { useStore } from "@/state/store";
import { color, font } from "@/theme/tokens";

type Mode = "spots" | "days";
const LIST_EMOJI = "🔖";
type Sort = "recent" | "score" | "distance";
const SORTS: { id: Sort; label: string }[] = [
  { id: "recent", label: "Recently saved" },
  { id: "score", label: "Locals Score" },
  { id: "distance", label: "Distance" },
];

export default function Saved() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [mode, setMode] = useState<Mode>(params.tab === "days" ? "days" : "spots");
  // Profile's "Your days" row and the feed's calendar open this tab on Days.
  useEffect(() => {
    if (params.tab === "days" || params.tab === "spots") {
      setMode(params.tab);
      router.setParams({ tab: undefined });
    }
  }, [params.tab]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="saved-screen">
      <View style={styles.top}>
        <BrandToggle testID="saved-toggle" value={mode} onChange={setMode} options={[{ id: "spots", label: "Spots", icon: "location-outline" }, { id: "days", label: "Days", icon: "calendar-outline" }]} />
      </View>
      {mode === "spots" ? <Spots /> : <Days />}
    </SafeAreaView>
  );
}

function Spots() {
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const here = useKnownLocation();
  const saved = useStore((s) => s.saved);
  const [sort, setSort] = useState<Sort>("recent");
  const [sortOpen, setSortOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [share, setShare] = useState(false);
  const name = useStore((s) => s.profile.name) || "You";

  const from = useMemo(() => (city ? (here && metersBetween(here, city.center) < 60_000 ? here : city.center) : null), [city, here]);
  const { places, elsewhere } = useMemo(() => {
    if (!city) return { places: [] as Place[], elsewhere: 0 };
    const list = saved.map((id) => city.byId.get(id)).filter((p): p is Place => Boolean(p));
    if (sort === "score") list.sort((a, b) => (b.unrated ? 0 : b.locals) - (a.unrated ? 0 : a.locals));
    if (sort === "distance" && from) list.sort((a, b) => metersBetween(from, a) - metersBetween(from, b));
    return { places: list, elsewhere: saved.length - list.length };
  }, [city, saved, sort, from]);

  if (status === "error") return <View style={{ paddingTop: 40 }}><ErrorState title="Couldn't load your spots. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} testID="saved-error" /></View>;
  if (status === "loading" || !city) {
    return (
      <View testID="saved-loading" style={{ paddingTop: 12 }}>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Skeleton style={{ width: 220, height: 26 }} />
          <Skeleton style={{ width: 160, height: 14 }} />
          <View style={{ flexDirection: "row", gap: 8 }}><Skeleton style={{ width: 190, height: 42, borderRadius: 21 }} /><Skeleton style={{ width: 130, height: 42, borderRadius: 21 }} /></View>
        </View>
        <SkeletonRows rows={4} />
      </View>
    );
  }
  if (!places.length) {
    return (
      <ScrollView contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
        <EmptyState testID="saved-empty" icon="bookmark-outline" title="Save spots you want to try" body={`Tap the bookmark on any spot in ${city.name} and it lands here.${elsewhere ? ` You have ${elsewhere} saved in other cities.` : ""}`} cta="Explore spots" onCta={() => router.push("/explore")} />
      </ScrollView>
    );
  }

  // Google's saved list on the map: every item is a small white marker with the list's emoji.
  const pins: MapPin[] = places.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: "spot", emoji: LIST_EMOJI, label: p.name, saved: true, priority: p.locals }));
  const sortLabel = SORTS.find((s) => s.id === sort)!.label;
  const photos = places.filter((p) => p.image).slice(0, 10);

  const sheet = (
    <View>
      {showMap ? <Grabber /> : null}
      <View style={styles.titleRow}>
        <Text style={styles.emoji}>{LIST_EMOJI}</Text>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">Want to try</Text>
        <CircleButton testID="saved-share" icon="share-outline" label="Share this list" onPress={() => setShare(true)} />
        <CircleButton testID="saved-map-toggle" icon={showMap ? "list" : "map-outline"} label={showMap ? "Show the list" : "Show on the map"} onPress={() => setShowMap((v) => !v)} />
      </View>
      <View style={styles.ownerRow}>
        <Avatar name={name} size={22} />
        <Text style={styles.owner}>You • Private list</Text>
      </View>
      <Text style={styles.desc}>Spots you want to try in {city.name}.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <ActionPill testID="saved-invite" icon="person-add-outline" label="Invite collaborators" onPress={() => setShare(true)} />
        <ActionPill testID="saved-add" icon="add" label="Add places" onPress={() => router.push("/explore")} />
      </ScrollView>
      <View style={styles.divider} />
      <View style={styles.countRow}>
        <Text style={styles.count}>{places.length} {places.length === 1 ? "place" : "places"}{elsewhere ? ` (+${elsewhere} in other cities)` : ""}</Text>
        <Pressable testID="saved-sort" accessibilityRole="button" accessibilityLabel={`Sort: ${sortLabel}`} onPress={() => setSortOpen(true)} style={styles.sortChip}>
          <Icon name="checkmark" size={17} tint="#1D1D1D" />
          <Text style={styles.sortText}>{sortLabel}</Text>
          <Icon name="caret-down" size={13} tint="#1D1D1D" />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
        {photos.map((p, i) => (
          <Pressable key={p.id} testID={`saved-photo-${i}`} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => router.push(`/place/${encodeURIComponent(p.id)}`)}>
            <PlaceImage uri={p.image} category={p.category} style={styles.photo} />
          </Pressable>
        ))}
      </ScrollView>
      <View style={{ height: 8 }} />
      {places.map((p, i) => <PlaceRow key={p.id} testID={`saved-row-${i}`} place={p} clock={clock} from={from} />)}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      {showMap ? (
        <View style={{ flex: 1 }}>
          <View style={styles.mapArea}>
            <FavesMap testID="saved-map" creditBottom={28} style={StyleSheet.absoluteFill} center={from ?? city.center} span={0.08} pins={pins} fitToPins showLabels={false} onPinPress={(id) => router.push(`/place/${encodeURIComponent(id)}`)} />
          </View>
          <ScrollView style={styles.overSheet} contentContainerStyle={{ paddingBottom: 24 }} testID="saved-sheet">{sheet}</ScrollView>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 24, paddingTop: 6 }} testID="saved-list">{sheet}</ScrollView>
      )}

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by" background="#F2F2F6" testID="saved-sort-sheet">
        <View style={styles.sortCard}>
          {SORTS.map((s, i) => (
            <Pressable key={s.id} testID={`saved-sort-${s.id}`} accessibilityRole="button" accessibilityState={{ selected: sort === s.id }} onPress={() => { setSort(s.id); setSortOpen(false); }} style={[styles.sortRow, i > 0 && styles.sortSep]}>
              <Text style={styles.sortRowText}>{s.label}{s.id === "distance" && !(here && metersBetween(here, city.center) < 60_000) ? " from downtown" : ""}</Text>
              {sort === s.id ? <Icon name="checkmark" size={20} tint={color.appleBlue} /> : null}
            </Pressable>
          ))}
        </View>
      </Sheet>
      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Share your list"
        subtitle="Send your Want to try spots. Friends can open each one on Faves."
        url={shareUrl(`/place/${encodeURIComponent(places[0].id)}`)}
        cardTitle={`Want to try: ${places.length} ${places.length === 1 ? "spot" : "spots"} in ${city.name}`}
        image={photos[0]?.image ?? null}
        category={places[0].category}
        message={`My Want to try list on Faves: ${places.slice(0, 8).map((p) => p.name).join(", ")}`}
      />
    </View>
  );
}

function Days() {
  const { city } = useCity();
  const planOrder = useStore((s) => s.planOrder);
  const plansById = useStore((s) => s.plans);
  const recaps = useStore((s) => s.recaps);
  const posts = useStore((s) => s.posts);
  const groups = useStore((s) => s.groups);
  const savedDays = useStore((s) => s.savedDays);
  const community = useCommunityPosts(city);

  const plans = useMemo(() => planOrder.map((id) => plansById[id]).filter((p): p is Plan => Boolean(p)), [planOrder, plansById]);
  const saved = useMemo(() => (community ? savedDays.map((id) => community.find((d) => d.id === id)).filter((d): d is NonNullable<typeof d> => Boolean(d)).map((d) => ({ id: d.id, plan: d.plan, at: d.at })) : []), [community, savedDays]);

  const glyphsFor = (p: Plan) => {
    const g: { icon: IconName; tint?: string; label: string }[] = [];
    if (recaps[p.id]?.finishedAt) g.push({ icon: "thumbs-up", tint: color.score, label: "Rated" });
    if (posts.some((x) => x.planId === p.id)) g.push({ icon: "megaphone-outline", label: "Posted" });
    if (copiedFrom(p)) g.push({ icon: "repeat", label: "Copied from the feed" });
    if (Object.values(groups).some((x) => x.planId === p.id)) g.push({ icon: "people-outline", label: "Group plan" });
    return g;
  };

  if (!plans.length && !saved.length) {
    return (
      <ScrollView contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
        <EmptyState testID="days-empty" icon="calendar-outline" title="No days yet" body="Plan a day and it shows up here, with every stop and the route between them." cta="Plan a day" onCta={() => router.push("/builder")} secondary="See popular days" onSecondary={() => router.push("/feed")} />
      </ScrollView>
    );
  }
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24, paddingTop: 10 }} testID="days-list">
      <DaysDiary testID="days-diary" plans={plans} saved={saved} city={city} glyphsFor={glyphsFor} onOpenPlan={(p) => router.push(`/plan/${encodeURIComponent(p.id)}`)} onOpenSaved={(id) => router.push(`/day/${encodeURIComponent(id)}`)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  top: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  emoji: { fontSize: 28 },
  title: { flex: 1, fontFamily: font.sans, fontSize: 24, color: "#1D1D1D", marginLeft: 4 },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, marginTop: 14 },
  owner: { fontFamily: font.sans, fontSize: 15, color: "#5D5D5D" },
  desc: { fontFamily: font.sans, fontSize: 16, color: "#5D5D5D", paddingHorizontal: 18, marginTop: 12 },
  chips: { paddingHorizontal: 18, gap: 8, paddingTop: 16, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: "#E3E3E3" },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingTop: 12 },
  count: { fontFamily: font.sans, fontSize: 16, color: "#5D5D5D", flexShrink: 1, marginRight: 8 },
  sortChip: { height: 34, borderRadius: 8, backgroundColor: "#DEE4E4", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12 },
  sortText: { fontFamily: font.sans, fontSize: 16, fontWeight: "500", color: "#1D1D1D" },
  photoRow: { paddingHorizontal: 18, gap: 8, paddingTop: 14 },
  photo: { width: 148, height: 148, borderRadius: 8 },
  mapArea: { height: 360 },
  overSheet: { flex: 1, marginTop: -24, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  sortCard: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden", marginBottom: 8 },
  sortRow: { height: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  sortSep: { borderTopWidth: 1, borderTopColor: "#DFDFE1" },
  sortRowText: { fontFamily: font.sans, fontSize: 17, color: "#000" },
});
