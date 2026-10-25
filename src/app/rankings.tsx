// Your rankings + Leaderboard. The tabs are inspired by Beli's list tabs (beli_appstore_02: left-aligned,
// active bold with a 2 pt underline). "Your rankings" is inspired by Beli's ranked list (discovery/beli/
// beli_ranked_list_numbered_vid.jpg: progress card with a #EBE8EF track and a teal #487078
// fill with milestone dots, rows "1. Name" bold, "$$ | Kind", hood, a grey status line, the
// 39 pt score circle at the right; values from beli_appstore_05_recs_list_reserve.png). Scores
// come from your own order inside each "How was it?" bucket. "Leaderboard" is inspired by Beli's
// leaderboard (beli_leaderboard_vid.jpg: Playfair title, #F0F0F5 segmented control, grey
// caption, outlined dropdown chip, 54 pt rows with rank #848486, 30 pt avatar, grey handle,
// bold count). Empty = Beli's "Your Been List" card; loading = Instagram skeleton;
// error = TikTok tap to retry; offline = Spotify's bar.
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { metaLine } from "@/components/cards";
import { ShareSheet } from "@/components/ShareSheet";
import { DropChip, TrackSegmented, UnderlineTabs } from "@/components/social/controls";
import { rankScores, SENTIMENT_TINT } from "@/components/social/rankScore";
import { useCommunityPosts, useMyPosts } from "@/components/social/useDays";
import { Avatar, EmptyState, ErrorState, Icon, OfflineBanner, SampleTag, ScoreBadge, SkeletonRows } from "@/components/ui";
import { cityName } from "@/data/cities";
import { metersBetween } from "@/lib/geo";
import { shareUrl } from "@/lib/links";
import { costOf } from "@/lib/score";
import { useCity } from "@/state/city";
import { useCityClock, useKnownLocation, useOnline } from "@/state/device";
import { useStore, type Ranked } from "@/state/store";
import { color, font, palette } from "@/theme/tokens";

type Tab = "mine" | "board";
type Metric = "days" | "influence" | "loves";
const GOAL = 10;

