// A day's page. Header copies Beli's post page (social/beli/appstore_03_feed_post_ranked_share.png:
// plain back chevron, then the post header, Notes and kudos); the map copies Wanderlog's route
// map (plans/wanderlog/appstore_04_road_trip_route_map_numbered_stops.png: 26x37 numbered
// teardrops in the day color, route line at about 60%, walk legs dotted like Citymapper);
// the stops copy Airbnb's "What you'll do" list (plans/airbnb/android_video_2025_experience_
// what_youll_do.png: 76 pt square photo radius 8, 20 pt gap, bold title, grey 2-line
// description, a thin #EBEBEB line joining the photos); the footer copies Airbnb's floating
// listing footer (android_video_2025_experience_detail_show_dates.png: white pill card 15 pt
// from the edges, price at the left, a 162x49 pt pill button at the right).
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import FavesMap from "@/components/map/FavesMap";
import type { MapPin, RouteSegment } from "@/components/map/types";
import { ShareSheet } from "@/components/ShareSheet";
import { fromMine, fromPlan, stopPlaces, type DayPost } from "@/components/social/dayPost";
import { Facepile, NotesLine, PostHeader, ReorderPill } from "@/components/social/FeedPost";
import { doThisDay, facesFor, useCommunityPosts } from "@/components/social/useDays";
import { EmptyState, ErrorState, Icon, OfflineBanner, SampleTag, Skeleton, SkeletonRows, Toast, type IconName } from "@/components/ui";
import { StopClip } from "@/components/video/StopClip";
import { ViewportProvider, useViewport } from "@/components/video/viewport";
import { CITY_INDEX } from "@/data/cities";
import type { City } from "@/data/types";
import { formatLeg, type Mode } from "@/lib/geo";
import { openDirections, shareUrl } from "@/lib/links";
import { planCost } from "@/lib/planner";
import { formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { color, font, shadow } from "@/theme/tokens";

const MODE_ICON: Record<Mode, IconName> = { walk: "walk", transit: "bus", drive: "car", bike: "bicycle" };
const MODE_WORD: Record<Mode, string> = { walk: "on foot", transit: "by transit", drive: "by car", bike: "by bike" };

export default function DayPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dayId = decodeURIComponent(String(id ?? ""));
  const { city, status, error, retry } = useCity();
  const community = useCommunityPosts(city);
  const posts = useStore((s) => s.posts);
  const plans = useStore((s) => s.plans);
  const profile = useStore((s) => s.profile);
  const likes = useStore((s) => s.likes);
  const savedDays = useStore((s) => s.savedDays);
  const doneDays = useStore((s) => s.doneDays);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // A community day, one of your posts, or one of your plans. undefined = still loading.
  const found = useMemo((): { post: DayPost | null; otherCity: string | null } | undefined => {
    if (!city) return undefined;
    const mine = posts.find((p) => p.id === dayId);
    const plan = mine ? plans[mine.planId] : plans[dayId];
    if (plan) {
      if (plan.citySlug !== city.slug) return { post: null, otherCity: plan.citySlug };
      return { post: mine ? fromMine(mine, plan, city, profile) : fromPlan(plan, city, profile), otherCity: null };
    }
    const other = CITY_INDEX.find((c) => dayId.startsWith(`${c.slug}-day`));
    if (other && other.slug !== city.slug) return { post: null, otherCity: other.slug };
    if (!community) return undefined;
    return { post: community.find((p) => p.id === dayId) ?? null, otherCity: null };
  }, [city, community, posts, plans, profile, dayId]);

  const back = () => (router.canGoBack() ? router.back() : router.replace("/feed"));
  const post = found?.post ?? null;
  const saved = post ? savedDays.includes(post.id) : false;

  const nav = (
    <View style={styles.nav}>
      <Pressable testID="day-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={back}>
        <Icon name="chevron-back" size={28} tint="#000" />
      </Pressable>
      {post ? (
        <View style={{ flexDirection: "row", gap: 20 }}>
          <Pressable testID="day-share" accessibilityRole="button" accessibilityLabel="Share this day" hitSlop={8} onPress={() => setShare(true)}>
            <Icon name="share-outline" size={25} tint="#000" />
          </Pressable>
          {post.kind === "community" ? (
            <Pressable testID="day-save" accessibilityRole="button" accessibilityLabel={saved ? "Remove from saved days" : "Save this day"} accessibilityState={{ selected: saved }} hitSlop={8} onPress={() => { setToast(saved ? "Removed from saved days" : "Saved to your days"); actions.toggleSaveDay(post.id); }}>
              <Icon name={saved ? "bookmark" : "bookmark-outline"} size={25} tint={saved ? color.brand : "#000"} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (status === "error") {
    return <SafeAreaView style={styles.screen}>{nav}<View style={{ flex: 1, justifyContent: "center" }}><ErrorState title="Couldn't load this day. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} testID="day-error" /></View></SafeAreaView>;
  }
  if (status === "loading" || !city || found === undefined) {
    return (
      <SafeAreaView style={styles.screen} testID="day-loading">
        {nav}
        <View style={{ flexDirection: "row", gap: 22, paddingHorizontal: 14, paddingTop: 8 }}>
          <Skeleton style={{ width: 60, height: 60, borderRadius: 30 }} />
          <View style={{ flex: 1, gap: 10, paddingTop: 6 }}>
            <Skeleton style={{ width: "85%", height: 12, borderRadius: 6 }} />
            <Skeleton style={{ width: "60%", height: 10, borderRadius: 5 }} />
          </View>
        </View>
        <Skeleton style={{ height: 230, borderRadius: 0, marginTop: 24 }} />
        <SkeletonRows rows={3} />
      </SafeAreaView>
    );
  }
  if (!post) {
    const other = found.otherCity ? CITY_INDEX.find((c) => c.slug === found.otherCity) : null;
    return (
      <SafeAreaView style={styles.screen} testID="day-missing">
        {nav}
        <View style={{ flex: 1, justifyContent: "center" }}>
          {other ? (
            <EmptyState icon="map-outline" title={`This day is in ${other.name}`} body={`You're looking at ${city.name}. Switch cities to see this day and its stops.`} cta={`Switch to ${other.name}`} onCta={() => actions.updateProfile({ city: other.slug })} secondary="Back" onSecondary={back} testID="day-other-city" />
          ) : (
            <EmptyState icon="calendar-outline" title="Day not found" body="It may have been removed, or the link is from an older version of the app." cta="See popular days" onCta={() => router.replace("/feed")} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen} testID="day-page">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>{nav}</SafeAreaView>
      {!online ? <OfflineBanner /> : null}
      <DayBody post={post} city={city} liked={likes.includes(post.id)} faces={community ? facesFor(post, community, 0) : []} bottomPad={insets.bottom + 100} />
      <Footer post={post} city={city} done={doneDays.includes(post.id)} bottom={Math.max(insets.bottom, 12)} />
      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Share this day"
        subtitle="Friends can open it and copy it, no app needed."
        url={shareUrl(`/day/${encodeURIComponent(post.id)}`)}
        cardTitle={post.plan.title}
        image={stopPlaces(post.plan, city).find((p) => p.image)?.image ?? null}
        message={`${post.plan.title}, ${post.plan.stops.length} stops on Faves`}
      />
      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 50} />
    </View>
  );
}

function DayBody({ post, city, liked, faces, bottomPad }: { post: DayPost; city: City; liked: boolean; faces: string[]; bottomPad: number }) {
  const view = useViewport();
  const stops = post.plan.stops.map((s) => ({ s, p: city.byId.get(s.placeId) })).filter((x): x is { s: (typeof post.plan.stops)[number]; p: NonNullable<ReturnType<City["byId"]["get"]>> } => Boolean(x.p));
  const pins: MapPin[] = stops.map(({ p }, i) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: "number", number: i + 1, color: color.dayColor }));
  const routes: RouteSegment[] = stops.slice(1).map(({ s, p }, i) => ({ points: [{ lat: stops[i].p.lat, lng: stops[i].p.lng }, { lat: p.lat, lng: p.lng }], walk: s.leg?.mode === "walk" }));
  const count = post.likes + (liked ? 1 : 0);
  const plan = post.plan;
  const miles = plan.stops.reduce((m, s) => m + (s.leg?.miles ?? 0), 0);
  const reelBase = post.kind === "mine" ? `/reel?plan=${encodeURIComponent(plan.id)}` : `/reel?day=${encodeURIComponent(post.id)}`;
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }} testID="day-scroll" onScroll={view.onScroll} scrollEventThrottle={64} onLayout={view.onLayout}>
      <ViewportProvider vp={view.vp}>
      <PostHeader post={post} city={city} testID="day-header" />
      <View style={{ paddingHorizontal: 21 }}>
        <View style={{ marginTop: -8 }}><NotesLine post={post} subreddit={city.subreddit} testID="day-notes" /></View>
        {/* Strava kudos line (appstore_02): thumbs-up + count + 29 pt faces, step 27 pt. */}
        <Pressable testID="day-like" accessibilityRole="button" accessibilityLabel={liked ? "Unlike this day" : "Love this day"} accessibilityState={{ selected: liked }} onPress={() => actions.toggleLike(post.id)} style={styles.kudos}>
          <Icon name={liked ? "thumbs-up" : "thumbs-up-outline"} size={23} tint={liked ? color.strava : "#000"} />
          {count > 0 ? <Text style={styles.kudosCount}>{count}</Text> : null}
          {count > 0 ? <Facepile names={liked ? ["You", ...faces].slice(0, 5) : faces} size={29} /> : <Text style={styles.kudosText}>Be the first to love this day</Text>}
          {post.sample ? <View style={{ marginLeft: 4 }}><SampleTag /></View> : null}
        </Pressable>
        {post.kind === "mine" ? (
          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <ReorderPill testID="day-open-plan" icon="map-outline" label="Open your plan" onPress={() => router.push(`/plan/${encodeURIComponent(plan.id)}`)} />
          </View>
        ) : null}
      </View>

      <View style={styles.mapWrap} testID="day-map-wrap">
        {pins.length ? (
          <FavesMap testID="day-map" style={StyleSheet.absoluteFill} center={{ lat: pins[0].lat, lng: pins[0].lng }} span={0.05} pins={pins} routes={routes} fitToPins showLabels={false} onPinPress={(pid) => router.push(`/place/${encodeURIComponent(pid)}`)} />
        ) : null}
        {stops.length ? (
          // Wanderlog's 43 pt white map control at the top right: directions to the first stop.
          <Pressable testID="day-directions" accessibilityRole="button" accessibilityLabel={`Directions to ${stops[0].p.name}`} onPress={() => openDirections({ lat: stops[0].p.lat, lng: stops[0].p.lng, name: stops[0].p.name }, plan.transport)} style={[styles.mapControl, shadow.soft]}>
            <Icon name="navigate" size={20} tint={color.dayColor} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 22 }}>
        <Text style={styles.h2} accessibilityRole="header">What you'll do</Text>
        <Text style={styles.sub}>{plan.stops.length} stops · {formatClock(plan.start, { compact: true })} to {formatClock(plan.end, { compact: true })} · {miles >= 0.1 ? `${miles.toFixed(1)} mi between stops` : MODE_WORD[plan.transport]}</Text>
        <View style={{ marginTop: 18 }}>
          {stops.map(({ s, p }, i) => (
            <View key={s.key} style={styles.stop}>
              {i < stops.length - 1 ? <View style={styles.connector} /> : null}
              <StopClip testID={`day-stop-clip-${i}`} place={p} reel={`${reelBase}&i=${i}`} />
              <Pressable testID={`day-stop-${i}`} accessibilityRole="button" accessibilityLabel={`Stop ${i + 1}: ${p.name}`} onPress={() => router.push(`/place/${encodeURIComponent(p.id)}`)} style={{ flex: 1 }}>
                <Text style={styles.stopTitle} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.stopDesc} numberOfLines={2}>{s.why}</Text>
                <View style={styles.legRow}>
                  <Icon name={s.leg ? MODE_ICON[s.leg.mode] : "time-outline"} size={14} tint={color.airbnbSub} />
                  <Text style={styles.legText} numberOfLines={1}>{formatClock(s.start)}{s.leg ? ` · ${formatLeg(s.leg)}` : " · first stop"}</Text>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
      </ViewportProvider>
    </ScrollView>
  );
}

function Footer({ post, city, done, bottom }: { post: DayPost; city: City; done: boolean; bottom: number }) {
  const cost = planCost(post.plan, city);
  const price = cost.perPerson > 0 ? `${cost.estimated ? "About " : ""}$${Math.round(cost.perPerson)}` : "Free";
  return (
    <View style={[styles.footer, shadow.card, { bottom }]} testID="day-footer">
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={styles.footTop} numberOfLines={1}><Text style={{ fontWeight: "700" }}>{price}</Text>{cost.perPerson > 0 ? " / person" : " to do"}</Text>
        <Text style={styles.footSub} numberOfLines={1}>{post.plan.stops.length} stops · {formatClock(post.plan.start, { compact: true })} to {formatClock(post.plan.end, { compact: true })}</Text>
      </View>
      <Pressable testID="day-do" accessibilityRole="button" accessibilityLabel={done ? "Do this day again" : "Do this day"} onPress={() => doThisDay(post, city)} style={({ pressed }) => [styles.footButton, pressed && { opacity: 0.8 }]}>
        <Text style={styles.footButtonText}>{done || post.kind === "mine" ? "Do it again" : "Do this day"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  nav: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  kudos: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18, flexWrap: "wrap" },
  kudosCount: { fontFamily: font.sans, fontSize: 16, color: "#000", marginRight: 4 },
  kudosText: { fontFamily: font.sans, fontSize: 14, color: "#323232" },
  mapControl: { position: "absolute", top: 12, right: 12, width: 43, height: 43, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", zIndex: 500 },
  mapWrap: { height: 250, marginTop: 22, backgroundColor: color.cornerLand, overflow: "hidden" },
  h2: { fontFamily: font.sans, fontSize: 22, fontWeight: "600", color: color.airbnbText, marginTop: 24 },
  sub: { fontFamily: font.sans, fontSize: 15, color: color.airbnbSub, marginTop: 4 },
  stop: { flexDirection: "row", gap: 16, marginBottom: 18 },
  connector: { position: "absolute", left: 24.25, top: 75, bottom: -18, width: 1.5, backgroundColor: "#EBEBEB" },
  stopTitle: { fontFamily: font.sans, fontSize: 18, lineHeight: 23, fontWeight: "600", color: color.airbnbText },
  stopDesc: { fontFamily: font.sans, fontSize: 16, lineHeight: 22, color: color.airbnbSub, marginTop: 2 },
  legRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  legText: { fontFamily: font.sans, fontSize: 14, color: color.airbnbSub, flexShrink: 1 },
  footer: { position: "absolute", left: 15, right: 15, minHeight: 61, borderRadius: 31, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", paddingLeft: 22, paddingRight: 6, paddingVertical: 6, maxWidth: Platform.OS === "web" ? 490 : undefined },
  footTop: { fontFamily: font.sans, fontSize: 16, color: color.airbnbText },
  footSub: { fontFamily: font.sans, fontSize: 12, color: color.airbnbSub, marginTop: 2 },
  footButton: { width: 162, height: 49, borderRadius: 25, backgroundColor: color.brand, alignItems: "center", justifyContent: "center" },
  footButtonText: { fontFamily: font.sans, color: "#fff", fontSize: 17, fontWeight: "600" },
});
