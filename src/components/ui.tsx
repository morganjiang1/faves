// Shared building blocks. Each one names the reference it copies (docs/design_system.md).
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { categoryInfo, color, font, radius, shadow } from "@/theme/tokens";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export function Icon({ name, size = 22, tint = color.text, style }: { name: IconName; size?: number; tint?: string; style?: StyleProp<TextStyle> }) {
  return <Ionicons name={name} size={size} color={tint} style={style} />;
}

type Variant = "display" | "serif" | "serifSmall" | "h1" | "h2" | "title" | "body" | "bodyStrong" | "meta" | "label" | "caption" | "tab";
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: font.serif, fontSize: 32, lineHeight: 38, color: color.text },
  serif: { fontFamily: font.serif, fontSize: 28, lineHeight: 34, color: color.text },
  serifSmall: { fontFamily: font.serif, fontSize: 20, lineHeight: 26, color: color.text },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700", color: color.airbnbText },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: "700", color: "#000" }, // DoorDash section title
  title: { fontSize: 16, lineHeight: 21, fontWeight: "700", color: "#000" }, // DoorDash store name
  body: { fontSize: 16, lineHeight: 22, color: color.text },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600", color: color.text },
  meta: { fontSize: 14, lineHeight: 19, color: color.textSub }, // DoorDash meta line
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: color.appleLabel, letterSpacing: 0.3 },
  caption: { fontSize: 13, lineHeight: 17, color: color.textMuted },
  tab: { fontSize: 11, lineHeight: 13, color: "#393939" },
};

export function T({ v = "body", style, children, numberOfLines, onPress, selectable, testID }: { v?: Variant; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number; onPress?: () => void; selectable?: boolean; testID?: string }) {
  return (
    <Text testID={testID} selectable={selectable} onPress={onPress} numberOfLines={numberOfLines} style={[{ fontFamily: font.sans }, VARIANTS[v], style]}>
      {children}
    </Text>
  );
}

const pressed = ({ pressed: p }: { pressed: boolean }) => (p ? { opacity: 0.75 } : null);

