// Rank one spot (/rank?place=<placeId>), presented as a transparent modal over the screen
// you came from. Copies Beli's rank flow frame by frame:
// - social/beli/yt_GlMma4eXe18_t144_how_was_it_rating_sheet.png and
//   discovery/beli/beli_rank_1_how_was_it_vid.jpg: stacked white cards over a dimmed list,
//   card 1 = name in Playfair bold + grey type line + ✕, card 2 = "How was it?" with the
//   three circles;
// - discovery/beli/beli_rank_3_which_do_you_prefer_vid.jpg (+ _4): the comparison card, a
//   binary insertion against your list in the same bucket (at most 4 questions);
// - discovery/beli/beli_rank_5_ranked_toast_vid.jpg: the dark "<name> ranked!" toast;
// - discovery/beli/beli_rank_first_spot_modal_vid.jpg / social/beli/..._t146: the first-ever
//   ranking modal "Wooo! You ranked your first spot!".
// Beli's "Add to my list of [Restaurants ▾]" card is left out: Faves keeps one list.
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BeliCard, BeliModal, CompareCard, HeaderCard, HowWasIt, SCRIM } from "@/components/recap/beli";
import { EmptyState, ErrorState, OfflineBanner, Skeleton, Toast } from "@/components/ui";
import { answer, bucketOf, insertRanked, probe, skip, startInsertion, tooTough, undo, type Insertion } from "@/lib/ranking";
import { costOf } from "@/lib/score";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, useStore, type Ranked, type Sentiment } from "@/state/store";
import { categoryInfo } from "@/theme/tokens";

type Phase = "rate" | "compare" | "ranked" | "first";

export default function RankScreen() {
  const { place: param } = useLocalSearchParams<{ place?: string }>();
  const placeId = param ? decodeURIComponent(String(param)) : "";
  const { city, status, error, retry } = useCity();
  const rankings = useStore((s) => s.rankings);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [ins, setIns] = useState<Insertion | null>(null);
  const [phase, setPhase] = useState<Phase>("rate");
  const [toast, setToast] = useState<string | null>(null);

  const place = city?.byId.get(placeId) ?? null;
  const others = useMemo(() => rankings.filter((r) => r.placeId !== placeId), [rankings, placeId]);
  const bucket = useMemo(() => (sentiment ? bucketOf(others, sentiment) : []), [others, sentiment]);

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace("/")), []);

  const finish = (s: Sentiment, index: number) => {
    if (!place || !city) return;
    const item: Ranked = { placeId: place.id, city: city.slug, name: place.name, hood: place.hood, kind: place.kind, sentiment: s, at: new Date().toISOString() };
    const first = rankings.length === 0;
    actions.setRankings(insertRanked(rankings, item, index));
    if (first) setPhase("first");
    else {
      setPhase("ranked");
      setToast(`${place.name} ranked!`);
    }
  };

  const pick = (s: Sentiment) => {
    setSentiment(s);
    const st = startInsertion(bucketOf(others, s).length);
    if (st.index !== null) finish(s, st.index);
    else {
      setIns(st);
      setPhase("compare");
    }
  };

  const step = (next: Insertion) => {
    if (next.index !== null && sentiment) finish(sentiment, next.index);
    else setIns(next);
  };

  const top = Math.max(insets.top, Platform.OS === "web" ? 12 : 0) + 2;
  const showCards = phase === "rate" || phase === "compare";

  let body: ReactNode;
  if (status === "loading") {
    body = (
      <BeliCard testID="rank-loading" style={{ padding: 20, gap: 10 }}>
        <Skeleton style={{ width: "60%", height: 14, borderRadius: 7 }} />
        <Skeleton style={{ width: "40%", height: 10, borderRadius: 5 }} />
      </BeliCard>
    );
  } else if (status === "error") {
    body = <BeliCard><ErrorState testID="rank-error" body={error ?? "Check your connection and try again."} onRetry={retry} /></BeliCard>;
  } else if (!place) {
    body = (
      <View style={{ marginTop: 40 }}>
        <EmptyState testID="rank-missing" icon="trophy-outline" title="Spot not found" body={`We couldn't find this spot in ${city?.name ?? "this city"}. Pick a spot from a list to rank it.`} cta="Back" onCta={close} />
      </View>
    );
  } else {
    const cost = costOf(place);
    const sub = [cost.dollars, place.kind ?? categoryInfo(place.category).label].filter(Boolean).join(" | ");
    const m = ins ? probe(ins) : null;
    const against = m !== null ? bucket[m] : null;
    body = showCards ? (
      <>
        <HeaderCard testID="rank-header" title={place.name} sub={sub} onClose={close} />
        <HowWasIt value={sentiment} onPick={pick} />
        {phase === "compare" && ins && against ? (
          <CompareCard
            a={{ key: "new", name: place.name, sub: place.hood ?? city?.name ?? null }}
            b={{ key: "old", name: against.name, sub: against.hood ?? (against.city === city?.slug ? city?.name ?? null : null) }}
            onPick={(k) => step(answer(ins, k === "new"))}
            onUndo={() => setIns(undo(ins))}
            onTooTough={() => step(tooTough(ins))}
            onSkip={() => step(skip(ins))}
            canUndo={ins.history.length > 0}
          />
        ) : null}
      </>
    ) : null;
  }

  return (
    <View style={styles.root} testID="rank-screen">
      <Stack.Screen options={{ contentStyle: { backgroundColor: "transparent" } }} />
      {showCards || status !== "ready" || !place ? <Pressable accessibilityLabel="Close" testID="rank-scrim" style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }]} onPress={close} /> : (
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={close} />
      )}
      <View style={{ paddingTop: top }} pointerEvents="box-none">
        {body}
      </View>
      {!online && showCards ? <View style={styles.offline}><OfflineBanner /></View> : null}
      <Toast text={toast} onHide={close} top={top + 18} />
      <BeliModal
        testID="first-rank-modal"
        open={phase === "first"}
        icon="checkmark-circle-outline"
        title="Wooo! You ranked your first spot!"
        body="Every spot you rank finds its place on your list. Rank a few more and your favorites rise to the top."
        cta="Let's rank another!"
        onCta={() => router.replace("/rankings")}
        secondary="Close"
        onSecondary={close}
        onClose={close}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "transparent" },
  offline: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