export default function Rankings() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === "leaderboard" ? "board" : "mine");
  const online = useOnline();
  const rankings = useStore((s) => s.rankings);
  const [share, setShare] = useState(false);
  const back = () => (router.canGoBack() ? router.back() : router.replace("/profile"));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="rankings-screen">
      <View style={styles.nav}>
        <Pressable testID="rankings-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={back} style={{ width: 40 }}>
          <Icon name="chevron-back" size={28} tint={palette.ink} />
        </Pressable>
        <Text style={styles.navTitle} accessibilityRole="header">your rankings</Text>
        <View style={{ width: 40, alignItems: "flex-end" }}>
          {rankings.length ? (
            <Pressable testID="rankings-share" accessibilityRole="button" accessibilityLabel="Share your rankings" hitSlop={8} onPress={() => setShare(true)}>
              <Icon name="share-outline" size={24} tint={palette.ink} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {!online ? <OfflineBanner /> : null}
      <UnderlineTabs testID="rankings-tabs" value={tab} onChange={setTab} options={[{ id: "mine", label: "Your rankings" }, { id: "board", label: "Leaderboard" }]} />
      {tab === "mine" ? <Mine /> : <Board />}
      {rankings.length ? (
        <ShareSheet
          open={share}
          onClose={() => setShare(false)}
          title="Share your rankings"
          subtitle="Your top spots, in your order."
          url={shareUrl(`/place/${encodeURIComponent(rankings[0].placeId)}`)}
          cardTitle={`My top spots: ${rankings.slice(0, 3).map((r) => r.name).join(", ")}`}
          message={`My top spots on Faves: ${rankings.slice(0, 5).map((r, i) => `${i + 1}. ${r.name}`).join(", ")}`}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Mine() {
  const { city, status, error, retry } = useCity();
  const clock = useCityClock(city?.utcOffset);
  const here = useKnownLocation();
  const rankings = useStore((s) => s.rankings);
  const scores = useMemo(() => rankScores(rankings), [rankings]);
  const from = city ? (here && metersBetween(here, city.center) < 60_000 ? here : null) : null;

  if (!rankings.length) {
    return (
      <ScrollView contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
        <EmptyState testID="rankings-empty" icon="trophy-outline" title="Nothing ranked yet" body="After a day out, rank the spots you went to. Your list becomes your taste, and Faves plans more like it." cta="Rank a spot" onCta={() => router.push("/explore")} />
      </ScrollView>
    );
  }
  if (status === "loading") return <SkeletonRows rows={5} testID="rankings-loading" />;

  const n = rankings.length;
  const unlocked = n >= GOAL;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} testID="rankings-list">
      {status === "error" ? <ErrorState title="Couldn't load spot details. Tap to retry." body={error ?? "Your rankings are saved; distances and hours need the city data."} onRetry={retry} /> : null}
      <View style={styles.sortRow}>
        <Icon name="swap-vertical" size={16} tint={color.brandDeep} />
        <Text style={styles.sortText}>Your order</Text>
      </View>
      <View style={styles.progress} testID="rankings-progress">
        <Text style={styles.progressPre}>{unlocked ? "You unlocked" : "Your progress to"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.progressTitle}>Your taste profile!</Text>
          <Icon name="information-circle" size={18} tint="#1F4F55" />
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(8, Math.min(100, (n / GOAL) * 100))}%` }]} />
          <View style={[styles.milestone, { left: "50%" }]} />
          <View style={[styles.milestone, { left: "97%" }]} />
        </View>
        <View style={styles.milestoneLabels}>
          <Text style={[styles.milestoneText, { left: "41%" }]}>5 spots</Text>
          <Text style={[styles.milestoneText, { right: 0 }]}>Taste profile</Text>
        </View>
        <Text style={styles.progressCount}>{unlocked ? `${n} spots ranked. Your scores now shape your picks.` : `Rank ${GOAL} spots to unlock your taste profile. ${n} of ${GOAL} ranked.`}</Text>
      </View>
      {rankings.map((r, i) => <RankRow key={`${r.placeId}-${i}`} r={r} rank={i + 1} score={scores.get(r.placeId)} testID={`rank-row-${i}`} meta={city && city.slug === r.city ? (() => { const p = city.byId.get(r.placeId); return p ? metaLine(p, clock, from) : null; })() : cityName(r.city)} />)}
    </ScrollView>
  );
}

function RankRow({ r, rank, score, meta, testID }: { r: Ranked; rank: number; score: number | undefined; meta: string | null; testID: string }) {
  const { city } = useCity();
  const place = city && city.slug === r.city ? city.byId.get(r.placeId) : undefined;
  const dollars = place ? costOf(place).dollars : null;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`${rank}. ${r.name}`} onPress={() => router.push(`/place/${encodeURIComponent(r.placeId)}`)} style={({ pressed }) => [styles.row, pressed && { backgroundColor: palette.paperDeep }]}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={styles.rowName} numberOfLines={2}>{rank}. {r.name}</Text>
          {r.kind || dollars ? <Text style={styles.rowLine} numberOfLines={1}>{dollars ? `${dollars} | ` : ""}{r.kind ?? ""}</Text> : null}
          {r.hood ? <Text style={styles.rowLine} numberOfLines={1}>{r.hood}</Text> : null}
        </View>
        <ScoreBadge score={score != null ? score.toFixed(1) : "-"} tint={SENTIMENT_TINT[r.sentiment]} size={39} testID={`${testID}-score`} />
      </View>
      {meta ? <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text> : null}
    </Pressable>
  );
}

function Board() {
  const { city, status, error, retry } = useCity();
  const community = useCommunityPosts(city);
  const mine = useMyPosts(city);
  const profile = useStore((s) => s.profile);
  const [metric, setMetric] = useState<Metric>("influence");

  const rows = useMemo(() => {
    if (!community) return null;
    const by = new Map<string, { handle: string; name: string; sample: boolean; days: number; influence: number; loves: number }>();
    for (const p of community) {
      const k = p.author.handle;
      const cur = by.get(k) ?? { handle: k, name: p.author.name, sample: true, days: 0, influence: 0, loves: 0 };
      cur.days += 1; cur.influence += p.doneCount ?? 0; cur.loves += p.likes;
      by.set(k, cur);
    }
    const me = { handle: profile.handle || "you", name: profile.name || "You", sample: false, days: mine.length, influence: 0, loves: 0 };
    return [...by.values(), me].sort((a, b) => b[metric] - a[metric] || Number(a.sample === false) - Number(b.sample === false));
  }, [community, mine.length, profile, metric]);

  const caption = metric === "days" ? "Number of days posted" : metric === "influence" ? "People who did your days" : "Loves on your days";
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} testID="leaderboard">
      <Text style={styles.boardTitle} accessibilityRole="header">Leaderboard</Text>
      <View style={{ paddingHorizontal: 22 }}>
        <TrackSegmented testID="board-metric" value={metric} onChange={setMetric} options={[{ id: "influence", label: "Influence" }, { id: "days", label: "Days" }, { id: "loves", label: "Loves" }]} />
        <Text style={styles.caption}>{caption}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 }}>
          <DropChip testID="board-city" label={city?.name ?? "City"} onPress={() => router.push("/city")} />
        </View>
        <View style={styles.sampleNote}>
          <SampleTag text="Sample people" />
          <Text style={styles.sampleText}>Placeholder members until real people join.</Text>
        </View>
      </View>
      {status === "error" ? <ErrorState title="Couldn't load the leaderboard. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} testID="board-error" />
        : !rows ? <SkeletonRows rows={6} testID="board-loading" />
        : rows.map((r, i) => (
          <View key={r.handle} style={styles.boardRow} testID={`board-row-${i}`} accessibilityLabel={`${i + 1}. @${r.handle}, ${r[metric]}`}>
            <Text style={styles.boardRank}>{i + 1}</Text>
            <Avatar name={r.name} size={30} />
            <Text style={[styles.boardHandle, !r.sample && { color: palette.ink, fontWeight: "600" }]} numberOfLines={1}>@{r.handle}{r.sample ? "" : " (you)"}</Text>
            {r.sample ? <View><SampleTag /></View> : null}
            <Text style={styles.boardCount}>{r[metric]}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  nav: { height: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  navTitle: { fontFamily: font.display, fontSize: 18, color: palette.ink },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingTop: 14 },
  sortText: { fontFamily: font.sans, fontSize: 16, fontWeight: "500", color: color.brandDeep, letterSpacing: 0.4 },
  progress: { marginHorizontal: 12, marginTop: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 8, paddingHorizontal: 32, paddingTop: 18, paddingBottom: 14 },
  progressPre: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: palette.inkMuted },
  progressTitle: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "#1F4F55", marginTop: 2 },
  track: { height: 19, borderRadius: 10, backgroundColor: palette.paperDeep, marginTop: 16, justifyContent: "center" },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 10, backgroundColor: "#487078" },
  milestone: { position: "absolute", width: 12, height: 12, borderRadius: 6, marginLeft: -6, backgroundColor: "#807F85" },
  milestoneLabels: { height: 18, marginTop: 6 },
  milestoneText: { position: "absolute", fontFamily: font.sans, fontSize: 12, color: palette.inkMuted },
  progressCount: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: color.textMuted, marginTop: 4 },
  row: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: palette.line },
  rowName: { fontFamily: font.sans, fontSize: 18, lineHeight: 23, fontWeight: "700", color: palette.ink },
  rowLine: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: palette.ink },
  rowMeta: { fontFamily: font.sans, fontSize: 15, color: palette.inkMuted, marginTop: 18 },
  boardTitle: { fontFamily: font.serif, fontSize: 30, lineHeight: 38, color: palette.ink, paddingHorizontal: 22, marginTop: 26, marginBottom: 16 },
  caption: { fontFamily: font.sans, fontSize: 16, color: color.textMuted, marginTop: 14 },
  sampleNote: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14, marginBottom: 6 },
  sampleText: { fontFamily: font.sans, fontSize: 13, color: color.textMuted, flex: 1 },
  boardRow: { height: 54, flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 16, gap: 12 },
  boardRank: { width: 30, fontFamily: font.sans, fontSize: 16, color: palette.inkMuted },
  boardHandle: { flexShrink: 1, fontFamily: font.sans, fontSize: 16, color: palette.inkMuted, marginLeft: 1 },
  boardCount: { marginLeft: "auto", fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: palette.ink },
});
