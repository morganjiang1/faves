// Onboarding in the Faves identity: a splash of three of the city's postcards fanned out on
// cream paper with the rose wordmark, then one ask per screen (name, city, interests, who you go
// out with, how you get around) on paper, with postcard-framed photo tiles and rose buttons.
// One question per screen is inspired by Partiful's first run; picking at least 3 interests from
// photo tiles is inspired by Corner.
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
import { CATEGORIES, font, palette, type CategoryId } from "@/theme/tokens";

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
    // Three postcards from the city, fanned out like a stack on a table.
    const cards = (["views", "food", "courts"] as CategoryId[]).map((c, i) => ({ c, uri: tilePhoto[c], tilt: [-9, 4, -2][i], x: [-58, 52, 0][i], y: [18, 6, -14][i] }));
    return (
      <View style={[styles.fill, { backgroundColor: palette.paper }]} testID="onboarding-splash">
        <SafeAreaView style={styles.splash}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
            <View style={styles.fan}>
              {cards.map((k) => (
                <View key={k.c} style={[styles.fanCard, { transform: [{ translateX: k.x }, { translateY: k.y }, { rotate: `${k.tilt}deg` }] }]}>
                  <PlaceImage uri={k.uri} category={k.c} style={styles.fanPhoto} emojiSize={40} />
                </View>
              ))}
              <View style={styles.fanStamp}><Image source={require("../../assets/brand/mark.png")} style={{ width: 40, height: 40 }} contentFit="contain" /></View>
            </View>
            <Text style={styles.wordmark}>faves</Text>
            <Text style={styles.splashLine}>The spots locals love. The whole day, planned with your friends.</Text>
          </View>
          <Pressable testID="get-started" accessibilityRole="button" onPress={() => go("name")} style={styles.start}>
            <Text style={styles.startLabel}>Get started</Text>
          </Pressable>
          <Text style={styles.legal}>By tapping Get started, you agree to our <Text style={styles.legalBold}>Privacy Policy</Text> and <Text style={styles.legalBold}>Terms of Service</Text>.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: palette.paper }]} testID={`onboarding-${step}`}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.nav}>
            <Pressable testID="onboarding-back" accessibilityLabel="Back" hitSlop={10} onPress={back}><Icon name="chevron-back" size={26} tint={palette.ink} /></Pressable>
            {step === "interests" || step === "crew" ? (
              <Pressable testID="onboarding-skip" hitSlop={10} onPress={() => go(step === "interests" ? "crew" : "moves")}><Text style={styles.skip}>Skip</Text></Pressable>
            ) : null}
          </View>

          {step === "name" && (
            <View style={styles.body}>
              <Header title="What's your name?" sub="So your friends know it's you 🫶" />
              <Text style={styles.fieldLabel}>First name</Text>
              <TextInput testID="name-input" value={name} onChangeText={setName} placeholder="Your first name" placeholderTextColor={palette.inkMuted} autoFocus autoCapitalize="words" returnKeyType="next" onSubmitEditing={() => name.trim() && go("city")} style={styles.input} />
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
                      {on ? <Icon name="checkmark-circle" size={22} tint={palette.roseInk} /> : null}
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
                      <LinearGradient colors={["rgba(30,21,48,0)", "rgba(30,21,48,0.62)"]} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
                      <Text style={styles.tileLabel}>{c.label.toLowerCase()}</Text>
                      {on ? <View style={styles.tileCheck}><Icon name="heart" size={15} tint={palette.cream} /></View> : null}
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
    <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled: !enabled }} disabled={!enabled} onPress={onPress} style={[styles.next, { backgroundColor: enabled ? palette.roseInk : palette.paperDeep }]}>
      <Text style={[styles.nextLabel, { color: enabled ? palette.cream : palette.inkMuted }]}>{label}</Text>
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
  splash: { flex: 1, paddingHorizontal: 20, paddingBottom: 12 },
  fan: { width: 260, height: 230, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  fanCard: { position: "absolute", width: 150, height: 188, backgroundColor: palette.card, borderRadius: 10, padding: 7, paddingBottom: 26, shadowColor: palette.ink, shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4, borderWidth: 1, borderColor: palette.line },
  fanPhoto: { flex: 1, borderRadius: 6, overflow: "hidden" },
  fanStamp: { position: "absolute", right: 22, top: 8, width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderStyle: "dashed", borderColor: palette.rose, backgroundColor: palette.roseTint, alignItems: "center", justifyContent: "center", transform: [{ rotate: "12deg" }] },
  wordmark: { fontFamily: font.displayHeavy, fontSize: 60, color: palette.roseInk, letterSpacing: -1.5 },
  splashLine: { fontFamily: font.sans, fontSize: 17, lineHeight: 23, color: palette.inkSoft, textAlign: "center", paddingHorizontal: 18 },
  start: { height: 54, borderRadius: 16, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "#8F1C38" },
  startLabel: { fontFamily: font.sans, fontSize: 18, fontWeight: "800", color: palette.cream },
  legal: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 12, lineHeight: 18, textAlign: "center" },
  legalBold: { fontWeight: "700", color: palette.inkSoft },
  nav: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  skip: { fontFamily: font.sans, color: palette.roseInk, fontSize: 17, fontWeight: "700" },
  body: { flex: 1, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 12 },
  title: { fontFamily: font.display, fontSize: 28, lineHeight: 33, color: palette.ink, textAlign: "center" },
  sub: { fontFamily: font.sans, fontSize: 16, color: palette.inkSoft, textAlign: "center", marginTop: 8 },
  fieldLabel: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.inkMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 },
  input: { height: 54, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, color: palette.ink, fontSize: 20, paddingHorizontal: 16, fontFamily: font.sans },
  cityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 15, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: palette.line },
  cityText: { fontFamily: font.sans, fontSize: 17, color: palette.ink },
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  tile: { width: "47.5%", aspectRatio: 0.82, borderRadius: 10, overflow: "hidden", justifyContent: "flex-end", padding: 12, borderWidth: 6, borderColor: palette.card, backgroundColor: palette.card, shadowColor: palette.ink, shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  tileOn: { borderColor: palette.rose },
  tileLabel: { fontFamily: font.display, fontSize: 20, color: palette.cream, lineHeight: 23 },
  tileCheck: { position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-8deg" }] },
  next: { height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 12 },
  nextLabel: { fontFamily: font.sans, fontSize: 18, fontWeight: "800" },
  option: { minHeight: 76, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.card, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22 },
  optionOn: { borderWidth: 2, borderColor: palette.rose, backgroundColor: palette.roseTint },
  optionLabel: { fontFamily: font.sans, fontSize: 18, fontWeight: "600", color: palette.ink, flex: 1, paddingRight: 12 },
});
