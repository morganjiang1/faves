// Group vote on a plan, copied from Partiful:
// - plans/partiful/appstore_10_find_a_time_poll_responses.png: the purple gradient header
//   (navy #010039 at the top glowing to #7E00F7 behind the cards), "‹ title •••" nav, the
//   horizontally scrolling option cards (one row per stop: the planned place and its Plan B
//   places), then "Responses / 🏆 Most Popular" and the response rows on the deep purple body;
// - plans/partiful/ios_video_rsvp_sheet_going_maybe_cant.png (+ _dark): the vote sheet;
// - plans/partiful/ios_video_invite_share_link_dark.png: the invite block when nobody has
//   voted yet, and appstore_04_share_link_sheet.png (our ShareSheet) for the link.
// Routes: /group/new?plan=<planId> makes a group from a plan; /group/<id>?d=<payload> opens an
// invite (or votes sent back) on any device and merges it; /group/demo is the demo group.
// No backend: the poll travels in the link (src/lib/group.ts). With Supabase keys set, votes
// also sync live through src/lib/adapters/supabase.ts.
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { DEMO_VOTERS, ensureDemoGroup } from "@/components/group/demo";
import { OptionRow, type OptionInfo } from "@/components/group/OptionRow";
import { InviteBlock, Responses, type ResponseRow } from "@/components/group/Responses";
import { RsvpSheet } from "@/components/group/RsvpSheet";
import { DEMO_ID } from "@/components/recap/demo";
import { useCityFor } from "@/components/recap/useCityFor";
import { ShareSheet } from "@/components/ShareSheet";
import { EmptyState, ErrorState, Icon, OfflineBanner, Skeleton, SkeletonRows, TextButton, Toast } from "@/components/ui";
import { pullVotes, pushVotes, votesSyncOn } from "@/lib/adapters/supabase";
import { decodeGroup, encodeGroup, groupFromPlan, leader, mergeGroups, optionsByStop, placeIdOf, stopIndexOf, type Vote } from "@/lib/group";
import { shareUrl } from "@/lib/links";
import { newId, swapStop } from "@/lib/planner";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, getState, groupActions, useStore, type Group } from "@/state/store";
import { color, font, palette } from "@/theme/tokens";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;
const VOTE_WORD: Record<Vote, string> = { going: "Going", maybe: "Maybe", cant: "Can't" };

