// Spots are postcards: the spot's clip plays (muted) inside a rounded frame of white card
// stock, the Locals Score is a round stamp stuck on a corner, and the neighborhood is a
// small postmark under the picture. Cards can sit at a slight angle, like a stack on a table.
import { router } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import type { Place } from "@/data/types";
import { compact, rankedBy, scoreOutOf10 } from "@/lib/score";
import { font, palette, shadow } from "@/theme/tokens";
import { SampleTag, Stamp, UserDisc } from "../ui";
import { SpotMedia, clipFor } from "../video/SpotMedia";

export type PostcardSize = "deck" | "row" | "mini";
const SIZES: Record<PostcardSize, { w: number; ratio: number; pad: number; name: number; stamp: number }> = {
  deck: { w: 272, ratio: 5 / 4, pad: 8, name: 21, stamp: 50 },
  row: { w: 168, ratio: 4 / 3, pad: 6, name: 15.5, stamp: 38 },
  mini: { w: 112, ratio: 4 / 3, pad: 5, name: 13, stamp: 30 },
};

// Two wavy cancellation lines, like a postmark.
export function PostmarkWaves({ width = 34, color = palette.inkMuted }: { width?: number; color?: string }) {
  return (
    <Svg width={width} height={8} viewBox="0 0 34 8">
      <Path d="M0 2 Q 4.25 0 8.5 2 T 17 2 T 25.5 2 T 34 2" stroke={color} strokeWidth={1} fill="none" />
      <Path d="M0 6 Q 4.25 4 8.5 6 T 17 6 T 25.5 6 T 34 6" stroke={color} strokeWidth={1} fill="none" />
    </Svg>
  );
}

export function Postmark({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <View style={styles.postmark}>
      <PostmarkWaves color={dark ? palette.creamMuted : palette.inkMuted} />
      <Text style={[styles.postmarkText, dark && { color: palette.creamMuted }]} numberOfLines={1}>{text.toUpperCase()}</Text>
    </View>
  );
}

export function Postcard({ place, active, size = "row", tilt = 0, width, onPress, testID, line, sample, children, style, showPoster = true, showStamp = true }: {
  place: Place; active: boolean; size?: PostcardSize; tilt?: number; width?: number; onPress?: () => void; testID?: string;
  line?: string; sample?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle>; showPoster?: boolean; showStamp?: boolean;
}) {
  const s = SIZES[size];
  const w = width ?? s.w;
  const inner = w - s.pad * 2;
  const clip = clipFor(place.id);
  const postmark = [place.hood, line].filter(Boolean).join(" · ") || place.kind || "";
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${place.name}, Locals Score ${scoreOutOf10(place.locals)}`} onPress={onPress ?? (() => router.push(`/place/${encodeURIComponent(place.id)}`))}
      style={({ pressed }) => [{ width: w, transform: [{ rotate: `${tilt}deg` }, { scale: pressed ? 0.98 : 1 }] }, style]}>
      <View style={[styles.card, { padding: s.pad, borderRadius: size === "deck" ? 18 : 14 }, shadow.card]}>
        <SpotMedia place={place} active={active} credit={false} radius={size === "deck" ? 12 : 9} style={{ width: inner, height: Math.round(inner * s.ratio) }}>
          {clip?.creator && showPoster && size !== "mini" ? (
            <View style={styles.poster} pointerEvents="none">
              <UserDisc name={clip.creator.replace(/^@/, "")} size={size === "deck" ? 18 : 14} />
              <Text style={[styles.posterText, size === "deck" && { fontSize: 12 }]} numberOfLines={1}>{clip.creator}</Text>
            </View>
          ) : null}
          {sample ? <View style={{ position: "absolute", left: 8, top: 8 }} pointerEvents="none"><SampleTag /></View> : null}
        </SpotMedia>
        <View style={{ paddingHorizontal: 3, paddingTop: size === "mini" ? 6 : 9, paddingBottom: size === "mini" ? 2 : 4, gap: 3 }}>
          <Text style={[styles.name, { fontSize: s.name, lineHeight: s.name * 1.15 }]} numberOfLines={2}>{place.name}</Text>
          {size !== "mini" ? <Postmark text={postmark} /> : null}
        </View>
        {children}
      </View>
      {place.unrated || !showStamp ? null : (
        <View style={[styles.stamp, { right: -s.stamp * 0.22, top: -s.stamp * 0.22 }]} pointerEvents="none">
          <Stamp score={scoreOutOf10(place.locals)} count={size === "deck" ? compact(rankedBy(place)) : undefined} size={s.stamp} tilt={10} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  stamp: { position: "absolute" },
  name: { fontFamily: "BricolageGrotesque_700Bold", color: palette.ink, letterSpacing: -0.2 },
  postmark: { flexDirection: "row", alignItems: "center", gap: 6 },
  postmarkText: { fontFamily: font.sans, fontSize: 10, fontWeight: "700", color: palette.inkMuted, letterSpacing: 0.8, flexShrink: 1 },
  poster: { position: "absolute", left: 7, bottom: 7, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(30,21,48,0.55)", borderRadius: 999, paddingRight: 7, paddingLeft: 2, paddingVertical: 2, maxWidth: "92%" },
  posterText: { fontFamily: font.sans, fontSize: 11, fontWeight: "600", color: palette.cream, flexShrink: 1 },
});