// Beli's empty-state CTA: full-width teal pill, 50 pt.
export function PrimaryButton({ label, onPress, disabled, icon, loading, style, testID }: { label: string; onPress: () => void; disabled?: boolean; icon?: IconName; loading?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled || loading} onPress={onPress} style={(s) => [styles.primary, disabled && { backgroundColor: "#A2B8BB" }, pressed(s), style]}>
      {loading ? <ActivityIndicator color="#fff" /> : (
        <>
          {icon ? <Icon name={icon} size={20} tint="#fff" /> : null}
          <Text style={styles.primaryLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// Beli's list/map toggle, unselected half: white with a 2 pt teal outline.
export function SecondaryButton({ label, onPress, icon, style, testID }: { label: string; onPress: () => void; icon?: IconName; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={(s) => [styles.secondary, pressed(s), style]}>
      {icon ? <Icon name={icon} size={18} tint={color.brand} /> : null}
      <Text style={styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

// Airbnb's "Clear all": underlined text.
export function TextButton({ label, onPress, tint = color.airbnbText, testID }: { label: string; onPress: () => void; tint?: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} hitSlop={8} style={pressed}>
      <Text style={{ fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: tint, textDecorationLine: "underline" }}>{label}</Text>
    </Pressable>
  );
}

// Google Maps action pills: 42 pt, full radius; tonal (#D2F7FF / #014F5B) or filled (#007B8B).
export function ActionPill({ label, icon, onPress, filled, testID, small }: { label: string; icon?: IconName; onPress: () => void; filled?: boolean; testID?: string; small?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={(s) => [styles.pill, small && { height: 34, paddingHorizontal: 12 }, { backgroundColor: filled ? color.gmapsPrimary : color.tonal }, pressed(s)]}>
      {icon ? <Icon name={icon} size={small ? 16 : 19} tint={filled ? "#fff" : color.tonalText} /> : null}
      <Text style={[styles.pillLabel, small && { fontSize: 14 }, { color: filled ? "#fff" : color.tonalText }]}>{label}</Text>
    </Pressable>
  );
}

// Uber Eats reason chips: 38 pt, black when on, #F3F3F3 when off.
export function Chip({ label, on, onPress, icon, testID }: { label: string; on?: boolean; onPress?: () => void; icon?: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={(s) => [styles.chip, { backgroundColor: on ? color.chipOn : color.chipOff }, pressed(s)]}>
      {icon ? <Text style={{ fontSize: 15 }}>{icon}</Text> : null}
      <Text style={[styles.chipLabel, { color: on ? "#fff" : "#000" }]}>{label}</Text>
    </Pressable>
  );
}

// DoorDash filter chips: white, 1 pt #E4E4E4 border, 34 pt, icon + label (+ chevron).
export function FilterChip({ label, on, onPress, icon, chevron, testID }: { label: string; on?: boolean; onPress?: () => void; icon?: IconName; chevron?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={(s) => [styles.filter, on && { backgroundColor: "#000", borderColor: "#000" }, pressed(s)]}>
      {icon ? <Icon name={icon} size={16} tint={on ? "#fff" : "#000"} /> : null}
      <Text style={[styles.filterLabel, on && { color: "#fff" }]}>{label}</Text>
      {chevron ? <Icon name="chevron-down" size={14} tint={on ? "#fff" : "#000"} /> : null}
    </Pressable>
  );
}

// Beli's score circle: 40 pt white circle, 1 pt #D3D3D3 ring, green semibold number,
// optional teal count badge overlapping the bottom right ("2k").
export function ScoreBadge({ score, count, size = 40, tint = color.score, muted, testID }: { score: string; count?: string; size?: number; tint?: string; muted?: boolean; testID?: string }) {
  return (
    <View testID={testID} style={{ width: size, height: size }}>
      <View style={[styles.score, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={{ fontFamily: font.sans, fontSize: size * 0.37, fontWeight: "600", color: muted ? color.textMuted : tint }}>{score}</Text>
      </View>
      {count ? (
        <View style={styles.scoreCount}>
          <Text style={styles.scoreCountText}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

// Beli profile avatar: circle with a 1 pt #D3D3D3 ring and initials.
export function Avatar({ name, size = 40, uri, tint }: { name: string; size?: number; uri?: string | null; tint?: string }) {
  const initials = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: color.border, backgroundColor: tint ?? "#F2F2F4", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" /> : <Text style={{ fontFamily: font.sans, fontSize: size * 0.36, fontWeight: "600", color: tint ? "#fff" : "#8A8A8E" }}>{initials}</Text>}
    </View>
  );
}

// A poster with no photo: TikTok's initial on a colored disc (video/tiktok/
// yt_XDmV5t6Y-0Y_t061_comments_sheet_tabs_add_comment.png: 32 pt, white letter, teal #0299A8 or
// green #2E6716), with the Faves pink as a third color. The color follows the username.
const DISC_COLORS = ["#0299A8", "#2E6716", "#FF4F6D"];
export function UserDisc({ name, size = 32, ring }: { name: string; size?: number; ring?: boolean }) {
  const letter = (name.match(/[a-z0-9]/i)?.[0] ?? "?").toUpperCase();
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: DISC_COLORS[hash % DISC_COLORS.length], alignItems: "center", justifyContent: "center", borderWidth: ring ? 1 : 0, borderColor: "#fff" }}>
      <Text style={{ fontFamily: font.sans, fontSize: size * 0.5, lineHeight: size * 0.62, fontWeight: "500", color: "#fff" }}>{letter}</Text>
    </View>
  );
}

// DoorDash section header: 24 pt bold title + 33 pt grey circle with an arrow.
export function SectionHeader({ title, subtitle, onMore, testID }: { title: string; subtitle?: string; onMore?: () => void; testID?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <T v="h2" numberOfLines={1}>{title}</T>
        {subtitle ? <T v="meta" style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      {onMore ? (
        <Pressable testID={testID} accessibilityLabel={`See all ${title}`} onPress={onMore} style={(s) => [styles.arrow, pressed(s)]}>
          <Icon name="arrow-forward" size={18} tint="#000" />
        </Pressable>
      ) : null}
    </View>
  );
}

// DoorDash's 6 pt #F7F7F7 band between home sections.
export const Band = () => <View style={{ height: 6, backgroundColor: color.sectionBand }} />;

// Google Maps 34 pt grey circle buttons (share, close).
export function CircleButton({ icon, onPress, label, size = 34, light, testID }: { icon: IconName; onPress: () => void; label: string; size?: number; light?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityLabel={label} accessibilityRole="button" hitSlop={6} onPress={onPress} style={(s) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: light ? "rgba(255,255,255,0.92)" : color.circleButton, alignItems: "center", justifyContent: "center" }, light && shadow.soft, pressed(s)]}>
      <Icon name={icon} size={size * 0.52} tint={color.gmapsText} />
    </Pressable>
  );
}

export const Grabber = () => <View style={{ alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: color.sheetGrabber, marginVertical: 8 }} />;

// Airbnb Trips thumbnail treatment for spots without a photo: the category's object on #F5F2ED.
export function PlaceImage({ uri, category, style, emojiSize = 30, testID }: { uri?: string | null; category: string; style: StyleProp<ViewStyle>; emojiSize?: number; testID?: string }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View testID={testID} style={[{ backgroundColor: "#F5F2ED", alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
        <Text style={{ fontSize: emojiSize }}>{categoryInfo(category).emoji}</Text>
      </View>
    );
  }
  return (
    <View testID={testID} style={[{ overflow: "hidden", backgroundColor: "#EEE" }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} onError={() => setFailed(true)} recyclingKey={uri} />
    </View>
  );
}

// Beli's empty-state card: teal line art on a sage blob, Playfair title, two short lines,
// full-width teal pill. Our line art is the Ionicons outline glyph for the screen.
export function EmptyState({ icon, title, body, cta, onCta, secondary, onSecondary, testID }: { icon: IconName; title: string; body: string; cta?: string; onCta?: () => void; secondary?: string; onSecondary?: () => void; testID?: string }) {
  return (
    <View testID={testID} style={styles.empty}>
      <View style={styles.blobWrap}>
        <View style={styles.blob} />
        <View style={styles.blobIcon}>
          <Icon name={icon} size={64} tint={color.brand} />
        </View>
      </View>
      <T v="serif" style={{ textAlign: "center", marginTop: 18 }}>{title}</T>
      <T v="body" style={{ textAlign: "center", color: color.emptyBody, marginTop: 10, fontSize: 17, lineHeight: 23 }}>{body}</T>
      {cta && onCta ? <PrimaryButton label={cta} onPress={onCta} style={{ marginTop: 24, alignSelf: "stretch" }} /> : null}
      {secondary && onSecondary ? <View style={{ marginTop: 14 }}><TextButton label={secondary} onPress={onSecondary} tint={color.brand} /></View> : null}
    </View>
  );
}

// Error with a way out: TikTok's "No internet connection. Tap to retry." (refresh glyph,
// one bold line, one grey helper line; the whole block is the tap target).
export function ErrorState({ title, body, onRetry, testID }: { title?: string; body: string; onRetry?: () => void; testID?: string }) {
  const content = (
    <View style={styles.error}>
      <Icon name="refresh" size={52} tint="#000" />
      <Text style={styles.errorTitle}>{title ?? (onRetry ? "Couldn't load this. Tap to retry." : "Something went wrong.")}</Text>
      <Text style={styles.errorBody}>{body}</Text>
    </View>
  );
  return onRetry ? <Pressable testID={testID ?? "error-state"} accessibilityRole="button" onPress={onRetry}>{content}</Pressable> : <View testID={testID ?? "error-state"}>{content}</View>;
}

// Offline: Spotify's full-width dark bar with one bold line, sitting right above the tab bar
// (or at the bottom of screens without one).
export function OfflineBanner() {
  return (
    <View testID="offline-banner" style={styles.offline}>
      <Text style={{ fontFamily: font.sans, color: "#fff", fontSize: 14, fontWeight: "700" }}>You're offline. Showing saved spots.</Text>
    </View>
  );
}

// Loading placeholders: Instagram's skeleton (#F8F8F8 circles, round-ended bars and blocks
// on white, no spinner), with a gentle pulse.
export function Skeleton({ style }: { style: StyleProp<ViewStyle> }) {
  const a = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== "web" }),
      Animated.timing(a, { toValue: 0.6, duration: 800, useNativeDriver: Platform.OS !== "web" }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={[{ backgroundColor: "#F2F2F2", borderRadius: 8, opacity: a }, style]} />;
}

// Instagram's skeleton rows: 58 pt circle, two round-ended bars.
export function SkeletonRows({ rows = 4, testID }: { rows?: number; testID?: string }) {
  return (
    <View testID={testID} style={{ padding: 16, gap: 22 }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <Skeleton style={{ width: 58, height: 58, borderRadius: 29 }} />
          <View style={{ flex: 1, gap: 10 }}>
            <Skeleton style={{ width: "62%", height: 12, borderRadius: 6 }} />
            <Skeleton style={{ width: "84%", height: 10, borderRadius: 5 }} />
            <Skeleton style={{ width: "40%", height: 10, borderRadius: 5 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Instagram's map "Loading" pill.
export function LoadingPill({ text = "Loading" }: { text?: string }) {
  return (
    <View style={[{ alignSelf: "center", height: 36, borderRadius: 18, backgroundColor: "#fff", paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6 }, shadow.soft]}>
      <Text style={{ fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: "#000" }}>· {text}</Text>
    </View>
  );
}

// Beli's "X ranked!" toast: near-black 47 pt bar, white text, top of the screen.
export function Toast({ text, onHide, top = 60 }: { text: string | null; onHide: () => void; top?: number }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onHide, 2600);
    return () => clearTimeout(t);
  }, [text, onHide]);
  if (!text) return null;
  return (
    <View pointerEvents="none" style={[styles.toast, { top }]} testID="toast">
      <Text style={{ fontFamily: font.sans, color: "#fff", fontSize: 15, fontWeight: "600" }} numberOfLines={2}>{text}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: color.divider }, style]} />;
}

// "Sample" label for placeholder people and test data, so nothing reads as real when it isn't.
export function SampleTag({ text = "Sample" }: { text?: string }) {
  return (
    <View style={styles.sample}>
      <Text style={{ fontFamily: font.sans, fontSize: 11, fontWeight: "700", color: "#6A6A6A", letterSpacing: 0.3 }}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: { height: 50, borderRadius: radius.pill, backgroundColor: color.brand, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20 },
  primaryLabel: { fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "600" },
  secondary: { height: 44, borderRadius: radius.pill, borderWidth: 2, borderColor: color.brand, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  secondaryLabel: { fontFamily: font.sans, color: color.brand, fontSize: 16, fontWeight: "600" },
  pill: { height: 42, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 },
  pillLabel: { fontFamily: font.sans, fontSize: 16, fontWeight: "500" },
  chip: { height: 38, borderRadius: radius.pill, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 6 },
  chipLabel: { fontFamily: font.sans, fontSize: 16, fontWeight: "500" },
  filter: { height: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: "#E4E4E4", backgroundColor: "#fff", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  filterLabel: { fontFamily: font.sans, fontSize: 15, color: "#000" },
  score: { borderWidth: 1, borderColor: color.border, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  scoreCount: { position: "absolute", right: -5, bottom: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: color.brand, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderWidth: 1.5, borderColor: "#fff" },
  scoreCountText: { fontFamily: font.sans, color: "#fff", fontSize: 9, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 18, paddingBottom: 12, gap: 12 },
  arrow: { width: 33, height: 33, borderRadius: 17, backgroundColor: color.arrowCircle, alignItems: "center", justifyContent: "center" },
  empty: { backgroundColor: "#fff", borderRadius: 7, padding: 24, paddingTop: 12, alignItems: "center", marginHorizontal: 16 },
  blobWrap: { width: "100%", height: 170, alignItems: "center", justifyContent: "center" },
  blob: { position: "absolute", width: "86%", height: 140, borderRadius: 70, backgroundColor: color.sage, transform: [{ rotate: "-6deg" }] },
  blobIcon: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: color.brand, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  offline: { alignItems: "center", justifyContent: "center", backgroundColor: color.text, paddingVertical: 9, paddingHorizontal: 16 },
  error: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 28, gap: 10 },
  errorTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#000", textAlign: "center", marginTop: 8 },
  errorBody: { fontFamily: font.sans, fontSize: 14, color: "#6B6B6B", textAlign: "center" },
  toast: { position: "absolute", left: 16, right: 16, minHeight: 47, borderRadius: 11, backgroundColor: color.toast, justifyContent: "center", paddingHorizontal: 16, zIndex: 50 },
  sample: { backgroundColor: "#F2F2F2", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
});
