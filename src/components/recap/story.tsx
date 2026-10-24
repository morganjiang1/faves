// Strava Year in Sport, shrunk to one day (social/strava/yt_e1DDHqJURk4_*.png, 200x360
// frames, proportions only): one stat per slide on black with a colored glow at the bottom,
// tap to go on. Slides copied:
// - t088 "DAYS ACTIVE": translucent card (90% wide, ~12 pt radius), caps label, huge number,
//   one bar per row (#FDD300 on a dark yellow track, value at the bar's end, the best row
//   white), caption under the card;
// - t100 "HOURS ACTIVE": the same card with an orange-red #FF3100 line chart, area fade, the
//   peak marked with a dot, a drop line and its value;
// - t116 "A STANDOUT ACTIVITY": full-photo card, caps label top-left, title, three stats;
// - t044 "TOP FANS": podium, the biggest fan raised in the middle;
// - t026 summary card: 82% wide, 0.62 width:height, ~6% radius, #1A1A1A, "Top ..." label with
//   an orange outline icon, the photo in an orange frame at the right, four stacked
//   label/value pairs (value ~1.75x the label), and the orange #FD7A3B footer band with a
//   scrolling "FAVES DAY RECAP" marquee.
// The progress bars along the top are Instagram's story bars (moments/instagram/appstore_07).
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Line, Path, Stop, LinearGradient as SvgGradient } from "react-native-svg";
import { Avatar, Icon, PlaceImage, SampleTag, type IconName } from "@/components/ui";
import { color, font } from "@/theme/tokens";

export const YELLOW = "#FDD300";
export const LINE = "#FF3100";
const CARD = "rgba(255,255,255,0.07)";
const CARD_RING = "rgba(255,255,255,0.10)";

export interface Slide { id: string; glow: string; caption?: string; body: ReactNode }

