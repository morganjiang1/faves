// End-of-day recap for a plan (/recap/<planId>; /recap/demo builds a demo plan). Four steps,
// each copying a reference:
// 1. Rate: Uber Eats' "Rate your order" (social/ubereats/appstore_07_rate_order_thumbs_chips_stars.png):
//    ← and a grey pill top bar, 34 pt bold title, #717171 sub line, overlapping round photos at
//    the right, then per stop "How was <stop>?" with the 62 pt thumbs and 38 pt reason chips,
//    and the #F3F3F3 free-text box.
// 2. Which did you like more?: Beli's rank flow (discovery/beli/beli_rank_3_which_do_you_prefer_vid.jpg,
//    social/beli/yt_GlMma4eXe18_t208): stacked cards over a dark scrim, two outlined cards and
//    the OR disc, Undo / Too tough / Skip. The order goes into your rankings.
// 3. The day in slides: Strava Year in Sport (social/strava/yt_e1DDHqJURk4_t088, t100, t116,
//    t044, t026): one stat per slide, then the summary card with the orange marquee band.
// 4. Share card: Spotify Wrapped 2025's summary card in four colorways
//    (social/spotify/wrapped2025_newsroom_summary_share_cards.png) with Spotify's white
//    "Share" pill (wrapped2025_newsroom_minutes_story_share_button.png), then "Post your day"
//    and Beli's success modal (discovery/beli/beli_rank_first_spot_modal_vid.jpg).
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BeliModal, CompareCard, HeaderCard, SCRIM } from "@/components/recap/beli";
import { shareCardImage } from "@/components/recap/capture";
import { DEMO_ID, ensureDemoPlan } from "@/components/recap/demo";
import { RateStop } from "@/components/recap/RateStop";
import { COLORWAYS, ShareCard, type ShareCardData } from "@/components/recap/ShareCard";
import { CATEGORY_ICON, dayStats, fmt1, topFans, type DayStats, type Fan } from "@/components/recap/stats";
import { Bars, LineChart, Podium, StandoutCard, StatCard, Story, SummaryCard, type Slide } from "@/components/recap/story";
import { useCityFor } from "@/components/recap/useCityFor";
import { ShareSheet } from "@/components/ShareSheet";
import { EmptyState, ErrorState, Icon, OfflineBanner, PlaceImage, PrimaryButton, SampleTag, Skeleton, SkeletonRows } from "@/components/ui";
import type { Place } from "@/data/types";
import { shareUrl } from "@/lib/links";
import type { Plan } from "@/lib/planner";
import { mergeRecap, sortAnswer, sortDone, sortPair, sortSkip, sortTooTough, sortUndo, startSort, type SortState } from "@/lib/ranking";
import { costOf, scoreOutOf10 } from "@/lib/score";
import { DAY_NAMES, MONTHS, formatClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, useStore, type Ranked } from "@/state/store";
import { categoryInfo, color, font, palette } from "@/theme/tokens";

type Phase = "rate" | "compare" | "story" | "share";
const EMPTY: Record<string, never> = {};

