// Profile pieces in the Faves identity: passport stamps for stats, card-stock rows, ticket stubs.
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { font, palette } from "@/theme/tokens";
import { Icon, type IconName } from "@/components/ui";

// Compact card-stock button.
export function OutlineButton({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outline, pressed && { backgroundColor: palette.paperDeep }]}>
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

// A stat as a passport stamp: a dashed rose ring with the number, the label under it.
export function Stat({ value, label, onPress, testID, tilt = 0 }: { value: string; label: string; onPress?: () => void; testID: string; tilt?: number }) {
  return (
    <Pressable testID={testID} accessibilityRole={onPress ? "button" : "text"} accessibilityLabel={`${value} ${label}`} disabled={!onPress} onPress={onPress} style={styles.stat}>
      <View style={[styles.stamp, { transform: [{ rotate: `${tilt}deg` }] }]}><Text style={styles.statValue}>{value}</Text></View>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

// Rows inside a card-stock panel: icon, label, value, chevron.
export function ProfileRow({ icon, label, value, onPress, testID, last }: { icon: IconName; label: string; value?: ReactNode; onPress: () => void; testID: string; last?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && { backgroundColor: palette.paperDeep }]}>
      <View style={styles.rowIcon}><Icon name={icon} size={20} tint={palette.roseInk} /></View>
      <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
      {typeof value === "string" ? <Text style={styles.rowValue}>{value}</Text> : value}
      <Icon name="chevron-forward" size={18} tint={palette.inkMuted} />
    </Pressable>
  );
}

// A ticket stub: sunset band on the left, the label and value on paper.
export function StatCard({ icon, label, value, onPress, testID, tag }: { icon: IconName; label: string; value: string; onPress?: () => void; testID: string; tag?: ReactNode }) {
  return (
    <Pressable testID={testID} accessibilityRole={onPress ? "button" : "text"} accessibilityLabel={`${label}: ${value}`} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.cardStub}><Icon name={icon} size={20} tint={palette.ink} /></View>
      <View style={{ flex: 1, paddingVertical: 10, paddingRight: 10 }}>
        <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.cardValue} numberOfLines={1}>{value}</Text>
        {tag ? <View style={{ marginTop: 4 }}>{tag}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outline: { flex: 1, height: 36, borderRadius: 12, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center", backgroundColor: palette.card },
  outlineText: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.ink },
  stat: { flex: 1, alignItems: "center", gap: 6 },
  stamp: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderStyle: "dashed", borderColor: palette.rose, backgroundColor: palette.roseTint, alignItems: "center", justifyContent: "center" },
  statValue: { fontFamily: font.displayHeavy, fontSize: 24, color: palette.roseInk },
  statLabel: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.inkSoft },
  row: { height: 50, flexDirection: "row", alignItems: "center", paddingLeft: 14, paddingRight: 14, backgroundColor: palette.card },
  rowLine: { borderBottomWidth: 1, borderBottomColor: palette.line },
  rowIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: palette.roseTint, alignItems: "center", justifyContent: "center", marginRight: 12 },
  rowLabel: { flex: 1, fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: palette.ink },
  rowValue: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: palette.inkSoft, marginRight: 10 },
  card: { flex: 1, minHeight: 78, borderRadius: 14, flexDirection: "row", alignItems: "stretch", overflow: "hidden", backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line },
  cardStub: { width: 42, backgroundColor: palette.sunset, alignItems: "center", justifyContent: "center", borderRightWidth: 2, borderRightColor: palette.paper, borderStyle: "dashed", marginRight: 10 },
  cardLabel: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.inkMuted },
  cardValue: { fontFamily: font.display, fontSize: 19, color: palette.ink, marginTop: 2 },
});
