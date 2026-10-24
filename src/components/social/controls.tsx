// Controls used across the social screens, each copying one Beli screen (values measured in
// docs/design_references.md, Beli sections).
import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { color, font } from "@/theme/tokens";
import { Icon, type IconName } from "@/components/ui";

const pressed = ({ pressed: p }: { pressed: boolean }) => (p ? { opacity: 0.7 } : null);

// Beli's feed header (social/beli/yt_GlMma4eXe18_t160): the serif "beli" wordmark at the left
// in deep teal, icon buttons at the right. Ours: the Faves mark + a serif "faves".
export function WordmarkHeader({ right }: { right?: ReactNode }) {
  return (
    <View style={styles.wordHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }} accessibilityRole="header" accessibilityLabel="Faves">
        <Image source={require("../../../assets/brand/mark.png")} style={{ width: 28, height: 28, borderRadius: 7 }} contentFit="contain" />
        <Text style={styles.wordmark}>faves</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>{right}</View>
    </View>
  );
}

export function HeaderIcon({ icon, label, onPress, testID, dot }: { icon: IconName; label: string; onPress: () => void; testID: string; dot?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={onPress} style={pressed}>
      <Icon name={icon} size={27} tint="#000" />
      {dot ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

// Beli's grey search field: #EBEBED, 37 pt tall, 22 pt side margins, magnifier + placeholder.
export function SearchField({ placeholder, onPress, testID }: { placeholder: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="search" accessibilityLabel={placeholder} onPress={onPress} style={styles.search}>
      <Icon name="search" size={19} tint="#727073" />
      <Text style={styles.searchText} numberOfLines={1}>{placeholder}</Text>
    </Pressable>
  );
}

// Beli's filled chips: 32 pt, full round, icon + white label; selected #134456, others #9DB3B7.
export function FilledChip({ label, icon, on, onPress, testID }: { label: string; icon: IconName; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={(s) => [styles.fchip, { backgroundColor: on ? "#134456" : color.chipBeliOff }, pressed(s)]}>
      <Icon name={icon} size={16} tint="#fff" />
      <Text style={styles.fchipText}>{label}</Text>
    </Pressable>
  );
}

// Beli's caps section header ("FEATURED LISTS" / "YOUR FEED") with an optional teal "See all".
export function CapsHeader({ title, action, onAction, testID }: { title: string; action?: string; onAction?: () => void; testID?: string }) {
  return (
    <View style={styles.caps}>
      <Text style={styles.capsText} accessibilityRole="header">{title}</Text>
      {action && onAction ? <Pressable testID={testID} accessibilityRole="button" hitSlop={8} onPress={onAction}><Text style={styles.capsAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

// Beli's invite card: white, 1 px #CDCDCD border, radius 8, bold teal title, grey line,
// full-width #144554 button 43 pt.
export function InviteCard({ title, body, cta, onPress, testID }: { title: string; body: string; cta: string; onPress: () => void; testID: string }) {
  return (
    <View style={styles.invite} testID={testID}>
      <Text style={styles.inviteTitle}>{title}</Text>
      <Text style={styles.inviteBody}>{body}</Text>
      <Pressable testID={`${testID}-cta`} accessibilityRole="button" onPress={onPress} style={(s) => [styles.inviteButton, pressed(s)]}>
        <Text style={styles.inviteButtonText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

// Beli's List | Map toggle (discovery/beli/beli_appstore_ipad_list_map_toggle.png): 32 pt,
// radius 8.5, 2 pt teal outline; the selected half is teal with a white icon and label.
export function BrandToggle<T extends string>({ options, value, onChange, testID }: { options: { id: T; label: string; icon: IconName }[]; value: T; onChange: (v: T) => void; testID: string }) {
  return (
    <View style={styles.toggle} testID={testID} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} testID={`${testID}-${o.id}`} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={[styles.toggleHalf, on && { backgroundColor: color.brand }]}>
            <Icon name={o.icon} size={17} tint={on ? "#fff" : color.brand} />
            <Text style={[styles.toggleText, { color: on ? "#fff" : color.brand }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Beli's leaderboard segmented control (discovery/beli/beli_leaderboard_vid.jpg): 33 pt grey
// #F0F0F5 track, the selected segment a white rounded card, thin dividers between the others.
export function TrackSegmented<T extends string>({ options, value, onChange, testID }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; testID: string }) {
  return (
    <View style={styles.track} testID={testID} accessibilityRole="tablist">
      {options.map((o, i) => {
        const on = o.id === value;
        const prevOn = i > 0 && options[i - 1].id === value;
        return (
          <Pressable key={o.id} testID={`${testID}-${o.id}`} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={[styles.seg, on && styles.segOn]}>
            {i > 0 && !on && !prevOn ? <View style={styles.segDivider} /> : null}
            <Text style={[styles.segText, on && { fontWeight: "600" }]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// Beli's list tabs ("Been / Want to Try", beli_appstore_02): left-aligned, active bold
// #222428 with a 2 pt underline the width of the label, inactive #A2A4AB.
export function UnderlineTabs<T extends string>({ options, value, onChange, testID }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; testID: string }) {
  return (
    <View style={styles.utabs} testID={testID} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable key={o.id} testID={`${testID}-${o.id}`} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={styles.utab}>
            <Text style={[styles.utabText, on && styles.utabOn]}>{o.label}</Text>
            <View style={[styles.utabLine, on && { backgroundColor: "#222428" }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

// Beli's outlined dropdown chip ("All Members ▾", "New York, NY ▾").
export function DropChip({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={(s) => [styles.drop, pressed(s)]}>
      <Text style={styles.dropText}>{label}</Text>
      <Icon name="chevron-down" size={16} tint="#0F3F49" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wordHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12 },
  wordmark: { fontFamily: font.serifBlack, fontSize: 31, lineHeight: 36, color: "#163E44", letterSpacing: -0.5 },
  dot: { position: "absolute", right: -1, bottom: 1, width: 8, height: 8, borderRadius: 4, backgroundColor: "#E5534B" },
  search: { marginHorizontal: 22, height: 37, borderRadius: 10, backgroundColor: "#EBEBED", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  searchText: { fontFamily: font.sans, fontSize: 17, color: "#727073", flex: 1 },
  fchip: { height: 32, borderRadius: 16, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  fchipText: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "500" },
  caps: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingTop: 22, paddingBottom: 10 },
  capsText: { fontFamily: font.sans, fontSize: 14, fontWeight: "700", color: "#000", letterSpacing: 0.6 },
  capsAction: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: "#18383C", letterSpacing: 0.3 },
  invite: { marginHorizontal: 22, borderWidth: 1, borderColor: "#CDCDCD", borderRadius: 8, padding: 16, paddingTop: 18 },
  inviteTitle: { fontFamily: font.sans, fontSize: 18, fontWeight: "700", color: "#153A3F" },
  inviteBody: { fontFamily: font.sans, fontSize: 16, color: "#89898B", marginTop: 4 },
  inviteButton: { height: 43, borderRadius: 5, backgroundColor: "#144554", alignItems: "center", justifyContent: "center", marginTop: 16 },
  inviteButtonText: { fontFamily: font.sans, color: "#fff", fontSize: 17, fontWeight: "700" },
  toggle: { flexDirection: "row", height: 32, borderRadius: 8.5, borderWidth: 2, borderColor: color.brand, overflow: "hidden" },
  toggleHalf: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff" },
  toggleText: { fontFamily: font.sans, fontSize: 16, fontWeight: "500" },
  track: { flexDirection: "row", height: 33, borderRadius: 9, backgroundColor: "#F0F0F5", padding: 2, borderWidth: 1, borderColor: "#E2E2E8" },
  seg: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 7, flexDirection: "row" },
  segOn: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segDivider: { position: "absolute", left: 0, top: 7, bottom: 7, width: 1, backgroundColor: "#D3D3D8" },
  segText: { fontFamily: font.sans, fontSize: 15, color: "#000" },
  utabs: { flexDirection: "row", gap: 24, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E9E9E9" },
  utab: { paddingTop: 6 },
  utabText: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: "#A2A4AB", letterSpacing: 0.4, paddingBottom: 8 },
  utabOn: { color: "#222428", fontWeight: "700" },
  utabLine: { height: 2, borderRadius: 1, backgroundColor: "transparent" },
  drop: { height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#A2ABC8", backgroundColor: "#EAEDEF", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  dropText: { fontFamily: font.sans, fontSize: 16, color: "#0F3F49" },
});
