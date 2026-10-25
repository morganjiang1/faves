// Profile. Copies Beli's own profile (social/beli/yt_GlMma4eXe18_t192_profile_new_user.png for
// the order: name + menu, centered 96 pt avatar with a 1 pt #D3D3D3 ring, @handle, "Member
// since", outlined "Edit profile" / "Share profile" (33 pt, radius 5), the stats trio) with the
// measured values of social/beli/appstore_06_profile_stats.png (43 pt rows with bold label +
// bold count + chevron, 2-up stat cards radius 12 with a teal icon, grey label and teal bold
// value), then Beli's iPad "Recent Activity" tab (discovery/beli/beli_appstore_ipad_profile_
// activity.png). Works from saved data, so offline it keeps working (the tab bar shows
// Spotify's offline bar).
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShareSheet } from "@/components/ShareSheet";
import { UnderlineTabs } from "@/components/social/controls";
import { copiedFrom, monthYear, postDate } from "@/components/social/dayPost";
import { DaysDiary } from "@/components/social/Diary";
import { OutlineButton, ProfileRow, Stat, StatCard } from "@/components/social/ProfileParts";
import { rankScores, SENTIMENT_TINT } from "@/components/social/rankScore";
import { weekendStreak } from "@/components/social/streak";
import { Avatar, Icon, SampleTag, ScoreBadge, type IconName } from "@/components/ui";
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
  const streak = weekendStreak(plans, todayISO);
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
        <Text style={styles.navName} numberOfLines={1} accessibilityRole="header">{profile.name || "Your profile"}</Text>
        <View style={{ flexDirection: "row", gap: 20 }}>
          <Pressable testID="profile-share-icon" accessibilityRole="button" accessibilityLabel="Share profile" hitSlop={8} onPress={() => setShare(true)}><Icon name="share-outline" size={25} tint={palette.ink} /></Pressable>
          <Pressable testID="profile-menu" accessibilityRole="button" accessibilityLabel="Settings" hitSlop={8} onPress={() => router.push("/settings")}><Icon name="menu-outline" size={28} tint={palette.ink} /></Pressable>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }} testID="profile-scroll">
        <View style={styles.center}>
          <Avatar name={profile.name || "You"} size={96} />
          <Text style={styles.handle}>@{handle}</Text>
          <Text style={styles.since}>Member since {monthYear(profile.memberSince)}</Text>
          {interests.length ? <Text style={styles.interests} numberOfLines={2}>{interests.map((c) => `${c.emoji} ${c.short[0].toUpperCase()}${c.short.slice(1)}`).join("  ·  ")}</Text> : null}
          <View style={styles.buttons}>
            <OutlineButton testID="profile-edit" label="Edit profile" onPress={() => router.push("/settings")} />
            <OutlineButton testID="profile-share" label="Share profile" onPress={() => setShare(true)} />
          </View>
        </View>
        <View style={styles.stats}>
          <Stat testID="stat-days" value={String(daysDone)} label="Days done" onPress={() => router.push("/saved?tab=days")} />
          <Stat testID="stat-saved" value={String(saved.length)} label="Saved" onPress={() => router.push("/saved?tab=spots")} />
          <Stat testID="stat-ranked" value={String(rankings.length)} label="Ranked" onPress={() => router.push("/rankings")} />
        </View>

        <View style={styles.rows}>
          <ProfileRow testID="row-days" icon="calendar-outline" label="Your days" value={String(plans.length)} onPress={() => router.push("/saved?tab=days")} />
          <ProfileRow testID="row-saved" icon="bookmark" label="Want to try" value={String(saved.length)} onPress={() => router.push("/saved?tab=spots")} />
          <ProfileRow testID="row-rankings" icon="trophy-outline" label="Your rankings" value={String(rankings.length)} onPress={() => router.push("/rankings")} />
          <ProfileRow testID="row-wallet" icon="wallet-outline" label="Spot rewards" value={money(cash)} onPress={() => router.push("/wallet")} />
          <ProfileRow testID="row-plus" icon="diamond-outline" label="Faves Plus" value={plus.active ? "Member" : "Try it"} onPress={() => router.push("/plus")} />
          <ProfileRow testID="row-settings" icon="settings-outline" label="Settings" onPress={() => router.push("/settings")} last />
        </View>

        <View style={styles.cards}>
          <StatCard testID="card-rewards" icon="cash-outline" label="Spot rewards" value={money(cash)} onPress={() => router.push("/wallet")} tag={testWallet ? <SampleTag text="Test data" /> : null} />
          <StatCard testID="card-streak" icon="flame" label="Weekend streak" value={`${streak} ${streak === 1 ? "weekend" : "weekends"}`} onPress={() => router.push("/saved?tab=days")} />
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
              <Text style={styles.emptyBody}>Plan a day, rank a spot or post a day and it shows up here.</Text>
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
            <Text style={styles.emptyBody}>Your planned and finished days show up here like a diary.</Text>
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

