// Spot Moments viewer (full screen; ?tab=highlights|now&i=<index>). Copies Instagram's story
// viewer (references/moments/instagram/appstore_07_story_viewer_close_friends.png): #0C0F14
// background, 9:16 media under the status bar, a 2 pt progress segment per clip (6.7 pt
// insets), avatar + name + "2h" with "•••" and an 18 pt ✕, tap the left third for back and the
// right third for next, and the 280 x 45 pt reply pill with a heart and send under the media.
// For Right now, the name slot shows the place and the time after it, the way Snap's place
// stories do (references/moments/snapchat/yt_4Q-gjHtttGQ_t030_place_story_header_5m_ago.png).
// Own clips carry BeReal's "Taken here" pill
// (references/moments/bereal/yt_KXVIqgEsm64_t012_post_location_pill_3h_late.png). No clips:
// BeReal's empty feed (references/moments/bereal/yt_FMZgxjwSkfo_t020_empty_feed_take_your_bereal.png).
// TikTok clips play in TikTok's official embed player, credited to the creator.
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clipSeconds, clipsFor, shortAgo, tiktokVideoUrl, type MomentTab } from "@/components/moments/clips";
import { DarkError, DarkMessage, MomentMenu, OwnClip, ProgressSegments, ReplyBar, TakenHerePill, VIEWER_BG } from "@/components/moments/parts";
import { TikTokPlayer } from "@/components/moments/TikTokPlayer";
import { ShareSheet } from "@/components/ShareSheet";
import { Avatar, Icon, LoadingPill, OfflineBanner, PlaceImage, Toast } from "@/components/ui";
import { openUrl, shareUrl } from "@/lib/links";
import { useCity } from "@/state/city";
import { useOnline } from "@/state/device";
import { actions, momentsMoneyActions, useStore } from "@/state/store";
import { font } from "@/theme/tokens";

// Header band over TikTok clips, so TikTok's own player header stays visible under ours.
const BAND = 84;

