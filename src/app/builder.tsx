// Plan builder. The free-text ask copies Google Maps' "Ask Maps" sheet
// (promo_video_ask_maps_sheet_suggestions.png: header with the sparkle icon and round
// buttons, a big greeting, suggestion rows; promo_video_ask_maps_prompt_glow.png: the prompt
// card with a gray-to-blue gradient stroke, a soft blue glow, mic and a blue send arrow in a
// pale circle). The guided path copies Airbnb's question flow (appstore_07_host_question_flow_cards.png:
// one question per screen, × top right, big left-aligned question, 16 pt radius option cards
// with a 3D object at the right) and ends on Wanderlog's "Plan a new trip" form
// (android_video_plan_new_trip_filled.png: labeled bordered fields). While the agent works,
// the answer streams in like Ask Maps (promo_video_ask_maps_answer_streaming_tail.png):
// settled text near-black, the newest words blue, the last letters fading.
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sheet } from "@/components/Sheet";
import { EmptyState, ErrorState, Icon, PrimaryButton, Skeleton, TextButton } from "@/components/ui";
import type { Mode } from "@/lib/geo";
import { llmEnabled, llmExplain, llmParse } from "@/lib/llm";
import { parseRequest, requestChips, type PlanRequest } from "@/lib/parser";
import { makePlan, type Plan } from "@/lib/planner";
import { formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { useKnownLocation, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { categoryInfo, color, font } from "@/theme/tokens";

const SUGGESTIONS = [
  "First date in the Mission: something fun, dinner and a view",
  "Me and 3 friends, pickleball then hot pot, 2pm to 9pm",
  "Catching up with my college friend who loves Gundam",
  "Rainy Saturday, cheap, by subway",
];

type Step = "ask" | "who" | "when" | "vibe" | "move" | "musts" | "building";
const WHO = [
  { id: "friends", label: "Friends", emoji: "👯", text: "with friends" },
  { id: "date", label: "A date", emoji: "💘", text: "date" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧", text: "family day" },
  { id: "catch-up", label: "Catching up", emoji: "🫶", text: "catching up with an old friend" },
  { id: "solo", label: "Just me", emoji: "🎧", text: "solo" },
];
const WHEN = [
  { id: "today", label: "Today", emoji: "☀️", text: "today" },
  { id: "tonight", label: "Tonight", emoji: "🌙", text: "tonight" },
  { id: "tomorrow", label: "Tomorrow", emoji: "📅", text: "tomorrow" },
  { id: "weekend", label: "This weekend", emoji: "🎉", text: "this weekend" },
];
const VIBES = [
  { id: "chill", label: "Chill", emoji: "🛋️" },
  { id: "active", label: "Active", emoji: "🏃" },
  { id: "fancy", label: "Fancy", emoji: "🥂" },
  { id: "cheap", label: "Cheap", emoji: "💸" },
  { id: "outdoors", label: "Outdoors", emoji: "🌳" },
  { id: "rainy", label: "Rainy day", emoji: "🌧️" },
  { id: "non touristy", label: "Hidden gems", emoji: "💎" },
];
const MOVES: { id: Mode; label: string; emoji: string; text: string }[] = [
  { id: "walk", label: "Walking", emoji: "🚶", text: "walking" },
  { id: "transit", label: "Subway and bus", emoji: "🚇", text: "by transit" },
  { id: "drive", label: "Car or rideshare", emoji: "🚗", text: "by car" },
  { id: "bike", label: "Bike", emoji: "🚲", text: "by bike" },
];

export default function Builder() {
  const params = useLocalSearchParams<{ q?: string; place?: string }>();
  const { city, status, error, retry } = useCity();
  const online = useOnline();
  const here = useKnownLocation();
  const profile = useStore((s) => s.profile);
  const [step, setStep] = useState<Step>("ask");
  const [text, setText] = useState(params.q ?? "");
  const [who, setWho] = useState<string | null>(profile.crew);
  const [when, setWhen] = useState<string | null>(null);
  const [vibes, setVibes] = useState<string[]>([]);
  const [move, setMove] = useState<Mode>(profile.transport);
  const [musts, setMusts] = useState("");
  const [loves, setLoves] = useState("");
  const [hood, setHood] = useState("");
  const [req, setReq] = useState<PlanRequest | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const plans = useStore((s) => s.plans);
  const planOrder = useStore((s) => s.planOrder);
  const started = useRef(false);
  const included = params.place && city ? city.byId.get(decodeURIComponent(params.place)) : undefined;

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  async function build(raw: string) {
    if (!city) return;
    const t = raw.trim();
    if (!t && !included) return;
    setStep("building");
    setFailed(null);
    setPlan(null);
    let parsed = parseRequest(t || "something fun", { hoods: city.hoods });
    setReq(parsed);
    if (llmEnabled && online) {
      try { parsed = await llmParse(t, parsed, city.hoods); setReq(parsed); } catch { /* deterministic parse stays */ }
    }
    // Let the "reading your request" line show before the work starts.
    await new Promise((r) => setTimeout(r, 350));
    try {
      const p = makePlan(parsed, { city, origin: here, defaultTransport: profile.transport, profileInterests: profile.interests, includePlace: included?.id });
      if (!p.stops.length) { setFailed("We couldn't fit any open spots into that window. Try a longer day, another neighborhood or fewer must-dos."); return; }
      if (llmEnabled && online) {
        try {
          const reasons = await llmExplain(p, city);
          if (reasons) { p.stops.forEach((s, i) => { s.why = reasons[i]; }); p.source = "model"; }
        } catch { /* deterministic reasons stay */ }
      }
      setPlan(p);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "Something went wrong while planning.");
    }
  }

  // Occasion chips and "Plan a day for this" hand over a request: start right away.
  useEffect(() => {
    if (params.q && city && !started.current) { started.current = true; build(params.q); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q, city]);
  useEffect(() => {
    if (included && !text) setText(`A day around ${included.name}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [included?.id]);

  const composed = useMemo(() => {
    const bits: string[] = [];
    const w = WHO.find((x) => x.id === who);
    if (w) bits.push(w.text);
    const wh = WHEN.find((x) => x.id === when);
    if (wh) bits.push(wh.text);
    bits.push(...vibes.map((v) => (v === "rainy" ? "rainy day" : v)));
    if (musts.trim()) bits.push(musts.trim());
    if (loves.trim()) bits.push(`loves ${loves.trim()}`);
    if (hood.trim()) bits.push(`in ${hood.trim()}`);
    bits.push(MOVES.find((m) => m.id === move)!.text);
    return bits.join(", ");
  }, [who, when, vibes, musts, loves, hood, move]);

  if (status === "error") return <SafeAreaView style={{ flex: 1, justifyContent: "center" }}><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></SafeAreaView>;
  if (!city) return <SafeAreaView style={{ flex: 1, padding: 20, gap: 14 }} testID="builder-loading"><Skeleton style={{ height: 30, width: 200 }} /><Skeleton style={{ height: 140 }} /></SafeAreaView>;

  if (step === "building") return <Building req={req} plan={plan} failed={failed} raw={text || composed} cityName={city.name} spots={city.places.length} onEdit={() => { setStep("ask"); started.current = true; }} onOpen={() => { if (plan) { actions.savePlan(plan); router.replace(`/plan/${plan.id}`); } }} />;

  if (step !== "ask") {
    const options = step === "who" ? WHO : step === "when" ? WHEN : step === "vibe" ? VIBES : step === "move" ? MOVES : [];
    const selected = (id: string) => (step === "who" ? who === id : step === "when" ? when === id : step === "vibe" ? vibes.includes(id) : step === "move" ? move === id : false);
    const pick = (id: string) => {
      if (step === "who") { setWho(id); setStep("when"); }
      else if (step === "when") { setWhen(id); setStep("vibe"); }
      else if (step === "vibe") setVibes((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
      else if (step === "move") { setMove(id as Mode); setStep("musts"); }
    };
    const order: Step[] = ["who", "when", "vibe", "move", "musts"];
    const title = { who: "Who's coming?", when: "When are you going?", vibe: "What's the vibe?", move: "How are you getting around?", musts: "Anything you have to do?" }[step as "who"];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} testID={`builder-${step}`}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={styles.qNav}>
            <Pressable testID="builder-back" accessibilityLabel="Back" hitSlop={10} onPress={() => { const i = order.indexOf(step); setStep(i > 0 ? order[i - 1] : "ask"); }}><Icon name="chevron-back" size={24} tint="#222" /></Pressable>
            <Text style={styles.qProgress}>{order.indexOf(step) + 1} of {order.length}</Text>
            <Pressable testID="builder-close" accessibilityLabel="Close" hitSlop={10} onPress={close}><Icon name="close" size={24} tint="#222" /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 23, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.qTitle}>{title}</Text>
            {step === "musts" ? (
              <View style={{ gap: 12, marginTop: 20 }}>
                <Field testID="field-musts" label="Must-dos, in order" value={musts} onChange={setMusts} placeholder="pickleball then hot pot" />
                <Field testID="field-loves" label="Does someone love something?" value={loves} onChange={setLoves} placeholder="Gundam, jazz, vintage" />
                <Field testID="field-hood" label="Neighborhood (optional)" value={hood} onChange={setHood} placeholder={city.hoods[Math.min(5, city.hoods.length - 1)] ?? "Downtown"} />
                <Text style={styles.qSummary}>We'll plan: {composed}</Text>
              </View>
            ) : (
              <View style={{ gap: 12.7, marginTop: 24 }}>
                {options.map((o) => (
                  <Pressable key={o.id} testID={`option-${o.id}`} accessibilityRole={step === "vibe" ? "checkbox" : "radio"} accessibilityState={{ selected: selected(o.id) }} onPress={() => pick(o.id)} style={[styles.card, { height: options.length > 4 ? 88 : 118 }, selected(o.id) && styles.cardOn]}>
                    <Text style={styles.cardLabel}>{o.label}</Text>
                    <Text style={{ fontSize: options.length > 4 ? 38 : 48 }}>{o.emoji}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
          {step === "vibe" || step === "musts" ? (
            <View style={styles.qFooter}>
              {step === "vibe" ? <TextButton testID="vibe-skip" label="Skip" onPress={() => { setVibes([]); setStep("move"); }} /> : <TextButton label="Back to typing" onPress={() => { setText(composed); setStep("ask"); }} />}
              <PrimaryButton testID={step === "vibe" ? "vibe-next" : "build-from-questions"} label={step === "vibe" ? "Next" : "Plan my day"} icon={step === "musts" ? "sparkles" : undefined} onPress={() => (step === "vibe" ? setStep("move") : build(composed))} style={{ flex: 1, marginLeft: 20 }} />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Ask Maps: greeting, suggestions, the glowing prompt card.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} testID="builder-ask">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.askHeader}>
          <Icon name="sparkles" size={24} tint={color.askMapsBlue} />
          <Text style={styles.askTitle}>Plan a day</Text>
          <View style={{ flex: 1 }} />
          <Pressable testID="builder-history" accessibilityLabel="Your past days" onPress={() => setHistory(true)} style={styles.askRound}><Icon name="time-outline" size={20} tint="#1F1F1F" /></Pressable>
          <Pressable testID="builder-new" accessibilityLabel="Start over" onPress={() => setText("")} style={styles.askRound}><Icon name="create-outline" size={19} tint="#1F1F1F" /></Pressable>
          <Pressable testID="builder-close" accessibilityLabel="Close" onPress={close} style={styles.askRound}><Icon name="close" size={20} tint="#1F1F1F" /></Pressable>
        </View>
        <Sheet open={history} onClose={() => setHistory(false)} title="Your days" testID="history-sheet">
          {planOrder.length ? planOrder.slice(0, 20).map((id) => plans[id]).filter(Boolean).map((p) => (
            <Pressable key={p.id} testID={`history-${p.id}`} onPress={() => { setHistory(false); router.replace(`/plan/${p.id}`); }} style={styles.historyRow}>
              <Icon name="calendar-outline" size={20} tint="#1F1F1F" />
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.historySub} numberOfLines={1}>{p.dayLabel} · {p.cityName} · "{p.request.raw}"</Text>
              </View>
            </Pressable>
          )) : <Text style={[styles.historySub, { padding: 20 }]}>No days yet. The days you plan show up here.</Text>}
        </Sheet>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.greeting}>Hi{profile.name ? `, ${profile.name}` : ""}. Who's coming, and what are you into?</Text>
          {included ? (
            <View style={styles.includedChip}><Text style={{ fontSize: 15 }}>{categoryInfo(included.category).emoji}</Text><Text style={styles.includedText} numberOfLines={1}>Built around {included.name}</Text></View>
          ) : null}
          <View style={{ gap: 18, marginTop: 22 }}>
            {SUGGESTIONS.map((s, i) => (
              <Pressable key={s} testID={`suggestion-${i}`} onPress={() => { setText(s); build(s); }} style={styles.suggestion}>
                <View style={styles.suggestionMark} />
                <Text style={styles.suggestionText}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable testID="start-questions" onPress={() => setStep("who")} style={styles.questionsLink}>
            <Icon name="list-outline" size={18} tint={color.brand} />
            <Text style={styles.questionsText}>Answer a few questions instead</Text>
          </Pressable>
          {llmEnabled ? <Text style={styles.engine}>Planner model connected</Text> : <Text style={styles.engine}>Planning runs on this device with Faves data</Text>}
        </ScrollView>
        <View style={styles.promptWrap}>
          <View style={styles.glow} />
          <LinearGradient colors={[color.askMapsStrokeA, color.askMapsStrokeB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stroke}>
            <View style={styles.prompt}>
              <TextInput
                testID="builder-input"
                value={text}
                onChangeText={setText}
                placeholder="pickleball then hot pot with 3 friends, cheap"
                placeholderTextColor="#8A8A8A"
                multiline
                style={styles.promptInput}
                onSubmitEditing={() => build(text)}
                blurOnSubmit
                returnKeyType="go"
              />
              <View style={styles.promptRow}>
                <View style={{ flex: 1 }} />
                <Pressable testID="builder-send" accessibilityRole="button" accessibilityLabel="Plan my day" disabled={!text.trim() && !included} onPress={() => build(text)} style={[styles.send, !text.trim() && !included && { opacity: 0.4 }]}>
                  <Icon name="send" size={20} tint="#306CF0" />
                </Pressable>
              </View>
            </View>
          </LinearGradient>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, testID }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; testID: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput testID={testID} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#9A9A9A" style={styles.fieldInput} />
    </View>
  );
}

// The streaming answer: lines arrive one at a time, newest words blue, last letters fading.
function Building({ req, plan, failed, raw, cityName, spots, onEdit, onOpen }: { req: PlanRequest | null; plan: Plan | null; failed: string | null; raw: string; cityName: string; spots: number; onEdit: () => void; onOpen: () => void }) {
  const { city } = useCity();
  const lines = useMemo(() => {
    const out = [`Reading your request.`, `Looking at ${spots.toLocaleString()} spots locals rate in ${cityName}.`];
    if (plan && city) {
      out.push(`Checking opening hours${plan.sunset != null ? `, sunset at ${formatClock(plan.sunset)}` : ""} and travel times.`);
      plan.stops.forEach((s, i) => {
        const p = city.byId.get(s.placeId);
        out.push(`${i + 1}. ${formatClock(s.start)}  ${s.slot.label}: ${p?.name ?? ""}`);
      });
      out.push(`Your day is ready: ${plan.stops.length} stops.`);
    }
    return out;
  }, [plan, city, cityName, spots]);
  const [shown, setShown] = useState(0); // characters revealed across all lines
  const total = lines.join("\n").length;
  useEffect(() => {
    const t = setInterval(() => setShown((n) => Math.min(n + 4, total)), 18);
    return () => clearInterval(t);
  }, [total]);
  const done = Boolean(plan) && shown >= total;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(onOpen, 900);
    return () => clearTimeout(t);
  }, [done, onOpen]);

  let left = shown;
  const chips = req && city ? requestChips(req, (m) => formatClock(m, { compact: true })) : [];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} testID="builder-building">
      <View style={styles.askHeader}>
        <Icon name="sparkles" size={24} tint={color.askMapsBlue} />
        <Text style={styles.askTitle}>Plan a day</Text>
        <View style={{ flex: 1 }} />
        <Pressable testID="building-edit" accessibilityLabel="Edit request" onPress={onEdit} style={styles.askRound}><Icon name="create-outline" size={19} tint="#1F1F1F" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 6 }}>
        <View style={styles.userBubble}><Text style={styles.userText}>{raw}</Text></View>
        {chips.length ? (
          <View style={styles.chips}>
            {chips.map((c) => <View key={c} style={styles.reqChip}><Text style={styles.reqChipText}>{c}</Text></View>)}
          </View>
        ) : null}
        {failed ? (
          <View style={{ marginTop: 20 }}>
            <EmptyState icon="calendar-outline" title="No day fits that yet" body={failed} cta="Edit the request" onCta={onEdit} />
          </View>
        ) : (
          <View style={{ marginTop: 18 }}>
            <View style={styles.glowSmall} />
            <LinearGradient colors={[color.askMapsStrokeA, color.askMapsStrokeB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stroke}>
              <View style={[styles.prompt, { minHeight: 180 }]} testID="building-answer">
                {lines.map((l, i) => {
                  if (left <= 0) return null;
                  const visible = l.slice(0, left);
                  left -= l.length + 1;
                  const streaming = left < 0;
                  const settled = streaming ? visible.slice(0, Math.max(0, visible.length - 18)) : visible;
                  const fresh = streaming ? visible.slice(settled.length, Math.max(settled.length, visible.length - 3)) : "";
                  const tail = streaming ? visible.slice(settled.length + fresh.length) : "";
                  return (
                    <Text key={i} style={[styles.answer, l.match(/^\d+\./) && styles.answerStop]}>
                      {settled}<Text style={{ color: color.askMapsTail }}>{fresh}</Text><Text style={{ color: color.askMapsFade }}>{tail}</Text>
                    </Text>
                  );
                })}
                {!plan ? <Text style={styles.waiting}>{llmEnabled ? "Asking the planner model…" : "Building your day…"}</Text> : null}
              </View>
            </LinearGradient>
            {done ? <PrimaryButton testID="open-plan" label="Open my day" onPress={onOpen} style={{ marginTop: 18 }} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  askHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
  askTitle: { fontFamily: font.sans, fontSize: 22, color: "#1F1F1F" },
  askRound: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F2F2F2", alignItems: "center", justifyContent: "center", marginLeft: 8 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },
  historyTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: "#1F1F1F" },
  historySub: { fontFamily: font.sans, fontSize: 13, color: color.textSub, marginTop: 2 },
  greeting: { fontFamily: font.sans, fontSize: 26, lineHeight: 32, color: "#1B1B1B", marginTop: 14, fontWeight: "500" },
  includedChip: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: color.tonal, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 14, maxWidth: "100%" },
  includedText: { fontFamily: font.sans, fontSize: 15, color: color.tonalText, fontWeight: "600", flexShrink: 1 },
  suggestion: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  suggestionMark: { width: 14, height: 22, borderRadius: 7, backgroundColor: "#E3ECEB", marginTop: 1 },
  suggestionText: { fontFamily: font.sans, fontSize: 17, lineHeight: 23, color: "#1F1F1F", flex: 1 },
  questionsLink: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 28 },
  questionsText: { fontFamily: font.sans, fontSize: 16, fontWeight: "600", color: color.brand },
  engine: { fontFamily: font.sans, fontSize: 13, color: color.textMuted, marginTop: 14 },
  promptWrap: { paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  glow: { position: "absolute", left: 4, right: 4, top: -8, bottom: 2, borderRadius: 34, backgroundColor: color.askMapsGlow, opacity: 0.7 },
  glowSmall: { position: "absolute", left: -6, right: -6, top: -6, bottom: -6, borderRadius: 30, backgroundColor: "#E8F0FF" },
  stroke: { borderRadius: 26, padding: 2.5 },
  prompt: { backgroundColor: "#fff", borderRadius: 24, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  promptInput: { fontFamily: font.sans, fontSize: 19, color: "#000", minHeight: 56, maxHeight: 140, textAlignVertical: "top" },
  promptRow: { flexDirection: "row", alignItems: "center" },
  send: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F0F0FC", alignItems: "center", justifyContent: "center" },
  qNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 10 },
  qProgress: { fontFamily: font.sans, fontSize: 14, color: color.airbnbSub },
  qTitle: { fontFamily: font.sans, fontSize: 26, lineHeight: 32, fontWeight: "600", color: color.airbnbText, marginTop: 14 },
  card: { borderRadius: 16, borderWidth: 1, borderColor: color.airbnbBorder, paddingHorizontal: 25, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardOn: { borderWidth: 1.5, borderColor: color.airbnbText },
  cardLabel: { fontFamily: font.sans, fontSize: 19, fontWeight: "500", color: color.airbnbText },
  qFooter: { flexDirection: "row", alignItems: "center", paddingHorizontal: 23, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#EBEBEB" },
  qSummary: { fontFamily: font.sans, fontSize: 15, color: color.airbnbSub, marginTop: 8, lineHeight: 21 },
  field: { borderWidth: 1, borderColor: "#C8CACC", borderRadius: 8, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  fieldLabel: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: "#141719" },
  fieldInput: { fontFamily: font.sans, fontSize: 17, color: "#141719", paddingVertical: 6 },
  userBubble: { alignSelf: "flex-end", maxWidth: "88%", backgroundColor: "#F0F2F5", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 11, marginTop: 8 },
  userText: { fontFamily: font.sans, fontSize: 17, color: "#1B1B1B", lineHeight: 23 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  reqChip: { backgroundColor: color.chipOff, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  reqChipText: { fontFamily: font.sans, fontSize: 13, color: "#000", fontWeight: "500" },
  answer: { fontFamily: font.sans, fontSize: 17, lineHeight: 25, color: "#1B1B1B" },
  answerStop: { fontWeight: "600" },
  waiting: { fontFamily: font.sans, fontSize: 15, color: color.loadingRow, marginTop: 6 },
});
