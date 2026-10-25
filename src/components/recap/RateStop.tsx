// One stop's rating, copied from Uber Eats' "Rate your courier" block
// (social/ubereats/appstore_07_rate_order_thumbs_chips_stars.png, 2.11 px/pt): a ~22 pt bold
// question, a ~16 pt #717171 line under it, two 62 pt circles 18 pt apart (off = #F3F3F3 with
// a #727272 outline thumb, on = #000 with a white filled thumb), then 38 pt reason chips
// (on = black / white text, off = #F3F3F3 / black), 8 pt apart, about 15 pt between rows.
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Chip, Icon } from "@/components/ui";
import { font, palette } from "@/theme/tokens";

export const UP_REASONS = ["Worth the wait", "Great for groups", "Cheap", "Great view", "Would go again"];
export const DOWN_REASONS = ["Too crowded", "Overpriced", "Closed early", "Not as pictured"];

export function RateStop({ name, line, rating, reasons, onRate, onReason, testID }: { name: string; line: string; rating: "up" | "down" | null; reasons: string[]; onRate: (r: "up" | "down" | null) => void; onReason: (r: string) => void; testID: string }) {
  const list = rating === "up" ? UP_REASONS : rating === "down" ? DOWN_REASONS : [];
  return (
    <View testID={testID} style={s.block}>
      <Text style={s.title}>How was {name}?</Text>
      <Text style={s.line}>{line}</Text>
      <View style={s.thumbs}>
        <Thumb kind="down" on={rating === "down"} onPress={() => onRate(rating === "down" ? null : "down")} testID={`${testID}-down`} />
        <Thumb kind="up" on={rating === "up"} onPress={() => onRate(rating === "up" ? null : "up")} testID={`${testID}-up`} />
      </View>
      {list.length ? (
        <View style={s.chips}>
          {list.map((r) => <Chip key={r} label={r} on={reasons.includes(r)} onPress={() => onReason(r)} testID={`${testID}-reason-${r.toLowerCase().replace(/[^a-z]+/g, "-")}`} />)}
        </View>
      ) : null}
    </View>
  );
}

function Thumb({ kind, on, onPress, testID }: { kind: "up" | "down"; on: boolean; onPress: () => void; testID: string }) {
  const name = kind === "up" ? (on ? "thumbs-up" : "thumbs-up-outline") : on ? "thumbs-down" : "thumbs-down-outline";
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={kind === "up" ? "Thumbs up" : "Thumbs down"} accessibilityState={{ selected: on }} onPress={onPress} style={({ pressed }) => [s.thumb, { backgroundColor: on ? "#000" : "#F3F3F3" }, pressed && { opacity: 0.8 }]}>
      <Icon name={name} size={27} tint={on ? "#fff" : "#727272"} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  block: { paddingHorizontal: 16, paddingTop: 22, paddingBottom: 26 },
  title: { fontFamily: font.sans, fontSize: 22, lineHeight: 28, fontWeight: "700", color: palette.ink },
  line: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: palette.inkMuted, marginTop: 3 },
  thumbs: { flexDirection: "row", gap: 18, marginTop: 22 },
  thumb: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", flexWrap: "wrap", columnGap: 8, rowGap: 15, marginTop: 26 },
});
