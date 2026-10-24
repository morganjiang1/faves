// Place page. The top copies Instagram's location page (map header, the place's story ring
// that opens its Spot Moments); the sheet copies Google Maps' place sheet (30 pt radius,
// grabber, ~22 pt name with grey share and close circles, rating row, type row, open status,
// 42 pt action pills with the first one filled, photo collage); the section order after the
// actions follows Beli's place page (tag line, Scores, photos).
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import FavesMap from "@/components/map/FavesMap";
import { DetailsSection, MomentsSection, PhotoCollage, QuotesSection, ScoresSection, openStatusLine } from "@/components/place/sections";
import { ShareSheet } from "@/components/ShareSheet";
import { ActionPill, CircleButton, EmptyState, ErrorState, Grabber, Icon, OfflineBanner, PlaceImage, Skeleton, SkeletonRows, Toast } from "@/components/ui";
import { bestLeg, metersBetween } from "@/lib/geo";
import { callNumber, openDirections, openUrl, shareUrl } from "@/lib/links";
import { compact, costOf, gemLine, scoreOutOf10, signalCount } from "@/lib/score";
import { services } from "@/lib/adapters";
import { livePlace, type LivePlace } from "@/lib/adapters/places";
import { liveYelp, type LiveYelp } from "@/lib/adapters/yelp";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { categoryInfo, color, font } from "@/theme/tokens";

const OCCASION_TAGS: Record<string, string[]> = {
  courts: ["Sports", "Friends"], food: ["Friends", "Date", "Cheap eats"], sweets: ["Date", "Friends", "Treat"], night: ["Night out", "Date", "Friends"],
  games: ["Friends", "Date", "Rainy day"], active: ["Sports", "Friends", "Day trip"], views: ["Date", "Sunset", "Day trip"], culture: ["Date", "Rainy day", "Friends"],
  shops: ["Friends", "Rainy day", "Browsing"], classes: ["Date", "Friends", "Rainy day"],
};

