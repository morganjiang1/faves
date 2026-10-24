// Onboarding copies Partiful's first run (ios_video_onboarding_*): a splash with a full-width
// translucent "Get started" and a legal line, then one ask per screen on near-black #0B0B0F
// with a purple aurora at the top, a centered bold title, a soft subtitle with an emoji,
// 45 pt inputs and a 47 pt full-width button (white when enabled, grey when not).
// The city list follows Beli's "Where are you eating most?" rows; interests use Corner's
// "personalize your map / pick at least 3" photo tiles; the choice cards are Airbnb's
// question-flow cards.
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon, PlaceImage } from "@/components/ui";
import { CITY_INDEX } from "@/data/cities";
import type { Mode } from "@/lib/geo";
import type { Who } from "@/lib/parser";
import { seedWallet } from "@/lib/rewards";
import { useCity } from "@/state/city";
import { actions, getState, useStore } from "@/state/store";
import { CATEGORIES, font, logo, type CategoryId } from "@/theme/tokens";

const CREW: { id: Who; label: string; emoji: string }[] = [
  { id: "friends", label: "Friends", emoji: "👯" },
  { id: "date", label: "A date or partner", emoji: "💘" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "catch-up", label: "Old friends I'm catching up with", emoji: "🫶" },
  { id: "solo", label: "Just me", emoji: "🎧" },
];
const MOVES: { id: Mode; label: string; emoji: string }[] = [
  { id: "walk", label: "Walking", emoji: "🚶" },
  { id: "transit", label: "Subway and bus", emoji: "🚇" },
  { id: "drive", label: "Car or rideshare", emoji: "🚗" },
  { id: "bike", label: "Bike or scooter", emoji: "🚲" },
];

type Step = "splash" | "name" | "city" | "interests" | "crew" | "moves";
const ORDER: Step[] = ["splash", "name", "city", "interests", "crew", "moves"];

