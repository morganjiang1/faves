// Place page: a full-screen vertical player, the way TikTok plays a place's videos
// (video/tiktok/yt_l4HrrhqS7NY_t045_video_location_anchor_caption_rail.png, 1.71 px/pt on a
// 390 x 844 pt screen). The spot's clips fill the screen, muted and looping, and swiping up
// moves through its other posts and then its photos (photos zoom slowly). Measured from the
// reference:
// - Caption block bottom left, 12 pt in: the location anchor (26 pt tall, 4 pt radius, a
//   translucent dark fill, an 18 pt green #40B49A pin square, 13 pt label) that opens the
//   place's Spot Moments; the bold 17 pt name line (TikTok's username line, here with the
//   Locals Score as a small green pill where TikTok puts "· 1d ago"); 15 pt caption lines.
// - Right rail, centered 29 pt from the right edge, about 60 pt per item: TikTok's 44 pt
//   avatar with a 20 pt red plus (here the spot's photo: Add to a day), then 30 pt glyphs over
//   13 pt semibold labels (Locals say with its count, Save, Share, Directions).
// - A 2 pt progress line with a scrub dot 3 pt above the bottom of the video, and TikTok's
//   black bottom bar with its 37 pt "Add comment..." pill (#363336), here "Been here? Rank it".
// - Photo-mode "1/7" counter top right (moments/tiktok/press_02_local_feed_grid_place_video.jpg).
// Details open in a dark sheet copied from TikTok's comments sheet (components/spot/DetailsSheet).
// Netflix's dark page color and type stay from Home (#110F15, system sans).
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pagesFor, shortAgo, type MomentTab, type SpotPage } from "@/components/moments/clips";
import { DarkError, DarkMessage } from "@/components/moments/parts";
import { ShareSheet } from "@/components/ShareSheet";
import { DetailsSheet, SPOT_DARK, type DetailsTab } from "@/components/spot/DetailsSheet";
import { PageMedia } from "@/components/spot/media";
import { Icon, LoadingPill, OfflineBanner, PlaceImage, Toast, UserDisc, type IconName } from "@/components/ui";
import type { Place } from "@/data/types";
import { statusAt } from "@/lib/hours";
import { callNumber, openDirections, openUrl, shareUrl } from "@/lib/links";
import { costOf, scoreOutOf10 } from "@/lib/score";
import { useCity } from "@/state/city";
import { useCityClock, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { categoryInfo, font } from "@/theme/tokens";

const RAIL_RIGHT = 7; // the rail's right edge, in from the screen edge
const BAR = 45; // TikTok's bottom bar above the home indicator

export default function PlacePage() {
  const params = useLocalSearchParams<{ id: string; reserve?: string; i?: string; tab?: string; details?: string }>();
  const placeId = decodeURIComponent(String(params.id));
  const tab: MomentTab = params.tab === "now" ? "now" : "highlights";
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const saved = useStore((s) => s.saved.includes(placeId));
  const mine = useStore((s) => s.moments[placeId]);
  const hidden = useStore((s) => s.hidden);
  const transport = useStore((s) => s.profile.transport);
  const me = useStore((s) => s.profile.name);
  const [current, setCurrent] = useState(Math.max(0, Number(params.i) || 0));
  const [share, setShare] = useState(false);
  const [sheet, setSheet] = useState<DetailsTab | null>(params.details === "locals" || params.details === "scores" ? params.details : params.details ? "details" : null);
  const [toast, setToast] = useState<string | null>(null);

  const place = city?.byId.get(placeId) ?? null;
  useEffect(() => { if (params.reserve === "1" && place?.reserveUrl) openUrl(place.reserveUrl); }, [params.reserve, place]);
  const pages = useMemo(() => (place ? pagesFor(place, mine ?? [], hidden, tab) : []), [place, mine, hidden, tab]);
  const pageH = height - BAR - Math.max(insets.bottom, 8);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setCurrent(first.index);
  }).current;
  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace("/")), []);

  const shell = (body: ReactNode, testID: string) => (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID={testID}>
      <StatusBar style="light" />
      <View style={styles.bareTop}>
        <Pressable testID="place-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close}><Icon name="chevron-back" size={28} tint="#fff" /></Pressable>
      </View>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>{body}</View>
      {!online ? <OfflineBanner /> : null}
    </View>
  );
  if (status === "loading") return shell(<LoadingPill text="Loading this spot" />, "place-loading");
  if (status === "error") return shell(<DarkError testID="place-error" title="Couldn't load this spot. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} />, "place-error-screen");
  if (!place || !city) return shell(<DarkMessage testID="place-missing" title="Spot not found" body={`We couldn't find this spot in ${city?.name ?? "this city"}. It may be in another city you've switched away from.`} cta="Back to Home" onCta={() => router.replace("/")} />, "place-missing-screen");

  const toggleSave = () => { actions.toggleSave(place.id); setToast(saved ? "Removed from Saved" : `${place.name} saved`); };
  const directions = () => openDirections({ ...place }, transport);
  const rank = () => { setSheet(null); router.push(`/rank?place=${encodeURIComponent(place.id)}`); };
  const posts = pages.filter((p) => p.kind === "clip").length;
  const idx = Math.min(current, pages.length - 1);

  return (
    <View style={styles.screen} testID="place-page">
      <StatusBar style="light" />
      <FlatList
        data={pages}
        keyExtractor={(p) => p.key}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={Math.min(current, Math.max(0, pages.length - 1))}
        getItemLayout={(_, index) => ({ length: pageH, offset: pageH * index, index })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        style={{ height: pageH, flexGrow: 0 }}
        renderItem={({ item, index }) => (
          <View style={{ width, height: pageH, overflow: "hidden" }} testID={`place-page-${index}`}>
            <PageMedia page={item} place={place} active={focused && index === idx && !share} />
            <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} style={styles.scrim} />
            <Caption page={item} place={place} subreddit={city.subreddit} day={clock.day} minute={clock.minutes} posts={posts} index={index}
              onMoments={() => router.push(`/moments/${encodeURIComponent(place.id)}`)} onDetails={(t) => setSheet(t)} />
            <Rail place={place} saved={saved} index={index} onAdd={() => router.push(`/builder?place=${encodeURIComponent(place.id)}`)} onLocals={() => setSheet("locals")} onSave={toggleSave} onShare={() => setShare(true)} onDirections={directions} />
            {item.kind === "clip" ? <Progress seconds={item.moment.duration} active={focused && index === idx} /> : null}
          </View>
        )}
      />
      <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]} style={[styles.topShade, { height: insets.top + 64 }]} />
      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Pressable testID="place-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close} style={styles.backHit}>
          <Icon name="chevron-back" size={28} tint="#fff" />
        </Pressable>
        {pages.length > 1 ? <Text testID="place-counter" style={styles.counter}>{idx + 1}/{pages.length}</Text> : null}
      </View>
      {!online ? <View style={{ position: "absolute", left: 0, right: 0, top: insets.top + 48 }}><OfflineBanner /></View> : null}

      {/* TikTok's bottom bar: its "Add comment..." pill becomes "Been here? Rank it". */}
      <View style={[styles.bottomBar, { height: BAR + Math.max(insets.bottom, 8), paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable testID="action-rank" accessibilityRole="button" onPress={rank} style={styles.bottomPill}>
          <Text style={styles.bottomPillText}>Been here? Rank it</Text>
          <Icon name="ribbon-outline" size={20} tint="#fff" />
        </Pressable>
      </View>

      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 48} />
      <DetailsSheet open={sheet != null} tab={sheet ?? "details"} place={place} subreddit={city.subreddit} day={clock.day} minute={clock.minutes} me={me}
        onClose={() => setSheet(null)} onDirections={directions} onCall={() => callNumber(place.phone)} onReserve={() => openUrl(place.reserveUrl)} onRank={rank} />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Anyone with the link can see this spot" url={shareUrl(`/place/${encodeURIComponent(place.id)}`)} cardTitle={place.name} image={place.image} category={place.category} message={`${place.name} has a Locals Score of ${scoreOutOf10(place.locals)} on Faves`} />
    </View>
  );
}

