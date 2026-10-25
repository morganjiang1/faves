// You: a Faves passport (your initial as a stamp, name, handle, what you're into) with your
// days, saved spots and rankings as passport stamps (each opens its list), one list of the
// rest (popular days, spot rewards, Faves Plus, settings), and your recent activity. Works
// from saved data offline. A stats row of days, saved and ranked is inspired by Beli's profile.
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShareSheet } from "@/components/ShareSheet";
import { UnderlineTabs } from "@/components/social/controls";
import { copiedFrom, monthYear, postDate } from "@/components/social/dayPost";
import { DaysDiary } from "@/components/social/Diary";
import { ProfileRow, Stat } from "@/components/social/ProfileParts";
import { rankScores, SENTIMENT_TINT } from "@/components/social/rankScore";
import { Avatar, Icon, ScoreBadge, type IconName } from "@/components/ui";
import type { Plan } from "@/lib/planner";
import { balance, money } from "@/lib/rewards";
import { shareUrl } from "@/lib/links";
import { cityClock } from "@/lib/time";
import { useCity } from "@/state/city";
import { useStore } from "@/state/store";
import { CATEGORIES, color, font, palette } from "@/theme/tokens";

type Activity = { key: string; at: string; icon: "rank" | "post" | "plan"; verb: string; name: string; sub: string; score?: { value: string; tint: string }; onPress: () => void };

export default function Profile() {
  const { city } = useCity();
  const profile = useStore((s) => s.profile);
  const planOrder = useStore((s) => s.planOrder);
  const plansById = useStore((s) => s.plans);
  const saved = useStore((s) => s.saved);
  const rankings = useStore((s) => s.rankings);
  const posts = useStore((s) => s.posts);
  const wallet = useStore((s) => s.wallet);
  const plus = useStore((s) => s.plus);
  const recaps = useStore((s) => s.recaps);
  const [tab, setTab] = useState<"activity" | "days">("activity");
  const [share, setShare] = useState(false);

  const plans = useMemo(() => planOrder.map((id) => plansById[id]).filter((p): p is Plan => Boolean(p)), [planOrder, plansById]);
  const todayISO = cityClock(city?.utcOffset ?? -8).wall.toISOString().slice(0, 10);
  const daysDone = plans.filter((p) => p.dateISO <= todayISO).length;
  const cash = balance(wallet);
  const testWallet = wallet.entries.length > 0 && wallet.entries.every((e) => e.id.startsWith("test-"));
  const interests = CATEGORIES.filter((c) => profile.interests.includes(c.id));
  const handle = profile.handle || "you";

  const activity = useMemo<Activity[]>(() => {
    const scores = rankScores(rankings);
    const out: Activity[] = [];
    for (const r of rankings) {
      const v = scores.get(r.placeId);
      out.push({ key: `r-${r.placeId}`, at: r.at, icon: "rank", verb: "ranked", name: r.name, sub: [r.hood, r.kind].filter(Boolean).join(" · "), score: v != null ? { value: v.toFixed(1), tint: SENTIMENT_TINT[r.sentiment] } : undefined, onPress: () => router.push(`/place/${encodeURIComponent(r.placeId)}`) });
    }
    for (const p of posts) out.push({ key: `p-${p.id}`, at: p.at, icon: "post", verb: "posted", name: p.title, sub: "Shared to the Community feed", onPress: () => router.push(`/day/${encodeURIComponent(p.id)}`) });
    for (const p of plans) out.push({ key: `d-${p.id}`, at: p.createdAt, icon: "plan", verb: copiedFrom(p) ? "copied" : "planned", name: p.title, sub: `${p.stops.length} stops · ${p.dayLabel}`, onPress: () => router.push(`/plan/${encodeURIComponent(p.id)}`) });
    return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 20);
  }, [rankings, posts, plans]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="profile-screen">
      <View style={styles.nav}>
        <Text style={styles.navName} numberOfLines={1} accessibilityRole="header">you</Text>
        <View style={{ flexDirection: "row", gap: 20 }}>
          <Pressable testID="profile-share-icon" accessibilityRole="button" accessibilityLabel="Share profile" hitSlop={8} onPress={() => setShare(true)}><Icon name="share-outline" size={25} tint={palette.ink} /></Pressable>
          <Pressable testID="profile-menu" accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8} onPress={() => router.push("/settings")}><Icon name="settings-outline" size={25} tint={palette.ink} /></Pressable>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }} testID="profile-scroll">
        <View style={styles.passport} testID="profile-passport">
          <View style={styles.passportTop}>
            <View style={styles.initial}><Text style={styles.initialText}>{(profile.name || "You").slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{profile.name || "You"}</Text>
              <Text style={styles.handle}>@{handle} <Text style={styles.since}>· since {monthYear(profile.memberSince)}</Text></Text>
            </View>
          </View>
          {interests.length ? (
            <View style={styles.chips}>{interests.map((c) => <View key={c.id} style={styles.chip}><Text style={styles.chipText}>{c.emoji} {c.short}</Text></View>)}</View>
          ) : null}
          <View style={styles.perf} />
          <View style={styles.stats}>
            <Stat testID="stat-days" value={String(daysDone)} label="days out" tilt={-6} onPress={() => router.push("/saved?tab=days")} />
            <Stat testID="stat-saved" value={String(saved.length)} label="saved" tilt={4} onPress={() => router.push("/saved?tab=spots")} />
            <Stat testID="stat-ranked" value={String(rankings.length)} label="ranked" tilt={-3} onPress={() => router.push("/rankings")} />
          </View>
        </View>

        <View style={styles.rows}>
          <ProfileRow testID="row-community" icon="flame-outline" label="Popular days" onPress={() => router.push("/feed")} />
          <ProfileRow testID="row-wallet" icon="wallet-outline" label="Spot rewards" value={testWallet ? `${money(cash)} test` : money(cash)} onPress={() => router.push("/wallet")} />
          <ProfileRow testID="row-plus" icon="diamond-outline" label="Faves Plus" value={plus.active ? "Member" : "Try it"} onPress={() => router.push("/plus")} />
          <ProfileRow testID="row-settings" icon="settings-outline" label="Settings" onPress={() => router.push("/settings")} last />
        </View>

        <View style={{ marginTop: 22 }}>
          <UnderlineTabs testID="profile-tabs" value={tab} onChange={setTab} options={[{ id: "activity", label: "Recent activity" }, { id: "days", label: "Your days" }]} />
        </View>
        {tab === "activity" ? (
          activity.length ? (
            <View testID="profile-activity">
              {activity.map((a, i) => <ActivityRow key={a.key} a={a} name={profile.name || "You"} testID={`activity-${i}`} />)}
            </View>
          ) : (
            <View style={styles.emptyActivity} testID="profile-activity-empty">
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Pressable testID="profile-plan" accessibilityRole="button" onPress={() => router.push("/builder")} style={styles.emptyCta}><Text style={styles.emptyCtaText}>Plan a day</Text></Pressable>
            </View>
          )
        ) : plans.length ? (
          <DaysDiary testID="profile-days" plans={plans} saved={[]} city={city} glyphsFor={(p) => {
            const g: { icon: IconName; tint?: string; label: string }[] = [];
            if (recaps[p.id]?.finishedAt) g.push({ icon: "thumbs-up", tint: color.score, label: "Rated" });
            if (posts.some((x) => x.planId === p.id)) g.push({ icon: "megaphone-outline", label: "Posted" });
            if (copiedFrom(p)) g.push({ icon: "repeat", label: "Copied from the feed" });
            return g;
          }} onOpenPlan={(p) => router.push(`/plan/${encodeURIComponent(p.id)}`)} onOpenSaved={(id) => router.push(`/day/${encodeURIComponent(id)}`)} />
        ) : (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyTitle}>No days yet</Text>
          </View>
        )}
      </ScrollView>
      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Share your profile"
        subtitle="Invite friends to plan days with you."
        url={shareUrl("/")}
        cardTitle={`@${handle} on Faves`}
        image={null}
        category={interests[0]?.id ?? "views"}
        message={`Plan days with me on Faves. I'm @${handle}.`}
      />
    </SafeAreaView>
  );
}

