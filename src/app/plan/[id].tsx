// Itinerary. Map on top with Wanderlog's numbered teardrop pins and route line in the day
// color (appstore_04_road_trip_route_map_numbered_stops.png; walk legs as Citymapper's navy
// dots, appstore_04_journey_go_button_legs.png), a sheet below with Wanderlog's day header and
// blue links (appstore_05_itinerary_day_travel_legs.png), Airbnb Trips' timeline and stop
// cards (appstore_06_trips_day_by_day_timeline.png), Wanderlog leg rows between stops, Google
// Maps tonal pills for reserve and directions, and the live re-plan box in Ask Maps' glowing
// prompt style (promo_video_ask_maps_prompt_glow.png).
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import FavesMap from "@/components/map/FavesMap";
import type { MapPin, RouteSegment } from "@/components/map/types";
import { DateBadge, LegModeSheet, LegRow, StopCard, SwapSheet } from "@/components/plan/parts";
import { ViewportProvider, useViewport } from "@/components/video/viewport";
import { Sheet } from "@/components/Sheet";
import { ShareSheet } from "@/components/ShareSheet";
import { Chip, CircleButton, EmptyState, ErrorState, Grabber, Icon, OfflineBanner, Skeleton, SkeletonRows, Toast } from "@/components/ui";
import { formatDuration, type Mode } from "@/lib/geo";
import { openDirections, openUrl, shareUrl } from "@/lib/links";
import { encodePayload, decodePayload } from "@/lib/payload";
import { activitiesIn, parseRequest, requestChips } from "@/lib/parser";
import { alternativesFor, planCost, planFromShared, planTravel, replan, setLegMode, swapStop } from "@/lib/planner";
import { cityClock, DAY_SHORT, formatClock, wallDateFor } from "@/lib/time";
import { weatherFor, type DayWeather } from "@/lib/weather";
import { services } from "@/lib/adapters";
import { routeLeg, type RouteLeg } from "@/lib/adapters/routes";
import { eventsNear, type LiveEvent } from "@/lib/adapters/ticketmaster";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { color, font } from "@/theme/tokens";

const FREE_REPLANS = 3;
const QUICK = ["It's raining", "We're running 30 min late", "Make it cheaper", "Add dessert"];

interface SharedPlan { id: string; c: string; raw: string; date: string; start: number; mode: Mode; places: string[]; title: string }