export default function GroupScreen() {
  const params = useLocalSearchParams<{ id: string; d?: string; plan?: string }>();
  const id = decodeURIComponent(one(params.id) ?? "");
  const payload = one(params.d);
  const planParam = one(params.plan);
  const groups = useStore((s) => s.groups);
  const allMeta = useStore((s) => s.groupMeta);
  const plans = useStore((s) => s.plans);
  const me = useStore((s) => s.profile.name);
  const here = useCity();
  const online = useOnline();
  const insets = useSafeAreaInsets();

  const link = useMemo(() => (payload ? decodeGroup(payload) : null), [payload]);
  const group: Group | null = groups[id] ?? null;
  const meta = allMeta[id];
  const newPlan = id === "new" && planParam ? plans[decodeURIComponent(planParam)] ?? null : null;
  const citySlug = link?.city ?? meta?.city ?? newPlan?.citySlug ?? (group ? plans[group.planId]?.citySlug : null) ?? (id === DEMO_ID ? here.city?.slug : null) ?? null;
  const { city, status, error, retry } = useCityFor(citySlug);

  const [voteKey, setVoteKey] = useState<string | null>(null);
  const [share, setShare] = useState<"invite" | "back" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // An invite link (or votes sent back): merge it in, then drop the payload from the URL so a
  // reload can't replay old votes over newer ones.
  useEffect(() => {
    if (!payload || !link) return;
    const local = getState().groups[link.group.id];
    actions.saveGroup(local ? mergeGroups(local, link.group) : link.group);
    const prev = getState().groupMeta[link.group.id];
    groupActions.setGroupMeta(link.group.id, { city: link.city, names: { ...link.names, ...(prev?.names ?? {}) }, mine: prev?.mine ?? Boolean(getState().plans[link.group.planId]) });
    router.replace(`/group/${encodeURIComponent(link.group.id)}`);
  }, [payload, link]);

  // /group/new?plan=<id>: one group per plan; reuse yours if it exists.
  useEffect(() => {
    if (id !== "new" || !newPlan || !city) return;
    const s = getState();
    const existing = Object.values(s.groups).find((g) => g.planId === newPlan.id && s.groupMeta[g.id]?.mine);
    if (existing) { router.replace(`/group/${encodeURIComponent(existing.id)}`); return; }
    const names = Object.fromEntries(newPlan.stops.flatMap((x) => [x.placeId, ...x.planB]).map((pid) => [pid, city.byId.get(pid)?.name ?? ""]));
    const gid = newId("g");
    const made = groupFromPlan(newPlan, s.profile.name || "Host", names, gid);
    actions.saveGroup(made.group);
    groupActions.setGroupMeta(gid, { city: made.city, names: made.names, mine: true });
    router.replace(`/group/${encodeURIComponent(gid)}`);
  }, [id, newPlan, city]);

  useEffect(() => { if (id === DEMO_ID && city && !getState().groups[DEMO_ID]) ensureDemoGroup(city); }, [id, city]);

  // Live votes when Supabase is set up.
  useEffect(() => {
    if (!votesSyncOn || !group) return;
    let live = true;
    pullVotes(group.id).then((votes) => {
      const cur = getState().groups[group.id];
      if (live && votes && cur) actions.saveGroup(mergeGroups(cur, { ...cur, votes }));
    });
    return () => { live = false; };
  }, [group?.id]);

  const rows = useMemo(() => (group ? optionsByStop(group) : []), [group]);

  // ---- states -----------------------------------------------------------------------
  if (payload && !link) {
    return (
      <SafeAreaView style={styles.center} testID="group-broken">
        <ErrorState title="This invite link is broken. Ask for a new one." body="Part of the link may be missing. Copy the whole link and open it again." />
        <View style={{ alignItems: "center" }}><TextButton testID="group-broken-home" label="Go to Faves" tint={color.brand} onPress={() => router.replace("/")} /></View>
      </SafeAreaView>
    );
  }
  if (status === "error" && (group || newPlan)) {
    return (
      <SafeAreaView style={styles.center} testID="group-error">
        <ErrorState body={error ?? "Couldn't load the spots for this vote."} onRetry={retry} />
      </SafeAreaView>
    );
  }
  if (id === "new" && !newPlan) {
    return (
      <SafeAreaView style={styles.center} testID="group-no-plan">
        <EmptyState icon="people-outline" title="No plan to vote on" body="Make a plan first, then tap Vote with friends on it." cta="Plan a day" onCta={() => router.replace("/builder")} />
      </SafeAreaView>
    );
  }
  if (payload || id === "new" || (id === DEMO_ID && !group) || (group && status === "loading")) return <Loading />;
  if (!group) {
    return (
      <SafeAreaView style={styles.center} testID="group-missing">
        <EmptyState icon="people-outline" title="Vote not found" body="This vote isn't on this phone. Ask whoever made the plan to send the invite link again." cta="Plan a day" onCta={() => router.replace("/builder")} />
      </SafeAreaView>
    );
  }
  // ---- data -------------------------------------------------------------------------
  const names = meta?.names ?? {};
  const info = (placeId: string): OptionInfo => {
    const p = city?.byId.get(placeId);
    return p ? { name: p.name, sub: p.kind ?? p.hood } : { name: names[placeId] || "A spot", sub: null };
  };
  const plan = plans[group.planId];
  const isHost = meta?.mine ?? Boolean(plan);
  const myName = me.trim();
  const mine = myName ? group.votes[myName] : undefined;
  const isDemo = group.id === DEMO_ID;
  const encoded = () => encodeGroup({ group, city: citySlug ?? "", names: { ...names, ...Object.fromEntries(group.options.map((o) => [o.placeId, info(o.placeId).name])) } });
  const linkUrl = () => shareUrl(`/group/${encodeURIComponent(group.id)}?d=${encoded()}`);

  const responses: ResponseRow[] = Object.entries(group.votes)
    .map(([name, votes]) => ({
      name,
      votes,
      me: name === myName,
      test: isDemo && DEMO_VOTERS.includes(name),
      picks: (["going", "maybe", "cant"] as Vote[])
        .map((v) => {
          const keys = Object.entries(votes).filter(([, x]) => x === v).map(([k]) => info(placeIdOf(k)).name);
          return keys.length ? `${VOTE_WORD[v]}: ${keys.join(", ")}` : null;
        })
        .filter(Boolean)
        .join(" · "),
    }))
    .sort((a, b) => Number(b.me) - Number(a.me) || Object.values(b.votes).filter((v) => v === "going").length - Object.values(a.votes).filter((v) => v === "going").length);

  const vote = (key: string, v: Vote, name: string) => {
    if (name !== myName) actions.updateProfile({ name });
    // A new name carries your earlier votes over to it.
    const before = group.votes[name] ?? (name !== myName && myName ? group.votes[myName] : undefined) ?? {};
    const row = { ...before, [key]: v };
    const votes = { ...group.votes, [name]: row };
    if (name !== myName && myName && group.votes[myName]) delete votes[myName];
    actions.saveGroup({ ...group, votes });
    if (votesSyncOn) pushVotes(group.id, name, row);
    setVoteKey(null);
    setToast(`${VOTE_WORD[v]}: ${info(placeIdOf(key)).name}`);
  };

  const applyPick = (key: string, quiet = false): boolean => {
    const cur = getState().plans[group.planId];
    if (!cur || !city) { setToast("The plan isn't on this phone."); return false; }
    const i = stopIndexOf(key), placeId = placeIdOf(key);
    if (!cur.stops[i]) return false;
    const next = cur.stops[i].placeId === placeId ? cur : swapStop(cur, city, i, placeId);
    actions.savePlan(next);
    const g = getState().groups[group.id] ?? group;
    actions.saveGroup({ ...g, picked: [...g.picked.filter((k) => stopIndexOf(k) !== i), key] });
    if (!quiet) setToast(`Picked ${info(placeId).name} for stop ${i + 1}`);
    return true;
  };

  const pickWinners = () => {
    let n = 0;
    for (const r of rows) {
      const voted = r.options.some((o) => Object.values(group.votes).some((row) => row[o.key]));
      const win = voted ? leader(group, r.options) : null;
      if (win && applyPick(win, true)) n += 1;
    }
    setToast(n ? `Picked the top spot for ${n} ${n === 1 ? "stop" : "stops"}` : "No votes yet. Share the link first.");
  };

  const sheetOpt = voteKey ? group.options.find((o) => o.key === voteKey) : null;
  const top = Math.max(insets.top, 12);

  return (
    <View style={styles.root} testID="group-screen">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <LinearGradient colors={[color.partifulNight, color.partifulDeep, color.partifulPurple]} locations={[0, 0.45, 1]} style={{ paddingTop: top, paddingBottom: 26 }}>
          <View style={styles.nav}>
            <Pressable testID="group-back" accessibilityRole="button" accessibilityLabel="Back" hitSlop={10} onPress={() => (router.canGoBack() ? router.back() : router.replace(plan ? `/plan/${encodeURIComponent(plan.id)}` : "/"))}>
              <Icon name="chevron-back" size={28} tint="#fff" />
            </Pressable>
            <Text style={styles.navTitle} numberOfLines={1}>Vote on the day</Text>
            <Pressable testID="group-invite" accessibilityRole="button" accessibilityLabel="Invite friends" hitSlop={10} onPress={() => setShare("invite")}>
              <Icon name="share-outline" size={24} tint="#fff" />
            </Pressable>
          </View>
          <Text style={styles.planTitle} numberOfLines={2}>{group.title}</Text>
          <Text style={styles.host}>Hosted by {group.host}{isHost ? " (you)" : ""} · tap a card to vote</Text>
          {rows.map((r) => (
            <OptionRow key={r.stop} testID={`group-row-${r.stop}`} group={group} stop={r.stop} label={r.label} options={r.options} info={info} onOpen={setVoteKey} />
          ))}
        </LinearGradient>
        <LinearGradient colors={["#23008E", "#3B0190", "#7E018B"]} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 1 }} style={{ minHeight: 420 }}>
          {responses.length ? (
            <>
              <Responses rows={responses} onEditMine={() => setVoteKey(rows[0]?.options[0]?.key ?? null)} />
              {responses.length < 2 && isHost ? <InviteBlock onShare={() => setShare("invite")} title="Get more votes" /> : null}
            </>
          ) : (
            <InviteBlock onShare={() => setShare("invite")} />
          )}
        </LinearGradient>
      </ScrollView>

      {!online ? <OfflineBanner /> : null}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {isHost ? (
          <>
            {responses.length ? <Pressable testID="group-pick-winners" accessibilityRole="button" onPress={pickWinners} style={({ pressed }) => [styles.white, pressed && { opacity: 0.85 }]}>
              <Text style={styles.whiteLabel}>Pick the winners</Text>
            </Pressable> : null}
            {plan ? <Pressable testID="group-back-to-plan" accessibilityRole="button" hitSlop={8} onPress={() => router.replace(`/plan/${encodeURIComponent(plan.id)}`)} style={{ alignSelf: "center", marginTop: 12 }}>
              <Text style={styles.link}>Back to the plan</Text>
            </Pressable> : null}
          </>
        ) : mine ? (
          <Pressable testID="group-send-back" accessibilityRole="button" onPress={() => setShare("back")} style={({ pressed }) => [styles.white, pressed && { opacity: 0.85 }]}>
            <Icon name="paper-plane" size={18} tint={palette.ink} />
            <Text style={styles.whiteLabel}>Send my votes back</Text>
          </Pressable>
        ) : (
          <Text style={styles.hint}>Tap a card above to vote. Then send your votes back to {group.host}.</Text>
        )}
      </View>

      <RsvpSheet
        open={Boolean(sheetOpt)}
        title={sheetOpt ? info(sheetOpt.placeId).name : ""}
        sub={sheetOpt ? `Stop ${stopIndexOf(sheetOpt.key) + 1} · ${sheetOpt.label}` : null}
        current={sheetOpt && myName ? group.votes[myName]?.[sheetOpt.key] ?? null : null}
        name={myName}
        isHost={isHost}
        picked={sheetOpt ? group.picked.includes(sheetOpt.key) : false}
        onClose={() => setVoteKey(null)}
        onSubmit={(v, name) => sheetOpt && vote(sheetOpt.key, v, name)}
        onPick={sheetOpt ? () => { applyPick(sheetOpt.key); setVoteKey(null); } : undefined}
      />
      {share ? (
        <ShareSheet
          open
          onClose={() => setShare(null)}
          title={share === "invite" ? "Share Link" : "Send your votes"}
          subtitle={share === "invite" ? "Anyone with the link can vote" : `Send this to ${group.host} so your votes count`}
          url={linkUrl()}
          cardTitle={share === "invite" ? `Vote on ${group.title}` : `${myName || "My"} votes for ${group.title}`}
          image={city?.byId.get(group.options[0]?.placeId ?? "")?.image ?? null}
          category={city?.byId.get(group.options[0]?.placeId ?? "")?.category ?? "views"}
          message={share === "invite" ? `Help pick our day: ${group.title}` : `My votes for ${group.title}`}
        />
      ) : null}
      <Toast text={toast} onHide={() => setToast(null)} top={top + 6} />
    </View>
  );
}