// Beli's activity row: avatar, "**You** ranked **La Giostra**", grey place line, score circle
// at the right, grey date.
function ActivityRow({ a, name, testID }: { a: Activity; name: string; testID: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={`You ${a.verb} ${a.name}`} onPress={a.onPress} style={({ pressed }) => [styles.activity, pressed && { backgroundColor: palette.paperDeep }]}>
      <Avatar name={name} size={44} />
      <View style={{ flex: 1 }}>
        <Text style={styles.actText}><Text style={{ fontWeight: "700" }}>You</Text> {a.verb} <Text style={{ fontWeight: "700" }}>{a.name}</Text></Text>
        {a.sub ? <Text style={styles.actSub} numberOfLines={1}>{a.sub}</Text> : null}
        <Text style={styles.actDate}>{postDate(new Date(a.at))}</Text>
      </View>
      {a.score ? <ScoreBadge score={a.score.value} tint={a.score.tint} size={40} /> : <View style={styles.actIcon}><Icon name={a.icon === "post" ? "megaphone-outline" : "calendar-outline"} size={18} tint={color.brandDeep} /></View>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.paper },
  nav: { height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  navName: { fontFamily: font.sans, fontSize: 20, fontWeight: "700", color: palette.ink, flex: 1, marginRight: 12 },
  center: { alignItems: "center", paddingHorizontal: 20, paddingTop: 2 },
  handle: { fontFamily: font.sans, fontSize: 18, fontWeight: "700", color: color.text, marginTop: 12 },
  since: { fontFamily: font.sans, fontSize: 16, color: color.textMuted, marginTop: 3 },
  interests: { fontFamily: font.sans, fontSize: 15, color: palette.ink, marginTop: 6, textAlign: "center" },
  buttons: { flexDirection: "row", gap: 5, marginTop: 12, width: 245 },
  stats: { flexDirection: "row", paddingHorizontal: 16, marginTop: 22, marginBottom: 18 },
  rows: { borderTopWidth: 1, borderTopColor: palette.line, borderBottomWidth: 1, borderBottomColor: palette.line },
  cards: { flexDirection: "row", gap: 10, paddingHorizontal: 12, marginTop: 18 },
  activity: { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: color.divider },
  actText: { fontFamily: font.sans, fontSize: 16, lineHeight: 21, color: palette.ink },
  actSub: { fontFamily: font.sans, fontSize: 14, color: color.textMuted, marginTop: 2 },
  actDate: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 6 },
  actIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: color.border, alignItems: "center", justifyContent: "center" },
  emptyActivity: { alignItems: "center", paddingHorizontal: 32, paddingVertical: 28 },
  emptyTitle: { fontFamily: font.serif, fontSize: 20, color: color.text },
  emptyBody: { fontFamily: font.sans, fontSize: 15, color: color.emptyBody, textAlign: "center", marginTop: 6 },
  emptyCta: { marginTop: 14, height: 40, borderRadius: 20, backgroundColor: color.brand, paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  emptyCtaText: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "600" },
});
