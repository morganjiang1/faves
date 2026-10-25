// Shared building blocks in the Faves "warm postcard" identity (docs/design_system.md):
// cream paper, plum ink, rose stamps and stickers, Bricolage Grotesque headlines.
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { categoryInfo, color, font, palette, radius, shadow } from "@/theme/tokens";

export type IconName = ComponentProps<typeof Ionicons>["name"];
export function Icon({ name, size = 22, tint = color.text, style }: { name: IconName; size?: number; tint?: string; style?: StyleProp<TextStyle> }) {
  return <Ionicons name={name} size={size} color={tint} style={style} />;
}

type Variant = "display" | "serif" | "serifSmall" | "h1" | "h2" | "title" | "body" | "bodyStrong" | "meta" | "label" | "caption" | "tab";
const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: font.displayHeavy, fontSize: 34, lineHeight: 38, color: palette.ink, letterSpacing: -0.6 },
  serif: { fontFamily: font.display, fontSize: 28, lineHeight: 32, color: palette.ink, letterSpacing: -0.4 },
  serifSmall: { fontFamily: font.display, fontSize: 20, lineHeight: 24, color: palette.ink, letterSpacing: -0.2 },
  h1: { fontFamily: font.displayHeavy, fontSize: 28, lineHeight: 32, color: palette.ink, letterSpacing: -0.5 },
  h2: { fontFamily: font.display, fontSize: 22, lineHeight: 27, color: palette.ink, letterSpacing: -0.3 },
  title: { fontSize: 16, lineHeight: 21, fontWeight: "700", color: palette.ink },
  body: { fontSize: 16, lineHeight: 22, color: palette.ink },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: "600", color: palette.ink },
  meta: { fontSize: 14, lineHeight: 19, color: palette.inkSoft },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700", color: palette.inkMuted, letterSpacing: 0.6 },
  caption: { fontSize: 13, lineHeight: 17, color: palette.inkMuted },
  tab: { fontSize: 11, lineHeight: 13, color: palette.inkMuted },
};
const DISPLAY = new Set<Variant>(["display", "serif", "serifSmall", "h1", "h2"]);

export function T({ v = "body", style, children, numberOfLines, onPress, selectable, testID }: { v?: Variant; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number; onPress?: () => void; selectable?: boolean; testID?: string }) {
  return (
    <Text testID={testID} selectable={selectable} onPress={onPress} numberOfLines={numberOfLines} style={[DISPLAY.has(v) ? null : { fontFamily: font.sans }, VARIANTS[v], style]}>
      {children}
    </Text>
  );
}

const pressed = ({ pressed: p }: { pressed: boolean }) => (p ? { opacity: 0.8, transform: [{ translateY: 1 }] } : null);

