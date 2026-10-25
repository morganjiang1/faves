// "This week in <city>": a hand-dealt deck of postcards. The top card plays its clip; flick
// it left or right (or tap the arrows) to deal the next one. The two cards under it peek
// out at their own angles.
import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { Place } from "@/data/types";
import { font, palette } from "@/theme/tokens";
import { Icon } from "../ui";
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
      <View style={styles.controls}>
        <Pressable testID={`${testID}-prev`} accessibilityRole="button" accessibilityLabel="Previous postcard" onPress={() => deal(-1)} hitSlop={8} style={styles.arrow}><Icon name="arrow-back" size={18} tint={palette.ink} /></Pressable>
        <Text style={styles.count} testID={`${testID}-count`}>{top + 1} of {n}</Text>
        <Pressable testID={`${testID}-next`} accessibilityRole="button" accessibilityLabel="Next postcard" onPress={() => deal(1)} hitSlop={8} style={styles.arrow}><Icon name="arrow-forward" size={18} tint={palette.ink} /></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center" },
  layer: { position: "absolute", top: 12 },
  controls: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 2 },
  arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  count: { fontFamily: font.displaySemi, fontSize: 15, color: palette.inkSoft, minWidth: 60, textAlign: "center" },
});