export default function RecapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const planId = decodeURIComponent(String(id ?? ""));
  const isDemo = planId === DEMO_ID;
  const here = useCity();
  const plan = useStore((s) => s.plans[planId]);
  const recap = useStore((s) => s.recaps[planId]);
  const rankings = useStore((s) => s.rankings);
  const groups = useStore((s) => s.groups);
  const me = useStore((s) => s.profile.name);
  const posts = useStore((s) => s.posts);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const { city, status, error, retry } = useCityFor(plan?.citySlug ?? (isDemo ? here.city?.slug : null));

  useEffect(() => { if (isDemo && here.city && !plan) ensureDemoPlan(here.city); }, [isDemo, here.city, plan]);

  const [phase, setPhase] = useState<Phase>("rate");
  const [sort, setSort] = useState<SortState<string> | null>(null);
  const [likedOrder, setLikedOrder] = useState<string[] | null>(null);
  const [slide, setSlide] = useState(0);
  const [note, setNote] = useState(() => posts.find((p) => p.planId === planId)?.note ?? "");

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const ratings = recap?.ratings ?? EMPTY;
  const reasons = recap?.reasons ?? EMPTY;

  const order = useMemo(() => {
    if (likedOrder) return likedOrder;
    if (!plan) return [];
    const liked = plan.stops.filter((s) => ratings[s.key] === "up");
    const idx = (s: (typeof liked)[number]) => (s.key === recap?.favorite ? -1 : rankings.findIndex((r) => r.placeId === s.placeId));
    return [...liked].sort((a, b) => idx(a) - idx(b)).map((s) => s.key);
  }, [likedOrder, plan, ratings, recap?.favorite, rankings]);

  const stats = useMemo(() => (plan && city ? dayStats(plan, city, recap, order) : null), [plan, city, recap, order]);
  const fans = useMemo(() => (plan ? topFans(groups, plan.id, me) : []), [groups, plan, me]);

  if (!plan) {
    if (isDemo && here.status !== "error") return <Loading />;
    return (
      <SafeAreaView style={styles.center} testID="recap-missing">
        <EmptyState icon="calendar-outline" title="No day to recap" body="This plan isn't on this phone. Plan a day, go do it, then come back to rate it." cta="Plan a day" onCta={() => router.replace("/builder")} secondary="Close" onSecondary={close} />
      </SafeAreaView>
    );
  }
  if (status === "loading") return <Loading />;
  if (status === "error" || !city || !stats) {
    return (
      <SafeAreaView style={styles.center} testID="recap-error">
        <ErrorState body={error ?? "Couldn't load this city's spots. Check your connection."} onRetry={retry} />
      </SafeAreaView>
    );
  }

  const placeOf = (key: string) => city.byId.get(plan.stops.find((s) => s.key === key)?.placeId ?? "") as Place | undefined;

  const rate = (key: string, r: "up" | "down" | null) => {
    const next = { ...ratings };
    const nextReasons = { ...reasons };
    if (r) next[key] = r; else delete next[key];
    if (ratings[key] !== r) nextReasons[key] = [];
    actions.setRecap(planId, { ratings: next, reasons: nextReasons });
  };
  const toggleReason = (key: string, reason: string) => {
    const cur = reasons[key] ?? [];
    actions.setRecap(planId, { reasons: { ...reasons, [key]: cur.includes(reason) ? cur.filter((x) => x !== reason) : [...cur, reason] } });
  };

  const finishCompare = (sorted: string[]) => {
    const liked: Ranked[] = [];
    const disliked: Ranked[] = [];
    const at = new Date().toISOString();
    const entry = (key: string): Ranked | null => {
      const p = placeOf(key);
      return p ? { placeId: p.id, city: city.slug, name: p.name, hood: p.hood, kind: p.kind, sentiment: "great", at } : null;
    };
    for (const k of sorted) { const e = entry(k); if (e) liked.push(e); }
    for (const s of plan.stops) if (ratings[s.key] === "down") { const e = entry(s.key); if (e) disliked.push({ ...e, sentiment: "bad" }); }
    actions.setRankings(mergeRecap(rankings, liked, disliked));
    actions.setRecap(planId, { favorite: sorted[0] ?? null, finishedAt: recap?.finishedAt ?? at });
    setLikedOrder(sorted);
    setSort(null);
    setSlide(0);
    setPhase("story");
  };

  const toRecap = () => {
    const liked = plan.stops.filter((s) => ratings[s.key] === "up").map((s) => s.key);
    if (liked.length >= 2) {
      setSort(startSort(liked));
      setPhase("compare");
    } else finishCompare(liked);
  };

  const stepSort = (next: SortState<string>) => (sortDone(next) ? finishCompare(next.sorted) : setSort(next));

  if (phase === "story") {
    return <DayStory plan={plan} stats={stats} fans={fans} favorite={recap?.favorite ?? null} slide={slide} onSlide={setSlide} onClose={close} onDone={() => setPhase("share")} />;
  }
  if (phase === "share") {
    return <SharePhase planId={planId} plan={plan} stats={stats} posted={Boolean(recap?.posted)} note={note} reasons={reasons} online={online} onBack={() => setPhase("story")} onClose={close} />;
  }

  const pair = sort ? sortPair(sort) : null;
  const covers = plan.stops.slice(0, 2).map((s) => city.byId.get(s.placeId)).filter((p): p is Place => Boolean(p));

  return (
    <View style={{ flex: 1, backgroundColor: palette.paper }} testID="recap-screen">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: Math.max(insets.top, 12), paddingBottom: 24 }}>
          {/* Uber Eats top bar: back arrow, grey pill at the right */}
          <View style={styles.topBar}>
            <Pressable testID="recap-back" accessibilityRole="button" accessibilityLabel="Close recap" hitSlop={10} onPress={close}>
              <Icon name="arrow-back" size={26} tint={palette.ink} />
            </Pressable>
            <Pressable testID="recap-skip" accessibilityRole="button" onPress={toRecap} style={({ pressed }) => [styles.helpPill, pressed && { opacity: 0.7 }]}>
              <Icon name="play-forward-outline" size={16} tint={palette.ink} />
              <Text style={styles.helpLabel}>Skip</Text>
            </Pressable>
          </View>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Rate your day</Text>
              <Text style={styles.sub}>{plan.title} • {plan.dayLabel}</Text>
              {isDemo ? <View style={{ marginTop: 6 }}><SampleTag text="Demo plan" /></View> : null}
            </View>
            <View style={{ flexDirection: "row" }}>
              {covers.map((p, i) => (
                <View key={p.id} style={[styles.cover, i > 0 && { marginLeft: -10 }]}>
                  <PlaceImage uri={p.image} category={p.category} style={{ width: 46, height: 46, borderRadius: 23 }} emojiSize={20} />
                </View>
              ))}
            </View>
          </View>

          {plan.stops.map((s, i) => {
            const p = city.byId.get(s.placeId);
            if (!p) return null;
            const line = [`Stop ${i + 1}`, formatClock(s.start), p.kind ?? categoryInfo(p.category).label].join(" • ");
            return (
              <View key={s.key}>
                {i > 0 ? <View style={styles.rule} /> : null}
                <RateStop testID={`rate-stop-${i}`} name={p.name} line={line} rating={ratings[s.key] ?? null} reasons={reasons[s.key] ?? []} onRate={(r) => rate(s.key, r)} onReason={(r) => toggleReason(s.key, r)} />
              </View>
            );
          })}

          <View style={styles.rule} />
          <View style={{ paddingHorizontal: 16, paddingTop: 22 }}>
            <Text style={styles.section}>Anything to add?</Text>
            <Text style={styles.question}>It goes on your post if you share the day.</Text>
            <TextInput
              testID="recap-note"
              accessibilityLabel="Note about your day"
              value={note}
              onChangeText={setNote}
              placeholder="You can mention what you'd do again."
              placeholderTextColor={palette.inkSoft}
              multiline
              maxLength={280}
              style={styles.noteBox}
            />
          </View>
        </ScrollView>
        {!online ? <OfflineBanner /> : null}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <PrimaryButton testID="recap-continue" label="See your recap" onPress={toRecap} />
        </View>
      </KeyboardAvoidingView>

      {phase === "compare" && sort && pair ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM, paddingTop: Math.max(insets.top, 12) + 2 }]} testID="recap-compare">
          <HeaderCard testID="recap-compare-header" title={plan.title} sub={`${sort.items.length} stops you liked`} closeLabel="Skip comparing" onClose={() => finishCompare([...sort.sorted, ...sort.items.slice(sort.next)])} />
          <CompareCard
            title="Which did you like more?"
            a={side(pair[0], placeOf(pair[0]))}
            b={side(pair[1], placeOf(pair[1]))}
            onPick={(k) => stepSort(sortAnswer(sort, k === pair[0]))}
            onUndo={() => setSort(sortUndo(sort))}
            onTooTough={() => stepSort(sortTooTough(sort))}
            onSkip={() => stepSort(sortSkip(sort))}
            canUndo={sort.past.length > 0}
          />
        </View>
      ) : null}
    </View>
  );
}

