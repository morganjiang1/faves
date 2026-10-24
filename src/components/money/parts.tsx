// Spot rewards wallet parts. Each one copies a measured reference (docs/design_references.md,
// "Spot rewards wallet" sections and the Element map at the end):
// - BalanceBox, TxRow: Ibotta Earnings (wallet/ibotta/appstore_05_earnings_withdraw_transactions.png)
// - MethodCard: Venmo Transfer Balance (wallet/venmo/yt_wHGzOIg7ayA_t043_instant_selected_fee.png)
// - MethodRow: Rakuten "Choose how you get paid" (wallet/rakuten/appstore_05_choose_how_you_get_paid.png)
// - ProgressRing: DoorDash Fast Pay success (wallet/doordash-dasher/yt_QtNGm8n4OdE_t038_fast_pay_in_progress.png)
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { WalletEntry } from "@/state/store";
import { color, font } from "@/theme/tokens";
import { Icon, type IconName } from "../ui";

// Ibotta values (2.47 px/pt): box 330 pt wide with 31 pt margins, radius 9.7, 1 pt #C2C2C2;
// band 41 pt; white body 103 pt; strip 15 pt; labels about 19 pt; amount bold about 47 pt.
export function BalanceBox({ lifetime, ready, onInfo, testID }: { lifetime: string; ready: string; onInfo?: () => void; testID?: string }) {
  return (
    <View testID={testID} style={styles.box}>
      <View style={styles.band}>
        <Text style={styles.bandLabel}>Lifetime earned</Text>
        <Text testID="wallet-lifetime" style={styles.bandValue}>{lifetime}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.bodyTop}>
          <Text style={styles.bodyLabel}>Ready to cash out</Text>
          {onInfo ? (
            <Pressable testID="wallet-info" accessibilityRole="button" accessibilityLabel="How you earn" hitSlop={10} onPress={onInfo}>
              <Icon name="information-circle-outline" size={25} tint={color.brand} />
            </Pressable>
          ) : null}
        </View>
        <Text testID="wallet-balance" style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>{ready}</Text>
      </View>
      <View style={styles.strip} />
    </View>
  );
}

const KIND: Record<WalletEntry["kind"], { icon: IconName; bg: string }> = {
  save: { icon: "bookmark", bg: color.dashTag },
  "did-day": { icon: "footsteps", bg: color.brand },
  trending: { icon: "diamond", bg: color.gem },
  booking: { icon: "ticket", bg: color.appleOrange },
  payout: { icon: "arrow-up", bg: "#5E5E5E" },
};

// Ibotta transaction row: 70.5 pt pitch, 33 pt circle 25 pt from the edge, bold name 66 pt from
// the edge, bold amount right-aligned 23.5 pt in, 1 pt #E8E8E8 divider inset 21.5 / 22 pt.
export function TxRow({ kind, icon, tint, name, amount, muted, last, lines, testID, children }: { kind?: WalletEntry["kind"]; icon?: IconName; tint?: string; name: string; amount?: string; muted?: boolean; last?: boolean; lines?: number; testID?: string; children?: ReactNode }) {
  const k = kind ? KIND[kind] : null;
  return (
    <View testID={testID} style={styles.txWrap}>
      <View style={styles.tx}>
        <View style={[styles.txCircle, { backgroundColor: tint ?? k?.bg ?? "#F2F2F2" }]}>
          <Icon name={icon ?? k?.icon ?? "ellipse"} size={16} tint={tint === "#F2F2F2" || (!tint && !k) ? color.brand : "#fff"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.txName, muted && styles.txNameMuted]} numberOfLines={lines ?? (muted ? 3 : 2)}>{name}</Text>
          {children}
        </View>
        {amount ? <Text style={styles.txAmount}>{amount}</Text> : null}
      </View>
      {!last ? <View style={styles.txDivider} /> : null}
    </View>
  );
}

