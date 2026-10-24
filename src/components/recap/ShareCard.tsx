// The shareable day card, copied from Spotify Wrapped 2025's summary share card
// (social/spotify/wrapped2025_newsroom_summary_share_cards.png): 9:16, corner radius 7.1% of
// the width, text inset 7.4%; the top ~48% is the art (a big vertical accent word down the
// left, the photo framed by ink/paper stripes); then two numbered columns, two big stats
// (value ~4x the list cap height), and a footer with the logo and a caps line. Four
// colorways: #DAB503 and #FF4834 on paper #EFEFEA, #9691FF and #95C90D on ink #272727.
import { Image } from "expo-image";
import type { ComponentRef, Ref } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PlaceImage } from "@/components/ui";
import { color, font } from "@/theme/tokens";

export interface Colorway { accent: string; bg: string; fg: string }
export const COLORWAYS: Colorway[] = [
  { accent: color.wrapped[0], bg: color.wrappedPaper, fg: color.wrappedInk },
  { accent: color.wrapped[1], bg: color.wrappedInk, fg: color.wrappedPaper },
  { accent: color.wrapped[2], bg: color.wrappedPaper, fg: color.wrappedInk },
  { accent: color.wrapped[3], bg: color.wrappedInk, fg: color.wrappedPaper },
];

export interface ShareCardData {
  stamp: string; // the vertical accent word, e.g. "OCT 25"
  photo: string | null;
  category: string;
  stops: string[];
  loved: string[];
  miles: string;
  score: string;
  footer: string;
}

export function ShareCard({ data, colorway, width, viewRef, testID }: { data: ShareCardData; colorway: Colorway; width: number; viewRef?: Ref<ComponentRef<typeof View>>; testID?: string }) {
  const W = width, H = (W * 16) / 9;
  const inset = W * 0.074;
  const { accent, bg, fg } = colorway;
  const artH = H * 0.475;
  const photo = W * 0.66;
  const stripe = W * 0.024;
  const list = W * 0.052;
  const colW = W - photo - stripe * 1.6;
  const stampSize = Math.min(colW * 0.8, (artH * 0.92) / Math.max(3, data.stamp.length * 0.66));
  const label = W * 0.036;
  const stripes = (n: number, vertical: boolean) => (
    <View style={{ flexDirection: vertical ? "column" : "row", flex: 1 }}>
      {Array.from({ length: n }, (_, i) => <View key={i} style={{ flex: 1, backgroundColor: i % 2 ? bg : fg }} />)}
    </View>
  );
  return (
    <View ref={viewRef} collapsable={false} testID={testID} style={[s.card, { width: W, height: H, borderRadius: W * 0.071, backgroundColor: bg }]}>
      {/* Art: accent word down the left, the photo in a striped frame on the right */}
      <View style={{ height: artH, flexDirection: "row" }}>
        <View style={{ width: colW, height: artH, overflow: "hidden" }}>
          {/* The word runs bottom to top, like Wrapped's "2025": a box artH wide, turned. */}
          <View style={{ position: "absolute", width: artH, height: colW, left: (colW - artH) / 2, top: (artH - colW) / 2, transform: [{ rotate: "-90deg" }], alignItems: "center", justifyContent: "center" }}>
            <Text numberOfLines={1} style={[s.stamp, { color: accent, fontSize: stampSize, lineHeight: stampSize * 1.05 }]}>{data.stamp}</Text>
          </View>
        </View>
        <View style={{ width: photo + stripe * 1.6 }}>
          <View style={{ height: (artH - photo) / 2 }}>{stripes(Math.round(photo / stripe / 1.2), false)}</View>
          <View style={{ flexDirection: "row", height: photo }}>
            <PlaceImage uri={data.photo} category={data.category} style={{ width: photo, height: photo }} emojiSize={W * 0.2} />
            <View style={{ flex: 1 }}>{stripes(Math.round(photo / stripe / 1.4), true)}</View>
          </View>
          <View style={{ flex: 1 }}>{stripes(Math.round(photo / stripe / 1.2), false)}</View>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: inset, paddingTop: H * 0.05 }}>
        <View style={{ flexDirection: "row", gap: inset * 0.6, height: H * 0.205 }}>
          <Column title="Stops" items={data.stops} fg={fg} label={label} size={list} />
          <Column title="Loved most" items={data.loved.length ? data.loved : []} empty="No thumbs up yet" fg={fg} label={label} size={list} />
        </View>
        <View style={{ flexDirection: "row", gap: inset * 0.6, marginTop: H * 0.012 }}>
          <Stat title="Miles" value={data.miles} fg={fg} label={label} size={W * 0.095} />
          <Stat title="Locals Score avg" value={data.score} fg={fg} label={label} size={W * 0.095} />
        </View>
        <View style={{ flex: 1 }} />
        <View style={[s.footer, { paddingBottom: H * 0.035 }]}>
          <Image source={require("../../../assets/brand/mark.png")} style={{ width: W * 0.095, height: W * 0.095, borderRadius: W * 0.022 }} contentFit="contain" />
          <Text style={[s.footerText, { color: fg, fontSize: W * 0.042 }]} numberOfLines={1}>{data.footer}</Text>
        </View>
      </View>
    </View>
  );
}

function Column({ title, items, empty, fg, label, size }: { title: string; items: string[]; empty?: string; fg: string; label: number; size: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.label, { color: fg, fontSize: label }]}>{title}</Text>
      <View style={{ marginTop: size * 0.35 }}>
        {items.length ? items.slice(0, 5).map((t, i) => (
          <Text key={`${t}-${i}`} numberOfLines={1} style={[s.item, { color: fg, fontSize: size, lineHeight: size * 1.22 }]}>{i + 1} {t}</Text>
        )) : <Text style={[s.item, { color: fg, opacity: 0.6, fontSize: size * 0.85 }]}>{empty}</Text>}
      </View>
    </View>
  );
}

function Stat({ title, value, fg, label, size }: { title: string; value: string; fg: string; label: number; size: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[s.label, { color: fg, fontSize: label }]}>{title}</Text>
      <Text style={[s.stat, { color: fg, fontSize: size, lineHeight: size * 1.18 }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { overflow: "hidden" },
  stamp: { fontFamily: font.sans, fontWeight: "900", textAlign: "center", letterSpacing: -2 },
  label: { fontFamily: font.sans, fontWeight: "500" },
  item: { fontFamily: font.sans, fontWeight: "600" },
  stat: { fontFamily: font.sans, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerText: { fontFamily: font.sans, fontWeight: "800", letterSpacing: 0.2 },
});
