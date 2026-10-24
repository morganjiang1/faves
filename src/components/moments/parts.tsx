// Spot Moments parts. Each copies a measured reference (docs/design_references.md, "Spot
// Moments" sections and the Element map at the end of the moments catalog):
// - ProgressSegments, ReplyBar, MomentMenu: Instagram story viewer
//   (moments/instagram/appstore_07_story_viewer_close_friends.png)
// - TakenHerePill: BeReal location pill (moments/bereal/yt_KXVIqgEsm64_t012_post_location_pill_3h_late.png)
// - DarkMessage: BeReal empty feed (moments/bereal/yt_FMZgxjwSkfo_t020_empty_feed_take_your_bereal.png)
// - DarkError: TikTok "No internet connection. Tap to retry." (states/tiktok/yt_spo0PbcgeOo_t004_no_internet_tap_to_retry.png)
// - OwnClip: the user's own clip, played with expo-video (video) or expo-image (photo)
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { Moment } from "@/data/types";
import { font } from "@/theme/tokens";
import { Icon } from "../ui";
import { resolveClip } from "./clipFile";

export const VIEWER_BG = "#0C0F14"; // Instagram's dark story background

// 2 pt bar, 6.7 pt side insets, one segment per clip with thin gaps; played #F9F9F9, unplayed
// white at 50%.
export function ProgressSegments({ count, index, progress }: { count: number; index: number; progress: Animated.Value }) {
  return (
    <View style={styles.segments} pointerEvents="none" testID="moment-progress">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.segment}>
          {i < index ? <View style={[StyleSheet.absoluteFill, styles.played]} /> : null}
          {i === index ? <Animated.View style={[styles.played, { position: "absolute", left: 0, top: 0, bottom: 0, width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }]} /> : null}
        </View>
      ))}
    </View>
  );
}

// BeReal's location pill: fully rounded, about 30 pt, #18181C on dark, arrow glyph + bold label.
export function TakenHerePill({ place, demo, light, testID }: { place: string; demo?: boolean; light?: boolean; testID?: string }) {
  return (
    <View testID={testID ?? (demo ? "demo-pill" : "taken-here-pill")} style={[styles.pill, light && styles.pillLight]}>
      <Icon name={demo ? "flask" : "navigate"} size={13} tint={light ? "#222427" : "#fff"} />
      <Text style={[styles.pillText, light && { color: "#222427" }]} numberOfLines={1}>{demo ? "Demo, not verified" : `Taken here · ${place}`}</Text>
    </View>
  );
}

// Instagram's reply bar under the media: 280 x 45 pt outlined pill (1 pt #4B4F52), placeholder
// #F8FAF9 about 17 pt, then a 24 pt heart and a 22.5 pt send icon.
export function ReplyBar({ liked, onLike, onSend, placeholder = "Send to a friend" }: { liked: boolean; onLike: () => void; onSend: () => void; placeholder?: string }) {
  return (
    <View style={styles.reply}>
      <Pressable testID="moment-reply" accessibilityRole="button" accessibilityLabel={placeholder} onPress={onSend} style={styles.replyPill}>
        <Text style={styles.replyText}>{placeholder}</Text>
      </Pressable>
      <Pressable testID="moment-like" accessibilityRole="button" accessibilityLabel={liked ? "Unlike" : "Like"} accessibilityState={{ selected: liked }} hitSlop={8} onPress={onLike}>
        <Icon name={liked ? "heart" : "heart-outline"} size={27} tint={liked ? "#FF3040" : "#fff"} />
      </Pressable>
      <Pressable testID="moment-send" accessibilityRole="button" accessibilityLabel="Share this spot" hitSlop={8} onPress={onSend}>
        <Icon name="paper-plane-outline" size={25} tint="#fff" />
      </Pressable>
    </View>
  );
}

// Instagram's white sheet card from the same frame (radius about 16, rows split by hairlines).
export function MomentMenu({ open, onClose, onReport, onHide, onOpenTikTok }: { open: boolean; onClose: () => void; onReport: () => void; onHide: () => void; onOpenTikTok?: () => void }) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.menuWrap}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.menu} testID="moment-menu">
          <Pressable testID="moment-report" accessibilityRole="button" onPress={onReport} style={styles.menuRow}><Text style={[styles.menuText, { color: "#ED4956", fontWeight: "700" }]}>Report</Text></Pressable>
          <Pressable testID="moment-hide" accessibilityRole="button" onPress={onHide} style={[styles.menuRow, styles.menuLine]}><Text style={styles.menuText}>Hide</Text></Pressable>
          {onOpenTikTok ? <Pressable testID="moment-open-tiktok" accessibilityRole="link" onPress={onOpenTikTok} style={[styles.menuRow, styles.menuLine]}><Text style={styles.menuText}>Open in TikTok</Text></Pressable> : null}
          <Pressable testID="moment-menu-cancel" accessibilityRole="button" onPress={onClose} style={[styles.menuRow, styles.menuLine]}><Text style={styles.menuText}>Cancel</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