export default function Itinerary() {
  const { id, d } = useLocalSearchParams<{ id: string; d?: string }>();
  const planId = String(id);
  const { city, status, error, retry } = useCity();
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const plan = useStore((s) => s.plans[planId]);
  const plus = useStore((s) => s.plus.active);
  const replans = useStore((s) => s.replans);
  const citySlug = useStore((s) => s.profile.city);
  const [swapAt, setSwapAt] = useState<number | null>(null);
  const [legAt, setLegAt] = useState<number | null>(null);
  const [share, setShare] = useState(false);
  const [menu, setMenu] = useState(false);
  const [ask, setAsk] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [weather, setWeather] = useState<DayWeather | null>(null);
  const [now, setNow] = useState(() => new Date());
  const view = useViewport();
  const [realLegs, setRealLegs] = useState<Record<string, RouteLeg>>({});
  const [events, setEvents] = useState<LiveEvent[]>([]);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(t); }, []);

  // A plan shared as a link: rebuild it from the link (switching city if needed).
  const shared = useMemo(() => (d ? decodePayload<SharedPlan>(String(d)) : null), [d]);
  useEffect(() => {
    if (plan || !shared) return;
    if (shared.c !== citySlug) { actions.updateProfile({ city: shared.c }); return; }
    if (!city) return;
    const rebuilt = planFromShared(city, shared, parseRequest(shared.raw, { hoods: city.hoods }));
    if (rebuilt) actions.savePlan(rebuilt);
  }, [plan, shared, city, citySlug]);

  useEffect(() => {
    if (!plan || !city || !online) return;
    let live = true;
    weatherFor(city.center.lat, city.center.lng, plan.dateISO).then((w) => { if (live) setWeather(w); });
    return () => { live = false; };
  }, [plan?.dateISO, city, online]);

  // Optional: Google Routes for real travel times and lines, Ticketmaster for events that day.
  useEffect(() => {
    if (!plan || !city || !online || !services.googleRoutes) return;
    let on = true;
    const stops = plan.stops;
    Promise.all(stops.slice(1).map((s, i) => {
      const a = city.byId.get(stops[i].placeId), b = city.byId.get(s.placeId);
      return a && b && s.leg ? routeLeg(a, b, s.leg.mode).then((r) => [s.key, r] as const) : Promise.resolve([s.key, null] as const);
    })).then((pairs) => { if (on) setRealLegs(Object.fromEntries(pairs.filter((p): p is readonly [string, RouteLeg] => Boolean(p[1])))); });
    return () => { on = false; };
  }, [plan?.revision, plan?.id, city, online]);
  useEffect(() => {
    if (!plan || !city || !online || !services.ticketmaster) return;
    let on = true;
    const first = city.byId.get(plan.stops[0]?.placeId ?? "");
    if (first) eventsNear(first.lat, first.lng, plan.dateISO).then((e) => { if (on) setEvents(e); });
    return () => { on = false; };
  }, [plan?.id, city, online]);

  const cityMatches = plan && city && plan.citySlug === city.slug;
  const places = useMemo(() => (plan && city && cityMatches ? plan.stops.map((s) => city.byId.get(s.placeId)!) : []), [plan, city, cityMatches]);

  if (status === "error") return <SafeAreaView style={{ flex: 1, justifyContent: "center" }}><ErrorState body={error ?? "Check your connection and try again."} onRetry={retry} /></SafeAreaView>;
  if (plan && city && !cityMatches) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }} testID="plan-other-city">
        <EmptyState icon="map-outline" title={`This day is in ${plan.cityName}`} body={`You're looking at ${city.name} right now. Switch cities to open it.`} cta={`Switch to ${plan.cityName}`} onCta={() => actions.updateProfile({ city: plan.citySlug })} secondary="Back" onSecondary={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
      </SafeAreaView>
    );
  }
  if (!plan || !city) {
    if (status === "loading" || shared) {
      return (
        <SafeAreaView style={{ flex: 1 }} testID="plan-loading">
          <Skeleton style={{ height: 280, borderRadius: 0 }} />
          <SkeletonRows rows={4} />
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }} testID="plan-missing">
        <EmptyState icon="calendar-outline" title="This day isn't here" body="It may have been deleted, or it was planned on another device. Plan a new one in about 30 seconds." cta="Plan a day" onCta={() => router.replace("/builder")} secondary="Back to Home" onSecondary={() => router.replace("/")} />
      </SafeAreaView>
    );
  }

  const today = plan.dateISO === wallDateFor(city.utcOffset, { offsetDays: 0 }, now).toISOString().slice(0, 10);
  const clock = cityClock(city.utcOffset, now);
  const started = Boolean(today && clock.minutes >= plan.stops[0]?.start - 30);
  const liveIndex = today ? plan.stops.findIndex((s) => clock.minutes >= s.start - 5 && clock.minutes < s.end) : -1;
  const nextIndex = today ? plan.stops.findIndex((s) => s.start > clock.minutes) : -1;
  const cost = planCost(plan, city);
  const travel = planTravel(plan);
  const date = new Date(`${plan.dateISO}T00:00:00Z`);
  const dayKey = wallDateFor(city.utcOffset, { offsetDays: 0 }, now).toISOString().slice(0, 10);
  const usedToday = replans.day === dayKey ? replans.count : 0;
  const left = Math.max(0, FREE_REPLANS - usedToday);
  const chips = requestChips(plan.request, (m) => formatClock(m, { compact: true }));
  const rainHour = weather?.rainHours.find((h) => h.hour * 60 >= plan.start - 60 && h.hour * 60 <= plan.end);

  const pins: MapPin[] = places.map((p, i) => ({ id: p.id, lat: p.lat, lng: p.lng, kind: "number", number: i + 1, color: color.dayColor }));
  const routes: RouteSegment[] = places.slice(1).map((p, i) => {
    const real = realLegs[plan.stops[i + 1].key];
    return { points: real?.points.length ? real.points : [places[i], p], walk: plan.stops[i + 1].leg?.mode === "walk" };
  });

  const save = (next: typeof plan, note?: string) => { actions.savePlan(next); if (note) setMessage(note); };

  const runReplan = (text: string) => {
    const t = text.trim();
    if (!t) return;
    if (!plus && left <= 0) { router.push("/plus"); return; }
    const r = replan(plan, city, t, { lexicon: activitiesIn, now });
    save(r.plan, r.message);
    if (r.changed.length || /Removed|Added|Pushed/.test(r.message)) actions.useReplan(dayKey);
    setAsk("");
  };

  const sharePayload: SharedPlan = { id: plan.id, c: plan.citySlug, raw: plan.request.raw, date: plan.dateISO, start: plan.stops[0]?.start ?? plan.start, mode: plan.transport, places: plan.stops.map((s) => s.placeId), title: plan.title };
  const link = shareUrl(`/plan/${plan.id}?d=${encodePayload(sharePayload)}`);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }} testID="itinerary">
      <View style={styles.mapBox}>
        <FavesMap testID="plan-map" creditBottom={26} style={StyleSheet.absoluteFill} center={places[0] ?? city.center} span={0.04} pins={pins} routes={routes} fitToPins showLabels={false} onPinPress={(pid) => router.push(`/place/${encodeURIComponent(pid)}`)} />
        <View style={[styles.mapButtons, { top: insets.top + 8 }]} pointerEvents="box-none">
          <CircleButton testID="plan-back" icon="chevron-back" label="Back" light size={40} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <CircleButton testID="plan-share" icon="share-outline" label="Share" light size={40} onPress={() => setShare(true)} />
            <CircleButton testID="plan-menu" icon="ellipsis-horizontal" label="More" light size={40} onPress={() => setMenu(true)} />
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheet}>
        {!online ? <OfflineBanner /> : null}
        <Grabber />
        <ScrollView testID="plan-scroll" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" onScroll={view.onScroll} scrollEventThrottle={64} onLayout={view.onLayout}>
          <ViewportProvider vp={view.vp}>
          <Text style={styles.title} testID="plan-title">{plan.title}</Text>
          <Text style={styles.meta}>{plan.dayLabel} · {formatClock(plan.stops[0]?.start ?? plan.start)} to {formatClock(plan.stops[plan.stops.length - 1]?.end ?? plan.end)} · {plan.stops.length} stops</Text>
          <Text style={styles.meta}>
            {cost.perPerson ? `About $${cost.perPerson} each${cost.estimated ? ` (${cost.estimated} estimated)` : ""}` : "Free"} · {formatDuration(travel.minutes)} of travel, {travel.miles.toFixed(1)} mi
          </Text>
          <View style={styles.links}>
            <Text testID="link-share" style={styles.link} onPress={() => setShare(true)}>Share</Text>
            <Text style={styles.dot}>•</Text>
            <Text testID="link-vote" style={styles.link} onPress={() => router.push(`/group/new?plan=${plan.id}`)}>Vote with friends</Text>
            <Text style={styles.dot}>•</Text>
            <Text testID="link-recap" style={styles.link} onPress={() => router.push(`/recap/${plan.id}`)}>Day recap</Text>
          </View>
          {chips.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
              {chips.map((c) => <View key={c} style={styles.reqChip}><Text style={styles.reqChipText}>{c}</Text></View>)}
            </ScrollView>
          ) : null}
          <View style={styles.info}>
            {plan.sunset != null ? <Text style={styles.infoText}>🌅 Sunset at {formatClock(plan.sunset)}</Text> : null}
            {weather ? <Text style={styles.infoText}>{rainHour ? `🌧️ ${rainHour.chance}% chance of rain around ${formatClock(rainHour.hour * 60, { compact: true })}` : `🌤️ ${weather.highF}°F high, rain unlikely`}</Text> : null}
            {rainHour ? <Text testID="make-rain-plan" style={styles.link} onPress={() => runReplan("it's raining")}>Make it a rain plan</Text> : null}
          </View>
          {message || plan.log[0] ? (
            <View style={styles.agentNote} testID="agent-note">
              <Icon name="sparkles" size={16} tint={color.askMapsBlue} />
              <Text style={styles.agentText}>{message ?? plan.log[0]}</Text>
            </View>
          ) : null}
          {plan.notes.filter((n) => !n.startsWith("Sunset")).map((n) => <Text key={n} style={styles.note}>{n}</Text>)}
          <Text style={styles.changedTitle}>Something changed?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} keyboardShouldPersistTaps="handled">
            {QUICK.map((q, i) => <Chip key={q} testID={`quick-${i}`} label={q} onPress={() => runReplan(q)} />)}
          </ScrollView>
          <Text style={styles.replansLeft}>{plus ? "Faves Plus: unlimited live re-plans" : left > 0 ? `${left} free live ${left === 1 ? "re-plan" : "re-plans"} left today` : "Out of free re-plans today. Plus has unlimited."}</Text>

          {/* Timeline */}
          <View style={styles.timeline}>
            <View style={styles.rail}>
              <DateBadge dayShort={DAY_SHORT[date.getUTCDay()]} date={date.getUTCDate()} />
              <View style={styles.railLine} />
              <View style={styles.railDot} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              {plan.stops.map((s, i) => {
                const p = places[i];
                const prev = places[i - 1];
                const planB = s.planB.map((x) => city.byId.get(x)).find(Boolean);
                return (
                  <View key={s.key}>
                    {s.leg && prev ? <LegRow testID={`leg-${i}`} leg={realLegs[s.key] ? { ...s.leg, minutes: realLegs[s.key].minutes, meters: realLegs[s.key].meters, miles: realLegs[s.key].meters / 1609.344 } : s.leg} onModes={() => setLegAt(i)} onDirections={() => openDirections({ lat: p.lat, lng: p.lng, name: p.name }, s.leg!.mode)} /> : null}
                    <StopCard
                      testID={`stop-${i}`}
                      stop={s}
                      place={p}
                      index={i}
                      live={liveIndex === i ? "now" : liveIndex < 0 && nextIndex === i && started ? "next" : null}
                      onOpen={() => router.push(`/place/${encodeURIComponent(p.id)}`)}
                      onSwap={() => setSwapAt(i)}
                      onPlanB={() => { if (planB) { save(swapStop(plan, city, i, planB.id), `Switched to Plan B: ${planB.name}.`); } }}
                      onDirections={() => openDirections({ lat: p.lat, lng: p.lng, name: p.name }, plan.transport)}
                      onReserve={() => openUrl(p.reserveUrl ?? p.website)}
                      planBName={planB?.name ?? null}
                      reel={`/reel?plan=${encodeURIComponent(plan.id)}&i=${i}`}
                    />
                  </View>
                );
              })}
            </View>
          </View>
          {events.length ? (
            <View style={{ marginTop: 16 }} testID="events">
              <Text style={styles.changedTitle}>Happening nearby that day</Text>
              {events.map((e) => (
                <Pressable key={e.id} onPress={() => openUrl(e.url)} style={styles.menuRow}>
                  <Icon name="ticket-outline" size={20} tint="#1F1F1F" />
                  <Text style={[styles.menuText, { flex: 1, fontSize: 15 }]} numberOfLines={2}>{e.name}{e.venue ? ` · ${e.venue}` : ""}{e.time ? ` · ${formatClock(Number(e.time.slice(0, 2)) * 60 + Number(e.time.slice(3, 5)), { compact: true })}` : ""}</Text>
                  <Text style={styles.link}>Tickets</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          </ViewportProvider>
          <Text style={styles.footnote}>{Object.keys(realLegs).length ? "Travel times and route lines from Google Routes." : "Travel times are estimates from distance and typical speeds. Lines on the map are straight; tap Directions for the real route."}</Text>
        </ScrollView>

        {/* Live re-plan: one row with the agent box and the start button */}
        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
            <LinearGradient colors={[color.askMapsStrokeA, color.askMapsStrokeB]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.askStroke}>
              <View style={styles.askBox}>
                <TextInput testID="replan-input" value={ask} onChangeText={setAsk} placeholder="What changed?" placeholderTextColor="#8A8A8A" style={styles.askInput} onSubmitEditing={() => runReplan(ask)} returnKeyType="send" />
                <Pressable testID="replan-send" accessibilityLabel="Re-plan" onPress={() => runReplan(ask)} style={styles.askSend}><Icon name="send" size={16} tint="#306CF0" /></Pressable>
              </View>
            </LinearGradient>
            <Pressable
              testID={started ? "end-day" : "start-day"}
              accessibilityRole="button"
              onPress={() => {
                if (started) router.push(`/recap/${plan.id}`);
                else if (today) setToast("Have fun. The plan stays live as you go.");
                else { actions.savePlan(plan); setToast("Saved to your days"); }
              }}
              style={styles.startPill}
            >
              <Icon name={started ? "flag" : today ? "play" : "bookmark"} size={16} tint="#fff" />
              <Text style={styles.startText}>{started ? "End day" : today ? "Start" : "Save"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 8} />
      <SwapSheet
        open={swapAt != null}
        onClose={() => setSwapAt(null)}
        city={city}
        stop={swapAt != null ? plan.stops[swapAt] : null}
        alternatives={swapAt != null ? alternativesFor(plan, city, swapAt, 8) : []}
        onPick={(pid) => { if (swapAt != null) { const before = places[swapAt]?.name; save(swapStop(plan, city, swapAt, pid), `Swapped ${before} for ${city.byId.get(pid)?.name}.`); } setSwapAt(null); }}
      />
      <LegModeSheet
        open={legAt != null}
        onClose={() => setLegAt(null)}
        from={legAt != null ? places[legAt - 1] ?? null : null}
        to={legAt != null ? places[legAt] ?? null : null}
        current={legAt != null ? plan.stops[legAt].leg?.mode ?? plan.transport : plan.transport}
        onPick={(m) => { if (legAt != null) save(setLegMode(plan, city, legAt, m), "Updated the travel time and the times after it."); setLegAt(null); }}
      />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Anyone with the link can see this day" url={link} cardTitle={plan.title} image={places[0]?.image} category={places[0]?.category} message={`${plan.title}, ${plan.dayLabel}. Planned on Faves:`} />
      <Sheet open={menu} onClose={() => setMenu(false)} title="This day" testID="plan-menu-sheet">
        <MenuRow testID="menu-group" icon="people-outline" label="Vote with friends" onPress={() => { setMenu(false); router.push(`/group/new?plan=${plan.id}`); }} />
        <MenuRow testID="menu-recap" icon="flag-outline" label="End the day and recap" onPress={() => { setMenu(false); router.push(`/recap/${plan.id}`); }} />
        <MenuRow testID="menu-redo" icon="refresh" label="Plan it again from scratch" onPress={() => { setMenu(false); router.push(`/builder?q=${encodeURIComponent(plan.request.raw)}`); }} />
        <MenuRow testID="menu-delete" icon="trash-outline" label="Delete this day" danger onPress={() => { setMenu(false); actions.deletePlan(plan.id); router.replace("/"); }} />
      </Sheet>
    </View>
  );
}

function MenuRow({ icon, label, onPress, danger, testID }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onPress: () => void; danger?: boolean; testID: string }) {
  return (
    <Pressable testID={testID} onPress={onPress} style={styles.menuRow}>
      <Icon name={icon} size={22} tint={danger ? "#D93025" : "#1F1F1F"} />
      <Text style={[styles.menuText, danger && { color: "#D93025" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  mapBox: { height: "38%", backgroundColor: color.cornerLand },
  mapButtons: { position: "absolute", left: 14, right: 14, flexDirection: "row", justifyContent: "space-between" },
  sheet: { flex: 1, marginTop: -22, backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  title: { fontFamily: font.sans, fontSize: 26, lineHeight: 31, fontWeight: "700", color: "#212529", marginTop: 4 },
  meta: { fontFamily: font.sans, fontSize: 15, color: "#677079", marginTop: 4 },
  links: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
  link: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: color.wanderBlue },
  dot: { color: "#B8BEC4" },
  reqChip: { backgroundColor: color.chipOff, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  reqChipText: { fontFamily: font.sans, fontSize: 13, color: "#000", fontWeight: "500" },
  info: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8, alignItems: "center" },
  infoText: { fontFamily: font.sans, fontSize: 14, color: "#444" },
  agentNote: { flexDirection: "row", gap: 8, backgroundColor: "#F0F5FF", borderRadius: 12, padding: 12, marginTop: 12 },
  agentText: { fontFamily: font.sans, fontSize: 14, color: "#1B1B1B", flex: 1, lineHeight: 19 },
  note: { fontFamily: font.sans, fontSize: 14, color: color.closed, marginTop: 8 },
  timeline: { flexDirection: "row", gap: 10, marginTop: 18 },
  rail: { width: 44, alignItems: "center" },
  railLine: { flex: 1, width: 1, backgroundColor: color.airbnbRail, marginTop: 6 },
  railDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: color.airbnbDot },
  footnote: { fontFamily: font.sans, fontSize: 12, color: color.textMuted, marginTop: 16, lineHeight: 17 },
  bottom: { borderTopWidth: 1, borderTopColor: "#EEE", paddingTop: 10, backgroundColor: "#fff" },
  askStroke: { flex: 1, borderRadius: 24, padding: 2 },
  askBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 22, paddingLeft: 14, paddingRight: 4, height: 44 },
  askInput: { flex: 1, fontFamily: font.sans, fontSize: 16, color: "#000", height: 44 },
  askSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F0F0FC", alignItems: "center", justifyContent: "center" },
  replansLeft: { fontFamily: font.sans, fontSize: 12, color: color.textMuted, marginTop: 6 },
  changedTitle: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: "#212529", marginTop: 14, marginBottom: 8 },
  startPill: { height: 46, borderRadius: 23, backgroundColor: color.brand, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16 },
  startText: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "600" },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, height: 54, borderBottomWidth: 1, borderBottomColor: "#F1F1F1" },
  menuText: { fontFamily: font.sans, fontSize: 17, color: "#1F1F1F" },
});

