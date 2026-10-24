// Cash out (modal). Copies Venmo's Transfer Balance
// (references/wallet/venmo/yt_wHGzOIg7ayA_t043_instant_selected_fee.png): ✕ and a centered
// title over a hairline, the amount huge in the middle with a small raised "$" and a grey clear
// button, two 172 x 160 pt method cards side by side, a "Fee" row and a "Transfer to" row with
// "›", and one full-width pill pinned at the bottom. "Transfer to" opens Rakuten's "Choose how you
// get paid" method cards (references/wallet/rakuten/appstore_05_choose_how_you_get_paid.png) in a
// sheet. Above the pill: DoorDash's one-line arrival note and the amount in the label
// (references/wallet/doordash-dasher/yt_QtNGm8n4OdE_t023_fast_pay_confirm.png); after it:
// DoorDash's success screen (yt_QtNGm8n4OdE_t038_fast_pay_in_progress.png). Test mode only.
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MethodCard, MethodRow, PAYOUT_METHODS, ProgressRing } from "@/components/money/parts";
import { Sheet } from "@/components/Sheet";
import { EmptyState, Icon, OfflineBanner, PrimaryButton, SampleTag } from "@/components/ui";
import { balance, money, RATES } from "@/lib/rewards";
import { useOnline } from "@/state/device";
import { actions, getState, useStore } from "@/state/store";
import { color, font } from "@/theme/tokens";

const noOutline = Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null;

