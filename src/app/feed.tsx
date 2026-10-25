// Community tab. The fixed top copies Beli's feed (social/beli/yt_GlMma4eXe18_t160 and t174):
// serif wordmark at the left with three icons at the right, the #EBEBED search field, the
// filled chips row (selected #134456, others #9DB3B7). Posts copy Beli's feed post
// (appstore_03_feed_post_ranked_share.png), likes Strava kudos (appstore_02 / appstore_06),
// "Do this day" DoorDash's Reorder pill (appstore2026_05). The "Post your first day" card
// copies Beli's invite card (t160). Loading = Instagram skeleton, error = TikTok tap to retry,
// offline = Spotify's bar (drawn by the tab bar), empty = Beli's empty card.
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShareSheet } from "@/components/ShareSheet";
import { CapsHeader, FilledChip, HeaderIcon, InviteCard, SearchField, WordmarkHeader } from "@/components/social/controls";
import { stopPlaces, type DayPost } from "@/components/social/dayPost";
import { FeedPost, FeedSkeleton } from "@/components/social/FeedPost";
import { doThisDay, facesFor, useCommunityPosts, useMyPosts } from "@/components/social/useDays";
import { EmptyState, ErrorState, SampleTag, T, Toast } from "@/components/ui";
import { shareUrl } from "@/lib/links";
import { useCity } from "@/state/city";
import { actions, useStore } from "@/state/store";

type Tab = "top" | "new" | "saved";
type Row = { key: string; kind: "caps"; title: string } | { key: string; kind: "post"; post: DayPost; index: number } | { key: string; kind: "invite" } | { key: string; kind: "empty-saved" } | { key: string; kind: "sample" };

