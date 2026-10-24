// Spot rewards wallet. Copies Ibotta's Earnings page
// (references/wallet/ibotta/appstore_05_earnings_withdraw_transactions.png): back chevron and a
// brand "Help" link, centered bold title, the bordered balance box (brand band "Lifetime
// earned", big "Ready to cash out" number, brand strip), a 343 x 40 pt pill 30 pt under it, then
// "Transactions" rows (33 pt circle, bold name, bold amount at the right, inset dividers).
// "How you earn" and "Fair play" reuse the same Ibotta header and row. Empty state: Beli's empty
// card; error: TikTok's tap to retry; offline: Spotify's bar (cash out needs a connection).
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BalanceBox, MoneyHeader, TxRow } from "@/components/money/parts";
import { EmptyState, ErrorState, Icon, OfflineBanner, SampleTag, SkeletonRows, TextButton } from "@/components/ui";
import { balance, money, RATES, seedWallet } from "@/lib/rewards";
import { useOnline } from "@/state/device";
import { actions, useStore, type Wallet, type WalletEntry } from "@/state/store";
import { color, font } from "@/theme/tokens";

// Test data is seeded once per session when the wallet is empty, so "Clear test data" can
// show the real empty state until the app restarts.
let seededThisSession = false;
let clearedThisSession = false;

const isWallet = (w: unknown): w is Wallet => Boolean(w && Array.isArray((w as Wallet).entries) && Array.isArray((w as Wallet).payouts));

export default function WalletScreen() {
  const wallet = useStore((s) => s.wallet);
  const name = useStore((s) => s.profile.name);
  const plus = useStore((s) => s.plus.active);
  const online = useOnline();
  const [ready, setReady] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [earnY, setEarnY] = useState(0);
  const ok = isWallet(wallet);

  useEffect(() => {
    if (ok && !wallet.entries.length && !wallet.payouts.length && !seededThisSession && !clearedThisSession) {
      seededThisSession = true;
      actions.setWallet(seedWallet(name || "You"));
    }
    setReady(true);
    // Seed on first open only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    if (!ok) return [];
    const earned = wallet.entries.filter((e) => e.kind !== "payout").map((e) => ({ id: e.id, kind: e.kind, name: e.text.replace(/\s*\([^)]*\)/g, "").trim(), amount: `+${money(e.amount)}`, at: e.at }));
    const paid = wallet.payouts.map((p) => ({ id: p.id, kind: "payout" as WalletEntry["kind"], name: `Cash out to ${p.method}${p.status === "pending" ? ", pending" : ""}`, amount: `-${money(p.amount)}`, at: p.at }));
    return [...earned, ...paid].sort((a, b) => b.at.localeCompare(a.at));
  }, [ok, wallet]);

  const lifetime = ok ? wallet.entries.filter((e) => e.kind !== "payout").reduce((s, e) => s + e.amount, 0) : 0;
  const now = ok ? balance(wallet) : 0;
  const canCash = now >= RATES.cashOutMin && online;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const reseed = () => { clearedThisSession = false; actions.setWallet(seedWallet(name || "You")); };

  const nav = (
    <View style={styles.nav}>
      <Pressable testID="wallet-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={back}>
        <Icon name="chevron-back" size={28} tint="#282F37" />
      </Pressable>
      <Pressable testID="wallet-help" accessibilityRole="button" accessibilityLabel="How you earn" hitSlop={10} onPress={() => scroll.current?.scrollTo({ y: earnY, animated: true })}>
        <Text style={styles.help}>Help</Text>
      </Pressable>
    </View>
  );

  if (!ok) {
    return (
      <SafeAreaView style={styles.screen} testID="wallet-error">
        {nav}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState title="Couldn't read your earnings. Tap to retry." body="Your saved wallet looks damaged. Retrying reloads the test data." onRetry={() => actions.setWallet(seedWallet(name || "You"))} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="wallet-screen">
      <ScrollView ref={scroll} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {nav}
        <Text style={styles.title} accessibilityRole="header">Spot rewards</Text>

        <BalanceBox testID="wallet-box" lifetime={money(lifetime)} ready={money(now)} onInfo={() => scroll.current?.scrollTo({ y: earnY, animated: true })} />

        <Pressable
          testID="wallet-cash-out"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCash }}
          disabled={!canCash}
          onPress={() => router.push("/payout")}
          style={({ pressed }) => [styles.cash, !canCash && { backgroundColor: "#A2B8BB" }, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.cashLabel}>{!online ? "Cash out needs a connection" : now >= RATES.cashOutMin ? "Cash out" : `Cash out at ${money(RATES.cashOutMin).replace(".00", "")}`}</Text>
        </Pressable>

        <View style={styles.testNote} testID="wallet-test-note">
          <SampleTag text="Test data" />
          <Text style={styles.testText}>Real payouts start after launch; these earnings are test data.</Text>
        </View>

        <MoneyHeader title="Transactions" />
        {!ready ? (
          <SkeletonRows rows={3} testID="wallet-loading" />
        ) : rows.length ? (
          rows.map((r, i) => <TxRow key={r.id} testID={`wallet-tx-${i}`} kind={r.kind} name={r.name} amount={r.amount} last={i === rows.length - 1} />)
        ) : (
          <View style={{ marginTop: 8 }}>
            <EmptyState testID="wallet-empty" icon="wallet-outline" title="No earnings yet" body="You earn when people save your spots or do your days. Likes don't pay, real visits do." cta="Load test data" onCta={reseed} />
          </View>
        )}

        <View onLayout={(e) => setEarnY(e.nativeEvent.layout.y)}>
          <MoneyHeader title="How you earn" />
          {plus ? (
            <View style={styles.plusOn} testID="wallet-plus-on">
              <Icon name="diamond" size={16} tint={color.brand} />
              <Text style={styles.plusOnText}>You're on Faves Plus, so every reward below counts 2x.</Text>
            </View>
          ) : null}
          <TxRow testID="rate-save" icon="bookmark" tint={color.dashTag} name="Someone saves your spot" amount={money(RATES.save * (plus ? 2 : 1))} />
          <TxRow testID="rate-day" icon="footsteps" tint={color.brand} name="Someone does your day and gives it a thumbs up" amount={money(RATES.didDay * (plus ? 2 : 1))} />
          <TxRow testID="rate-trending" icon="diamond" tint={color.gem} name="A spot you posted first becomes a trending hidden gem" lines={3} amount={money(RATES.trending * (plus ? 2 : 1))} />
          <TxRow testID="rate-booking" icon="ticket" tint={color.appleOrange} name="Someone books from your post: your share of the commission" lines={3} amount={`${Math.round(RATES.bookingShare * 100 * (plus ? 2 : 1))}%`} />
          {plus ? null : (
            <Pressable testID="wallet-get-plus" accessibilityRole="button" onPress={() => router.push("/plus")}>
              <TxRow icon="sparkles" tint="#F2F2F2" name="Faves Plus members earn 2x on all of these" amount="2x" last />
            </Pressable>
          )}
        </View>

        <MoneyHeader title="Fair play" />
        {FAIR.map((t, i) => <TxRow key={t} testID={`fair-${i}`} icon={FAIR_ICONS[i]} tint="#F2F2F2" name={t} muted last={i === FAIR.length - 1} />)}

        <View style={styles.footer}>
          <TextButton testID="wallet-reset" label="Reset test data" tint={color.textSub} onPress={reseed} />
          <TextButton testID="wallet-clear" label="Clear test data" tint={color.textSub} onPress={() => { clearedThisSession = true; actions.setWallet({ entries: [], payouts: [] }); }} />
        </View>
      </ScrollView>
      {!online ? <OfflineBanner /> : null}
    </SafeAreaView>
  );
}

