// Faves Plus paywall (full-screen modal). Copies Meetup+
// (references/paywall/meetup/paywallscreens_02_weekly_yearly_rows_free_trial.png, exact 3x):
// ✕ top-left, the logo centered, a two-line bold title with the product name in the brand
// color, a check list (18.7 pt filled circles, 36 pt pitch), the 355 x 75 pt "Not sure yet?"
// trial card with a 28.7 pt radio, two 355 x 65 pt plan rows (radius 16, 11 pt apart, MOST
// POPULAR badge on the selected row's top border) and a 62 pt Continue pill. The legal paragraph
// above the pill and "Restore" under it are inspired by Timeleft
// (references/paywall/timeleft/paywallscreens_01_unlimited_dinners_plan_cards.png). "Also on
// Faves" uses the icon + bold title + grey line feature rows of Meetup's other paywall
// (references/paywall/meetup/paywallscreens_01_join_meetup_plus_toggle_features.png).
// Test mode: nothing is charged.
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, OfflineBanner, SampleTag, Toast, type IconName } from "@/components/ui";
import { CITY_INDEX } from "@/data/cities";
import { formatDate, toWall } from "@/lib/time";
import { useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { color, font, palette } from "@/theme/tokens";

type PlanId = "monthly" | "annual";

const PLANS: { id: PlanId; name: string; price: string; sub: string | null; popular?: boolean }[] = [
  { id: "annual", name: "Yearly", price: "$42.90/year", sub: "$3.58/month, save 38%", popular: true },
  { id: "monthly", name: "Monthly", price: "$5.79/month", sub: null },
];

// docs/plan.md, Monetization: the Faves Plus row, item by item.
const FEATURES = [
  "Members-only Faves Nights at partner spots",
  "Perks at partner places",
  "Live Plan B re-planning",
  "Busy now crowd levels and best time to go",
  "2x spot rewards",
  "Streak saves included",
];

// docs/plan.md, Monetization: the other rows of the Faves table.
const ALSO: { icon: IconName; title: string; line: string }[] = [
  { icon: "book", title: "Local guides", line: "Top locals sell their own guides and days. From $5.79/month." },
  { icon: "flame", title: "Weekend streak save", line: "Keeps your something-new-every-weekend streak alive. $0.99." },
  { icon: "calendar", title: "Booking commissions", line: "Partners pay a commission on tables, tickets and classes booked from a plan." },
  { icon: "ticket", title: "Faves Nights tickets", line: "Hosted group outings with partner venues, priced per ticket." },
  { icon: "shield-checkmark", title: "No ads", line: "Locals Scores are never for sale." },
];

const TINT_ON = palette.roseTint; // the selected fill

export default function Plus() {
  const plus = useStore((s) => s.plus);
  const citySlug = useStore((s) => s.profile.city);
  const online = useOnline();
  const [plan, setPlan] = useState<PlanId>("annual");
  const [trial, setTrial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const buy = () => {
    if (!online) { setError("You're offline. Connect to start Plus."); return; }
    setError(null);
    setBusy(true);
    // Test mode: no store purchase happens. Plus turns on locally.
    setTimeout(() => {
      try {
        actions.setPlus(true, plan);
        setToast("You're a Plus member");
      } catch {
        setError("Couldn't start Plus. Tap Continue to try again.");
      }
      setBusy(false);
    }, 700);
  };

  const active = plus.active;
  const activePlan = PLANS.find((p) => p.id === plus.plan) ?? PLANS[0];
  const since = plus.since ? formatDate(toWall(new Date(plus.since), CITY_INDEX.find((c) => c.slug === citySlug)?.utcOffset ?? -8)) : null;

  return (
    <SafeAreaView style={styles.screen} testID={active ? "plus-active" : "plus-paywall"}>
      <View style={styles.top}>
        <Pressable testID="plus-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} onPress={close}>
          <Icon name="close-outline" size={32} tint={palette.inkSoft} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Image source={require("../../assets/brand/mark.png")} style={styles.logo} contentFit="contain" accessibilityLabel="Faves" />
        <Text style={styles.title} accessibilityRole="header">
          {active ? "You're a\n" : "Do more with\n"}
          <Text style={{ color: color.brand }}>{active ? "Faves Plus member" : "Faves Plus"}</Text>
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <View key={f} style={styles.feature} testID={`plus-feature-${i}`}>
              <View style={styles.check}><Icon name="checkmark" size={12} tint="#fff" /></View>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {active ? (
          <View style={{ marginTop: 30 }}>
            <View style={[styles.planRow, styles.planOn]} testID="plus-active-plan">
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{activePlan.name}</Text>
                <Text style={styles.planSub}>{since ? `Member since ${since}` : "Active"}</Text>
              </View>
              <Text style={styles.planPrice}>{activePlan.price}</Text>
            </View>
            <View style={styles.testLine}><SampleTag text="Test mode" /><Text style={styles.testText}>You weren't charged.</Text></View>
          </View>
        ) : (
          <>
            <Pressable testID="plus-trial" accessibilityRole="switch" accessibilityState={{ checked: trial }} onPress={() => setTrial((t) => !t)} style={styles.trial}>
              <View style={{ flex: 1 }}>
                <Text style={styles.trialTitle}>Not sure yet?</Text>
                <Text style={styles.trialSub}>{trial ? "Free for 7 days, then your plan below" : "Enable free trial"}</Text>
              </View>
              <View style={[styles.radio, trial && styles.radioOn]}>{trial ? <Icon name="checkmark" size={18} tint="#fff" /> : null}</View>
            </Pressable>

            <View style={{ marginTop: 22, gap: 11 }}>
              {PLANS.map((p) => {
                const on = plan === p.id;
                return (
                  <Pressable key={p.id} testID={`plus-plan-${p.id}`} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${p.name}, ${p.price}`} onPress={() => setPlan(p.id)} style={[styles.planRow, on && styles.planOn]}>
                    {p.popular ? <View style={styles.badge}><Text style={styles.badgeText}>MOST POPULAR</Text></View> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{p.name}</Text>
                      {p.sub ? <Text style={styles.planSub}>{p.sub}</Text> : null}
                    </View>
                    <Text style={styles.planPrice}>{p.price}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.alsoTitle}>Also on Faves</Text>
        <View style={{ gap: 20 }}>
          {ALSO.map((a) => (
            <View key={a.title} style={styles.also} testID={`plus-also-${a.title.toLowerCase().replace(/\s+/g, "-")}`}>
              <View style={styles.alsoIcon}><Icon name={a.icon} size={24} tint={palette.ink} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alsoName}>{a.title}</Text>
                <Text style={styles.alsoLine}>{a.line}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {active ? (
          <>
            <Pressable testID="plus-done" accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
              <Text style={styles.ctaLabel}>Done</Text>
            </Pressable>
            <Pressable testID="plus-cancel" accessibilityRole="button" hitSlop={8} onPress={() => { actions.setPlus(false, null); setToast("Plus canceled"); }} style={styles.restore}>
              <Text style={styles.restoreText}>Cancel Plus</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.legal} testID="plus-legal">
              <Text style={{ fontWeight: "700", color: color.text }}>Test mode: you won't be charged. </Text>
              After launch, Continue charges your App Store account{trial ? " when the 7-day trial ends" : ""}, Plus renews at the same price until you cancel in Settings, and you agree to our <Text style={{ textDecorationLine: "underline" }}>Terms</Text>.
            </Text>
            {error ? <Text testID="plus-error" style={styles.error}>{error}</Text> : null}
            <Pressable testID="plus-continue" accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={buy} style={({ pressed }) => [styles.cta, (pressed || busy) && { opacity: 0.85 }]}>
              <Text style={styles.ctaLabel}>{busy ? "Starting Plus..." : "Continue"}</Text>
            </Pressable>
            <Pressable testID="plus-restore" accessibilityRole="button" hitSlop={8} onPress={() => setToast("Nothing to restore on this account")} style={styles.restore}>
              <Text style={styles.restoreText}>Restore</Text>
            </Pressable>
          </>
        )}
      </View>
      {!online ? <OfflineBanner /> : null}
      <Toast text={toast} onHide={() => setToast(null)} top={12} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  top: { height: 52, justifyContent: "center", paddingLeft: 18 },
  logo: { width: 80, height: 80, alignSelf: "center", marginTop: 4 },
  title: { fontFamily: font.sans, fontSize: 30, lineHeight: 36, fontWeight: "800", color: palette.ink, textAlign: "center", marginTop: 18, letterSpacing: -0.4 },
  features: { marginTop: 26, paddingHorizontal: 24 },
  feature: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 12 },
  check: { width: 18.7, height: 18.7, borderRadius: 9.35, backgroundColor: color.brand, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: palette.ink },
  trial: { marginTop: 30, marginHorizontal: 24, minHeight: 75, borderRadius: 16, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", paddingHorizontal: 15 },
  trialTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: palette.ink },
  trialSub: { fontFamily: font.sans, fontSize: 14, color: palette.inkSoft, marginTop: 3 },
  radio: { width: 28.7, height: 28.7, borderRadius: 14.35, borderWidth: 1.5, borderColor: "#A9A9A9", alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: color.brand, borderColor: color.brand },
  planRow: { marginHorizontal: 24, minHeight: 65, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, flexDirection: "row", alignItems: "center", paddingHorizontal: 13 },
  planOn: { backgroundColor: TINT_ON, borderColor: color.brand },
  planName: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: palette.ink },
  planSub: { fontFamily: font.sans, fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  planPrice: { fontFamily: font.sans, fontSize: 15, color: palette.inkSoft },
  badge: { position: "absolute", left: 13, top: -12, height: 22, borderRadius: 11, backgroundColor: "#D8884B", paddingHorizontal: 9, justifyContent: "center" },
  badgeText: { fontFamily: font.sans, fontSize: 12, fontWeight: "600", color: "#fff", letterSpacing: 0.2 },
  testLine: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 24, marginTop: 10 },
  testText: { fontFamily: font.sans, fontSize: 13, color: color.textSub },
  alsoTitle: { fontFamily: font.sans, fontSize: 20, fontWeight: "700", color: palette.ink, marginTop: 34, marginBottom: 16, paddingHorizontal: 24 },
  also: { flexDirection: "row", gap: 18, paddingHorizontal: 24 },
  alsoIcon: { width: 28, alignItems: "center", paddingTop: 2 },
  alsoName: { fontFamily: font.sans, fontSize: 17, fontWeight: "500", color: palette.ink },
  alsoLine: { fontFamily: font.sans, fontSize: 14, lineHeight: 19, color: palette.inkMuted, marginTop: 3 },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, backgroundColor: palette.card },
  legal: { fontFamily: font.sans, fontSize: 11, lineHeight: 13, color: color.textMuted, textAlign: "center", paddingHorizontal: 10, marginBottom: 10 },
  error: { fontFamily: font.sans, fontSize: 13, color: color.closed, textAlign: "center", marginBottom: 8 },
  cta: { height: 62, borderRadius: 31, backgroundColor: color.brand, alignItems: "center", justifyContent: "center" },
  ctaLabel: { fontFamily: font.sans, fontSize: 19, fontWeight: "600", color: "#fff" },
  restore: { alignSelf: "center", paddingVertical: 10 },
  restoreText: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: palette.ink, textDecorationLine: "underline" },
});
