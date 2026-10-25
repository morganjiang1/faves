// Spot Moments: a place's posts, laid out like TikTok's location page
// (video/tiktok/yt_l4HrrhqS7NY_t055_location_page_reviews_posts_favorite.png, 1.71 px/pt) in the
// app's dark colors: back and a faded title, the name in 26 pt heavy, the rating line (here
// the Locals Score), a grey category chip with "More ›", the address with a 36 pt round
// directions button, 8 pt bands between sections, "Reviews" with one review and a full-width
// "View all" button (here What locals say, opening the details sheet), then "Posts": a 3-column
// grid with 1 pt gutters and 3:4 tiles (TikTok's own ratio; the clips are 9:16 and crop to
// fit), each with its play count bottom left (video/tiktok/yt_l4HrrhqS7NY_t029_grid_play_counts.png:
// play glyph + 13 pt semibold) and TikTok's small "Pinned" label shape top left, used here for
// "Taken here". The bottom bar keeps TikTok's layout (a count line on the left, a grey Share
// button and a red Favorite button, here Save), with TikTok's record button
// (moments/tiktok/appstore_05_camera_record_button.png: red disc in a lighter red ring) in
// front of "Post a moment". Posting is only allowed from the spot while it's open.
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pagesFor, playCount, type MomentTab } from "@/components/moments/clips";
import { useSharedMoments } from "@/chat/moments";
import { openForPosting, POST_RADIUS_M } from "@/components/moments/gate";
import { DarkError, DarkMessage } from "@/components/moments/parts";
import { ShareSheet } from "@/components/ShareSheet";
import { SPOT_DARK } from "@/components/spot/DetailsSheet";
import { PageThumb } from "@/components/spot/media";
import { Icon, LoadingPill, OfflineBanner, Toast } from "@/components/ui";
import { metersBetween } from "@/lib/geo";
import { openDirections, shareUrl } from "@/lib/links";
import { compact, scoreOutOf10, signalCount } from "@/lib/score";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { categoryInfo, font } from "@/theme/tokens";