export default function PlacePage() {
  const { id, reserve } = useLocalSearchParams<{ id: string; reserve?: string }>();
  const placeId = decodeURIComponent(String(id));
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const here = useKnownLocation();
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const saved = useStore((s) => s.saved.includes(placeId));
  const mine = useStore((s) => s.moments[placeId]);
  const hidden = useStore((s) => s.hidden);
  const transport = useStore((s) => s.profile.transport);
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const place = city?.byId.get(placeId) ?? null;
  useEffect(() => { if (reserve === "1" && place?.reserveUrl) openUrl(place.reserveUrl); }, [reserve, place]);
  // Optional live checks (only with keys): Google's current hours and Yelp's current rating.
  const [live, setLive] = useState<{ google: LivePlace | null; yelp: LiveYelp | null }>({ google: null, yelp: null });
  useEffect(() => {
    if (!place || !online || (!services.googlePlaces && !services.yelp)) return;
    let on = true;
    Promise.all([livePlace(place.id), liveYelp(place.name, place.lat, place.lng)]).then(([google, yelp]) => { if (on) setLive({ google, yelp }); });
    return () => { on = false; };
  }, [place, online]);

  const myMoments = useMemo(() => (mine ?? []).filter((m) => !hidden.includes(m.id)), [mine, hidden]);
  const visible = useMemo(() => (place ? { ...place, moments: place.moments.filter((m) => !hidden.includes(m.id)) } : null), [place, hidden]);

  if (status === "loading") {
    return (
      <SafeAreaView style={{ flex: 1 }} testID="place-loading">
        <Skeleton style={{ height: 230, borderRadius: 0 }} />
        <SkeletonRows rows={4} />
      </SafeAreaView>
    );
  }
  if (status === "error") return <SafeAreaView style={{ flex: 1, justifyContent: "center" }}><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></SafeAreaView>;
  if (!place || !visible || !city) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }} testID="place-missing">
        <EmptyState icon="location-outline" title="Spot not found" body={`We couldn't find this spot in ${city?.name ?? "this city"}. It may be in another city you've switched away from.`} cta="Back to Home" onCta={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  const from = here && metersBetween(here, city.center) < 60_000 ? here : null;
  const leg = from ? bestLeg(from, place, transport) : null;
  const near = from ? metersBetween(from, place) <= 150 : false;
  const status_ = openStatusLine(place, clock.day, clock.minutes);
  const cost = costOf(place);
  const gem = gemLine(place);
  const tags = [...(place.hiddenGem ? ["Hidden gem"] : []), ...(place.localPick ? ["Locals pick"] : []), ...(place.free ? ["Free"] : []), ...(OCCASION_TAGS[place.category] ?? [])];
  const url = shareUrl(`/place/${encodeURIComponent(place.id)}`);
  const ringCover = visible.moments[0]?.cover ?? myMoments[0]?.uri ?? place.image;
  const hasMoments = visible.moments.length + myMoments.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }} testID="place-page">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Instagram location header: map + the place's story ring */}
        <View style={styles.header}>
          <FavesMap style={StyleSheet.absoluteFill} center={{ lat: place.lat + 0.0012, lng: place.lng }} span={0.012} pins={[{ id: place.id, lat: place.lat, lng: place.lng, kind: "spot", emoji: categoryInfo(place.category).emoji }]} showLabels={false} />
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.0)"]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={[styles.headerButtons, { top: insets.top + 8 }]} pointerEvents="box-none">
            <CircleButton testID="place-back" icon="chevron-back" label="Back" light size={40} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
            <CircleButton testID="place-directions-fab" icon="navigate" label="Directions" light size={40} onPress={() => openDirections({ ...place }, transport)} />
          </View>
          <Pressable testID="story-ring" accessibilityLabel={hasMoments ? "Watch Spot Moments" : "Post the first moment"} onPress={() => (hasMoments ? router.push(`/moments/${encodeURIComponent(place.id)}?i=0`) : router.push(`/post-moment/${encodeURIComponent(place.id)}`))} style={[styles.ringWrap, { top: insets.top + 18 }]}>
            {hasMoments ? <LinearGradient colors={["#ED9E1A", "#BA1AAA"]} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={styles.ring} /> : <View style={[styles.ring, { backgroundColor: "#D3D3D3" }]} />}
            <View style={styles.ringInner}>
              <PlaceImage uri={ringCover} category={place.category} style={styles.ringPhoto} />
            </View>
          </Pressable>
        </View>

        {/* Google Maps sheet */}
        <View style={styles.sheet}>
          {!online ? <OfflineBanner /> : null}
          <Grabber />
          <View style={styles.titleRow}>
            <Text testID="place-name" style={styles.title} numberOfLines={3}>{place.name}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <CircleButton testID="place-share" icon="share-outline" label="Share" onPress={() => setShare(true)} />
              <CircleButton testID="place-close" icon="close" label="Close" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
            </View>
          </View>
          <View style={styles.ratingRow} testID="locals-score-row">
            {place.unrated ? <Text style={styles.gray}>No ratings yet</Text> : (
              <>
                <Text style={styles.scoreNum}>{scoreOutOf10(place.locals)}</Text>
                <Text style={styles.gray}>Locals Score ({compact(signalCount(place))})</Text>
              </>
            )}
            {leg ? <Text style={styles.gray}> · <Icon name={leg.mode === "walk" ? "walk" : leg.mode === "drive" ? "car" : leg.mode === "bike" ? "bicycle" : "bus"} size={15} tint="#5E5E5E" /> {leg.minutes} min</Text> : null}
          </View>
          <Text style={styles.gray}>{[place.kind ?? categoryInfo(place.category).label, cost.dollars ?? (cost.perPerson === 0 && !cost.estimated ? "Free" : null), place.hood].filter(Boolean).join(" · ")}</Text>
          <Text style={[styles.gray, { marginTop: 3 }]} testID="open-status">
            {status_.word ? <Text style={{ color: status_.open ? color.open : color.closed }}>{status_.word}</Text> : null}
            {status_.word ? " · " : ""}{status_.rest}
          </Text>
          {live.google?.openNow != null ? (
            <Text style={[styles.gray, { marginTop: 3 }]} testID="live-hours">Live from Google: <Text style={{ color: live.google.openNow ? color.open : color.closed }}>{live.google.openNow ? "open now" : "closed now"}</Text>{live.google.todayHours ? ` · ${live.google.todayHours}` : ""}</Text>
          ) : null}
          {live.yelp ? <Text style={[styles.gray, { marginTop: 3 }]} testID="live-yelp" onPress={() => openUrl(live.yelp!.url)}>Live on Yelp: ★ {live.yelp.rating.toFixed(1)} ({compact(live.yelp.count)}){live.yelp.price ? ` · ${live.yelp.price}` : ""}</Text> : null}
          {gem ? (
            <View style={styles.gemRow}>
              <Icon name="diamond-outline" size={15} tint="#000" />
              <Text style={styles.gemText}>{gem}</Text>
            </View>
          ) : null}
          <Text style={styles.tags} numberOfLines={2}>{tags.join(" · ")}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          <ActionPill testID="add-to-day" filled icon="add" label="Add to a day" onPress={() => router.push(`/builder?place=${encodeURIComponent(place.id)}`)} />
          <ActionPill testID="action-directions" icon="navigate-outline" label="Directions" onPress={() => openDirections({ ...place }, transport)} />
          <ActionPill testID="action-save" icon={saved ? "bookmark" : "bookmark-outline"} label={saved ? "Saved" : "Save"} onPress={() => { actions.toggleSave(place.id); setToast(saved ? "Removed from Saved" : `${place.name} saved`); }} />
          {place.reserveUrl ? <ActionPill testID="action-reserve" icon="calendar-outline" label="Reserve" onPress={() => openUrl(place.reserveUrl)} /> : null}
          <ActionPill testID="action-rank" icon="ribbon-outline" label="Been? Rank it" onPress={() => router.push(`/rank?place=${encodeURIComponent(place.id)}`)} />
          {place.phone ? <ActionPill testID="action-call" icon="call-outline" label="Call" onPress={() => callNumber(place.phone)} /> : null}
          <ActionPill testID="action-share" icon="share-outline" label="Share" onPress={() => setShare(true)} />
        </ScrollView>

        <MomentsSection place={visible} mine={myMoments} canPost={near} onPost={() => router.push(`/post-moment/${encodeURIComponent(place.id)}`)} />
        <ScoresSection place={place} subreddit={city.subreddit} />
        <QuotesSection place={place} subreddit={city.subreddit} />
        <PhotoCollage place={place} />
        <DetailsSection place={place} day={clock.day} minute={clock.minutes} onDirections={() => openDirections({ ...place }, transport)} onCall={() => callNumber(place.phone)} onReserve={() => openUrl(place.reserveUrl)} />
        <Text style={styles.sourceNote}>Ratings from Google, Yelp and TripAdvisor; local mentions from r/{city.subreddit} and TikTok; courts from OpenStreetMap. Updated {new Date(city.builtAt).toLocaleDateString()}.</Text>
      </ScrollView>
      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 8} />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Anyone with the link can see this spot" url={url} cardTitle={place.name} image={place.image} category={place.category} message={`${place.name} has a Locals Score of ${scoreOutOf10(place.locals)} on Faves`} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 250, backgroundColor: color.cornerLand },
  headerButtons: { position: "absolute", left: 14, right: 14, flexDirection: "row", justifyContent: "space-between" },
  ringWrap: { position: "absolute", alignSelf: "center", width: 108, height: 108, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 108, height: 108, borderRadius: 54 },
  ringInner: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  ringPhoto: { width: 92, height: 92, borderRadius: 46 },
  sheet: { marginTop: -30, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 16, paddingBottom: 4, overflow: "hidden" },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 4 },
  title: { flex: 1, fontFamily: font.sans, fontSize: 22, lineHeight: 28, color: color.gmapsText },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  scoreNum: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: color.score },
  gray: { fontFamily: font.sans, fontSize: 16, color: color.gmapsSub, lineHeight: 22 },
  gemRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  gemText: { fontFamily: font.sans, fontSize: 16, fontStyle: "italic", color: "#000" },
  tags: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: color.brand, marginTop: 8 },
  pills: { paddingHorizontal: 16, gap: 8.6, paddingVertical: 14 },
  sourceNote: { fontFamily: font.sans, fontSize: 12, color: color.textMuted, paddingHorizontal: 16, paddingTop: 18, lineHeight: 17 },
});
