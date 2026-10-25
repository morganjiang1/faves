// The Community feed post. Anatomy is inspired by Beli's feed post (social/beli/
// appstore_03_feed_post_ranked_share.png, measured at 2.70 px/pt, and video t174): 60 pt
// avatar 14 pt from the edge, a sentence headline with bold names 22 pt to its right, grey
// meta lines with the category glyph and "↻", a 40 pt score circle at the top right, a
// horizontal row of 156 pt square photos (radius 7, gap 8, 21 pt inset) one per stop, a
// "Notes:" line, the counts row, the action row and the grey date over a 1 pt #F4F5F8 divider.
// Likes are inspired by Strava kudos (social/strava/appstore_02 + appstore_06): thumbs-up, facepile and
// "48 loved this day". "Do this day" is inspired by DoorDash's Reorder pill (social/doordash/
// appstore2026_05_order_it_again_reorder.png): 25 pt #F1F1F1 pill, bold 13 pt #181818 label.
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { City } from "@/data/types";
import { openUrl } from "@/lib/links";
import { scoreOutOf10 } from "@/lib/score";
import { color, font, palette } from "@/theme/tokens";
import { Avatar, Icon, PlaceImage, SampleTag, ScoreBadge, Skeleton } from "@/components/ui";
import { categoryGlyph, dayScore, mainCategory, mainHood, postDate, stopPlaces, withWhom, type DayPost } from "./dayPost";

const GREY = palette.inkMuted;

export function PostHeader({ post, city, done, testID }: { post: DayPost; city: City; done?: boolean; testID?: string }) {
  const score = dayScore(post.plan, city);
  const who = withWhom(post.plan.request.who, post.plan.groupSize, post.plan.title);
  const name = post.kind === "mine" ? "You" : post.author.name;
  return (
    <View style={styles.header} testID={testID}>
      <Avatar name={post.kind === "mine" ? post.author.name : post.author.name} size={60} />
      <View style={styles.headerText}>
        <Text style={styles.headline} accessibilityRole="header">
          <Text style={styles.bold}>{name}</Text> did <Text style={styles.bold}>{post.plan.title}</Text>{who ? ` ${who}` : ""}
        </Text>
        <View style={styles.metaRow}>
          <Icon name={categoryGlyph(mainCategory(post.plan, city))} size={15} tint={GREY} />
          <Text style={[styles.meta, { marginLeft: 5 }]} numberOfLines={1}>•  {mainHood(post.plan, city)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Icon name="repeat" size={15} tint={GREY} />
          <Text style={[styles.meta, { marginLeft: 5 }]} numberOfLines={1}>
            {post.doneCount != null ? `done by ${post.doneCount}${done ? ", you too" : ""}` : `${post.plan.stops.length} stops${done ? ", done again" : ""}`}
          </Text>
          {post.sample ? <View style={{ marginLeft: 8 }}><SampleTag /></View> : null}
        </View>
      </View>
      {score != null ? <ScoreBadge score={scoreOutOf10(score)} size={40} testID={testID ? `${testID}-score` : undefined} /> : <ScoreBadge score="-" muted size={40} />}
    </View>
  );
}

export function PhotoRow({ post, city, testID }: { post: DayPost; city: City; testID?: string }) {
  const places = stopPlaces(post.plan, city);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos} testID={testID}>
      {places.map((p, i) => (
        <Pressable key={`${p.id}-${i}`} testID={testID ? `${testID}-${i}` : undefined} accessibilityRole="button" accessibilityLabel={`Stop ${i + 1}: ${p.name}`} onPress={() => router.push(`/place/${encodeURIComponent(p.id)}`)}>
          <PlaceImage uri={p.image} category={p.category} style={styles.photo} emojiSize={44} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

// "Notes:" is the poster's own note, or a real scraped quote about one of the stops with
// its source (tap to open it). Nothing here is written by us.
export function NotesLine({ post, subreddit, testID }: { post: DayPost; subreddit: string; testID?: string }) {
  if (post.note) {
    return <Text style={styles.notes} testID={testID}><Text style={styles.notesLabel}>Notes: </Text>{post.note}</Text>;
  }
  const q = post.quote;
  if (!q) return null;
  const source = `r/${subreddit}`;
  return (
    <Pressable testID={testID} accessibilityRole="link" accessibilityLabel={`Quote from ${source} about ${q.placeName}`} onPress={() => openUrl(q.quote.url)}>
      <Text style={styles.notes} numberOfLines={4}>
        <Text style={styles.notesLabel}>Notes: </Text>“{q.quote.text}”<Text style={styles.source}>  {source} on {q.placeName}</Text>
      </Text>
    </Pressable>
  );
}

// Strava's facepile: overlapping round faces with a thin ring between them.
export function Facepile({ names, size = 22 }: { names: string[]; size?: number }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {names.map((n, i) => (
        <View key={`${n}-${i}`} style={{ marginLeft: i ? -2 : 0, borderRadius: size, borderWidth: 1.5, borderColor: palette.line, zIndex: names.length - i }}>
          <Avatar name={n} size={size} />
        </View>
      ))}
    </View>
  );
}

// Strava kudos line: thumbs-up, faces, "48 loved this day".
export function Kudos({ count, faces, liked, testID }: { count: number; faces: string[]; liked: boolean; testID?: string }) {
  const text = count === 0 ? "Be the first to love this day" : count === 1 && liked ? "You loved this day" : `${count} loved this day`;
  return (
    <View style={styles.kudos} testID={testID}>
      <Icon name={liked ? "thumbs-up" : "thumbs-up-outline"} size={16} tint={liked ? color.strava : "#323232"} />
      {count > 0 && faces.length ? <Facepile names={faces} /> : null}
      <Text style={styles.counts}>{text}</Text>
    </View>
  );
}

// DoorDash "Reorder" / "View receipt" pills.
export function ReorderPill({ label, onPress, testID, icon }: { label: string; onPress: () => void; testID?: string; icon?: Parameters<typeof Icon>[0]["name"] }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }} onPress={onPress} style={({ pressed }) => [styles.pill, pressed && { opacity: 0.7 }]}>
      {icon ? <Icon name={icon} size={13} tint={color.reorderText} /> : null}
      <Text style={styles.pillText}>{label}</Text>
    </Pressable>
  );
}