export default function Onboarding() {
  const profile = useStore((s) => s.profile);
  const [step, setStep] = useState<Step>("splash");
  const [name, setName] = useState(profile.name);
  const [interests, setInterests] = useState<CategoryId[]>(profile.interests);
  const [crew, setCrew] = useState<Who | null>(profile.crew);
  const [move, setMove] = useState<Mode | null>(null);
  const { city } = useCity();

  const go = (s: Step) => setStep(s);
  const back = () => { const i = ORDER.indexOf(step); if (i > 0) setStep(ORDER[i - 1]); };
  const finish = (m: Mode) => {
    actions.updateProfile({ name: name.trim(), handle: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "you", interests, crew, transport: m, onboarded: true });
    if (!getState().wallet.entries.length) actions.setWallet(seedWallet(name.trim() || "You"));
    router.replace("/");
  };

  // Corner's tiles show a real photo for each interest: the city's top-scored spot of that kind.
  const tilePhoto = useMemo(() => {
    const out: Record<string, string | null> = {};
    for (const c of CATEGORIES) {
      const best = city?.places.filter((p) => p.category === c.id && p.image && !p.court).sort((a, b) => b.locals - a.locals)[0];
      out[c.id] = best?.image ?? null;
    }
    return out;
  }, [city]);

  if (step === "splash") {
    return (
      <View style={[styles.fill, { backgroundColor: logo.color }]} testID="onboarding-splash">
        <SafeAreaView style={styles.splash}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18 }}>
            <Image source={require("../../assets/brand/mark.png")} style={{ width: 132, height: 132 }} contentFit="contain" />
            <Text style={styles.wordmark}>faves</Text>
            <Text style={styles.splashLine}>The spots locals love. The whole day, planned.</Text>
          </View>
          <Pressable testID="get-started" accessibilityRole="button" onPress={() => go("name")} style={styles.glassButton}>
            <Text style={styles.glassLabel}>Get started</Text>
          </Pressable>
          <Text style={styles.legal}>By tapping 'Get started', you agree to our <Text style={styles.legalBold}>Privacy Policy</Text> and <Text style={styles.legalBold}>Terms of Service</Text>.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: "#0B0B0F" }]} testID={`onboarding-${step}`}>
      <LinearGradient colors={["#2A1646", "#1B1430", "#0B0B0F"]} locations={[0, 0.5, 1]} style={styles.aurora} />
      <LinearGradient colors={["rgba(42,52,65,0.55)", "rgba(42,52,65,0)"]} start={{ x: 0.5, y: 0 }} end={{ x: 0.2, y: 1 }} style={[styles.aurora, { opacity: 0.8 }]} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.nav}>
            <Pressable testID="onboarding-back" accessibilityLabel="Back" hitSlop={10} onPress={back}><Icon name="chevron-back" size={26} tint="#fff" /></Pressable>
            {step === "interests" || step === "crew" ? (
              <Pressable testID="onboarding-skip" hitSlop={10} onPress={() => go(step === "interests" ? "crew" : "moves")}><Text style={styles.skip}>Skip</Text></Pressable>
            ) : null}
          </View>

          {step === "name" && (
            <View style={styles.body}>
              <Header title="What's your name?" sub="So your friends know it's you 🫶" />
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput testID="name-input" value={name} onChangeText={setName} placeholder="Beyoncé" placeholderTextColor="#747478" autoFocus autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => name.trim() && go("city")} style={styles.input} />
              <View style={{ flex: 1 }} />
              <NextButton enabled={Boolean(name.trim())} onPress={() => go("city")} />
            </View>
          )}

          {step === "city" && (
            <View style={styles.body}>
              <Header title="Where are you hanging out most?" sub="Your default city. Switch anytime 🗺️" />
              <ScrollView style={{ flex: 1, marginTop: 8 }}>
                {CITY_INDEX.map((c) => {
                  const on = profile.city === c.slug;
                  return (
                    <Pressable key={c.slug} testID={`city-${c.slug}`} onPress={() => actions.updateProfile({ city: c.slug })} style={styles.cityRow}>
                      <Text style={[styles.cityText, on && { fontWeight: "700" }]}>{c.name}</Text>
                      {on ? <Icon name="checkmark" size={22} tint="#fff" /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <NextButton enabled onPress={() => go("interests")} />
            </View>
          )}

          {step === "interests" && (
            <View style={[styles.body, { paddingHorizontal: 0 }]}>
              <Header title="What are you into?" sub="Pick at least 3 ✨" />
              <ScrollView contentContainerStyle={styles.tiles}>
                {CATEGORIES.map((c) => {
                  const on = interests.includes(c.id);
                  return (
                    <Pressable key={c.id} testID={`interest-${c.id}`} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setInterests((xs) => (on ? xs.filter((x) => x !== c.id) : [...xs, c.id]))} style={[styles.tile, on && styles.tileOn]}>
                      <PlaceImage uri={tilePhoto[c.id]} category={c.id} style={StyleSheet.absoluteFill} emojiSize={44} />
                      <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
                      <Text style={styles.tileLabel}>{c.label.toLowerCase()}</Text>
                      {on ? <View style={styles.tileCheck}><Icon name="checkmark" size={16} tint="#000" /></View> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={{ paddingHorizontal: 16 }}><NextButton enabled={interests.length >= 3} onPress={() => go("crew")} label={interests.length >= 3 ? "Next" : `Pick ${3 - interests.length} more`} /></View>
            </View>
          )}

          {step === "crew" && (
            <View style={styles.body}>
              <Header title="Who do you usually go out with?" sub="We'll plan for them too 👋" />
              <View style={{ gap: 10, marginTop: 10 }}>
                {CREW.map((c) => <OptionCard key={c.id} testID={`crew-${c.id}`} label={c.label} emoji={c.emoji} on={crew === c.id} onPress={() => setCrew(c.id)} />)}
              </View>
              <View style={{ flex: 1 }} />
              <NextButton enabled={Boolean(crew)} onPress={() => go("moves")} />
            </View>
          )}

          {step === "moves" && (
            <View style={styles.body}>
              <Header title="How do you get around?" sub="So travel times are real 🚇" />
              <View style={{ gap: 10, marginTop: 10 }}>
                {MOVES.map((m) => <OptionCard key={m.id} testID={`move-${m.id}`} label={m.label} emoji={m.emoji} on={move === m.id} onPress={() => setMove(m.id)} />)}
              </View>
              <View style={{ flex: 1 }} />
              <NextButton enabled={Boolean(move)} label="Start exploring" onPress={() => move && finish(move)} testID="finish-onboarding" />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 24, paddingHorizontal: 16 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

function NextButton({ enabled, onPress, label = "Next", testID = "onboarding-next" }: { enabled: boolean; onPress: () => void; label?: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled: !enabled }} disabled={!enabled} onPress={onPress} style={[styles.next, { backgroundColor: enabled ? "#FEFCFF" : "#68686B" }]}>
      <Text style={[styles.nextLabel, { color: enabled ? "#000001" : "#2B2B2D" }]}>{label}</Text>
    </Pressable>
  );
}

function OptionCard({ label, emoji, on, onPress, testID }: { label: string; emoji: string; on: boolean; onPress: () => void; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.option, on && styles.optionOn]}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Text style={{ fontSize: 30 }}>{emoji}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  splash: { flex: 1, paddingHorizontal: 16, paddingBottom: 12 },
  wordmark: { fontFamily: font.serif, fontSize: 52, color: "#fff", letterSpacing: -0.5 },
  splashLine: { fontFamily: font.sans, fontSize: 17, color: "rgba(255,255,255,0.92)", textAlign: "center" },
  glassButton: { height: 47, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.88)", alignItems: "center", justifyContent: "center" },
  glassLabel: { fontFamily: font.sans, fontSize: 18, fontWeight: "500", color: "#000" },
  legal: { fontFamily: font.sans, fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 12, lineHeight: 18 },
  legalBold: { fontWeight: "700", color: "#fff" },
  aurora: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  nav: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  skip: { fontFamily: font.sans, color: "#fff", fontSize: 17, fontWeight: "600" },
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 20 },
  title: { fontFamily: font.sans, fontSize: 24, fontWeight: "700", color: "#fff", textAlign: "center" },
  sub: { fontFamily: font.sans, fontSize: 16, color: "#D2D3DE", textAlign: "center", marginTop: 8 },
  fieldLabel: { fontFamily: font.sans, fontSize: 13, color: "#CFD0D3", marginBottom: 8 },
  input: { height: 45, borderRadius: 3, borderWidth: 1, borderColor: "#707074", backgroundColor: "#111114", color: "#fff", fontSize: 20, paddingHorizontal: 12, fontFamily: font.sans },
  cityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: "#2A2A30" },
  cityText: { fontFamily: font.sans, fontSize: 17, color: "#fff" },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  tile: { width: "48%", aspectRatio: 0.82, borderRadius: 16, overflow: "hidden", justifyContent: "flex-end", padding: 12, borderWidth: 3, borderColor: "transparent" },
  tileOn: { borderColor: "#fff" },
  tileLabel: { fontFamily: font.sans, fontSize: 20, fontWeight: "800", color: "#fff", lineHeight: 23 },
  tileCheck: { position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  next: { height: 47, borderRadius: 3, alignItems: "center", justifyContent: "center", marginTop: 12 },
  nextLabel: { fontFamily: font.sans, fontSize: 18, fontWeight: "600" },
  option: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: "#707074", backgroundColor: "#111114", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22 },
  optionOn: { borderWidth: 1.5, borderColor: "#fff", backgroundColor: "#1C1C22" },
  optionLabel: { fontFamily: font.sans, fontSize: 18, fontWeight: "500", color: "#fff", flex: 1, paddingRight: 12 },
});
