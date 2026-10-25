// Spot Moments as a postcard wall: everything people posted at a spot, pinned up as tilted
// postcards on paper (who posted it, how long ago, "Taken here" when the phone was really there
// while it was open). The spot's name and Locals Score stamp on top, then the wall with
// Highlights and Right now, and a bar to post your own (only from the spot), share or save. A grid of a place's posts is inspired by Instagram's location pages.
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { pagesFor, playCount, type MomentTab } from "@/components/moments/clips";
import { useSharedMoments } from "@/chat/moments";
import { openForPosting, POST_RADIUS_M } from "@/components/moments/gate";
import { shortAgo } from "@/components/moments/clips";
import { ShareSheet } from "@/components/ShareSheet";
import { PageThumb } from "@/components/spot/media";
import { EmptyState, ErrorState, Icon, LoadingPill, OfflineBanner, Stamp, Toast } from "@/components/ui";
import { metersBetween } from "@/lib/geo";
import { shareUrl } from "@/lib/links";
import { compact, rankedBy, scoreOutOf10 } from "@/lib/score";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { categoryInfo, font, palette } from "@/theme/tokens";

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
  const [tab, setTab] = useState<MomentTab>(params.tab === "now" ? "now" : "highlights");
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const place = city?.byId.get(placeId) ?? null;
  const pages = useMemo(() => (place ? pagesFor(place, mine ?? [], hidden, tab) : []), [place, mine, hidden, tab]);
  const nowCount = useMemo(() => (place ? pagesFor(place, mine ?? [], hidden, "now").length : 0), [place, mine, hidden]);
  const close = () => (router.canGoBack() ? router.back() : router.replace(`/place/${encodeURIComponent(placeId)}`));

  const shell = (body: ReactNode, testID: string) => (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID={testID}>
      <StatusBar style="dark" />
      <View style={styles.nav}><Pressable testID="moments-close" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close}><Icon name="chevron-back" size={28} tint={palette.ink} /></Pressable></View>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>{body}</View>
      {!online ? <OfflineBanner /> : null}
    </View>
  );
  if (status === "loading") return shell(<LoadingPill text="Loading moments" />, "moments-loading");
  if (status === "error") return shell(<ErrorState title="Couldn't load this spot. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} />, "moments-error");
  if (!place || !city) return shell(<EmptyState testID="moments-missing" icon="images-outline" title="Spot not found" body="This spot isn't in the city you have open. Switch cities and try again." cta="Back" onCta={close} />, "moments-missing-screen");

  const near = here ? metersBetween(here, place) <= POST_RADIUS_M : false;
  const openNow = openForPosting(place, clock.day, clock.minutes).ok;
  const tile = Math.floor((Math.min(width, 520) - 16 * 2 - 14) / 2);
  const posts = pages.filter((p) => p.kind === "clip").length;
  const toDetails = (t: string) => router.push(`/place/${encodeURIComponent(place.id)}?details=${t}`);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID="moments-page">
      <StatusBar style="dark" />
      <View style={styles.nav}>
        <Pressable testID="moments-close" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close}><Icon name="chevron-back" size={28} tint={palette.ink} /></Pressable>
        <Text style={styles.navTitle}>moments</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={styles.title} testID="moments-title">{place.name}</Text>
            <View style={styles.chipRow}>
              <View style={styles.chip}><Text style={styles.chipText}>{place.kind ?? categoryInfo(place.category).label}</Text></View>
              <Pressable testID="moments-more" accessibilityRole="button" onPress={() => toDetails("details")} style={styles.moreLink}>
                <Text style={styles.more}>details</Text><Icon name="arrow-forward" size={14} tint={palette.roseInk} />
              </Pressable>
            </View>
          </View>
          {place.unrated ? null : (
            <Pressable accessibilityRole="button" accessibilityLabel={`Locals Score ${scoreOutOf10(place.locals)}, ranked by ${compact(rankedBy(place))} locals`} onPress={() => toDetails("scores")}>
              <Stamp score={scoreOutOf10(place.locals)} count={compact(rankedBy(place))} size={68} tilt={8} />
            </Pressable>
          )}
        </View>

        <View style={styles.tabs}>
          {(["highlights", "now"] as const).map((t) => (
            <Pressable key={t} testID={`moments-tab-${t}`} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabOn]}>
              <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === "highlights" ? `highlights ${posts}` : `right now ${nowCount}`}</Text>
            </Pressable>
          ))}
        </View>
        {pages.length ? (
          <View style={styles.grid} testID="moments-grid">
            {pages.map((p, i) => {
              const m = p.kind === "clip" ? p.moment : null;
              return (
                <Pressable key={p.key} testID={`moment-tile-${i}`} accessibilityRole="button" accessibilityLabel={m ? `Post by ${m.mine ? "you" : m.creator}` : "Photo"} onPress={() => router.push(`/place/${encodeURIComponent(place.id)}?i=${i}${tab === "now" ? "&tab=now" : ""}`)} style={[styles.card, { width: tile, transform: [{ rotate: `${[-2.5, 2, 1.5, -1.5][i % 4]}deg` }] }]}>
                  <View style={[styles.cardPhoto, { height: Math.round(tile * 1.2) }]}>
                    <PageThumb page={p} place={place} />
                    {m && m.views > 0 ? <View style={styles.plays}><Icon name="play" size={11} tint={palette.cream} /><Text style={styles.playsText}>{playCount(m.views)}</Text></View> : null}
                    {p.kind === "photo" ? <View style={styles.plays}><Icon name="images" size={12} tint={palette.cream} /></View> : null}
                  </View>
                  <View style={styles.cardFoot}>
                    <Text style={styles.cardWho} numberOfLines={1}>{m ? (m.mine ? "you" : `@${m.creator}`) : "photo"}</Text>
                    {m?.demo ? <Text style={[styles.mark, styles.markDemo]}>demo</Text> : m?.takenHere ? <Text style={styles.mark}>taken here</Text> : m?.postedAt ? <Text style={styles.cardAgo}>{shortAgo(m.postedAt)}</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty} testID="moments-empty">
            <Text style={styles.emptyTitle}>Nothing from the last 24 hours</Text>
            <Text style={styles.emptyBody}>Posts from today show here.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable testID="post-moment" accessibilityRole="button" accessibilityLabel="Post a moment from here" onPress={() => router.push(`/post-moment/${encodeURIComponent(place.id)}`)} style={styles.postWrap}>
          <View style={styles.recordRing}><View style={styles.recordDisc} /></View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.postTitle}>Pin one up</Text>
            <Text style={styles.postSub} numberOfLines={1}>{near && openNow ? "You're here" : "Be here to post"}</Text>
          </View>
        </Pressable>
        <Pressable testID="moments-share" accessibilityRole="button" accessibilityLabel="Share" onPress={() => setShare(true)} style={styles.round}>
          <Icon name="share-outline" size={19} tint={palette.ink} />
        </Pressable>
        <Pressable testID="moments-save" accessibilityRole="button" accessibilityLabel={saved ? "Saved" : "Save"} onPress={() => { actions.toggleSave(place.id); setToast(saved ? "Removed from Saved" : `${place.name} saved`); }} style={[styles.round, saved && { backgroundColor: palette.roseTint, borderColor: palette.rose }]}>
          <Icon name={saved ? "heart" : "heart-outline"} size={19} tint={palette.roseInk} />
        </Pressable>
      </View>
      {!online ? <View style={{ position: "absolute", left: 0, right: 0, top: insets.top + 44 }}><OfflineBanner /></View> : null}
      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 48} />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Send this spot and its postcard wall to a friend" url={shareUrl(`/moments/${encodeURIComponent(place.id)}`)} cardTitle={place.name} image={place.image} category={place.category} message={`Look at ${place.name} on Faves`} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  nav: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10 },
  navTitle: { fontFamily: font.sans, fontSize: 12, fontWeight: "800", color: palette.roseInk, letterSpacing: 1.2, textTransform: "uppercase" },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 32, color: palette.ink },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  chip: { backgroundColor: palette.paperDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: palette.ink },
  moreLink: { flexDirection: "row", alignItems: "center", gap: 3 },
  more: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.roseInk },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 14 },
  tab: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: palette.paperDeep },
  tabOn: { backgroundColor: palette.ink },
  tabText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.ink },
  tabTextOn: { color: palette.cream },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14, paddingHorizontal: 16 },
  card: { backgroundColor: palette.card, borderRadius: 8, padding: 6, borderWidth: 1, borderColor: palette.line, shadowColor: palette.ink, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  cardPhoto: { borderRadius: 5, overflow: "hidden", backgroundColor: palette.paperDeep },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, paddingTop: 6, paddingHorizontal: 2 },
  cardWho: { flex: 1, fontFamily: font.sans, fontSize: 12.5, fontWeight: "700", color: palette.ink },
  cardAgo: { fontFamily: font.sans, fontSize: 12, color: palette.inkMuted },
  mark: { fontFamily: font.sans, fontSize: 10.5, fontWeight: "800", color: palette.open, borderWidth: 1, borderColor: palette.open, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1, overflow: "hidden" },
  markDemo: { color: palette.sunsetInk, borderColor: palette.sunsetInk },
  plays: { position: "absolute", left: 6, bottom: 6, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(30,21,48,0.55)", borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  playsText: { fontFamily: font.sans, fontSize: 11.5, fontWeight: "700", color: palette.cream },
  empty: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 36, gap: 6 },
  emptyTitle: { fontFamily: font.display, fontSize: 19, color: palette.ink, textAlign: "center" },
  emptyBody: { fontFamily: font.sans, fontSize: 15, color: palette.inkSoft, textAlign: "center" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: palette.card, borderTopWidth: 1, borderTopColor: palette.line },
  postWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  recordRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, borderColor: palette.roseTint, alignItems: "center", justifyContent: "center", backgroundColor: palette.card },
  recordDisc: { width: 32, height: 32, borderRadius: 16, backgroundColor: palette.rose },
  postTitle: { fontFamily: font.display, fontSize: 17, color: palette.ink },
  postSub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: palette.card },
});