// The main action: a rose sticker button with a pressed-paper lip under it.
export function PrimaryButton({ label, onPress, disabled, icon, loading, style, testID }: { label: string; onPress: () => void; disabled?: boolean; icon?: IconName; loading?: boolean; style?: StyleProp<ViewStyle>; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled || loading} onPress={onPress} style={(s) => [styles.primary, disabled && styles.primaryOff, pressed(s), style]}>
      {loading ? <ActivityIndicator color={palette.cream} /> : (
        <>
          {icon ? <Icon name={icon} size={20} tint={disabled ? palette.inkMuted : palette.cream} /> : null}
          <Text style={[styles.primaryLabel, disabled && { color: palette.inkMuted }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

// The quieter action: white card stock with an ink outline.
export function SecondaryButton({ label, onPress, icon, style, testID, compact }: { label: string; onPress: () => void; icon?: IconName; style?: StyleProp<ViewStyle>; testID?: string; compact?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={(s) => [styles.secondary, compact && { paddingHorizontal: 10, gap: 6 }, pressed(s), style]}>
      {icon ? <Icon name={icon} size={compact ? 16 : 18} tint={palette.ink} /> : null}
      <Text style={[styles.secondaryLabel, compact && { fontSize: 15 }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress, tint = palette.roseInk, testID }: { label: string; onPress: () => void; tint?: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} hitSlop={8} style={pressed}>
      <Text style={{ fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: tint }}>{label}</Text>
    </Pressable>
  );
}

// Small rounded action: rose-tinted, or filled rose with cream text.
export function ActionPill({ label, icon, onPress, filled, testID, small }: { label: string; icon?: IconName; onPress: () => void; filled?: boolean; testID?: string; small?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={(s) => [styles.pill, small && { height: 34, paddingHorizontal: 12 }, { backgroundColor: filled ? palette.roseInk : palette.roseTint }, pressed(s)]}>
      {icon ? <Icon name={icon} size={small ? 16 : 19} tint={filled ? palette.cream : palette.roseInk} /> : null}
      <Text style={[styles.pillLabel, small && { fontSize: 14 }, { color: filled ? palette.cream : palette.roseInk }]}>{label}</Text>
    </Pressable>
  );
}

// Choice chips: sand when off, plum ink when on.
export function Chip({ label, on, onPress, icon, testID }: { label: string; on?: boolean; onPress?: () => void; icon?: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={(s) => [styles.chip, { backgroundColor: on ? palette.ink : palette.paperDeep }, pressed(s)]}>
      {icon ? <Text style={{ fontSize: 15 }}>{icon}</Text> : null}
      <Text style={[styles.chipLabel, { color: on ? palette.cream : palette.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function FilterChip({ label, on, onPress, icon, chevron, testID }: { label: string; on?: boolean; onPress?: () => void; icon?: IconName; chevron?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={(s) => [styles.filter, on && { backgroundColor: palette.ink, borderColor: palette.ink }, pressed(s)]}>
      {icon ? <Icon name={icon} size={16} tint={on ? palette.cream : palette.ink} /> : null}
      <Text style={[styles.filterLabel, on && { color: palette.cream }]}>{label}</Text>
      {chevron ? <Icon name="chevron-down" size={14} tint={on ? palette.cream : palette.ink} /> : null}
    </Pressable>
  );
}

// The Locals Score as a postage stamp: a round sticker with a dashed rose ring and the score
// in display type. `count` adds a tiny ink tab ("1.7k") the way a postmark adds a date.
export function Stamp({ score, count, size = 44, muted, tilt = -8, testID, dark }: { score: string; count?: string; size?: number; muted?: boolean; tilt?: number; testID?: string; dark?: boolean }) {
  const ring = muted ? palette.line : palette.rose;
  return (
    <View testID={testID} style={{ width: size, height: size, transform: [{ rotate: `${tilt}deg` }] }}>
      <View style={[styles.stamp, { width: size, height: size, borderRadius: size / 2, borderColor: ring, backgroundColor: dark ? palette.plumRaised : palette.card }]}>
        <View style={{ position: "absolute", top: 3, left: 3, right: 3, bottom: 3, borderRadius: size / 2, borderWidth: 1, borderColor: ring, opacity: 0.55 }} />
        <Text style={{ fontFamily: font.displayHeavy, fontSize: size * 0.38, lineHeight: size * 0.46, color: muted ? palette.inkMuted : dark ? palette.roseOnPlum : palette.roseInk, letterSpacing: -0.5 }}>{score}</Text>
      </View>
      {count ? (
        <View style={styles.stampCount}><Text style={styles.stampCountText}>{count}</Text></View>
      ) : null}
    </View>
  );
}

// Kept for older screens: the score badge is now the stamp.
export function ScoreBadge({ score, count, size = 40, muted, testID }: { score: string; count?: string; size?: number; tint?: string; muted?: boolean; testID?: string }) {
  return <Stamp score={score} count={count} size={size} muted={muted} tilt={0} testID={testID} />;
}

const DISC_COLORS = [palette.rose, palette.sunset, palette.lavender, "#4FA87A", palette.ink];
const discColor = (name: string) => DISC_COLORS[[...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % DISC_COLORS.length];

// A person: their photo, or their initials on a warm colored disc picked by name.
export function Avatar({ name, size = 40, uri, tint }: { name: string; size?: number; uri?: string | null; tint?: string }) {
  const initials = name.split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
  const bg = tint ?? discColor(name);
  const darkText = bg === palette.sunset || bg === palette.rose;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: palette.card, backgroundColor: bg, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" /> : <Text style={{ fontFamily: font.displaySemi, fontSize: size * 0.38, color: darkText ? palette.ink : palette.cream }}>{initials}</Text>}
    </View>
  );
}

// A poster's little disc: the first letter of their username.
export function UserDisc({ name, size = 32, ring }: { name: string; size?: number; ring?: boolean }) {
  const letter = (name.match(/[a-z0-9]/i)?.[0] ?? "?").toUpperCase();
  const bg = discColor(name);
  const darkText = bg === palette.sunset || bg === palette.rose;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center", borderWidth: ring ? 1.5 : 0, borderColor: palette.card }}>
      <Text style={{ fontFamily: font.displaySemi, fontSize: size * 0.52, lineHeight: size * 0.66, color: darkText ? palette.ink : palette.cream }}>{letter}</Text>
    </View>
  );
}

// Section header: a friendly lowercase headline with an optional "see all" link.
export function SectionHeader({ title, subtitle, onMore, testID, dark }: { title: string; subtitle?: string; onMore?: () => void; testID?: string; dark?: boolean }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <T v="h2" numberOfLines={1} style={dark ? { color: palette.cream } : null}>{title}</T>
        {subtitle ? <T v="meta" style={[{ marginTop: 2 }, dark && { color: palette.creamSoft }]}>{subtitle}</T> : null}
      </View>
      {onMore ? (
        <Pressable testID={testID} accessibilityLabel={`See all ${title}`} onPress={onMore} hitSlop={8} style={(s) => [styles.more, pressed(s)]}>
          <Text style={[styles.moreText, dark && { color: palette.roseOnPlum }]}>see all</Text>
          <Icon name="arrow-forward" size={15} tint={dark ? palette.roseOnPlum : palette.roseInk} />
        </Pressable>
      ) : null}
    </View>
  );
}

// A row in a "More" sheet: an icon disc, a label, an optional short line under it.
export function MenuRow({ icon, label, sub, onPress, testID, tint = palette.ink, disabled }: { icon: IconName; label: string; sub?: string; onPress: () => void; testID?: string; tint?: string; disabled?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={(s) => [styles.menuRow, disabled && { opacity: 0.45 }, pressed(s)]}>
      <View style={styles.menuIcon}><Icon name={icon} size={19} tint={tint} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, { color: tint }]}>{label}</Text>
        {sub ? <Text style={styles.menuSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <Icon name="chevron-forward" size={16} tint={palette.inkMuted} />
    </Pressable>
  );
}

export const Band = () => <View style={{ height: 10 }} />;

export function CircleButton({ icon, onPress, label, size = 34, light, testID }: { icon: IconName; onPress: () => void; label: string; size?: number; light?: boolean; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityLabel={label} accessibilityRole="button" hitSlop={6} onPress={onPress} style={(s) => [{ width: size, height: size, borderRadius: size / 2, backgroundColor: light ? "rgba(255,248,241,0.94)" : palette.paperDeep, alignItems: "center", justifyContent: "center" }, light && shadow.soft, pressed(s)]}>
      <Icon name={icon} size={size * 0.52} tint={palette.ink} />
    </Pressable>
  );
}

export const Grabber = () => <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#D9C8B5", marginVertical: 8 }} />;

// A spot's photo, or its category sticker on sand when there is none.
export function PlaceImage({ uri, category, style, emojiSize = 30, testID }: { uri?: string | null; category: string; style: StyleProp<ViewStyle>; emojiSize?: number; testID?: string }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View testID={testID} style={[{ backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center", overflow: "hidden" }, style]}>
        <Text style={{ fontSize: emojiSize }}>{categoryInfo(category).emoji}</Text>
      </View>
    );
  }
  return (
    <View testID={testID} style={[{ overflow: "hidden", backgroundColor: palette.paperDeep }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} onError={() => setFailed(true)} recyclingKey={uri} />
    </View>
  );
}

// Empty: a blank postcard, tilted, with the screen's glyph as its stamp.
export function EmptyState({ icon, title, body, cta, onCta, secondary, onSecondary, testID, dark }: { icon: IconName; title: string; body: string; cta?: string; onCta?: () => void; secondary?: string; onSecondary?: () => void; testID?: string; dark?: boolean }) {
  return (
    <View testID={testID} style={styles.empty}>
      <View style={[styles.blankCard, shadow.soft]}>
        <View style={styles.blankLines}>
          <View style={styles.blankLine} />
          <View style={[styles.blankLine, { width: "70%" }]} />
          <View style={[styles.blankLine, { width: "50%" }]} />
        </View>
        <View style={styles.blankStamp}><Icon name={icon} size={30} tint={palette.roseInk} /></View>
      </View>
      <T v="serif" style={[{ textAlign: "center", marginTop: 22 }, dark && { color: palette.cream }]}>{title}</T>
      <T v="body" style={[{ textAlign: "center", color: dark ? palette.creamSoft : palette.inkSoft, marginTop: 8, fontSize: 16, lineHeight: 22 }]}>{body}</T>
      {cta && onCta ? <PrimaryButton label={cta} onPress={onCta} style={{ marginTop: 22, alignSelf: "stretch" }} /> : null}
      {secondary && onSecondary ? <View style={{ marginTop: 14 }}><TextButton label={secondary} onPress={onSecondary} tint={dark ? palette.roseOnPlum : palette.roseInk} /></View> : null}
    </View>
  );
}

// Error with a way out: a rose refresh disc, one line saying what to do, one helper line.
export function ErrorState({ title, body, onRetry, testID }: { title?: string; body: string; onRetry?: () => void; testID?: string }) {
  const content = (
    <View style={styles.error}>
      <View style={styles.errorDisc}><Icon name="refresh" size={30} tint={palette.roseInk} /></View>
      <Text style={styles.errorTitle}>{title ?? (onRetry ? "Couldn't load this. Tap to retry." : "Something went wrong.")}</Text>
      <Text style={styles.errorBody}>{body}</Text>
    </View>
  );
  return onRetry ? <Pressable testID={testID ?? "error-state"} accessibilityRole="button" onPress={onRetry}>{content}</Pressable> : <View testID={testID ?? "error-state"}>{content}</View>;
}

export function OfflineBanner() {
  return (
    <View testID="offline-banner" style={styles.offline}>
      <Icon name="cloud-offline-outline" size={16} tint={palette.cream} />
      <Text style={{ fontFamily: font.sans, color: palette.cream, fontSize: 14, fontWeight: "700" }}>You're offline. Showing saved spots.</Text>
    </View>
  );
}

// Loading: sand shapes that breathe, no spinner.
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
  return <Animated.View style={[{ backgroundColor: palette.paperDeep, borderRadius: 10, opacity: a }, style]} />;
}

export function SkeletonRows({ rows = 4, testID }: { rows?: number; testID?: string }) {
  return (
    <View testID={testID} style={{ padding: 16, gap: 22 }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
          <Skeleton style={{ width: 58, height: 72, borderRadius: 10 }} />
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

export function LoadingPill({ text = "Loading" }: { text?: string }) {
  return (
    <View style={[{ alignSelf: "center", height: 38, borderRadius: 19, backgroundColor: palette.card, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }, shadow.soft]}>
      <ActivityIndicator size="small" color={palette.roseInk} />
      <Text style={{ fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: palette.ink }}>{text}</Text>
    </View>
  );
}

export function Toast({ text, onHide, top = 60 }: { text: string | null; onHide: () => void; top?: number }) {
  useEffect(() => {
    if (!text) return;
    const t = setTimeout(onHide, 2600);
    return () => clearTimeout(t);
  }, [text, onHide]);
  if (!text) return null;
  return (
    <View pointerEvents="none" style={[styles.toast, { top }]} testID="toast">
      <Icon name="heart" size={16} tint={palette.rose} />
      <Text style={{ fontFamily: font.sans, color: palette.cream, fontSize: 15, fontWeight: "600", flexShrink: 1 }} numberOfLines={2}>{text}</Text>
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: palette.line }, style]} />;
}

// "Sample" label for placeholder people and test data, so nothing reads as real when it isn't.
export function SampleTag({ text = "Sample" }: { text?: string }) {
  return (
    <View style={styles.sample}>
      <Text style={{ fontFamily: font.sans, fontSize: 10.5, fontWeight: "800", color: palette.sunsetInk, letterSpacing: 0.6 }}>{text.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 8 },
  menuIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.paperDeep, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: font.sans, fontSize: 16, fontWeight: "600" },
  menuSub: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 1 },
  primary: { height: 52, borderRadius: 16, backgroundColor: palette.roseInk, borderBottomWidth: 3, borderBottomColor: "#8F1C38", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 20 },
  primaryOff: { backgroundColor: palette.paperDeep, borderBottomColor: "#E2CDB8" },
  primaryLabel: { fontFamily: font.sans, color: palette.cream, fontSize: 17, fontWeight: "700" },
  secondary: { height: 46, borderRadius: 14, borderWidth: 1.5, borderColor: palette.ink, backgroundColor: palette.card, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 18 },
  secondaryLabel: { fontFamily: font.sans, color: palette.ink, fontSize: 16, fontWeight: "700" },
  pill: { height: 40, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14 },
  pillLabel: { fontFamily: font.sans, fontSize: 15, fontWeight: "700" },
  chip: { height: 36, borderRadius: radius.pill, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 6 },
  chipLabel: { fontFamily: font.sans, fontSize: 15, fontWeight: "600" },
  filter: { height: 34, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  filterLabel: { fontFamily: font.sans, fontSize: 15, color: palette.ink, fontWeight: "500" },
  stamp: { borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  stampCount: { position: "absolute", right: -6, bottom: -4, minWidth: 20, height: 16, borderRadius: 4, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  stampCountText: { fontFamily: font.sans, color: palette.cream, fontSize: 9, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 18, paddingTop: 22, paddingBottom: 12, gap: 12 },
  more: { flexDirection: "row", alignItems: "center", gap: 3, paddingBottom: 3 },
  moreText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: palette.roseInk },
  empty: { padding: 24, paddingTop: 12, alignItems: "center", marginHorizontal: 8 },
  blankCard: { width: 210, height: 140, borderRadius: 14, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, transform: [{ rotate: "-4deg" }], padding: 16, flexDirection: "row" },
  blankLines: { flex: 1, justifyContent: "flex-end", gap: 9, paddingBottom: 8 },
  blankLine: { height: 3, borderRadius: 2, backgroundColor: palette.paperDeep, width: "85%" },
  blankStamp: { width: 54, height: 62, borderRadius: 6, borderWidth: 2, borderStyle: "dashed", borderColor: palette.rose, alignItems: "center", justifyContent: "center", backgroundColor: palette.roseTint },
  offline: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: palette.ink, paddingVertical: 9, paddingHorizontal: 16 },
  error: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 28, gap: 10 },
  errorDisc: { width: 64, height: 64, borderRadius: 32, backgroundColor: palette.roseTint, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontFamily: font.display, fontSize: 19, color: palette.ink, textAlign: "center", marginTop: 6 },
  errorBody: { fontFamily: font.sans, fontSize: 14, color: palette.inkSoft, textAlign: "center" },
  toast: { position: "absolute", left: 16, right: 16, minHeight: 48, borderRadius: 14, backgroundColor: palette.ink, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, zIndex: 50 },
  sample: { backgroundColor: palette.sunsetTint, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
});