export function Story({ slides, index, onIndex, onClose, footer, testID = "story" }: { slides: Slide[]; index: number; onIndex: (i: number) => void; onClose: () => void; footer?: ReactNode; testID?: string }) {
  const insets = useSafeAreaInsets();
  const slide = slides[Math.min(index, slides.length - 1)];
  const top = Math.max(insets.top, Platform.OS === "web" ? 10 : 0);
  return (
    <View style={s.root} testID={testID}>
      <LinearGradient colors={["#000000", "#000000", slide.glow]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={[s.bars, { top: top + 6 }]}>
        {slides.map((x, i) => <View key={x.id} style={[s.bar, { backgroundColor: i <= index ? "#fff" : "rgba(255,255,255,0.35)" }]} />)}
      </View>
      <Pressable testID={`${testID}-close`} accessibilityRole="button" accessibilityLabel="Close recap" hitSlop={10} onPress={onClose} style={[s.close, { top: top + 16 }]}>
        <Icon name="close" size={28} tint="#fff" />
      </Pressable>
      {/* Tap zones: left third goes back, the rest goes on (Instagram / Strava stories). */}
      <View style={[StyleSheet.absoluteFill, { flexDirection: "row", top: top + 56 }]}>
        <Pressable testID={`${testID}-back`} accessibilityLabel="Previous" style={{ flex: 1 }} onPress={() => onIndex(Math.max(0, index - 1))} />
        <Pressable testID={`${testID}-next`} accessibilityLabel="Next" style={{ flex: 2 }} onPress={() => onIndex(Math.min(slides.length - 1, index + 1))} />
      </View>
      <View style={[s.content, { paddingTop: top + 64, paddingBottom: Math.max(insets.bottom, 16) + 8 }]} pointerEvents="box-none">
        <View pointerEvents="box-none" style={{ flex: 1, justifyContent: "flex-start", alignItems: "center" }} testID={`slide-${slide.id}`}>
          {slide.body}
          {slide.caption ? <Text style={s.caption}>{slide.caption}</Text> : null}
        </View>
        {footer}
      </View>
    </View>
  );
}

// The translucent stat card of t088 / t100: tall (about 0.75 width:height), label and the
// big number at the top, the chart filling the rest.
export const statCardWidth = (screen: number) => Math.min(screen, 520) * 0.9;
export function StatCard({ label, value, unit, tall, children }: { label: string; value: string; unit?: string; tall?: boolean; children?: ReactNode }) {
  const { width } = useWindowDimensions();
  const w = statCardWidth(width);
  return (
    <View pointerEvents="none" style={[s.statCard, { width: w }, tall && { height: w * 1.25 }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}{unit ? <Text style={s.statUnit}> {unit}</Text> : null}</Text>
      <View style={tall ? { flex: 1, justifyContent: "flex-end" } : { marginTop: 22 }}>{children}</View>
    </View>
  );
}

// t088's bar rows.
export function Bars({ rows, max }: { rows: { label: string; value: number; text: string; best?: boolean }[]; max: number }) {
  return (
    <View style={{ gap: 16, marginBottom: 4 }}>
      {rows.map((r, i) => (
        <View key={`${r.label}-${i}`} style={s.barRow}>
          <Text style={[s.barLabel, r.best && { color: "#fff", fontWeight: "800" }]} numberOfLines={1}>{r.label}</Text>
          <View style={s.track}>
            <View style={[s.fill, { width: `${Math.max(16, (r.value / Math.max(1, max)) * 100)}%`, backgroundColor: r.best ? "#fff" : YELLOW }]}>
              <Text style={s.fillText} numberOfLines={1}>{r.text}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// t100's line chart: values over the day, the peak marked.
export function LineChart({ points, labels, peakText }: { points: number[]; labels: string[]; peakText: string }) {
  const { width } = useWindowDimensions();
  const w = statCardWidth(width) - 2;
  const h = Math.max(160, statCardWidth(width) * 1.25 - 175);
  const max = Math.max(1, ...points);
  const n = points.length;
  const x = (i: number) => (n === 1 ? w / 2 : 24 + (i * (w - 48)) / (n - 1));
  const y = (v: number) => 18 + (1 - v / max) * (h - 36);
  const d = points.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${d} L${x(n - 1).toFixed(1)},${h} L${x(0).toFixed(1)},${h} Z`;
  const peak = points.indexOf(Math.max(...points));
  return (
    <View style={{ marginHorizontal: -18, marginBottom: -18 }}>
      <Svg width={w} height={h}>
        <Defs>
          <SvgGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={LINE} stopOpacity={0.45} />
            <Stop offset="1" stopColor={LINE} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Path d={area} fill="url(#fade)" />
        <Path d={d} stroke={LINE} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        <Line x1={x(peak)} y1={y(points[peak])} x2={x(peak)} y2={h} stroke={LINE} strokeWidth={1} />
        <Circle cx={x(peak)} cy={y(points[peak])} r={5} fill={LINE} />
      </Svg>
      <Text style={[s.peak, { left: Math.min(w - 70, x(peak) + 10), top: y(points[peak]) - 9 }]}>{peakText}</Text>
      <View style={{ flexDirection: "row", width: w, height: 34, marginTop: 6 }}>
        {labels.map((l, i) => (
          <Text key={`${l}-${i}`} numberOfLines={1} style={[s.xLabel, { position: "absolute", left: Math.max(0, Math.min(w - 64, x(i) - 32)), width: 64 }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

// t116: the standout stop as a full-photo card.
export function StandoutCard({ label, title, photo, category, stats, icon }: { label: string; title: string; photo: string | null; category: string; stats: { label: string; value: string }[]; icon: IconName }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, 520) * 0.9;
  return (
    <View pointerEvents="none" style={[s.standout, { width: w, height: w * 1.42 }]}>
      <PlaceImage uri={photo} category={category} style={StyleSheet.absoluteFill} emojiSize={90} />
      <LinearGradient colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0.78)"]} locations={[0, 0.3, 1]} style={StyleSheet.absoluteFill} />
      <Text style={[s.statLabel, { position: "absolute", top: 18, left: 18 }]}>{label}</Text>
      <View style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
        <Icon name={icon} size={30} tint="#fff" />
        <Text style={s.standoutTitle} numberOfLines={2}>{title}</Text>
        <View style={{ flexDirection: "row", gap: 22, marginTop: 12 }}>
          {stats.map((x) => (
            <View key={x.label}>
              <Text style={s.miniLabel}>{x.label}</Text>
              <Text style={s.miniValue}>{x.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// t044: the podium of fans.
export function Podium({ fans }: { fans: { name: string; going: number; test?: boolean }[] }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, 520) * 0.9;
  const [first, second, third] = fans;
  const spot = (f: { name: string; going: number; test?: boolean } | undefined, size: number, lift: number) => f ? (
    <View style={{ alignItems: "center", width: w / 3, marginBottom: lift }}>
      <View style={{ borderWidth: 3, borderColor: color.strava, borderRadius: size }}>
        <Avatar name={f.name} size={size} tint="#3A3A3A" />
      </View>
      <Text style={[s.fanName, size > 80 && { fontSize: 22 }]} numberOfLines={1}>{f.name}</Text>
      <Text style={s.fanCount}>{f.going} Going</Text>
      {f.test ? <View style={{ marginTop: 4 }}><SampleTag text="Test data" /></View> : null}
    </View>
  ) : <View style={{ width: w / 3 }} />;
  return (
    <View pointerEvents="none" style={[s.statCard, { width: w, height: w * 1.25, paddingHorizontal: 0, overflow: "hidden" }]}>
      <View style={[StyleSheet.absoluteFill, { flexDirection: "row", alignItems: "flex-end" }]}>
        {[60, 130, 40].map((hgt, i) => (
          <LinearGradient key={i} colors={["rgba(253,82,0,0.55)", "rgba(171,25,0,0.15)"]} style={{ width: w / 3 - 6, marginHorizontal: 3, height: hgt, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
        ))}
      </View>
      <Text style={[s.statLabel, { textAlign: "center" }]}>TOP FANS</Text>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end" }}>
        {spot(second, 64, 70)}
        {spot(first, 110, 140)}
        {spot(third, 64, 50)}
      </View>
    </View>
  );
}

// t026: the summary card.
export function SummaryCard({ topLabel, topName, icon, photo, category, pairs }: { topLabel: string; topName: string; icon: IconName; photo: string | null; category: string; pairs: { label: string; value: string }[] }) {
  const { width } = useWindowDimensions();
  const w = Math.min(width, 520) * 0.82;
  const h = w / 0.62;
  const pad = w * 0.07;
  return (
    <View pointerEvents="none" style={[s.summary, { width: w, height: h, borderRadius: w * 0.06 }]} testID="recap-summary-card">
      <View style={{ flexDirection: "row", paddingHorizontal: pad, paddingTop: pad * 1.1 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.sumLabel}>{topLabel}</Text>
          <Icon name={icon} size={w * 0.15} tint={color.strava} style={{ marginTop: 6 }} />
        </View>
        <View style={{ alignItems: "center", width: w * 0.3 }}>
          <View style={s.frame}>
            <PlaceImage uri={photo} category={category} style={{ width: w * 0.26, height: w * 0.26, borderRadius: 4 }} emojiSize={30} />
          </View>
          <Text style={s.frameName} numberOfLines={1}>{topName}</Text>
        </View>
      </View>
      <View style={{ flex: 1, justifyContent: "space-evenly", paddingHorizontal: pad, paddingVertical: pad * 0.4 }}>
        {pairs.map((p) => (
          <View key={p.label}>
            <Text style={s.sumLabel}>{p.label}</Text>
            <Text style={[s.sumValue, { fontSize: w * 0.1, lineHeight: w * 0.12 }]} numberOfLines={1}>{p.value}</Text>
          </View>
        ))}
      </View>
      <Marquee height={h * 0.057} text="FAVES DAY RECAP" />
    </View>
  );
}

function Marquee({ height, text }: { height: number; text: string }) {
  const x = useRef(new Animated.Value(0)).current;
  const [unit, setUnit] = useState(0);
  useEffect(() => {
    if (!unit) return;
    const loop = Animated.loop(Animated.timing(x, { toValue: -unit, duration: unit * 28, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" }));
    loop.start();
    return () => loop.stop();
  }, [unit, x]);
  const words = `${text}   `;
  return (
    <View style={[s.band, { height }]}>
      <Animated.View style={{ flexDirection: "row", alignSelf: "flex-start", width: 4000, transform: [{ translateX: x }] }}>
        {Array.from({ length: 8 }, (_, i) => (
          <Text key={i} onLayout={i === 0 ? (e) => setUnit(e.nativeEvent.layout.width) : undefined} style={[s.bandText, { fontSize: height * 0.62, lineHeight: height, flexShrink: 0 }]}>{words}</Text>
        ))}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  bars: { position: "absolute", left: 10, right: 10, flexDirection: "row", gap: 4, zIndex: 3 },
  bar: { flex: 1, height: 2, borderRadius: 1 },
  close: { position: "absolute", right: 14, zIndex: 3 },
  content: { flex: 1, alignItems: "center" },
  caption: { fontFamily: font.sans, color: "#fff", fontSize: 18, lineHeight: 24, fontWeight: "500", textAlign: "center", marginTop: 22, paddingHorizontal: 28 },
  statCard: { backgroundColor: CARD, borderWidth: 1, borderColor: CARD_RING, borderRadius: 12, padding: 18 },
  statLabel: { fontFamily: font.sans, color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  statValue: { fontFamily: font.sans, color: "#fff", fontSize: 58, lineHeight: 66, fontWeight: "800", marginTop: 4, letterSpacing: -1 },
  statUnit: { fontSize: 22, fontWeight: "700", letterSpacing: 0 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barLabel: { fontFamily: font.sans, color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700", width: 78, letterSpacing: 0.4 },
  track: { flex: 1, height: 22, borderRadius: 11, backgroundColor: "rgba(253,211,0,0.16)", overflow: "hidden" },
  fill: { height: 22, borderRadius: 11, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 7 },
  fillText: { fontFamily: font.sans, color: "#000", fontSize: 12, fontWeight: "800" },
  peak: { position: "absolute", fontFamily: font.sans, color: "#fff", fontSize: 14, fontWeight: "700" },
  xLabel: { fontFamily: font.sans, color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "700", textAlign: "center", letterSpacing: 0.4 },
  standout: { borderRadius: 12, overflow: "hidden", backgroundColor: "#222" },
  standoutTitle: { fontFamily: font.sans, color: "#fff", fontSize: 26, lineHeight: 31, fontWeight: "800", marginTop: 8 },
  miniLabel: { fontFamily: font.sans, color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: "600" },
  miniValue: { fontFamily: font.sans, color: "#fff", fontSize: 19, fontWeight: "800", marginTop: 2 },
  fanName: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 8, maxWidth: "92%" },
  fanCount: { fontFamily: font.sans, color: "#fff", fontSize: 15, fontWeight: "500", marginTop: 1 },
  summary: { backgroundColor: color.stravaCard, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  sumLabel: { fontFamily: font.sans, color: "#fff", fontSize: 14, fontWeight: "600" },
  sumValue: { fontFamily: font.sans, color: "#fff", fontWeight: "800", marginTop: 2, letterSpacing: -0.5 },
  frame: { padding: 3, borderWidth: 2, borderColor: color.strava, borderRadius: 8, backgroundColor: "#2A1A12" },
  frameName: { fontFamily: font.sans, color: color.strava, fontSize: 10, fontWeight: "800", marginTop: 5, letterSpacing: 0.3, textTransform: "uppercase" },
  band: { backgroundColor: color.stravaBand, overflow: "hidden", justifyContent: "center" },
  bandText: { fontFamily: font.sans, color: "#000", fontWeight: "900", letterSpacing: 0.5 },
});
