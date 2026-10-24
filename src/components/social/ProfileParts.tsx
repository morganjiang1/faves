// Profile pieces copied from Beli's profile (social/beli/appstore_06_profile_stats.png, 2.70 px/pt;
// own-profile layout from yt_GlMma4eXe18_t192_profile_new_user.png; activity from
// discovery/beli/beli_appstore_ipad_profile_activity.png).
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { color, font } from "@/theme/tokens";
import { Icon, type IconName } from "@/components/ui";

// Outlined button: 33 pt tall, 1 pt #D3D3D3, radius 5, #222427 label.
export function OutlineButton({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.outline, pressed && { backgroundColor: "#F6F6F6" }]}>
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

// Stats trio: value 16 pt semibold #222427 over a 16 pt #989AA3 label.
export function Stat({ value, label, onPress, testID }: { value: string; label: string; onPress?: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole={onPress ? "button" : "text"} accessibilityLabel={`${value} ${label}`} disabled={!onPress} onPress={onPress} style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

// List rows at a 43 pt pitch: icon, bold label, bold count, #BFBFBF chevron, #D0CFD3 dividers.
export function ProfileRow({ icon, label, value, onPress, testID, last }: { icon: IconName; label: string; value?: ReactNode; onPress: () => void; testID: string; last?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && { backgroundColor: "#FAFAFA" }]}>
      <View style={styles.rowIcon}><Icon name={icon} size={25} tint="#000" /></View>
      <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
      {typeof value === "string" ? <Text style={styles.rowValue}>{value}</Text> : value}
      <Icon name="chevron-forward" size={20} tint="#BFBFBF" />
    </Pressable>
  );
}

// 2-up stat cards: 1 pt #E5E5E5, radius 12, teal icon, grey label, teal bold value.
export function StatCard({ icon, label, value, onPress, testID, tag }: { icon: IconName; label: string; value: string; onPress?: () => void; testID: string; tag?: ReactNode }) {
  return (
    <Pressable testID={testID} accessibilityRole={onPress ? "button" : "text"} accessibilityLabel={`${label}: ${value}`} disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.card, pressed && { backgroundColor: "#FAFAFA" }]}>
      <Icon name={icon} size={23} tint={color.brandDeep} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardLabel} numberOfLines={1}>{label}</Text>
        <Text style={styles.cardValue} numberOfLines={1}>{value}</Text>
        {tag ? <View style={{ marginTop: 4 }}>{tag}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outline: { flex: 1, height: 33, borderRadius: 5, borderWidth: 1, borderColor: color.border, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  outlineText: { fontFamily: font.sans, fontSize: 16, color: color.text },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: color.text },
  statLabel: { fontFamily: font.sans, fontSize: 16, color: color.textMuted, letterSpacing: 0.3 },
  row: { height: 43, flexDirection: "row", alignItems: "center", paddingLeft: 17, paddingRight: 16, backgroundColor: "#fff" },
  rowLine: { borderBottomWidth: 1, borderBottomColor: "#D0CFD3" },
  rowIcon: { width: 32, alignItems: "center", marginRight: 20 },
  rowLabel: { flex: 1, fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "#000" },
  rowValue: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "#000", marginRight: 12 },
  card: { flex: 1, minHeight: 85, borderWidth: 1, borderColor: color.hairline, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: "#fff" },
  cardLabel: { fontFamily: font.sans, fontSize: 16, color: "#8D8C8C" },
  cardValue: { fontFamily: font.sans, fontSize: 18, fontWeight: "700", color: color.brandDeep, marginTop: 1 },
});