export interface PostState { liked: boolean; saved: boolean; done: boolean }
export interface PostHandlers { onLike: () => void; onShare: () => void; onDo: () => void; onSave: () => void; onOpen: () => void }

export function FeedPost({ post, city, state, faces, handlers, testID }: { post: DayPost; city: City; state: PostState; faces: string[]; handlers: PostHandlers; testID: string }) {
  const count = post.likes + (state.liked ? 1 : 0);
  return (
    <View style={styles.post} testID={testID}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${post.plan.title}`} onPress={handlers.onOpen} testID={`${testID}-open`}>
        <PostHeader post={post} city={city} done={state.done} testID={`${testID}-header`} />
      </Pressable>
      <PhotoRow post={post} city={city} testID={`${testID}-photo`} />
      <View style={styles.body}>
        <NotesLine post={post} subreddit={city.subreddit} testID={`${testID}-notes`} />
        <View style={styles.countsRow}>
          <Kudos count={count} faces={state.liked ? ["You", ...faces].slice(0, 3) : faces} liked={state.liked} testID={`${testID}-kudos`} />
          <Text style={styles.counts}>{post.plan.stops.length} stops</Text>
        </View>
        <View style={styles.actions}>
          <Pressable testID={`${testID}-like`} accessibilityRole="button" accessibilityLabel={state.liked ? "Unlike this day" : "Love this day"} accessibilityState={{ selected: state.liked }} hitSlop={8} onPress={handlers.onLike}>
            <Icon name={state.liked ? "thumbs-up" : "thumbs-up-outline"} size={26} tint={state.liked ? color.strava : "#000"} />
          </Pressable>
          <Pressable testID={`${testID}-share`} accessibilityRole="button" accessibilityLabel="Share this day" hitSlop={8} onPress={handlers.onShare} style={{ marginLeft: 12 }}>
            <Icon name="paper-plane-outline" size={25} tint={palette.ink} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <ReorderPill label={state.done ? "Do it again" : "Do this day"} onPress={handlers.onDo} testID={`${testID}-do`} />
          <View style={{ width: 8 }} />
          <ReorderPill label="See stops" onPress={handlers.onOpen} testID={`${testID}-stops`} />
          <Pressable testID={`${testID}-save`} accessibilityRole="button" accessibilityLabel={state.saved ? "Remove from saved days" : "Save this day"} accessibilityState={{ selected: state.saved }} hitSlop={8} onPress={handlers.onSave} style={{ marginLeft: 14 }}>
            <Icon name={state.saved ? "bookmark" : "bookmark-outline"} size={25} tint={state.saved ? color.brand : "#000"} />
          </Pressable>
        </View>
        <Text style={styles.date}>{postDate(post.at)}</Text>
      </View>
    </View>
  );
}

// Loading: Instagram's skeleton (states/instagram/yt_q2ASzVtL0YE_t089): a circle, round-ended
// bars, then the photo blocks, in the post's own layout.
export function FeedSkeleton({ posts = 2 }: { posts?: number }) {
  return (
    <View testID="feed-loading">
      {Array.from({ length: posts }, (_, i) => (
        <View key={i} style={[styles.post, { paddingBottom: 24 }]}>
          <View style={styles.header}>
            <Skeleton style={{ width: 60, height: 60, borderRadius: 30 }} />
            <View style={[styles.headerText, { gap: 10, paddingTop: 6 }]}>
              <Skeleton style={{ width: "80%", height: 12, borderRadius: 6 }} />
              <Skeleton style={{ width: "95%", height: 10, borderRadius: 5 }} />
              <Skeleton style={{ width: "50%", height: 10, borderRadius: 5 }} />
            </View>
          </View>
          <View style={[styles.photos, { flexDirection: "row" }]}>
            <Skeleton style={styles.photo} />
            <Skeleton style={styles.photo} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  post: { borderBottomWidth: 1, borderBottomColor: color.divider, paddingTop: 16, backgroundColor: palette.card },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14 },
  headerText: { flex: 1, marginLeft: 22, marginRight: 10, paddingTop: 4 },
  headline: { fontFamily: font.sans, fontSize: 17, lineHeight: 23, color: palette.ink },
  bold: { fontWeight: "600" },
  notesLabel: { fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  meta: { fontFamily: font.sans, fontSize: 15, lineHeight: 19, color: GREY, flexShrink: 1 },
  photos: { paddingHorizontal: 21, gap: 8, marginTop: 18 },
  photo: { width: 156, height: 156, borderRadius: 7 },
  body: { paddingHorizontal: 21 },
  notes: { fontFamily: font.sans, fontSize: 16, lineHeight: 20, color: palette.ink, marginTop: 26 },
  source: { color: GREY, fontSize: 14 },
  countsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 },
  kudos: { flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 1 },
  counts: { fontFamily: font.sans, fontSize: 14, color: palette.ink },
  actions: { flexDirection: "row", alignItems: "center", marginTop: 12, minHeight: 30 },
  pill: { height: 25, borderRadius: 13, backgroundColor: color.reorderPill, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4 },
  pillText: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: color.reorderText },
  date: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 20, marginBottom: 12 },
});
