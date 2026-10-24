// Settings. Copies Apple Maps' grouped sheet (plans/apple-maps/appstore_03_nearby_transit_sheet_chips.png,
// 2.49 px/pt): #F2F2F6 background, centered 17 pt semibold title with a 43 pt round close
// button, 20 pt bold section headers, white inset cells 16 pt from the edges with radius 18,
// 45 pt rows of 17 pt text with #7C7C81 secondary text and 1 px #DFDFE1 separators, green
// #34C458 for live status. The transport switch is Beli's segmented control (beli_leaderboard_vid);
// interests are Uber Eats chips (social/ubereats/appstore_07). Reset asks first in the same
// Apple sheet style. Loading = Instagram skeleton, error = TikTok tap to retry, offline =
// Spotify's bar.
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sheet } from "@/components/Sheet";
import { TrackSegmented } from "@/components/social/controls";
import { Chip, ErrorState, Icon, OfflineBanner, Skeleton } from "@/components/ui";
import type { Mode } from "@/lib/geo";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, resetAll, useStore } from "@/state/store";
import { CATEGORIES, color, font, type CategoryId } from "@/theme/tokens";

const BG = "#F2F2F6";
const SUB = "#7C7C81";
const SEP = "#DFDFE1";
const LIVE = "#34C458";
const RED = "#FF3B30";

// Expo inlines EXPO_PUBLIC_ variables only when they are read by their full name.
const SERVICES: { id: string; label: string; what: string; set: boolean }[] = [
  { id: "llm", label: "Planner model", what: "Writes plans with a language model", set: Boolean(process.env.EXPO_PUBLIC_LLM_BASE_URL) },
  { id: "supabase", label: "Sync and groups", what: "Supabase", set: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) },
  { id: "google", label: "Google Maps", what: "Live places and routes", set: Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY) },
  { id: "yelp", label: "Yelp", what: "Live ratings", set: Boolean(process.env.EXPO_PUBLIC_YELP_KEY) },
  { id: "ticketmaster", label: "Ticketmaster", what: "Events and tickets", set: Boolean(process.env.EXPO_PUBLIC_TICKETMASTER_KEY) },
];

const MODES: { id: Mode; label: string }[] = [
  { id: "walk", label: "Walk" },
  { id: "transit", label: "Transit" },
  { id: "drive", label: "Car" },
  { id: "bike", label: "Bike" },
];

