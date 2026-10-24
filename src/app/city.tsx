// City switcher (modal). Copies Beli's "Where are you eating most?"
// (references/discovery/beli/beli_onboarding_city_pick_vid.jpg, about 1.5 px/pt): back chevron,
// Playfair bold title (two lines, 24 pt from the left), a short body line, city rows (49 pt
// pitch, text 40 pt in, hairline dividers inset 24 / 22 pt, lower rows fading out) and a
// 300 x 49 pt centered "Continue" pill that stays the disabled #A2B8BB until the city changes.
// The picked city loads lazily: Instagram's "Loading" pill while it loads, TikTok's tap to
// retry if it fails, Spotify's offline bar.
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ErrorState, Icon, LoadingPill, OfflineBanner } from "@/components/ui";
import { CITY_INDEX } from "@/data/cities";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { color, font } from "@/theme/tokens";

const STATE: Record<string, string> = {
  "new-york": "NY", "los-angeles": "CA", "san-francisco": "CA", chicago: "IL", seattle: "WA",
  boston: "MA", austin: "TX", miami: "FL", "washington-dc": "", "san-diego": "CA",
};
const label = (slug: string, name: string) => (STATE[slug] ? `${name}, ${STATE[slug]}` : name);

export default function CityPicker() {
  const current = useStore((s) => s.profile.city);
  const { city, status, retry } = useCity();
  const online = useOnline();
  const [picked, setPicked] = useState(current);
  const [switching, setSwitching] = useState<string | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  // After Continue, wait for the new city to load, then go back.
  useEffect(() => {
    if (switching && status === "ready" && city?.slug === switching) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [switching, status, city?.slug]);

  const changed = picked !== current;
  const go = () => {
    if (!changed) return;
    setSwitching(picked);
    actions.updateProfile({ city: picked });
  };
  const pickedName = CITY_INDEX.find((c) => c.slug === (switching ?? picked))?.name ?? "your city";

  return (
    <SafeAreaView style={styles.screen} testID="city-picker">
      <View style={styles.nav}>
        <Pressable testID="city-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={close}>
          <Icon name="chevron-back" size={30} tint="#000" />
        </Pressable>
      </View>
      <Text style={styles.title} accessibilityRole="header">Where are you hanging out?</Text>
      <Text style={styles.body}>This will be your default city for spots and plans. You can switch any time.</Text>

      {switching && status === "error" ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ErrorState testID="city-error" title={`Couldn't load ${pickedName}. Tap to retry.`} body={online ? "Something went wrong loading the city's spots." : "You're offline. Connect and try again."} onRetry={retry} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingTop: 22, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
            {CITY_INDEX.map((c, i) => {
              const on = picked === c.slug;
              return (
                <Pressable key={c.slug} testID={`city-row-${c.slug}`} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${label(c.slug, c.name)}, ${c.places.toLocaleString("en-US")} spots`} disabled={Boolean(switching)} onPress={() => setPicked(c.slug)} style={[styles.row, i === 0 && styles.rowFirst]}>
                  <Text style={[styles.rowText, on && styles.rowTextOn]} numberOfLines={1}>{label(c.slug, c.name)}</Text>
                  <Text style={styles.count}>{c.places.toLocaleString("en-US")} spots</Text>
                  <View style={{ width: 26, alignItems: "flex-end" }}>{on ? <Icon name="checkmark" size={22} tint={color.brand} /> : null}</View>
                </Pressable>
              );
            })}
          </ScrollView>
          <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]} style={styles.fade} />
        </View>
      )}

      <View style={styles.footer}>
        {switching && status === "loading" ? (
          <View testID="city-loading"><LoadingPill text={`Loading ${pickedName}`} /></View>
        ) : (
          <Pressable
            testID="city-continue"
            accessibilityRole="button"
            accessibilityState={{ disabled: !changed }}
            disabled={!changed || Boolean(switching)}
            onPress={go}
            style={({ pressed }) => [styles.cta, { backgroundColor: changed ? color.brand : "#A2B8BB" }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.ctaLabel}>Continue</Text>
          </Pressable>
        )}
      </View>
      {!online ? <OfflineBanner /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  nav: { height: 48, justifyContent: "center", paddingHorizontal: 14 },
  title: { fontFamily: font.serif, fontSize: 31, lineHeight: 36, color: "#111", paddingHorizontal: 24, marginTop: 52 },
  body: { fontFamily: font.sans, fontSize: 17, lineHeight: 22, color: color.emptyBody, paddingHorizontal: 24, marginTop: 10 },
  row: { height: 49, flexDirection: "row", alignItems: "center", marginLeft: 24, marginRight: 22, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: "#E3E3E6" },
  rowFirst: {},
  rowText: { flex: 1, fontFamily: font.sans, fontSize: 17, color: "#111" },
  rowTextOn: { fontWeight: "700" },
  count: { fontFamily: font.sans, fontSize: 14, color: color.textMuted, marginLeft: 8 },
  fade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 110 },
  footer: { height: 96, alignItems: "center", justifyContent: "center" },
  cta: { width: 300, height: 49, borderRadius: 24.5, alignItems: "center", justifyContent: "center" },
  ctaLabel: { fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "600" },
});