// BeReal's empty feed: bold white line, grey line, white pill button, centered on black.
export function DarkMessage({ title, body, cta, onCta, testID }: { title: string; body: string; cta?: string; onCta?: () => void; testID?: string }) {
  return (
    <View testID={testID} style={styles.message}>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.messageBody}>{body}</Text>
      {cta && onCta ? (
        <Pressable testID={testID ? `${testID}-cta` : undefined} accessibilityRole="button" onPress={onCta} style={({ pressed }) => [styles.messageButton, pressed && { opacity: 0.85 }]}>
          <Text style={styles.messageButtonText}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// TikTok's error on its black feed: retry glyph, bold white line with the fix, grey helper;
// the whole block is the tap target.
export function DarkError({ title, body, onRetry, testID = "moment-error" }: { title: string; body: string; onRetry?: () => void; testID?: string }) {
  const inner = (
    <View style={styles.message}>
      <Icon name="refresh" size={44} tint="#fff" />
      <Text style={[styles.messageTitle, { fontSize: 17, marginTop: 14 }]}>{title}</Text>
      <Text style={styles.messageBody}>{body}</Text>
    </View>
  );
  return onRetry ? <Pressable testID={testID} accessibilityRole="button" onPress={onRetry}>{inner}</Pressable> : <View testID={testID}>{inner}</View>;
}

export function OwnClip({ moment, paused, onReady, onError }: { moment: Moment; paused: boolean; onReady: () => void; onError: () => void }) {
  const uri = resolveClip(moment.uri);
  useEffect(() => { if (!uri) onError(); }, [uri, onError]);
  if (!uri) return null;
  if (moment.kind === "video") return <OwnVideo uri={uri} paused={paused} onReady={onReady} onError={onError} />;
  return <Image testID="own-photo" source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" onLoad={onReady} onError={onError} />;
}

function OwnVideo({ uri, paused, onReady, onError }: { uri: string; paused: boolean; onReady: () => void; onError: () => void }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = false; p.play(); });
  useEffect(() => {
    const sub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") onReady();
      if (status === "error") onError();
    });
    return () => sub.remove();
  }, [player, onReady, onError]);
  useEffect(() => { if (paused) player.pause(); else player.play(); }, [paused, player]);
  return <VideoView testID="own-video" player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  segments: { position: "absolute", top: 8, left: 6.7, right: 6.7, flexDirection: "row", gap: 3, zIndex: 3 },
  segment: { flex: 1, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.5)", overflow: "hidden" },
  played: { backgroundColor: "#F9F9F9" },
  pill: { alignSelf: "center", height: 30, borderRadius: 15, backgroundColor: "#18181C", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, maxWidth: "92%" },
  pillLight: { backgroundColor: "#EBE8EC" },
  pillText: { fontFamily: font.sans, color: "#fff", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  reply: { flexDirection: "row", alignItems: "center", paddingLeft: 11, paddingRight: 18, gap: 20 },
  replyPill: { flex: 1, maxWidth: 280, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: "#4B4F52", justifyContent: "center", paddingHorizontal: 18 },
  replyText: { fontFamily: font.sans, fontSize: 16, color: "#F8FAF9" },
  menuWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 28 },
  menu: { width: "100%", maxWidth: 300, backgroundColor: "#fff", borderRadius: 16, overflow: "hidden" },
  menuRow: { height: 52, alignItems: "center", justifyContent: "center" },
  menuLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DBDBDB" },
  menuText: { fontFamily: font.sans, fontSize: 16, color: "#000" },
  message: { alignItems: "center", paddingHorizontal: 32, gap: 6 },
  messageTitle: { fontFamily: font.sans, fontSize: 19, fontWeight: "700", color: "#fff", textAlign: "center" },
  messageBody: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: "#8E8E93", textAlign: "center" },
  messageButton: { marginTop: 18, height: 40, borderRadius: 11, backgroundColor: "#fff", paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  messageButtonText: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: "#000" },
});