export default function Feed() {
  const { city, status, error, retry } = useCity();
  const community = useCommunityPosts(city);
  const mine = useMyPosts(city);
  const likes = useStore((s) => s.likes);
  const doneDays = useStore((s) => s.doneDays);
  const savedDays = useStore((s) => s.savedDays);
  const [tab, setTab] = useState<Tab>("top");
  const [share, setShare] = useState<DayPost | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const all = useMemo(() => [...mine, ...(community ?? [])], [mine, community]);
  const rows = useMemo<Row[]>(() => {
    if (!community) return [];
    const out: Row[] = [];
    let i = 0;
    // Your posted days lead the feed; with none yet, the popular days come first and the
    // "post your first day" card sits after the first two.
    if (tab !== "saved" && mine.length) {
      out.push({ key: "caps-mine", kind: "caps", title: "YOUR DAYS" });
      for (const p of mine) out.push({ key: p.id, kind: "post", post: p, index: i++ });
    }
    const list = tab === "new" ? [...community].sort((a, b) => b.at.getTime() - a.at.getTime() || (b.doneCount ?? 0) - (a.doneCount ?? 0))
      : tab === "saved" ? community.filter((p) => savedDays.includes(p.id))
      : community;
    out.push({ key: "caps-community", kind: "caps", title: tab === "new" ? "NEWEST DAYS" : tab === "saved" ? "SAVED DAYS" : "MOST-DONE DAYS THIS WEEK" });
    out.push({ key: "sample", kind: "sample" });
    if (!list.length && tab === "saved") out.push({ key: "empty-saved", kind: "empty-saved" });
    list.forEach((p, k) => {
      out.push({ key: p.id, kind: "post", post: p, index: i++ });
      if (k === 1 && tab !== "saved" && !mine.length) out.push({ key: "invite", kind: "invite" });
    });
    if (list.length < 2 && tab !== "saved" && !mine.length) out.push({ key: "invite", kind: "invite" });
    return out;
  }, [community, mine, tab, savedDays]);

  const shareImage = share && city ? stopPlaces(share.plan, city).find((p) => p.image)?.image ?? null : null;

  const body = () => {
    if (status === "error") return <View style={{ paddingTop: 40 }}><ErrorState title="Couldn't load the feed. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} testID="feed-error" /></View>;
    if (status === "loading" || !city || !community) return <FeedSkeleton />;
    if (!community.length && !mine.length) {
      return (
        <View style={{ paddingTop: 24 }}>
          <EmptyState testID="feed-empty" icon="people-outline" title="No days here yet" body={`Nobody has posted a day in ${city.name} yet. Plan one and be the first.`} cta="Plan a day" onCta={() => router.push("/builder")} />
        </View>
      );
    }
    return (
      <FlatList
        testID="feed-list"
        data={rows}
        keyExtractor={(r) => r.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          if (item.kind === "caps") return <CapsHeader title={item.title} />;
          if (item.kind === "sample") {
            return (
              <View style={styles.sample} testID="feed-sample-note">
                <SampleTag text="Sample people" />
                <T v="caption" style={{ flex: 1 }}>Real spots and quotes. People and counts are placeholders for now.</T>
              </View>
            );
          }
          if (item.kind === "invite") {
            return <View style={{ paddingVertical: 20 }}><InviteCard testID="feed-invite" title="Your days show up here" body="Finish a day, rate the stops and post it so others can copy it." cta="Plan a day" onPress={() => router.push("/builder")} /></View>;
          }
          if (item.kind === "empty-saved") {
            return <EmptyState testID="feed-saved-empty" icon="bookmark-outline" title="No saved days" body="Tap the bookmark on any day to keep it here for later." cta="See popular days" onCta={() => setTab("top")} />;
          }
          const p = item.post;
          return (
            <FeedPost
              testID={`post-${item.index}`}
              post={p}
              city={city}
              faces={facesFor(p, all, item.index)}
              state={{ liked: likes.includes(p.id), saved: p.kind === "mine" || savedDays.includes(p.id), done: doneDays.includes(p.id) }}
              handlers={{
                onLike: () => actions.toggleLike(p.id),
                onShare: () => setShare(p),
                onDo: () => doThisDay(p, city),
                onSave: () => {
                  if (p.kind === "mine") { router.push("/saved?tab=days"); return; }
                  setToast(savedDays.includes(p.id) ? "Removed from saved days" : "Saved to your days");
                  actions.toggleSaveDay(p.id);
                },
                onOpen: () => router.push(`/day/${encodeURIComponent(p.id)}`),
              }}
            />
          );
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]} testID="feed-screen">
      <WordmarkHeader
        right={
          <>
            <HeaderIcon testID="feed-your-days" icon="calendar-outline" label="Your days" onPress={() => router.push("/saved?tab=days")} />
            <HeaderIcon testID="feed-leaderboard" icon="trophy-outline" label="Leaderboard" onPress={() => router.push("/rankings?tab=leaderboard")} />
            <HeaderIcon testID="feed-menu" icon="menu-outline" label="Settings" onPress={() => router.push("/settings")} />
          </>
        }
      />
      <SearchField testID="feed-search" placeholder="Search a spot, a day or a hood" onPress={() => router.push("/search")} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips}>
        <FilledChip testID="feed-tab-top" label="Trending" icon="trending-up" on={tab === "top"} onPress={() => setTab("top")} />
        <FilledChip testID="feed-tab-new" label="Newest" icon="time-outline" on={tab === "new"} onPress={() => setTab("new")} />
        <FilledChip testID="feed-tab-saved" label="Saved" icon="bookmark-outline" on={tab === "saved"} onPress={() => setTab("saved")} />
      </ScrollView>
      <View style={styles.hairline} />
      <View style={{ flex: 1 }}>{body()}</View>
      {share ? (
        <ShareSheet
          open
          onClose={() => setShare(null)}
          title="Share this day"
          subtitle="Friends can open it and copy it, no app needed."
          url={shareUrl(`/day/${encodeURIComponent(share.id)}`)}
          cardTitle={share.plan.title}
          image={shareImage}
          message={`${share.plan.title}, ${share.plan.stops.length} stops on Faves`}
        />
      ) : null}
      <Toast text={toast} onHide={() => setToast(null)} top={110} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  chips: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 10, gap: 8 },
  hairline: { height: 1, backgroundColor: "#F4F5F8" },
  sample: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingBottom: 6 },
});
