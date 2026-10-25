// Full-screen vertical swipe viewer through a day's stops (or one place's clip). Copies Netflix
// Clips (video/netflix/appstore_04_clips_vertical_viewer_mute.jpg): one clip per screen on
// #110F15, swipe up for the next stop, a title block bottom left (19 pt bold name, 11.5 pt
// semibold meta, 13 pt line), a 71 pt art circle with a thin white ring (opens the spot), a
// right rail of 48 pt glass circles, and a 2 pt playback bar (played #A5A5A5, unplayed
// #2D2729). The poster's line is TikTok's username line: an initial disc, @handle 16 pt and
// when it was posted, 14 pt.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShareSheet } from "@/components/ShareSheet";
import { EmptyState, Icon, PlaceImage, UserDisc } from "@/components/ui";
import { shortAgo } from "@/components/moments/clips";
import { SpotMedia, clipFor } from "@/components/video/SpotMedia";
import type { Place } from "@/data/types";
import { findDay } from "@/lib/community";
import { formatLeg } from "@/lib/geo";
import { openDirections, shareUrl } from "@/lib/links";
import type { PlanStop } from "@/lib/planner";
import { scoreOutOf10 } from "@/lib/score";
import { formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { actions, useStore } from "@/state/store";
import { font, palette } from "@/theme/tokens";

interface Page { place: Place; stop: PlanStop | null; index: number }

export default function Reel() {
  const { plan: planId, day: dayId, place: placeId, i } = useLocalSearchParams<{ plan?: string; day?: string; place?: string; i?: string }>();
  const { city } = useCity();
  const plans = useStore((s) => s.plans);
  const saved = useStore((s) => s.saved);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState(Number(i ?? 0) || 0);
  const [sharing, setSharing] = useState<Place | null>(null);

  const { pages, title } = useMemo(() => {
    if (!city) return { pages: [] as Page[], title: "" };
    const plan = planId ? plans[String(planId)] : dayId ? findDay(city, String(dayId))?.plan : undefined;
    if (plan) {
      return {
        title: plan.title,
        pages: plan.stops.map((s, k) => ({ place: city.byId.get(s.placeId)!, stop: s, index: k })).filter((p) => p.place),
      };
    }
    const p = placeId ? city.byId.get(decodeURIComponent(String(placeId))) : undefined;
    return { title: p?.name ?? "", pages: p ? [{ place: p, stop: null, index: 0 }] : [] };
  }, [city, planId, dayId, placeId, plans]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setCurrent(first.index);
  }).current;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  if (!pages.length) {
    return (
      <View style={[styles.fill, { justifyContent: "center", backgroundColor: palette.card }]} testID="reel-missing">
        <EmptyState icon="film-outline" title="Nothing to play" body="This day or spot isn't on this device. Open it again from Home." cta="Back" onCta={close} />
      </View>
    );
  }

  return (
    <View style={styles.fill} testID="reel">
      <FlatList
        data={pages}
        keyExtractor={(p) => `${p.place.id}-${p.index}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={Math.min(current, pages.length - 1)}
        getItemLayout={(_, index) => ({ length: height, offset: height * index, index })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        renderItem={({ item, index }) => {
          const clip = clipFor(item.place.id);
          const isSaved = saved.includes(item.place.id);
          const meta = [item.stop ? `Stop ${index + 1} of ${pages.length}` : null, item.stop ? formatClock(item.stop.start) : null, item.stop?.leg ? formatLeg(item.stop.leg) : null, item.place.unrated ? null : `${scoreOutOf10(item.place.locals)} Locals Score`].filter(Boolean).join("  ·  ");
          return (
            <View style={{ width, height }} testID={`reel-page-${index}`}>
              <SpotMedia place={item.place} active={index === current} style={StyleSheet.absoluteFill} credit={false} />
              <View style={styles.shadeBottom} pointerEvents="none" />
              <View style={[styles.rail, { bottom: insets.bottom + 132 }]}>
                <RailButton testID={`reel-save-${index}`} icon={isSaved ? "bookmark" : "bookmark-outline"} label={isSaved ? "Saved" : "Save"} onPress={() => actions.toggleSave(item.place.id)} />
                <RailButton testID={`reel-directions-${index}`} icon="navigate-outline" label="Go" onPress={() => openDirections(item.place)} />
                <RailButton testID={`reel-share-${index}`} icon="paper-plane-outline" label="Share" onPress={() => setSharing(item.place)} />
              </View>
              <View style={[styles.caption, { bottom: insets.bottom + 30 }]}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.name} numberOfLines={2}>{item.place.name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
                  {item.stop?.why ? <Text style={styles.desc} numberOfLines={1}>{item.stop.why}</Text> : item.place.hood ? <Text style={styles.desc} numberOfLines={1}>{item.place.hood}</Text> : null}
                  {clip?.creator ? (
                    <View style={styles.creditRow} testID={`reel-poster-${index}`}>
                      <UserDisc name={clip.creator.replace(/^@/, "")} size={20} />
                      <Text style={styles.handle} numberOfLines={1}>{clip.creator}</Text>
                      {clip.postedAt ? <Text style={styles.on} numberOfLines={1}>· {shortAgo(clip.postedAt)} ago</Text> : null}
                    </View>
                  ) : null}
                </View>
                <Pressable testID={`reel-open-${index}`} accessibilityLabel={`Open ${item.place.name}`} onPress={() => router.push(`/place/${encodeURIComponent(item.place.id)}`)} style={styles.art}>
                  <PlaceImage uri={item.place.image} category={item.place.category} style={{ width: 67, height: 67, borderRadius: 34 }} />
                </Pressable>
              </View>
              <Progress seconds={clip?.seconds ?? null} active={index === current} bottom={insets.bottom + 14} />
            </View>
          );
        }}
      />
      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Pressable testID="reel-close" accessibilityLabel="Close" hitSlop={10} onPress={close} style={styles.glassSmall}><Icon name="close" size={20} tint="#fff" /></Pressable>
      </View>
      {sharing ? <ShareSheet open onClose={() => setSharing(null)} subtitle="Anyone with the link can see this spot" url={shareUrl(`/place/${encodeURIComponent(sharing.id)}`)} cardTitle={sharing.name} image={sharing.image} category={sharing.category} /> : null}
    </View>
  );
}

// Netflix's 2 pt playback bar: fills over the clip's length, then starts again (it loops).
function Progress({ seconds, active, bottom }: { seconds: number | null; active: boolean; bottom: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.setValue(0);
    if (!active || !seconds) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: seconds * 1000, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [active, seconds, v]);
  return (
    <View style={[styles.track, { bottom }]} pointerEvents="none">
      <Animated.View style={[styles.played, { width: v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} />
    </View>
  );
}

function RailButton({ icon, label, onPress, testID }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <View style={styles.glass}><Icon name={icon} size={22} tint="#fff" /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#110F15" },
  shadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 280, backgroundColor: "rgba(0,0,0,0.28)" },
  top: { position: "absolute", left: 17.4, right: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 12, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 4 },
  glassSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  rail: { position: "absolute", right: 16, gap: 16, alignItems: "center" },
  glass: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  caption: { position: "absolute", left: 17.4, right: 16, flexDirection: "row", alignItems: "flex-end", gap: 12 },
  name: { fontFamily: font.sans, color: "#fff", fontSize: 19, fontWeight: "800", lineHeight: 23 },
  meta: { fontFamily: font.sans, color: "rgba(255,255,255,0.9)", fontSize: 11.5, fontWeight: "600" },
  desc: { fontFamily: font.sans, color: "rgba(255,255,255,0.9)", fontSize: 13 },
  creditRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  handle: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "600", flexShrink: 1 },
  on: { fontFamily: font.sans, color: "rgba(255,255,255,0.85)", fontSize: 14 },
  art: { width: 71, height: 71, borderRadius: 36, borderWidth: 2, borderColor: palette.line, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  track: { position: "absolute", left: 17.4, right: 17.4, height: 2, backgroundColor: "#2D2729", borderRadius: 1, overflow: "hidden" },
  played: { height: 2, backgroundColor: "#A5A5A5" },
});