const side = (key: string, p: Place | undefined) => ({ key, name: p?.name ?? "This stop", sub: (p?.hood && p.hood !== p.name ? p.hood : p?.kind) ?? null });

function Loading() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} testID="recap-loading">
      <View style={{ padding: 16, gap: 12 }}>
        <Skeleton style={{ width: 26, height: 26, borderRadius: 13 }} />
        <Skeleton style={{ width: "62%", height: 30, borderRadius: 8 }} />
        <Skeleton style={{ width: "80%", height: 14, borderRadius: 7 }} />
      </View>
      <SkeletonRows rows={4} />
    </SafeAreaView>
  );
}

// ---- 3. The day in slides (Strava Year in Sport) ------------------------------------

const short = (name: string) => {
  const words = name.replace(/^the\s+/i, "").split(/\s+/);
  let out = "";
  for (const w of words) { if ((out + " " + w).trim().length > 11) break; out = (out + " " + w).trim(); }
  return (out || words[0].slice(0, 11)).toUpperCase();
};

function DayStory({ plan, stats, fans, favorite, slide, onSlide, onClose, onDone }: { plan: Plan; stats: DayStats; fans: Fan[]; favorite: string | null; slide: number; onSlide: (i: number) => void; onClose: () => void; onDone: () => void }) {
  const weekday = DAY_NAMES[plan.weekday];
  const n = stats.stops.length;
  const slides: Slide[] = [];
  slides.push({
    id: "stops",
    glow: "#4F5A16",
    caption: `A full ${weekday}: ${n} ${n === 1 ? "stop" : "stops"} in ${fmt1(stats.hoursOut)} hours.`,
    body: (
      <StatCard label="STOPS DONE" value={String(n)}>
        <Bars max={Math.max(...stats.stops.map((s) => s.minutes))} rows={stats.stops.map((s) => ({ label: short(s.place.name), value: s.minutes, text: `${s.minutes}m`, best: s.key === favorite }))} />
      </StatCard>
    ),
  });
  if (stats.legs.length) {
    slides.push({
      id: "miles",
      glow: "#5C4A08",
      caption: `${stats.travelMinutes} min getting from stop to stop.`,
      body: (
        <StatCard label="MILES TRAVELED" value={fmt1(stats.miles)}>
          <Bars max={Math.max(...stats.legs.map((l) => l.miles))} rows={stats.legs.map((l) => ({ label: short(l.to.name), value: l.miles, text: `${fmt1(l.miles)} mi ${l.mode === "transit" ? "ride" : l.mode}` }))} />
        </StatCard>
      ),
    });
  }
  slides.push({
    id: "hours",
    glow: "#AB2B02",
    caption: stats.longest ? `Longest stop: ${stats.longest.place.name}.` : undefined,
    body: (
      <StatCard tall label="HOURS OUT" value={fmt1(stats.hoursOut)}>
        <LineChart points={stats.stops.map((s) => s.minutes)} labels={stats.stops.map((s) => short(s.place.name))} peakText={`${Math.max(...stats.stops.map((s) => s.minutes))} min`} />
      </StatCard>
    ),
  });
  if (stats.top) {
    const p = stats.top.stop.place;
    const c = costOf(p);
    slides.push({
      id: "top",
      glow: "#0F5550",
      caption: stats.top.why === "favorite" ? "You liked it most." : stats.top.why === "liked" ? "Your thumbs up, and the best Locals Score of them." : "The best Locals Score of the day.",
      body: (
        <StandoutCard
          label={stats.top.why === "favorite" ? "YOUR FAVORITE STOP" : "TOP-RATED STOP"}
          title={p.name}
          photo={p.image ?? p.photos[0] ?? null}
          category={p.category}
          icon={CATEGORY_ICON[p.category] ?? "star-outline"}
          stats={[
            { label: "Locals Score", value: p.unrated ? "None" : scoreOutOf10(p.locals) },
            { label: "Time", value: `${stats.top.stop.minutes} min` },
            { label: "Cost", value: c.dollars ?? (c.perPerson === 0 && !c.estimated ? "Free" : "Not listed") },
          ]}
        />
      ),
    });
  }
  if (fans.length) slides.push({ id: "fans", glow: "#AB1900", caption: "The friends who voted on the day.", body: <Podium fans={fans} /> });
  const top = stats.top?.stop.place ?? stats.stops[0]?.place;
  slides.push({
    id: "summary",
    glow: "#AB1900",
    body: (
      <SummaryCard
        topLabel="Top Stop"
        topName={top?.name ?? ""}
        icon={top ? CATEGORY_ICON[top.category] ?? "star-outline" : "star-outline"}
        photo={top?.image ?? null}
        category={top?.category ?? "views"}
        pairs={[
          { label: "Stops Done", value: String(n) },
          { label: "Miles Traveled", value: `${fmt1(stats.miles)} mi` },
          { label: "Hours Out", value: `${fmt1(stats.hoursOut)} hrs` },
          { label: "Locals Score Avg", value: stats.avgScore ?? "None" },
        ]}
      />
    ),
  });
  const last = slide >= slides.length - 1;
  return (
    <Story
      testID="recap-story"
      slides={slides}
      index={Math.min(slide, slides.length - 1)}
      onIndex={onSlide}
      onClose={onClose}
      footer={last ? (
        <Pressable testID="recap-make-card" accessibilityRole="button" onPress={onDone} style={({ pressed }) => [styles.stravaPill, pressed && { opacity: 0.8 }]}>
          <Text style={styles.stravaLabel}>Make your share card</Text>
        </Pressable>
      ) : null}
    />
  );
}