// An activity row: avatar, "**You** ranked **La Giostra**", the place line, a score circle, the date.
function ActivityRow({ a, name, testID }: { a: Activity; name: string; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`You ${a.verb} ${a.name}`} onPress={a.onPress} style={({ pressed }) => [styles.activity, pressed && { backgroundColor: palette.paperDeep }]}>
      <Avatar name={name} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={styles.actText}><Text style={{ fontWeight: "700" }}>You</Text> {a.verb} <Text style={{ fontWeight: "700" }}>{a.name}</Text></Text>
        {a.sub ? <Text style={styles.actSub} numberOfLines={1}>{a.sub}</Text> : null}
        <Text style={styles.actDate}>{postDate(new Date(a.at))}</Text>
      </View>
      {a.score ? <ScoreBadge score={a.score.value} tint={a.score.tint} size={40} /> : <View style={styles.actIcon}><Icon name={a.icon === "post" ? "megaphone-outline" : "calendar-outline"} size={18} tint={palette.roseInk} /></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  nav: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  navName: { fontFamily: font.displayHeavy, fontSize: 34, color: palette.ink, flex: 1, marginRight: 12, letterSpacing: -1 },
  passport: { marginHorizontal: 16, marginTop: 4, backgroundColor: palette.card, borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 16, shadowColor: palette.ink, shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  passportTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  initial: { width: 68, height: 68, borderRadius: 34, backgroundColor: palette.rose, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-6deg" }], borderWidth: 3, borderColor: palette.roseTint },
  initialText: { fontFamily: font.displayHeavy, fontSize: 32, color: palette.ink },
  name: { fontFamily: font.display, fontSize: 24, color: palette.ink },
  handle: { fontFamily: font.sans, fontSize: 15, fontWeight: "700", color: palette.roseInk, marginTop: 1 },
  since: { fontFamily: font.sans, fontSize: 13, fontWeight: "400", color: palette.inkMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: { backgroundColor: palette.paperDeep, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: palette.ink },
  perf: { borderTopWidth: 2, borderStyle: "dashed", borderColor: palette.line, marginVertical: 14, marginHorizontal: -16 },
  stats: { flexDirection: "row" },
  buttons: { flexDirection: "row", gap: 8, marginTop: 14 },
  rows: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: palette.line },
  cards: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 },
  activity: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: palette.line },
  actText: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: palette.ink },
  actSub: { fontFamily: font.sans, fontSize: 14, color: palette.inkMuted, marginTop: 2 },
  actDate: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 6 },
  actIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  emptyActivity: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 28 },
  emptyTitle: { fontFamily: font.display, fontSize: 20, color: palette.ink },
  emptyBody: { fontFamily: font.sans, fontSize: 15, color: palette.inkSoft, textAlign: "center", marginTop: 6 },
  emptyCta: { marginTop: 14, height: 42, borderRadius: 14, backgroundColor: palette.roseInk, paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  emptyCtaText: { fontFamily: font.sans, color: palette.cream, fontSize: 16, fontWeight: "800" },
});