function Loading() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} testID="group-loading">
      <View style={{ padding: 16, gap: 12 }}>
        <Skeleton style={{ width: "50%", height: 22, borderRadius: 8 }} />
        <Skeleton style={{ height: 117, borderRadius: 6 }} />
      </View>
      <SkeletonRows rows={3} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.partifulNight },
  center: { flex: 1, justifyContent: "center", backgroundColor: palette.paper },
  nav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, height: 48 },
  navTitle: { flex: 1, textAlign: "center", fontFamily: font.sans, color: "#fff", fontSize: 20, fontWeight: "600", marginHorizontal: 12 },
  planTitle: { fontFamily: font.sans, color: "#fff", fontSize: 15, fontWeight: "600", textAlign: "center", marginTop: 2, paddingHorizontal: 24 },
  host: { fontFamily: font.sans, color: "rgba(255,255,255,0.65)", fontSize: 13, textAlign: "center", marginTop: 3 },
  footer: { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#140045" },
  white: { height: 47, borderRadius: 3, backgroundColor: "#FEFCFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  whiteLabel: { fontFamily: font.sans, color: palette.ink, fontSize: 17, fontWeight: "600" },
  link: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "600", textDecorationLine: "underline" },
  hint: { fontFamily: font.sans, color: "rgba(255,255,255,0.75)", fontSize: 15, textAlign: "center", paddingVertical: 8 },
});