export default function Payout() {
  const wallet = useStore((s) => s.wallet);
  const online = useOnline();
  const ready = useMemo(() => (Array.isArray(wallet?.entries) && Array.isArray(wallet?.payouts) ? balance(wallet) : 0), [wallet]);
  const [text, setText] = useState(() => ready.toFixed(2));
  const [methodId, setMethodId] = useState("amazon");
  const [sheet, setSheet] = useState(false);
  const [width, setWidth] = useState(140);
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [sent, setSent] = useState<{ amount: number; method: string; icon: (typeof PAYOUT_METHODS)[number]["icon"] } | null>(null);

  const method = PAYOUT_METHODS.find((m) => m.id === methodId) ?? PAYOUT_METHODS[0];
  const amount = Math.round((parseFloat(text.replace(/[^0-9.]/g, "")) || 0) * 100) / 100;
  const problem = amount < RATES.cashOutMin ? `Cash out at least ${money(RATES.cashOutMin)}.` : amount > ready ? `You have ${money(ready)} ready.` : null;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/wallet"));
  const pick = (kind: "gift" | "bank") => setMethodId(PAYOUT_METHODS.find((m) => m.kind === kind)!.id);

  const confirm = () => {
    if (problem || !online) return;
    setPhase("sending");
    // Test mode: nothing leaves the phone. The payout is recorded as pending test data.
    setTimeout(() => {
      const w = getState().wallet;
      actions.setWallet({ ...w, payouts: [{ id: `test-payout-${Date.now().toString(36)}`, amount, method: `${method.label} (test)`, at: new Date().toISOString(), status: "pending" }, ...w.payouts] });
      setSent({ amount, method: method.label, icon: method.icon });
      setPhase("done");
    }, 700);
  };

  const nav = (title: string) => (
    <View style={styles.nav}>
      <Pressable testID="payout-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={close} style={styles.navSide}>
        <Icon name="close" size={26} tint={color.brand} />
      </Pressable>
      <Text style={styles.navTitle}>{title}</Text>
      <View style={styles.navSide} />
    </View>
  );

  if (phase === "done" && sent) {
    return (
      <SafeAreaView style={styles.screen} testID="payout-done">
        {nav("Cash out")}
        <View style={styles.doneBody}>
          <ProgressRing icon={sent.icon} />
          <Text testID="payout-done-amount" style={styles.doneAmount}>{money(sent.amount)}</Text>
          <Text style={styles.doneLine}>Cash out in progress!</Text>
          <Text style={styles.doneSub}>To your {sent.method}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.testRow}><SampleTag text="Test mode" /><Text style={styles.testText}>No money moved. It shows as pending in your wallet.</Text></View>
          <PrimaryButton testID="payout-finish" label="Done" onPress={close} style={{ height: 47 }} />
        </View>
      </SafeAreaView>
    );
  }

  if (ready < RATES.cashOutMin) {
    return (
      <SafeAreaView style={styles.screen} testID="payout-empty">
        {nav("Cash out")}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <EmptyState icon="wallet-outline" title="Not enough yet" body={`You can cash out at ${money(RATES.cashOutMin)}. You have ${money(ready)} ready.`} cta="Back to Spot rewards" onCta={close} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} testID="payout-screen">
      {nav("Cash out")}
      <View style={styles.amountWrap}>
        <View style={styles.amountRow}>
          <Text style={styles.dollar}>$</Text>
          <Text style={[styles.amount, styles.measure]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>{text || "0"}</Text>
          <TextInput
            testID="payout-amount"
            accessibilityLabel="Amount to cash out"
            value={text}
            onChangeText={(t) => setText(t.replace(/[^0-9.]/g, ""))}
            onBlur={() => amount && setText(amount.toFixed(2))}
            keyboardType="decimal-pad"
            selectionColor={color.brand}
            style={[styles.amount, noOutline, { width: Math.ceil(width) + 6 }]}
          />
          <Pressable testID="payout-clear" accessibilityRole="button" accessibilityLabel="Clear amount" hitSlop={10} onPress={() => setText("")} style={styles.clear}>
            <Icon name="close-circle" size={20} tint="#9B9B9F" />
          </Pressable>
        </View>
        <Text testID="payout-helper" style={[styles.helper, problem && text ? { color: color.closed } : null]}>{problem && text ? problem : `${money(ready)} ready to cash out`}</Text>
      </View>

      <View style={styles.cards}>
        <MethodCard testID="payout-kind-gift" icon="gift" label="Gift card" speed="Instant" on={method.kind === "gift"} onPress={() => pick("gift")} />
        <MethodCard testID="payout-kind-bank" icon="business" label="Bank" speed="1 to 3 days" on={method.kind === "bank"} onPress={() => pick("bank")} />
      </View>

      <View style={styles.rowLine}>
        <Text style={styles.rowLabel}>Fee</Text>
        <Text style={styles.rowValue}>{money(0)}</Text>
      </View>
      <View style={styles.hair} />
      <Pressable testID="payout-transfer-to" accessibilityRole="button" accessibilityLabel={`Transfer to ${method.label}. Change`} onPress={() => setSheet(true)} style={styles.rowLine}>
        <Text style={styles.rowLabel}>Transfer to</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Icon name={method.icon} size={18} tint="#22202D" />
          <Text style={styles.rowValue}>{method.label}</Text>
          <Icon name="chevron-forward" size={18} tint="#8A8A8E" />
        </View>
      </Pressable>
      <View style={styles.hair} />

      <View style={{ flex: 1 }} />
      <View style={styles.footer}>
        <Text style={styles.note}>{method.note}</Text>
        <View style={styles.testRow}><SampleTag text="Test mode" /><Text style={styles.testText}>No money moves.</Text></View>
        <PrimaryButton
          testID="payout-confirm"
          label={!online ? "Cash out needs a connection" : `Cash out ${money(amount)}`}
          disabled={Boolean(problem) || !online}
          loading={phase === "sending"}
          onPress={confirm}
          style={{ height: 47 }}
        />
      </View>
      {!online ? <OfflineBanner /> : null}

      <Sheet open={sheet} onClose={() => setSheet(false)} testID="payout-methods">
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Choose how you get paid</Text>
          <Text style={styles.sheetSub}>We'll send your cash out here. You can change it any time.</Text>
        </View>
        <View style={{ gap: 17, paddingBottom: 12 }}>
          {PAYOUT_METHODS.map((m) => <MethodRow key={m.id} method={m} on={m.id === methodId} onPress={() => { setMethodId(m.id); setSheet(false); }} />)}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  nav: { height: 48, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#D6D6D8", paddingHorizontal: 12 },
  navSide: { width: 40, height: 40, justifyContent: "center" },
  navTitle: { flex: 1, textAlign: "center", fontFamily: font.sans, fontSize: 17, fontWeight: "600", color: "#000" },
  amountWrap: { alignItems: "center", marginTop: 96, marginBottom: 56 },
  amountRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  dollar: { fontFamily: font.sans, fontSize: 24, fontWeight: "400", color: "#000", marginTop: 8, marginRight: 2 },
  amount: { fontFamily: font.sans, fontSize: 56, lineHeight: 66, fontWeight: "400", color: "#000", padding: 0, textAlign: "center", letterSpacing: -1 },
  measure: { position: "absolute", opacity: 0, left: 0, top: 0 },
  clear: { marginTop: 14, marginLeft: 6 },
  helper: { fontFamily: font.sans, fontSize: 15, color: "#6B6B6F", marginTop: 8 },
  cards: { flexDirection: "row", gap: 16, paddingHorizontal: 10 },
  rowLine: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 12 },
  rowLabel: { fontFamily: font.sans, fontSize: 17, color: "#000" },
  rowValue: { fontFamily: font.sans, fontSize: 17, color: "#2B2B2E" },
  hair: { height: 1, backgroundColor: "#ECECEE", marginHorizontal: 12 },
  footer: { paddingHorizontal: 8, paddingBottom: 12, gap: 10 },
  note: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: "#000", textAlign: "center", paddingHorizontal: 20 },
  testRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  testText: { fontFamily: font.sans, fontSize: 13, color: color.textSub },
  doneBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingBottom: 80 },
  doneAmount: { fontFamily: font.sans, fontSize: 40, fontWeight: "800", color: color.score, marginTop: 64, letterSpacing: -0.5 },
  doneLine: { fontFamily: font.sans, fontSize: 18, color: "#2B2B2E", marginTop: 6 },
  doneSub: { fontFamily: font.sans, fontSize: 15, color: color.textSub, marginTop: 6 },
  sheetHead: { paddingHorizontal: 20.6, paddingTop: 10, paddingBottom: 22 },
  sheetTitle: { fontFamily: font.sans, fontSize: 23, fontWeight: "700", color: "#252525" },
  sheetSub: { fontFamily: font.sans, fontSize: 15, color: "#464356", marginTop: 6 },
});
