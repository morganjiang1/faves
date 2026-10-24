// Your days as a diary: Letterboxd's Diary (social/letterboxd/appstore_03_diary.png, 2.6 px/pt):
// a 30 pt month band with an uppercase letter-spaced label, then 55 pt rows: the day-of-month
// numeral in an outlined 34x37 pt square (18 pt from the edge), a 2:3 poster thumbnail
// (26x37 pt, here the first stop's photo), a semibold title with a smaller grey suffix and a
// meta line of small glyphs. Letterboxd is dark; Faves keeps the layout and sizes on its
// light palette (band #F4F5F8, label #6E7F90, box #D3D3D3, numerals #989AA3).
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { City } from "@/data/types";
import type { Plan } from "@/lib/planner";
import { DAY_SHORT } from "@/lib/time";
import { color, font } from "@/theme/tokens";
import { Icon, PlaceImage, type IconName } from "@/components/ui";

export function MonthBand({ label }: { label: string }) {
  return (
    <View style={styles.band}>
      <Text style={styles.bandText} accessibilityRole="header">{label.toUpperCase()}</Text>
    </View>
  );
}

export function DiaryRow({ plan, city, glyphs, onPress, testID, at }: { plan: Plan; city: City | null; glyphs: { icon: IconName; tint?: string; label: string }[]; onPress: () => void; testID: string; at?: Date }) {
  const first = plan.stops.map((s) => city?.byId.get(s.placeId)).find(Boolean);
  // The day's own date, or (for days saved from the feed) the date it was posted.
  const date = at ? new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate(), 12)) : new Date(`${plan.dateISO}T12:00:00Z`);
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${plan.title}, ${plan.dayLabel}`} onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#FAFAFA" }]}>
      <View style={styles.box}><Text style={styles.numeral}>{date.getUTCDate()}</Text></View>
      <PlaceImage uri={first?.image} category={first?.category ?? "views"} style={styles.poster} emojiSize={14} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {plan.title}<Text style={styles.suffix}> {DAY_SHORT[date.getUTCDay()]}</Text>
        </Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{plan.stops.length} {plan.stops.length === 1 ? "stop" : "stops"}</Text>
          {glyphs.map((g) => (
            <View key={g.label} accessibilityLabel={g.label}><Icon name={g.icon} size={14} tint={g.tint ?? "#98A0A8"} /></View>
          ))}
        </View>
      </View>
      <Icon name="chevron-forward" size={18} tint="#BFBFBF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band: { height: 30, justifyContent: "center", paddingHorizontal: 18, backgroundColor: "#F4F5F8" },
  bandText: { fontFamily: font.sans, fontSize: 12, letterSpacing: 1.2, color: "#6E7F90", fontWeight: "500" },
  row: { height: 55, flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 14 },
  box: { width: 34, height: 37, borderWidth: 1, borderColor: color.border, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  numeral: { fontFamily: font.sans, fontSize: 20, fontWeight: "300", color: color.textMuted },
  poster: { width: 26, height: 37, borderRadius: 2, marginLeft: 8 },
  text: { flex: 1, marginLeft: 9, alignSelf: "stretch", justifyContent: "center", borderBottomWidth: 1, borderBottomColor: color.hairline, marginRight: 6 },
  title: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: "#000" },
  suffix: { fontSize: 13, fontWeight: "400", color: color.textMuted },
  meta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  metaText: { fontFamily: font.sans, fontSize: 13, color: color.textMuted, marginRight: 2 },
});

// The whole diary: plans grouped under month bands (newest first), then the days you saved
// from the feed under their own band.
export function DaysDiary({ plans, saved, city, glyphsFor, onOpenPlan, onOpenSaved, testID }: {
  plans: Plan[];
  saved: { id: string; plan: Plan; at: Date }[];
  city: City | null;
  glyphsFor: (p: Plan) => { icon: IconName; tint?: string; label: string }[];
  onOpenPlan: (p: Plan) => void;
  onOpenSaved: (id: string) => void;
  testID: string;
}) {
  const groups: { label: string; plans: Plan[] }[] = [];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  for (const p of [...plans].sort((a, b) => b.dateISO.localeCompare(a.dateISO) || b.createdAt.localeCompare(a.createdAt))) {
    const d = new Date(`${p.dateISO}T12:00:00Z`);
    const label = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.plans.push(p); else groups.push({ label, plans: [p] });
  }
  return (
    <View testID={testID}>
      {groups.map((g) => (
        <View key={g.label}>
          <MonthBand label={g.label} />
          {g.plans.map((p) => <DiaryRow key={p.id} testID={`diary-${p.id}`} plan={p} city={city} glyphs={glyphsFor(p)} onPress={() => onOpenPlan(p)} />)}
        </View>
      ))}
      {saved.length ? (
        <View>
          <MonthBand label="Saved from the feed" />
          {saved.map((s) => <DiaryRow key={s.id} testID={`diary-saved-${s.id}`} plan={s.plan} at={s.at} city={city} glyphs={[{ icon: "bookmark", tint: color.brand, label: "Saved" }]} onPress={() => onOpenSaved(s.id)} />)}
        </View>
      ) : null}
    </View>
  );
}