export default function SpotMoments() {
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const placeId = decodeURIComponent(String(params.id));
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const here = useKnownLocation();
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const local = useStore((s) => s.moments[placeId]);
  const shared = useSharedMoments(placeId);
  const mine = useMemo(() => [...(local ?? []), ...shared], [local, shared]);
  const hidden = useStore((s) => s.hidden);
  const saved = useStore((s) => s.saved.includes(placeId));
  const transport = useStore((s) => s.profile.transport);
  const [tab, setTab] = useState<MomentTab>(params.tab === "now" ? "now" : "highlights");
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const place = city?.byId.get(placeId) ?? null;
  const pages = useMemo(() => (place ? pagesFor(place, mine ?? [], hidden, tab) : []), [place, mine, hidden, tab]);
  const nowCount = useMemo(() => (place ? pagesFor(place, mine ?? [], hidden, "now").length : 0), [place, mine, hidden]);
  const close = () => (router.canGoBack() ? router.back() : router.replace(`/place/${encodeURIComponent(placeId)}`));

  const shell = (body: ReactNode, testID: string) => (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID={testID}>
      <StatusBar style="light" />
      <View style={styles.nav}><Pressable testID="moments-close" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close}><Icon name="chevron-back" size={28} tint="#fff" /></Pressable></View>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>{body}</View>
      {!online ? <OfflineBanner /> : null}
    </View>
  );
  if (status === "loading") return shell(<LoadingPill text="Loading moments" />, "moments-loading");
  if (status === "error") return shell(<DarkError title="Couldn't load this spot. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} />, "moments-error");
  if (!place || !city) return shell(<DarkMessage testID="moments-missing" title="Spot not found" body="This spot isn't in the city you have open. Switch cities and try again." cta="Back" onCta={close} />, "moments-missing-screen");

  const near = here ? metersBetween(here, place) <= POST_RADIUS_M : false;
  const openNow = openForPosting(place, clock.day, clock.minutes).ok;
  const tile = Math.floor((Math.min(width, 520) - 2) / 3);
  const posts = pages.filter((p) => p.kind === "clip").length;
  const quote = place.quotes[0] ?? null;
  const toDetails = (t: string) => router.push(`/place/${encodeURIComponent(place.id)}?details=${t}`);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="moments-page">
      <StatusBar style="light" />
      <View style={styles.nav}>
        <Pressable testID="moments-close" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close}><Icon name="chevron-back" size={28} tint="#fff" /></Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{place.name}</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <Text style={styles.title} testID="moments-title">{place.name}</Text>
          {place.unrated ? null : (
            <Pressable accessibilityRole="button" onPress={() => toDetails("scores")} style={styles.ratingRow}>
              <View style={styles.scorePill}><Text style={styles.scorePillText}>{scoreOutOf10(place.locals)}</Text></View>
              <Text style={styles.ratingText}>Locals Score ({compact(signalCount(place))} ratings)</Text>
              <Icon name="chevron-forward" size={14} tint={SPOT_DARK.sub} />
            </Pressable>
          )}
          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={styles.chipText}>{place.kind ?? categoryInfo(place.category).label}</Text></View>
            <Pressable testID="moments-more" accessibilityRole="button" onPress={() => toDetails("details")} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <Text style={styles.more}>More</Text><Icon name="chevron-forward" size={15} tint={SPOT_DARK.sub} />
            </Pressable>
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.address} numberOfLines={2}>{place.address ?? place.hood ?? ""}</Text>
            <Pressable testID="moments-directions" accessibilityRole="button" accessibilityLabel="Directions" onPress={() => openDirections({ ...place }, transport)} style={styles.dirButton}>
              <Icon name="navigate" size={17} tint="#fff" />
            </Pressable>
          </View>
        </View>

        {quote ? (
          <>
            <View style={styles.band} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What locals say</Text>
              <View style={styles.review}>
                <View style={[styles.sourceDisc, { backgroundColor: "#FF4500" }]}><Icon name="logo-reddit" size={22} tint="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>r/{city.subreddit}</Text>
                  <Text style={styles.reviewText} numberOfLines={3}>{quote.text}</Text>
                </View>
              </View>
              <Pressable testID="moments-view-all" accessibilityRole="button" onPress={() => toDetails("locals")} style={styles.viewAll}><Text style={styles.viewAllText}>View all</Text></Pressable>
            </View>
          </>
        ) : null}

        <View style={styles.band} />
        <View style={[styles.section, { paddingBottom: 10 }]}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <View style={styles.tabs}>
            {(["highlights", "now"] as const).map((t) => (
              <Pressable key={t} testID={`moments-tab-${t}`} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === "highlights" ? `Highlights ${posts}` : `Right now ${nowCount}`}</Text>
                <View style={[styles.tabLine, tab !== t && { backgroundColor: "transparent" }]} />
              </Pressable>
            ))}
          </View>
        </View>
        {pages.length ? (
          <View style={styles.grid} testID="moments-grid">
            {pages.map((p, i) => {
              const m = p.kind === "clip" ? p.moment : null;
              return (
                <Pressable key={p.key} testID={`moment-tile-${i}`} accessibilityRole="button" accessibilityLabel={m ? `Post by ${m.mine ? "you" : m.creator}` : "Photo"} onPress={() => router.push(`/place/${encodeURIComponent(place.id)}?i=${i}${tab === "now" ? "&tab=now" : ""}`)} style={{ width: tile, height: Math.round((tile * 4) / 3), overflow: "hidden", backgroundColor: "#1C1A1F" }}>
                  <PageThumb page={p} place={place} />
                  {m?.demo ? <View style={styles.label}><Text style={styles.labelText}>Demo</Text></View> : m?.takenHere ? <View style={styles.label}><Text style={styles.labelText}>Taken here</Text></View> : null}
                  {p.kind === "photo" ? <View style={styles.photoGlyph}><Icon name="images" size={15} tint="#fff" /></View> : null}
                  {m && m.views > 0 ? (
                    <View style={styles.plays}><Icon name="play-outline" size={14} tint="#fff" /><Text style={styles.playsText}>{playCount(m.views)}</Text></View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty} testID="moments-empty">
            <Text style={styles.emptyTitle}>Nothing from the last 24 hours</Text>
            <Text style={styles.emptyBody}>Right now shows posts from today, so you can see if it's busy tonight.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable testID="post-moment" accessibilityRole="button" accessibilityLabel="Post a moment from here" onPress={() => router.push(`/post-moment/${encodeURIComponent(place.id)}`)} style={styles.postWrap}>
          <View style={styles.recordRing}><View style={styles.recordDisc} /></View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.postTitle}>Post a moment</Text>
            <Text style={styles.postSub} numberOfLines={1}>{near && openNow ? "You're here" : "Be here to post"}</Text>
          </View>
        </Pressable>
        <Pressable testID="moments-share" accessibilityRole="button" onPress={() => setShare(true)} style={styles.shareButton}>
          <Icon name="arrow-redo-outline" size={18} tint="#fff" /><Text style={styles.buttonText}>Share</Text>
        </Pressable>
        <Pressable testID="moments-save" accessibilityRole="button" onPress={() => { actions.toggleSave(place.id); setToast(saved ? "Removed from Saved" : `${place.name} saved`); }} style={styles.saveButton}>
          <Icon name={saved ? "bookmark" : "bookmark-outline"} size={17} tint="#fff" /><Text style={styles.buttonText}>{saved ? "Saved" : "Save"}</Text>
        </Pressable>
      </View>
      {!online ? <View style={{ position: "absolute", left: 0, right: 0, top: insets.top + 44 }}><OfflineBanner /></View> : null}
      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 48} />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Send this spot and its moments to a friend" url={shareUrl(`/moments/${encodeURIComponent(place.id)}`)} cardTitle={place.name} image={place.image} category={place.category} message={`Look at ${place.name} on Faves`} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: SPOT_DARK.bg },
  nav: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10 },
  navTitle: { flex: 1, textAlign: "center", fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "rgba(248,248,248,0.35)", marginHorizontal: 8 },
  head: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 16, gap: 10 },
  title: { fontFamily: font.sans, fontSize: 26, lineHeight: 31, fontWeight: "800", color: SPOT_DARK.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  scorePill: { height: 18, borderRadius: 3, backgroundColor: SPOT_DARK.green, paddingHorizontal: 5, justifyContent: "center" },
  scorePillText: { fontFamily: font.sans, fontSize: 12, fontWeight: "800", color: "#06301C" },
  ratingText: { fontFamily: font.sans, fontSize: 15, color: SPOT_DARK.text },
  chipRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  chip: { backgroundColor: SPOT_DARK.raised, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 4 },
  chipText: { fontFamily: font.sans, fontSize: 13, color: SPOT_DARK.text },
  more: { fontFamily: font.sans, fontSize: 15, color: SPOT_DARK.sub },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  address: { flex: 1, fontFamily: font.sans, fontSize: 15, color: SPOT_DARK.sub },
  dirButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: SPOT_DARK.raised, alignItems: "center", justifyContent: "center" },
  band: { height: 8, backgroundColor: "#000" },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  sectionTitle: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: SPOT_DARK.text },
  review: { flexDirection: "row", gap: 10, marginTop: 14, alignItems: "flex-start" },
  sourceDisc: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  reviewName: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: SPOT_DARK.text },
  reviewText: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: SPOT_DARK.text, marginTop: 4 },
  viewAll: { height: 38, borderRadius: 4, backgroundColor: SPOT_DARK.raised, alignItems: "center", justifyContent: "center", marginTop: 14 },
  viewAllText: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: SPOT_DARK.text },
  tabs: { flexDirection: "row", gap: 18, marginTop: 12 },
  tabText: { fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: SPOT_DARK.sub, paddingBottom: 8 },
  tabTextOn: { color: SPOT_DARK.text },
  tabLine: { height: 2, backgroundColor: SPOT_DARK.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 1 },
  label: { position: "absolute", top: 5, left: 5, backgroundColor: SPOT_DARK.red, borderRadius: 2, paddingHorizontal: 4, paddingVertical: 1 },
  labelText: { fontFamily: font.sans, fontSize: 12, fontWeight: "600", color: "#fff" },
  photoGlyph: { position: "absolute", top: 6, right: 6 },
  plays: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 2 },
  playsText: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: "#fff", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 3 },
  empty: { alignItems: "center", paddingHorizontal: 28, paddingVertical: 36, gap: 6 },
  emptyTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: SPOT_DARK.text },
  emptyBody: { fontFamily: font.sans, fontSize: 14, color: SPOT_DARK.sub, textAlign: "center" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 12, backgroundColor: SPOT_DARK.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SPOT_DARK.line },
  postWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  recordRing: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(254,44,85,0.35)", alignItems: "center", justifyContent: "center" },
  recordDisc: { width: 34, height: 34, borderRadius: 17, backgroundColor: SPOT_DARK.red },
  postTitle: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: SPOT_DARK.text },
  postSub: { fontFamily: font.sans, fontSize: 12, color: SPOT_DARK.sub, marginTop: 1 },
  shareButton: { height: 40, borderRadius: 4, backgroundColor: SPOT_DARK.raised, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12 },
  saveButton: { height: 40, borderRadius: 4, backgroundColor: SPOT_DARK.red, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12 },
  buttonText: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: "#fff" },
});