export default function Settings() {
  const { city, status, error, retry } = useCity();
  const online = useOnline();
  const profile = useStore((s) => s.profile);
  const demoHere = useStore((s) => s.settings.demoHere);
  const [confirm, setConfirm] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/profile"));

  const toggleInterest = (id: CategoryId) => {
    const has = profile.interests.includes(id);
    actions.updateProfile({ interests: has ? profile.interests.filter((x) => x !== id) : [...profile.interests, id] });
  };

  const counts = city ? {
    places: city.places.filter((p) => !p.court).length,
    google: city.places.filter((p) => p.google).length,
    yelp: city.places.filter((p) => p.yelp).length,
    reddit: city.places.filter((p) => p.reddit.mentions > 0).length,
    tiktok: city.places.filter((p) => p.tiktok.mentions > 0).length,
    courts: city.places.filter((p) => p.court).length,
  } : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="settings-screen">
      <View style={styles.header}>
        <View style={{ width: 43 }} />
        <Text style={styles.title} accessibilityRole="header">Settings</Text>
        <Pressable testID="settings-close" accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}>
          <Icon name="close" size={24} tint="#000" />
        </Pressable>
      </View>
      {!online ? <OfflineBanner /> : null}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" testID="settings-scroll">
        <Section title="You">
          <Row label="Name" first>
            <TextInput testID="settings-name" accessibilityLabel="Name" value={profile.name} onChangeText={(t) => actions.updateProfile({ name: t })} placeholder="Your name" placeholderTextColor={SUB} style={styles.input} autoCapitalize="words" returnKeyType="done" />
          </Row>
          <Row label="Handle">
            <TextInput testID="settings-handle" accessibilityLabel="Handle" value={`@${profile.handle}`} onChangeText={(t) => actions.updateProfile({ handle: t.toLowerCase().replace(/[^a-z0-9._]/g, "") })} placeholder="@you" placeholderTextColor={SUB} style={styles.input} autoCapitalize="none" autoCorrect={false} />
          </Row>
          <Row label="City" onPress={() => router.push("/city")} testID="settings-city">
            <Text style={styles.value} numberOfLines={1}>{city?.name ?? "Loading"}</Text>
            <Icon name="chevron-forward" size={18} tint="#C4C4C7" />
          </Row>
        </Section>

        <Section title="How you get around">
          <View style={[styles.cellPad, { paddingVertical: 12 }]}>
            <TrackSegmented testID="settings-transport" value={profile.transport} onChange={(m) => actions.updateProfile({ transport: m })} options={MODES} />
          </View>
        </Section>

        <Section title="Interests">
          <View style={[styles.cellPad, styles.chips]}>
            {CATEGORIES.map((c) => <Chip key={c.id} testID={`settings-interest-${c.id}`} label={c.label} icon={c.emoji} on={profile.interests.includes(c.id)} onPress={() => toggleInterest(c.id)} />)}
          </View>
        </Section>

        <Section title="Demo mode" footer="For trying moment posting away from the city. Those clips get a Demo stamp, never Taken here.">
          <Row label="Demo mode: treat me as at the spot" first wrap>
            <Switch testID="settings-demo" accessibilityLabel="Demo mode" value={demoHere} onValueChange={(v) => actions.setSetting({ demoHere: v })} trackColor={{ true: LIVE, false: "#E9E9EA" }} thumbColor="#fff" {...(Platform.OS === "web" ? { activeThumbColor: "#fff" } : {})} />
          </Row>
        </Section>

        <Section title="Data" footer={city ? `Scores come from these sources, rebuilt by scheduled data jobs. Reddit means r/${city.subreddit}.` : undefined}>
          {status === "error" ? (
            <ErrorState title="Couldn't load the city data. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} testID="settings-data-error" />
          ) : status === "loading" || !city || !counts ? (
            <View style={[styles.cellPad, { gap: 12, paddingVertical: 14 }]} testID="settings-data-loading">
              <Skeleton style={{ width: "70%", height: 12, borderRadius: 6 }} />
              <Skeleton style={{ width: "50%", height: 12, borderRadius: 6 }} />
              <Skeleton style={{ width: "60%", height: 12, borderRadius: 6 }} />
            </View>
          ) : (
            <>
              <Row label={`Spots in ${city.name}`} first><Text style={styles.value}>{counts.places.toLocaleString("en-US")}</Text></Row>
              <Row label="City data built"><Text style={styles.value} testID="settings-built">{builtLabel(city.builtAt)}</Text></Row>
              <Row label="Google ratings"><Text style={styles.value}>{counts.google.toLocaleString("en-US")} spots</Text></Row>
              <Row label="Yelp ratings"><Text style={styles.value}>{counts.yelp.toLocaleString("en-US")} spots</Text></Row>
              <Row label="Reddit mentions"><Text style={styles.value}>{counts.reddit.toLocaleString("en-US")} spots</Text></Row>
              <Row label="TikTok posts"><Text style={styles.value}>{counts.tiktok.toLocaleString("en-US")} spots</Text></Row>
              <Row label="OpenStreetMap courts"><Text style={styles.value}>{counts.courts.toLocaleString("en-US")}</Text></Row>
            </>
          )}
        </Section>

        <Section title="Connected services">
          {SERVICES.map((s, i) => (
            <View key={s.id} style={[styles.row, styles.rowTall, i > 0 && styles.sep]} testID={`settings-service-${s.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{s.label}</Text>
                <Text style={[styles.sub, s.set && { color: LIVE }]}>{s.set ? "Connected" : "Not set, using bundled data"}</Text>
              </View>
              {s.set ? <Icon name="checkmark-circle" size={20} tint={LIVE} /> : <Text style={styles.subSmall}>{s.what}</Text>}
            </View>
          ))}
        </Section>

        <Section>
          <Pressable testID="settings-reset" accessibilityRole="button" onPress={() => setConfirm(true)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: "#F7F7F9" }]}>
            <Text style={[styles.label, { color: RED }]}>Reset app data</Text>
          </Pressable>
        </Section>
        <Text style={styles.version}>Faves 0.1.0</Text>
      </ScrollView>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Reset app data?" background={BG} testID="settings-reset-sheet">
        <Text style={styles.confirmBody}>This clears your profile, saved spots, days, rankings and rewards on this device. It can't be undone.</Text>
        <View style={styles.card}>
          <Pressable testID="settings-reset-confirm" accessibilityRole="button" onPress={async () => { setConfirm(false); await resetAll(); router.replace("/onboarding"); }} style={styles.row}>
            <Text style={[styles.label, { color: RED, fontWeight: "600" }]}>Reset everything</Text>
          </Pressable>
          <Pressable testID="settings-reset-cancel" accessibilityRole="button" onPress={() => setConfirm(false)} style={[styles.row, styles.sep]}>
            <Text style={[styles.label, { color: color.appleBlue }]}>Cancel</Text>
          </Pressable>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function builtLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function Section({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <View style={{ marginTop: title ? 22 : 28 }}>
      {title ? <Text style={styles.section} accessibilityRole="header">{title}</Text> : null}
      <View style={styles.card}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

function Row({ label, children, first, onPress, testID, wrap }: { label: string; children?: ReactNode; first?: boolean; onPress?: () => void; testID?: string; wrap?: boolean }) {
  const body = (
    <>
      <Text style={[styles.label, { flex: wrap ? 1 : undefined, marginRight: 12 }]} numberOfLines={wrap ? 2 : 1}>{label}</Text>
      <View style={styles.rowRight}>{children}</View>
    </>
  );
  if (onPress) return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, !first && styles.sep, pressed && { backgroundColor: "#F7F7F9" }]}>{body}</Pressable>;
  return <View testID={testID} style={[styles.row, !first && styles.sep, wrap && { minHeight: 56 }]}>{body}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontFamily: font.sans, fontSize: 17, fontWeight: "600", color: "#000" },
  close: { width: 43, height: 43, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3E3E8", alignItems: "center", justifyContent: "center" },
  section: { fontFamily: font.sans, fontSize: 20, fontWeight: "700", color: "#000", marginHorizontal: 17, marginBottom: 10 },
  card: { marginHorizontal: 16, backgroundColor: "#fff", borderRadius: 18, overflow: "hidden" },
  footer: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: SUB, marginHorizontal: 32, marginTop: 8 },
  row: { minHeight: 45, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  rowTall: { minHeight: 58 },
  sep: { borderTopWidth: 1, borderTopColor: SEP },
  rowRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  label: { fontFamily: font.sans, fontSize: 17, color: "#000" },
  value: { fontFamily: font.sans, fontSize: 17, color: SUB, flexShrink: 1, textAlign: "right" },
  sub: { fontFamily: font.sans, fontSize: 15, color: SUB, marginTop: 2 },
  subSmall: { fontFamily: font.sans, fontSize: 13, color: SUB, maxWidth: 130, textAlign: "right" },
  input: { flex: 1, fontFamily: font.sans, fontSize: 17, color: SUB, textAlign: "right", paddingVertical: 0, minHeight: 24 },
  cellPad: { paddingHorizontal: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 14 },
  confirmBody: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: SUB, marginHorizontal: 32, marginBottom: 14, textAlign: "center" },
  version: { fontFamily: font.sans, fontSize: 13, color: SUB, textAlign: "center", marginTop: 24 },
});