// Section header under the button: Ibotta "Transactions", semibold about 24 pt, #010300.
export function MoneyHeader({ title, right, onRight, testID }: { title: string; right?: string; onRight?: () => void; testID?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerText}>{title}</Text>
      {right && onRight ? (
        <Pressable testID={testID} accessibilityRole="button" hitSlop={8} onPress={onRight}>
          <Text style={styles.headerLink}>{right}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export interface PayoutMethod { id: string; kind: "gift" | "bank"; label: string; icon: IconName; speed: string; note: string }

export const PAYOUT_METHODS: PayoutMethod[] = [
  { id: "amazon", kind: "gift", label: "Amazon gift card", icon: "logo-amazon", speed: "Instant", note: "Gift cards arrive in minutes." },
  { id: "apple", kind: "gift", label: "Apple gift card", icon: "logo-apple", speed: "Instant", note: "Gift cards arrive in minutes." },
  { id: "bank", kind: "bank", label: "Bank transfer", icon: "business", speed: "1 to 3 days", note: "Bank transfers take 1 to 3 business days." },
  { id: "paypal", kind: "bank", label: "PayPal", icon: "logo-paypal", speed: "1 to 3 days", note: "PayPal transfers take 1 to 3 business days." },
];

// Venmo method card: 172 x 160 pt, radius 7.6; selected = 1 pt brand border + 58 pt filled
// icon circle; unselected = 1 pt #ACACAC border + grey #929498 circle and a grey label.
export function MethodCard({ icon, label, speed, on, onPress, testID }: { icon: IconName; label: string; speed: string; on: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${label}, ${speed}`} onPress={onPress} style={[styles.card, { borderColor: on ? color.brand : "#ACACAC" }]}>
      <View style={[styles.cardCircle, { backgroundColor: on ? color.brand : "#929498" }]}>
        <Icon name={icon} size={26} tint="#fff" />
      </View>
      <Text style={[styles.cardLabel, !on && { color: "#7A7A7E" }]}>{label}</Text>
      <Text style={styles.cardSpeed}>{speed}</Text>
    </Pressable>
  );
}

// Rakuten method card: 333 pt wide, 20.6 pt margins, 92.6 pt tall, 17 pt gap, 1 pt #DDDDDD,
// radius 7; logo 22.7 pt; bold name about 16 pt #22202D; brand "Select" or green "✓ Selected".
export function MethodRow({ method, on, onPress }: { method: PayoutMethod; on: boolean; onPress: () => void }) {
  return (
    <Pressable testID={`method-${method.id}`} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={method.label} onPress={onPress} style={styles.row}>
      <View style={styles.rowLogo}><Icon name={method.icon} size={23} tint="#22202D" /></View>
      <View style={{ flex: 1, gap: 12 }}>
        <View>
          <Text style={styles.rowName}>{method.label}</Text>
          <Text style={styles.rowSub}>{method.speed}</Text>
        </View>
        {on ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Icon name="checkmark" size={20} tint="#33823F" />
            <Text style={[styles.rowLink, { color: "#33823F" }]}>Selected</Text>
          </View>
        ) : <Text style={styles.rowLink}>Select</Text>}
      </View>
    </Pressable>
  );
}

// DoorDash's success glyph: the method icon inside a thin ring that opens on the right where a
// check sits (about 94 pt ring at 1.23 px/pt).
export function ProgressRing({ icon }: { icon: IconName }) {
  return (
    <View style={styles.ringWrap}>
      <View style={styles.ring} />
      <View style={styles.ringGap} />
      <Icon name={icon} size={34} tint="#5E6B6E" />
      <View style={styles.ringCheck}><Icon name="checkmark" size={20} tint="#5E6B6E" /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginHorizontal: 31, borderRadius: 9.7, borderWidth: 1, borderColor: "#C2C2C2", overflow: "hidden", backgroundColor: "#fff" },
  band: { height: 41, backgroundColor: color.brand, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 17 },
  bandLabel: { fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "500" },
  bandValue: { fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "700" },
  body: { height: 103, paddingHorizontal: 17, paddingTop: 14 },
  bodyTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bodyLabel: { fontFamily: font.sans, color: "#000", fontSize: 18 },
  amount: { fontFamily: font.sans, color: "#1B2128", fontSize: 46, lineHeight: 54, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  strip: { height: 15, backgroundColor: color.brand },
  txWrap: { backgroundColor: "#fff" },
  tx: { minHeight: 70.5, flexDirection: "row", alignItems: "center", paddingLeft: 25, paddingRight: 23.5, gap: 8, paddingVertical: 10 },
  txCircle: { width: 33, height: 33, borderRadius: 16.5, alignItems: "center", justifyContent: "center" },
  txName: { fontFamily: font.sans, fontSize: 17, lineHeight: 22, fontWeight: "700", color: "#050A0E" },
  txNameMuted: { fontWeight: "500", fontSize: 16, lineHeight: 21 },
  txAmount: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "#050A0E", marginLeft: 10 },
  txDivider: { height: 1, backgroundColor: "#E8E8E8", marginLeft: 21.5, marginRight: 22 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 25, paddingTop: 30, paddingBottom: 6 },
  headerText: { fontFamily: font.sans, fontSize: 24, fontWeight: "600", color: "#010300" },
  headerLink: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: color.brand },
  card: { flex: 1, height: 160, borderRadius: 7.6, borderWidth: 1, alignItems: "center", paddingTop: 9, backgroundColor: "#fff" },
  cardCircle: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  cardLabel: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "#000", marginTop: 20 },
  cardSpeed: { fontFamily: font.sans, fontSize: 15, color: "#5E5E5E", marginTop: 8 },
  row: { marginHorizontal: 20.6, minHeight: 92.6, borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 7, flexDirection: "row", gap: 11, paddingHorizontal: 15, paddingVertical: 15, backgroundColor: "#fff" },
  rowLogo: { width: 23, alignItems: "center", paddingTop: 1 },
  rowName: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#22202D" },
  rowSub: { fontFamily: font.sans, fontSize: 14, color: "#464356", marginTop: 2 },
  rowLink: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: color.brand },
  ringWrap: { width: 94, height: 94, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 94, height: 94, borderRadius: 47, borderWidth: 1.5, borderColor: "#5E6B6E" },
  ringGap: { position: "absolute", right: -4, top: 33, width: 14, height: 28, backgroundColor: "#fff" },
  ringCheck: { position: "absolute", right: -8, top: 37 },
});