// docs/plan.md, "Spot rewards: Anti-fraud" and "Legal", in plain short lines.
const FAIR = [
  "Likes show on posts but never pay. Only verified use does.",
  "A did-this-day counts only with a real visit: your phone near each stop while it's open.",
  "One reward per account per spot.",
  "New accounts start earning after a short trust period.",
  "Unusual like or save patterns are held for review.",
  `Cash out at ${money(RATES.cashOutMin).replace(".00", "")} as a gift card or a bank transfer. A payout provider handles ID checks and US tax forms.`,
];
const FAIR_ICONS = ["heart-dislike-outline", "location-outline", "person-outline", "time-outline", "eye-outline", "shield-checkmark-outline"] as const;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  nav: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14 },
  help: { fontFamily: font.sans, fontSize: 18, color: color.brand },
  title: { fontFamily: font.sans, fontSize: 32, lineHeight: 38, fontWeight: "700", color: "#282F37", textAlign: "center", marginTop: 4, marginBottom: 24 },
  cash: { marginTop: 30, marginHorizontal: 25, height: 40, borderRadius: 20, backgroundColor: color.brand, alignItems: "center", justifyContent: "center" },
  cashLabel: { fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "600" },
  testNote: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 25, marginTop: 14 },
  testText: { flex: 1, fontFamily: font.sans, fontSize: 13, lineHeight: 17, color: color.textSub },
  plusOn: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 25, marginBottom: 4, backgroundColor: "#EEF3F4", borderRadius: 8, padding: 10 },
  plusOnText: { flex: 1, fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: color.brand },
  footer: { flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 24 },
});