// Bottom-left caption: Spot Moments anchor, name + score, what it is, open now, one real
// quote, and the poster's username for a clip.
function Caption({ page, place, subreddit, day, minute, posts, index, onMoments, onDetails }: {
  page: SpotPage; place: Place; subreddit: string; day: number; minute: number; posts: number; index: number;
  onMoments: () => void; onDetails: (t: DetailsTab) => void;
}) {
  const cost = costOf(place);
  const st = statusAt(place, day, minute);
  const kindLine = [place.kind ?? categoryInfo(place.category).label, cost.dollars ?? (cost.perPerson === 0 && !cost.estimated ? "Free" : null), place.hood].filter(Boolean).join(" · ");
  const quote = place.quotes.find((q) => q.source === "reddit") ?? null;
  const m = page.kind === "clip" ? page.moment : null;
  const first = index === 0 ? "" : `-${index}`;
  return (
    <View style={styles.caption} pointerEvents="box-none">
      <Pressable testID={`moments-anchor${first}`} accessibilityRole="button" accessibilityLabel="Open Spot Moments" onPress={onMoments} style={styles.anchor}>
        <View style={styles.anchorPin}><Icon name="location" size={12} tint="#fff" /></View>
        <Text style={styles.anchorText} numberOfLines={1}>Spot Moments · {posts ? `${posts} ${posts === 1 ? "post" : "posts"}` : "post the first"}</Text>
      </Pressable>
      <Pressable testID={index === 0 ? "place-caption" : undefined} accessibilityRole="button" accessibilityLabel={`${place.name} details`} onPress={() => onDetails("details")}>
        <View style={styles.nameRow} testID={index === 0 ? "locals-score-row" : undefined}>
          <Text testID={index === 0 ? "place-name" : undefined} style={styles.name} numberOfLines={2}>{place.name}</Text>
          {place.unrated ? null : <View style={styles.scorePill}><Text style={styles.scorePillText}>{scoreOutOf10(place.locals)}</Text></View>}
        </View>
        <Text style={styles.line} numberOfLines={1}>{kindLine}</Text>
        <Text style={styles.line} numberOfLines={1} testID={index === 0 ? "open-status" : undefined}>
          {st.state !== "unknown" ? <Text style={{ fontWeight: "700", color: st.state === "open" ? SPOT_DARK.green : SPOT_DARK.orange }}>{st.word}</Text> : null}
          {st.state !== "unknown" && st.detail ? " · " : ""}{st.state === "unknown" ? (place.court ? (place.court.lit ? "Lit at night" : "Daylight only") : "Hours not listed") : st.detail}
        </Text>
      </Pressable>
      {quote ? (
        <Pressable accessibilityRole="button" onPress={() => onDetails("locals")}>
          <Text style={styles.quote} numberOfLines={2}>“{quote.text}” <Text style={styles.quoteSource}>r/{subreddit}</Text></Text>
        </Pressable>
      ) : null}
      {m ? (
        <View style={styles.poster}>
          <UserDisc name={m.mine ? "you" : m.creator} size={18} />
          <Text style={styles.posterName} numberOfLines={1}>{m.mine ? "You" : `@${m.creator}`}</Text>
          {m.postedAt ? <Text style={styles.posterWhen}>· {shortAgo(m.postedAt)} ago</Text> : null}
          {m.demo ? <Text style={styles.posterWhen}>· Demo, not verified</Text> : m.takenHere ? <Text style={styles.posterWhen}>· Taken here</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function Rail({ place, saved, index, onAdd, onLocals, onSave, onShare, onDirections }: {
  place: Place; saved: boolean; index: number; onAdd: () => void; onLocals: () => void; onSave: () => void; onShare: () => void; onDirections: () => void;
}) {
  const id = (s: string) => (index === 0 ? s : `${s}-${index}`);
  return (
    <View style={styles.rail} pointerEvents="box-none">
      <Pressable testID={id("add-to-day")} accessibilityRole="button" accessibilityLabel="Add to a day" onPress={onAdd} style={styles.avatarWrap}>
        <View style={styles.avatar}><PlaceImage uri={place.image} category={place.category} style={{ width: 42, height: 42, borderRadius: 21 }} emojiSize={20} /></View>
        <View style={styles.plus}><Icon name="add" size={15} tint="#fff" /></View>
      </Pressable>
      <RailItem testID={id("action-locals")} icon="chatbubble-ellipses" label={place.quotes.length ? `${place.quotes.length}` : "Locals"} a11y="What locals say" onPress={onLocals} />
      <RailItem testID={id("action-save")} icon="bookmark" tint={saved ? "#FACE15" : "#fff"} label={saved ? "Saved" : "Save"} a11y={saved ? "Remove from Saved" : "Save"} onPress={onSave} />
      <RailItem testID={id("action-share")} icon="arrow-redo" label="Share" a11y="Share" onPress={onShare} />
      <RailItem testID={id("action-directions")} icon="navigate" label="Go" a11y="Directions" onPress={onDirections} />
    </View>
  );
}

function RailItem({ icon, label, a11y, onPress, testID, tint = "#fff" }: { icon: IconName; label: string; a11y: string; onPress: () => void; testID: string; tint?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} style={styles.railItem}>
      <Icon name={icon} size={30} tint={tint} />
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
}

// TikTok's progress line: played white with a scrub dot, the rest translucent; loops with the clip.
function Progress({ seconds, active }: { seconds: number | null; active: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    if (!active) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: Math.max(1, seconds ?? 4) * 1000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [active, seconds, v]);
  const w = v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={styles.track} pointerEvents="none" testID="place-progress">
      <Animated.View style={[styles.played, { width: w }]} />
      <Animated.View style={[styles.dot, { left: w }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  bareTop: { height: 48, justifyContent: "center", paddingHorizontal: 12 },
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 300 },
  topShade: { position: "absolute", top: 0, left: 0, right: 0 },
  top: { position: "absolute", left: 6, right: 14, height: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backHit: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  counter: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: "#fff", textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 3 },
  caption: { position: "absolute", left: 12, right: 76, bottom: 12, gap: 4 },
  anchor: { alignSelf: "flex-start", height: 26, borderRadius: 4, backgroundColor: "rgba(40,36,38,0.72)", flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 4, paddingRight: 8, marginBottom: 6, maxWidth: "100%" },
  anchorPin: { width: 18, height: 18, borderRadius: 3, backgroundColor: "#40B49A", alignItems: "center", justifyContent: "center" },
  anchorText: { fontFamily: font.sans, fontSize: 13, color: "#fff", flexShrink: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  name: { fontFamily: font.sans, fontSize: 17, lineHeight: 21, fontWeight: "700", color: "#fff", flexShrink: 1, textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 3 },
  scorePill: { height: 18, borderRadius: 3, backgroundColor: SPOT_DARK.green, paddingHorizontal: 5, justifyContent: "center" },
  scorePillText: { fontFamily: font.sans, fontSize: 12, fontWeight: "800", color: "#06301C" },
  line: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: "#fff", marginTop: 2, textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 3 },
  quote: { fontFamily: font.sans, fontSize: 14, lineHeight: 19, color: "rgba(255,255,255,0.92)", marginTop: 4 },
  quoteSource: { fontWeight: "700", color: "rgba(255,255,255,0.7)" },
  poster: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  posterName: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: "#fff", flexShrink: 1 },
  posterWhen: { fontFamily: font.sans, fontSize: 13, color: "rgba(255,255,255,0.72)" },
  rail: { position: "absolute", right: RAIL_RIGHT, bottom: 70, width: 58, alignItems: "center", gap: 14 },
  avatarWrap: { width: 48, height: 56, alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden", backgroundColor: "#222" },
  plus: { position: "absolute", top: 34, width: 20, height: 20, borderRadius: 10, backgroundColor: SPOT_DARK.red, alignItems: "center", justifyContent: "center" },
  railItem: { alignItems: "center", gap: 3, minWidth: 48 },
  railLabel: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: "#fff", textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 3 },
  track: { position: "absolute", left: 12, right: 12, bottom: 3, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.25)" },
  played: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#fff", borderRadius: 1 },
  dot: { position: "absolute", top: -2, width: 6, height: 6, marginLeft: -3, borderRadius: 3, backgroundColor: "#fff" },
  bottomBar: { backgroundColor: "#000", paddingHorizontal: 12, justifyContent: "center", paddingTop: 4 },
  bottomPill: { height: 37, borderRadius: 18.5, backgroundColor: "#363336", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 16, paddingRight: 14 },
  bottomPillText: { fontFamily: font.sans, fontSize: 15, color: "#A8A8A8" },
});
