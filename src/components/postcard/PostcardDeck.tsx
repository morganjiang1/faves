// "This week in <city>": a hand-dealt deck of postcards. The top card plays its clip; flick
// it left or right to deal the next one (or tap the dots under it). The two cards under it
// peek out at their own angles.
import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View } from "react-native";
import type { Place } from "@/data/types";
import { palette } from "@/theme/tokens";
import { Postcard } from "./Postcard";

const TILTS = [-2, 5, -6, 3];
const NATIVE = Platform.OS !== "web";

export function PostcardDeck({ places, active, width = 272, testID = "deck" }: { places: Place[]; active: boolean; width?: number; testID?: string }) {
  const [top, setTop] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const n = places.length;
  const deal = (dir: 1 | -1) => {
    Animated.timing(x, { toValue: dir * 420, duration: 220, useNativeDriver: NATIVE }).start(() => {
      x.setValue(0);
      setTop((t) => (t + (dir === 1 ? 1 : n - 1)) % n);
    });
  };
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => x.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.dx) > 90 || Math.abs(g.vx) > 0.6) deal(g.dx < 0 ? -1 : 1);
      else Animated.spring(x, { toValue: 0, useNativeDriver: NATIVE }).start();
    },
  }), [n]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!n) return null;
  // Bottom of the pile first, the top card last (so it draws on top).
  const shown = Math.min(3, n);
  const order = Array.from({ length: shown }, (_, k) => (top + shown - 1 - k) % n);
  const rotate = x.interpolate({ inputRange: [-300, 0, 300], outputRange: ["-14deg", "0deg", "14deg"] });
  return (
    <View testID={testID} style={styles.wrap}>
      <View style={{ width: width + 24, height: Math.round((width - 16) * 1.25) + 80, alignItems: "center" }}>
        {order.map((i) => {
          const depth = (i - top + n) % n;
          const isTop = depth === 0;
          const card = (
            <Postcard place={places[i]} active={active && isTop} size="deck" width={width} tilt={isTop ? TILTS[0] : TILTS[depth % TILTS.length]} testID={isTop ? `${testID}-top` : undefined} showStamp={isTop} showPoster={isTop} />
          );
          return isTop ? (
            <Animated.View key={places[i].id} {...pan.panHandlers} style={[styles.layer, { transform: [{ translateX: x }, { rotate }] }]}>
              {card}
            </Animated.View>
          ) : (
            <View key={places[i].id} pointerEvents="none" style={[styles.layer, { transform: [{ translateY: depth * 6 }, { translateX: depth % 2 ? 10 : -10 }] }]}>{card}</View>
          );
        })}
      </View>
      <Pressable testID={`${testID}-next`} accessibilityRole="button" accessibilityLabel={`Postcard ${top + 1} of ${n}. Next`} onPress={() => deal(1)} style={styles.dots}>
        {places.map((p, k) => <View key={p.id} style={[styles.dot, k === top && styles.dotOn]} />)}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  layer: { position: "absolute", top: 12 },
  dots: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 32, marginTop: 10, paddingHorizontal: 16 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.line },
  dotOn: { width: 16, backgroundColor: palette.roseInk },
});
