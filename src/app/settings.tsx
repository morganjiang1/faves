// Settings: you, how you get around, interests, demo mode, the community behind the Locals
// Score, connected services (one row, the list in a sheet), reset, and the Powered by line.
// Card-stock groups on paper with display headings. Grouped rows are inspired by iOS Settings.
import { router } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sheet } from "@/components/Sheet";
import { TrackSegmented } from "@/components/social/controls";
import { Chip, ErrorState, Icon, OfflineBanner, Skeleton } from "@/components/ui";
import type { Mode } from "@/lib/geo";
import { communitySignals } from "@/lib/signals";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, resetAll, useStore } from "@/state/store";
import { CATEGORIES, color, font, palette, type CategoryId } from "@/theme/tokens";

const BG = palette.paper;
const SUB = palette.inkMuted;
const SEP = palette.line;
const LIVE = palette.open;
const RED = palette.roseInk;

// Expo inlines EXPO_PUBLIC_ variables only when they are read by their full name.
const SERVICES: { id: string; label: string; what: string; set: boolean }[] = [
  { id: "llm", label: "Planner model", what: "Writes plans with a language model", set: Boolean(process.env.EXPO_PUBLIC_LLM_BASE_URL) },
  { id: "supabase", label: "Sync and groups", what: "Supabase", set: Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) },
  { id: "google", label: "Live hours and travel times", what: "Maps key", set: Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY) },
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
  const [services, setServices] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/profile"));

  const toggleInterest = (id: CategoryId) => {
    const has = profile.interests.includes(id);
    actions.updateProfile({ interests: has ? profile.interests.filter((x) => x !== id) : [...profile.interests, id] });
  };

  // The community behind the Locals Scores: rankings, moments and saves on Faves.
  const counts = useMemo(() => {
    if (!city) return null;
    const spots = city.places.filter((p) => !p.court);
    const sum = (k: "ranked" | "moments" | "saves") => spots.reduce((t, p) => t + communitySignals(p)[k], 0);
    return { places: spots.length, ranked: sum("ranked"), moments: sum("moments"), saves: sum("saves"), courts: city.places.filter((p) => p.court).length };
  }, [city]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="settings-screen">
      <View style={styles.header}>
        <View style={{ width: 43 }} />
        <Text style={styles.title} accessibilityRole="header">Settings</Text>
        <Pressable testID="settings-close" accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}>
          <Icon name="close" size={24} tint={palette.ink} />
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
            <Icon name="chevron-forward" size={18} tint={palette.inkMuted} />
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

        <Section title="Demo mode" footer="Post moments from anywhere. They get a Demo stamp.">
          <Row label="Treat me as at the spot" first wrap>
            <Switch testID="settings-demo" accessibilityLabel="Demo mode" value={demoHere} onValueChange={(v) => actions.setSetting({ demoHere: v })} trackColor={{ true: LIVE, false: "#E9E9EA" }} thumbColor="#fff" {...(Platform.OS === "web" ? { activeThumbColor: "#fff" } : {})} />
          </Row>
        </Section>

        <Section title="Community" footer="Locals Scores come from what people on Faves rank, post and save.">
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
              <Row label="Rankings by locals"><Text style={styles.value} testID="settings-rankings">{counts.ranked.toLocaleString("en-US")}</Text></Row>
              <Row label="Moments posted"><Text style={styles.value}>{counts.moments.toLocaleString("en-US")}</Text></Row>
              <Row label="Saves"><Text style={styles.value}>{counts.saves.toLocaleString("en-US")}</Text></Row>
            </>
          )}
        </Section>

        <Section>
          <Row label="Connected services" first onPress={() => setServices(true)} testID="settings-services">
            <Text style={styles.value}>{SERVICES.filter((x) => x.set).length} of {SERVICES.length}</Text>
            <Icon name="chevron-forward" size={18} tint={palette.inkMuted} />
          </Row>
          <Pressable testID="settings-reset" accessibilityRole="button" onPress={() => setConfirm(true)} style={({ pressed }) => [styles.row, styles.sep, pressed && { backgroundColor: palette.paperDeep }]}>
            <Text style={[styles.label, { color: RED }]}>Reset app data</Text>
          </Pressable>
        </Section>
        <Text style={styles.version}>Faves 0.1.0</Text>
        <Text style={styles.credits} testID="settings-powered-by">Powered by Convex, Fetch.ai, Cartesia and Apify. Maps © OpenStreetMap contributors.</Text>
      </ScrollView>

      <Sheet open={services} onClose={() => setServices(false)} title="Connected services" subtitle="Faves works without them" background={BG} testID="settings-services-sheet">
        <View style={styles.card}>
          {SERVICES.map((s, i) => (
            <View key={s.id} style={[styles.row, styles.rowTall, i > 0 && styles.sep]} testID={`settings-service-${s.id}`}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{s.label}</Text>
                <Text style={[styles.sub, s.set && { color: LIVE }]}>{s.set ? "Connected" : "Not set"}</Text>
              </View>
              {s.set ? <Icon name="checkmark-circle" size={20} tint={LIVE} /> : <Text style={styles.subSmall}>{s.what}</Text>}
            </View>
          ))}
        </View>
        <Text style={styles.confirmBody}>Convex runs the live chats, the agent and reminders; Fetch.ai the agents on Agentverse and ASI:One; Cartesia the agent's voice; Apify live scouting.</Text>
      </Sheet>
      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Reset app data?" background={BG} testID="settings-reset-sheet">
        <Text style={styles.confirmBody}>Clears your profile, saved spots, days, rankings and rewards on this phone. This can't be undone.</Text>
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
  if (onPress) return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.row, !first && styles.sep, pressed && { backgroundColor: palette.paperDeep }]}>{body}</Pressable>;
  return <View testID={testID} style={[styles.row, !first && styles.sep, wrap && { minHeight: 56 }]}>{body}</View>;
}

const styles = StyleSheet.create({
  credits: { marginTop: 6, marginHorizontal: 32, textAlign: "center", fontSize: 12, lineHeight: 17, color: SUB },
  screen: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontFamily: font.display, fontSize: 20, color: palette.ink },
  close: { width: 43, height: 43, borderRadius: 22, backgroundColor: palette.card, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  section: { fontFamily: font.display, fontSize: 19, color: palette.ink, marginHorizontal: 17, marginBottom: 10 },
  card: { marginHorizontal: 16, backgroundColor: palette.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: palette.line },
  footer: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: SUB, marginHorizontal: 32, marginTop: 8 },
  row: { minHeight: 45, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10 },
  rowTall: { minHeight: 58 },
  sep: { borderTopWidth: 1, borderTopColor: SEP },
  rowRight: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  label: { fontFamily: font.sans, fontSize: 17, color: palette.ink },
  value: { fontFamily: font.sans, fontSize: 17, color: SUB, flexShrink: 1, textAlign: "right" },
  sub: { fontFamily: font.sans, fontSize: 15, color: SUB, marginTop: 2 },
  subSmall: { fontFamily: font.sans, fontSize: 13, color: SUB, maxWidth: 130, textAlign: "right" },
  input: { flex: 1, fontFamily: font.sans, fontSize: 17, color: SUB, textAlign: "right", paddingVertical: 0, minHeight: 24 },
  cellPad: { paddingHorizontal: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 14 },
  confirmBody: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: SUB, marginHorizontal: 32, marginBottom: 14, textAlign: "center" },
  version: { fontFamily: font.sans, fontSize: 13, color: SUB, textAlign: "center", marginTop: 24 },
});