// ---- 4. Share card + post (Spotify Wrapped) ----------------------------------------

function SharePhase({ planId, plan, stats, posted, note, reasons, online, onBack, onClose }: { planId: string; plan: Plan; stats: DayStats; posted: boolean; note: string; reasons: Record<string, string[]>; online: boolean; onBack: () => void; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const pageW = Math.min(winW, 520);
  const [cw, setCw] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const refs = useRef<(ComponentRef<typeof View> | null)[]>([]);
  const avail = winH - Math.max(insets.top, 12) - Math.max(insets.bottom, 12) - 52 - 28 - 64 - 62 - 34;
  const cardW = Math.max(200, Math.min(pageW - 64, (avail * 9) / 16));
  const top = stats.top?.stop.place ?? stats.stops[0]?.place;
  const d = new Date(`${plan.dateISO}T12:00:00Z`);
  const data: ShareCardData = {
    stamp: `${MONTHS[d.getUTCMonth()].slice(0, 3).toUpperCase()} ${d.getUTCDate()}`,
    photo: top?.image ?? top?.photos[0] ?? null,
    category: top?.category ?? "views",
    stops: stats.stops.map((s) => s.place.name),
    loved: stats.loved.map((s) => s.place.name),
    miles: fmt1(stats.miles),
    score: stats.avgScore ?? "None",
    footer: "MADE WITH FAVES",
  };
  const url = shareUrl(`/day/${encodeURIComponent(planId)}`);
  const cw_ = COLORWAYS[cw];

  const share = async () => {
    setBusy(true);
    const res = await shareCardImage({ current: refs.current[cw] }, { title: plan.title, text: `My day on Faves: ${plan.title}`, url });
    setBusy(false);
    if (res !== "shared") setSheet(true);
  };

  const post = () => {
    const liked = stats.loved.map((s) => s.place.name);
    const words = [...new Set(Object.values(reasons).flat())].slice(0, 2).map((w) => w.toLowerCase());
    const auto = liked.length ? `Loved ${liked.slice(0, 2).join(" and ")}${words.length ? `: ${words.join(", ")}` : ""}.` : "";
    actions.addPost({ id: `post-${planId}`, planId, city: plan.citySlug, title: plan.title, note: note.trim() || auto, at: new Date().toISOString() });
    actions.setRecap(planId, { posted: true });
    setModal(true);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / pageW);
    if (i !== cw && i >= 0 && i < COLORWAYS.length) setCw(i);
  };
  const go = (i: number) => { setCw(i); pager.current?.scrollTo({ x: i * pageW, animated: true }); };
  const ink = color.wrappedInk;

  return (
    <View style={{ flex: 1, backgroundColor: cw_.accent }} testID="recap-share">
      <View style={[styles.shareTop, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable testID="share-back" accessibilityRole="button" accessibilityLabel="Back to the slides" hitSlop={10} onPress={onBack}><Icon name="chevron-back" size={26} tint={ink} /></Pressable>
        <Image source={require("../../../assets/brand/mark.png")} style={{ width: 28, height: 28, borderRadius: 7 }} contentFit="contain" />
        <Pressable testID="share-close" accessibilityRole="button" accessibilityLabel="Close recap" hitSlop={10} onPress={onClose}><Icon name="close" size={26} tint={ink} /></Pressable>
      </View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onScroll={Platform.OS === "web" ? onScroll : undefined}
        scrollEventThrottle={64}
        style={{ flexGrow: 0 }}
        testID="share-pager"
      >
        {COLORWAYS.map((c, i) => (
          <View key={c.accent} style={{ width: pageW, alignItems: "center", paddingVertical: 8 }}>
            <ShareCard testID={`share-card-${i}`} data={data} colorway={c} width={cardW} viewRef={(r) => { refs.current[i] = r; }} />
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {COLORWAYS.map((c, i) => (
          <Pressable key={c.accent} testID={`share-colorway-${i}`} accessibilityRole="button" accessibilityLabel={`Color ${i + 1} of 4`} accessibilityState={{ selected: i === cw }} hitSlop={8} onPress={() => go(i)}>
            <View style={[styles.dot, { backgroundColor: i === cw ? ink : "rgba(39,39,39,0.3)" }]} />
          </Pressable>
        ))}
      </View>
      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Pressable testID="recap-share-card" accessibilityRole="button" accessibilityLabel="Share your day card" disabled={busy} onPress={share} style={({ pressed }) => [styles.spotifyPill, (pressed || busy) && { opacity: 0.75 }]}>
          <Icon name="share-outline" size={18} tint={palette.ink} />
          <Text style={styles.spotifyLabel}>Share</Text>
        </Pressable>
      </View>
      <View style={{ flex: 1 }} />
      {!online ? <OfflineBanner /> : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 12) }}>
        {posted ? (
          <PrimaryButton testID="recap-see-feed" label="Posted. See it in the feed" icon="checkmark" onPress={() => router.replace("/feed")} />
        ) : (
          <PrimaryButton testID="recap-post" label="Post your day" onPress={post} />
        )}
      </View>
      <ShareSheet open={sheet} onClose={() => setSheet(false)} subtitle="Anyone with the link can see your day" url={url} cardTitle={plan.title} image={data.photo} category={data.category} message={`My day on Faves: ${plan.title}`} />
      <BeliModal
        testID="posted-modal"
        open={modal}
        icon="people-outline"
        title="Your day is posted!"
        body="It's in the Community feed now. When people do your day, you earn spot rewards."
        cta="See it in the feed"
        onCta={() => { setModal(false); router.replace("/feed"); }}
        secondary="Done"
        onSecondary={() => setModal(false)}
        onClose={() => setModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", backgroundColor: palette.paper },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, height: 48 },
  helpPill: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, borderRadius: 17, backgroundColor: palette.paperDeep, paddingHorizontal: 14 },
  helpLabel: { fontFamily: font.sans, fontSize: 16, fontWeight: "500", color: palette.ink },
  titleRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, marginTop: 14, gap: 10 },
  title: { fontFamily: font.sans, fontSize: 34, lineHeight: 40, fontWeight: "700", color: palette.ink, letterSpacing: -0.5 },
  sub: { fontFamily: font.sans, fontSize: 16, lineHeight: 22, color: palette.inkMuted, marginTop: 4 },
  cover: { borderRadius: 25, borderWidth: 2, borderColor: palette.line, marginTop: 8 },
  rule: { height: 1, backgroundColor: palette.paperDeep, marginHorizontal: 16 },
  section: { fontFamily: font.sans, fontSize: 22, lineHeight: 28, fontWeight: "700", color: palette.ink },
  question: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: palette.inkMuted, marginTop: 3 },
  noteBox: { fontFamily: font.sans, marginTop: 18, minHeight: 100, borderRadius: 8, backgroundColor: palette.paperDeep, padding: 14, paddingTop: 14, fontSize: 16, color: palette.ink, textAlignVertical: "top" },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: palette.card },
  stravaPill: { alignSelf: "stretch", marginHorizontal: 20, height: 48, borderRadius: 24, backgroundColor: color.strava, alignItems: "center", justifyContent: "center" },
  stravaLabel: { fontFamily: font.sans, color: "#fff", fontSize: 17, fontWeight: "700" },
  shareTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, minHeight: 52 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 6, height: 20, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  spotifyPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, minWidth: 176, paddingHorizontal: 28, borderRadius: 24, backgroundColor: color.wrappedPaper },
  spotifyLabel: { fontFamily: font.sans, color: palette.ink, fontSize: 16, fontWeight: "700" },
});
