// Full-screen vertical swipe viewer through a day's stops (or one place's clip): TikTok's For
// You feed and Instagram Reels (references/video/*): one clip per page, swipe up for the next
// stop, the stop's name, time and creator credit over the bottom left, actions down the right.
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type ListViewToken } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState, Icon } from "@/components/ui";
import { SpotMedia, clipFor } from "@/components/video/SpotMedia";
import type { Place } from "@/data/types";
import { findDay } from "@/lib/community";
import { formatLeg } from "@/lib/geo";
import { openDirections } from "@/lib/links";
import type { PlanStop } from "@/lib/planner";
import { scoreOutOf10 } from "@/lib/score";
import { formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { actions, useStore } from "@/state/store";
import { font } from "@/theme/tokens";

interface Page { place: Place; stop: PlanStop | null; index: number }

export default function Reel() {
  const { plan: planId, day: dayId, place: placeId, i } = useLocalSearchParams<{ plan?: string; day?: string; place?: string; i?: string }>();
  const { city } = useCity();
  const plans = useStore((s) => s.plans);
  const saved = useStore((s) => s.saved);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [current, setCurrent] = useState(Number(i ?? 0) || 0);

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
      <View style={[styles.fill, { justifyContent: "center", backgroundColor: "#fff" }]} testID="reel-missing">
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
          return (
            <View style={{ width, height }} testID={`reel-page-${index}`}>
              <SpotMedia place={item.place} active={index === current} style={StyleSheet.absoluteFill} credit={false} />
              <View style={styles.shadeTop} pointerEvents="none" />
              <View style={styles.shadeBottom} pointerEvents="none" />
              <View style={[styles.rail, { bottom: insets.bottom + 120 }]}>
                <RailButton testID={`reel-save-${index}`} icon={isSaved ? "bookmark" : "bookmark-outline"} label={isSaved ? "Saved" : "Save"} onPress={() => actions.toggleSave(item.place.id)} />
                <RailButton testID={`reel-directions-${index}`} icon="navigate" label="Go" onPress={() => openDirections(item.place)} />
                <RailButton testID={`reel-open-${index}`} icon="information-circle-outline" label="Spot" onPress={() => router.push(`/place/${encodeURIComponent(item.place.id)}`)} />
              </View>
              <View style={[styles.caption, { bottom: insets.bottom + 28 }]}>
                {item.stop ? <Text style={styles.stopLine}>Stop {index + 1} · {formatClock(item.stop.start)}{item.stop.leg ? ` · ${formatLeg(item.stop.leg)}` : ""}</Text> : null}
                <Text style={styles.name} numberOfLines={2}>{item.place.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{[item.place.hood, item.place.unrated ? null : `${scoreOutOf10(item.place.locals)} Locals Score`].filter(Boolean).join(" · ")}</Text>
                <View style={styles.creditRow}>
                  <Icon name={clip?.creator ? "logo-tiktok" : "image-outline"} size={13} tint="#fff" />
                  <Text style={styles.credit} numberOfLines={1}>{clip?.creator ? `Video by ${clip.creator}` : "Photo from Google Maps"}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.segments}>
          {pages.map((p, k) => <View key={k} style={[styles.segment, { backgroundColor: k <= current ? "#F9F9F9" : "rgba(255,255,255,0.45)" }]} />)}
        </View>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Pressable testID="reel-close" accessibilityLabel="Close" hitSlop={10} onPress={close}><Icon name="close" size={28} tint="#fff" /></Pressable>
        </View>
      </View>
    </View>
  );
}

function RailButton({ icon, label, onPress, testID }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ alignItems: "center", gap: 3 }}>
      <Icon name={icon} size={32} tint="#fff" />
      <Text style={styles.railLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  shadeTop: { position: "absolute", top: 0, left: 0, right: 0, height: 140, backgroundColor: "rgba(0,0,0,0.25)" },
  shadeBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 260, backgroundColor: "rgba(0,0,0,0.3)" },
  top: { position: "absolute", left: 0, right: 0, paddingHorizontal: 8 },
  segments: { flexDirection: "row", gap: 4, paddingHorizontal: 0 },
  segment: { flex: 1, height: 2, borderRadius: 1 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, marginTop: 10 },
  title: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 12 },
  rail: { position: "absolute", right: 10, gap: 22, alignItems: "center" },
  railLabel: { fontFamily: font.sans, color: "#fff", fontSize: 12, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 3 },
  caption: { position: "absolute", left: 14, right: 80, gap: 4 },
  stopLine: { fontFamily: font.sans, color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "600" },
  name: { fontFamily: font.sans, color: "#fff", fontSize: 22, fontWeight: "800", lineHeight: 27 },
  meta: { fontFamily: font.sans, color: "rgba(255,255,255,0.9)", fontSize: 15 },
  creditRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  credit: { fontFamily: font.sans, color: "#fff", fontSize: 14, fontWeight: "600" },
});