export default function MomentsViewer() {
  const params = useLocalSearchParams<{ id: string; tab?: string; i?: string }>();
  const placeId = decodeURIComponent(String(params.id));
  const tab: MomentTab = params.tab === "now" ? "now" : "highlights";
  const { city, status, error, retry } = useCity();
  const mine = useStore((s) => s.moments[placeId]);
  const hidden = useStore((s) => s.hidden);
  const likedIds = useStore((s) => s.likedMoments);
  const me = useStore((s) => s.profile.name);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const [box, setBox] = useState({ w: 390, h: 844 });

  const place = city?.byId.get(placeId) ?? null;
  const clips = useMemo(() => (place ? clipsFor(place, mine ?? [], hidden, tab) : []), [place, mine, hidden, tab]);
  const [index, setIndex] = useState(() => Math.max(0, Number(params.i) || 0));
  const idx = Math.min(index, Math.max(0, clips.length - 1));
  const clip = clips[idx] ?? null;

  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [round, setRound] = useState(0);
  const [paused, setPaused] = useState(false);
  const [menu, setMenu] = useState(false);
  const [share, setShare] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const done = useRef(0);
  const held = useRef(false);

  useEffect(() => {
    const sub = progress.addListener(({ value }) => { done.current = value; });
    return () => progress.removeListener(sub);
  }, [progress]);

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace(`/place/${encodeURIComponent(placeId)}`)), [placeId]);
  const next = useCallback(() => { if (idx < clips.length - 1) setIndex(idx + 1); else close(); }, [idx, clips.length, close]);
  const prev = useCallback(() => { if (idx > 0) setIndex(idx - 1); else { progress.setValue(0); setRound((r) => r + 1); } }, [idx, progress]);

  // New clip: reset the bar and wait for the media to load.
  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    setReady(false);
    setFailed(false);
  }, [clip?.id, clip?.source, attempt, progress]);

  // Players that never report back still advance after a few seconds.
  useEffect(() => {
    if (ready || !clip) return;
    const t = setTimeout(() => setReady(true), clip.source === "tiktok" && online ? 6000 : 1500);
    return () => clearTimeout(t);
  }, [ready, clip, online]);

  // Auto-advance after the clip's duration (Moment.duration, default 12 s); pause while held,
  // while the menu or share sheet is open, or when the clip failed.
  useEffect(() => {
    if (!clip || !ready || paused || menu || share || failed) { progress.stopAnimation(); return; }
    const total = clipSeconds(clip) * 1000;
    const anim = Animated.timing(progress, { toValue: 1, duration: Math.max(200, total * (1 - done.current)), easing: Easing.linear, useNativeDriver: false });
    anim.start(({ finished }) => { if (finished) next(); });
    return () => anim.stop();
  }, [clip, ready, paused, menu, share, failed, round, next, progress]);

  // Arrow keys and Escape on the web.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, close]);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  const top = insets.top;
  const replyH = 45 + 24 + Math.max(insets.bottom, 10);
  const mediaH = Math.min(Math.round((box.w * 16) / 9), box.h - top - replyH);

  const shell = (children: ReactNode, testID: string) => (
    <View style={[styles.screen, { paddingTop: top }]} testID={testID}>
      <View style={styles.bareTop}>
        <View style={{ width: 40 }} />
        <Text style={styles.bareTitle} numberOfLines={1}>{place?.name ?? "Spot Moments"}</Text>
        <Pressable testID="moments-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={close} style={{ width: 40, alignItems: "flex-end" }}>
          <Icon name="close" size={30} tint="#fff" />
        </Pressable>
      </View>
      <View style={{ flex: 1, justifyContent: "center", paddingBottom: 60 }}>{children}</View>
      {!online ? <OfflineBanner /> : null}
    </View>
  );

  if (status === "loading") return shell(<LoadingPill text="Loading moments" />, "moments-loading");
  if (status === "error") return shell(<DarkError title="Couldn't load this spot. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} />, "moments-error");
  if (!place) return shell(<DarkMessage testID="moments-missing" title="Spot not found" body="This spot isn't in the city you have open. Switch cities and try again." cta="Back" onCta={close} />, "moments-missing-screen");
  if (!clip) {
    return shell(
      <DarkMessage
        testID="moments-empty"
        title="It's really calm in here!"
        body={tab === "now" ? `No one has posted from ${place.name} in the last few hours. Be the first one.` : `No one has posted a moment from ${place.name} yet. Be the first one.`}
        cta="Post the first moment"
        onCta={() => router.push(`/post-moment/${encodeURIComponent(place.id)}`)}
      />,
      "moments-empty-screen",
    );
  }

  const isTikTok = clip.source === "tiktok";
  const liked = likedIds.includes(clip.id);
  const name = tab === "now" ? place.name : isTikTok ? clip.creator : clip.creator || me || "you";
  const when = shortAgo(clip.postedAt);
  const videoLink = tiktokVideoUrl(clip.creator, clip.id);

  return (
    <View style={[styles.screen, { paddingTop: top }]} testID="moments-viewer" onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={[styles.media, { height: mediaH }]}>
        {isTikTok ? (
          online && !failed ? (
            <View style={[StyleSheet.absoluteFill, { top: BAND }]}>
              <TikTokPlayer key={`${clip.id}-${attempt}`} id={clip.id} onReady={onReady} onError={onError} />
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, { top: BAND }]}>
              {clip.cover ?? place.image ? <Image source={{ uri: (clip.cover ?? place.image)! }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              <View style={[StyleSheet.absoluteFill, styles.dim]}>
                {online ? (
                  <DarkError title="Couldn't play this clip. Tap to retry." body="TikTok didn't load it. You can also watch it on TikTok." onRetry={() => setAttempt((a) => a + 1)} />
                ) : (
                  <DarkMessage testID="moment-offline" title="You're offline" body="TikTok clips play when you're back online. Clips posted on Faves still play." />
                )}
              </View>
            </View>
          )
        ) : failed ? (
          <View style={[StyleSheet.absoluteFill, styles.dim]}>
            <DarkError title="Couldn't open this clip. Tap to retry." body="The file may have been removed from this phone." onRetry={() => setAttempt((a) => a + 1)} />
          </View>
        ) : (
          <OwnClip key={`${clip.id}-${attempt}`} moment={clip} paused={paused || menu || share} onReady={onReady} onError={onError} />
        )}

        {isTikTok ? null : <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0)"]} style={styles.topShade} />}
        <ProgressSegments count={clips.length} index={idx} progress={progress} />

        {/* Tap zones: left third back, right third next; the middle stays free for the player. */}
        <Pressable testID="moment-prev" accessibilityRole="button" accessibilityLabel="Previous moment" onPress={prev} onLongPress={() => { held.current = true; setPaused(true); }} onPressOut={() => { if (held.current) { held.current = false; setPaused(false); } }} style={[styles.zone, { left: 0 }]} />
        <Pressable testID="moment-next" accessibilityRole="button" accessibilityLabel="Next moment" onPress={next} onLongPress={() => { held.current = true; setPaused(true); }} onPressOut={() => { if (held.current) { held.current = false; setPaused(false); } }} style={[styles.zone, { right: 0 }]} />
        {!isTikTok ? <Pressable testID="moment-pause" accessibilityRole="button" accessibilityLabel={paused ? "Play" : "Pause"} onPress={() => setPaused((p) => !p)} style={[styles.zone, { left: "33.4%", width: "33.2%" }]} /> : null}

        <View style={styles.header}>
          {tab === "now" ? (
            <View style={styles.placeAvatar}><PlaceImage uri={place.image} category={place.category} style={{ width: 32, height: 32, borderRadius: 16 }} emojiSize={16} /></View>
          ) : isTikTok ? (
            <View style={styles.tiktokAvatar}><Icon name="logo-tiktok" size={16} tint="#fff" /></View>
          ) : (
            <Avatar name={me || clip.creator || "You"} size={32} />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
              {when ? <Text style={styles.when}>{`  ${when}`}</Text> : null}
            </Text>
          </View>
          <Pressable testID="moment-more" accessibilityRole="button" accessibilityLabel="More" hitSlop={10} onPress={() => setMenu(true)}>
            <Icon name="ellipsis-horizontal" size={22} tint="#fff" />
          </Pressable>
          <Pressable testID="moments-close" accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} onPress={close}>
            <Icon name="close-outline" size={36} tint="#fff" />
          </Pressable>
        </View>

        {isTikTok ? (
          <View style={styles.creditRow}>
            <Text style={styles.credit} numberOfLines={1}>{`Video by @${clip.creator} on TikTok`}</Text>
            <Pressable testID="moment-open-tiktok-link" accessibilityRole="link" accessibilityLabel="Open in TikTok" hitSlop={8} onPress={() => openUrl(videoLink)} style={styles.creditPill}>
              <Text style={styles.creditLink}>Open in TikTok</Text>
              <Icon name="open-outline" size={13} tint="#fff" />
            </Pressable>
          </View>
        ) : null}

        {!isTikTok ? (
          <View style={styles.bottom} pointerEvents="none">
            <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)"]} style={StyleSheet.absoluteFill} />
            {clip.caption ? <Text style={styles.caption} numberOfLines={3}>{clip.caption}</Text> : null}
            {clip.demo ? <TakenHerePill place={place.name} demo /> : clip.takenHere ? <TakenHerePill place={place.name} /> : null}
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1, justifyContent: "center", paddingBottom: Math.max(insets.bottom, 10) }}>
        <ReplyBar liked={liked} onLike={() => momentsMoneyActions.toggleMomentLike(clip.id)} onSend={() => setShare(true)} />
      </View>
      {!online ? <OfflineBanner /> : null}

      <MomentMenu
        open={menu}
        onClose={() => setMenu(false)}
        onReport={() => { setMenu(false); actions.hideMoment(clip.id); setToast("Reported. It's hidden while we review it."); }}
        onHide={() => { setMenu(false); actions.hideMoment(clip.id); setToast("Hidden. You won't see this moment again."); }}
        onOpenTikTok={isTikTok ? () => { setMenu(false); openUrl(videoLink); } : undefined}
      />
      <ShareSheet open={share} onClose={() => setShare(false)} subtitle="Send this spot and its moments to a friend" url={shareUrl(`/place/${encodeURIComponent(place.id)}`)} cardTitle={place.name} image={place.image} category={place.category} message={`Look at ${place.name} on Faves`} />
      <Toast text={toast} onHide={() => setToast(null)} top={top + 60} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0C0F14" },
  media: { width: "100%", backgroundColor: "#0C0F14", overflow: "hidden" },
  dim: { backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center" },
  topShade: { position: "absolute", top: 0, left: 0, right: 0, height: 110 },
  zone: { position: "absolute", top: BAND, bottom: 76, width: "33.3%" },
  header: { position: "absolute", top: 18, left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 4 },
  placeAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  tiktokAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.sans, color: "#fff", fontSize: 15, fontWeight: "600" },
  when: { fontWeight: "400", color: "rgba(255,255,255,0.72)" },
  creditRow: { position: "absolute", top: 54, left: 12, right: 12, height: 24, flexDirection: "row", alignItems: "center", gap: 10, zIndex: 4 },
  credit: { flexShrink: 1, fontFamily: font.sans, color: "rgba(255,255,255,0.82)", fontSize: 13 },
  creditPill: { height: 24, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.16)", paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 4 },
  creditLink: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: "#fff" },
  bottom: { position: "absolute", left: 0, right: 0, bottom: 0, paddingTop: 50, paddingBottom: 22, paddingHorizontal: 20, gap: 10, alignItems: "center" },
  caption: { fontFamily: font.sans, color: "#fff", fontSize: 16, fontWeight: "700", textAlign: "center" },
  bareTop: { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  bareTitle: { flex: 1, textAlign: "center", fontFamily: font.sans, color: "#fff", fontSize: 18, fontWeight: "700" },
});
