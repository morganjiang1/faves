// Spot Moments parts. Each copies a measured reference (docs/design_references.md, "Spot
// Moments" sections and the Element map at the end of the moments catalog):
// - TakenHerePill: BeReal location pill (moments/bereal/yt_KXVIqgEsm64_t012_post_location_pill_3h_late.png)
// - DarkMessage: BeReal empty feed (moments/bereal/yt_FMZgxjwSkfo_t020_empty_feed_take_your_bereal.png)
// - DarkError: TikTok "No internet connection. Tap to retry." (states/tiktok/yt_spo0PbcgeOo_t004_no_internet_tap_to_retry.png)
// - OwnClip: the user's own clip, played with expo-video (video) or expo-image (photo)
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Moment } from "@/data/types";
import { font } from "@/theme/tokens";
import { Icon } from "../ui";
import { resolveClip } from "./clipFile";

// BeReal's location pill: fully rounded, about 30 pt, #18181C on dark, arrow glyph + bold label.
export function TakenHerePill({ place, demo, light, testID }: { place: string; demo?: boolean; light?: boolean; testID?: string }) {
  return (
    <View testID={testID ?? (demo ? "demo-pill" : "taken-here-pill")} style={[styles.pill, light && styles.pillLight]}>
      <Icon name={demo ? "flask" : "navigate"} size={13} tint={light ? "#222427" : "#fff"} />
      <Text style={[styles.pillText, light && { color: "#222427" }]} numberOfLines={1}>{demo ? "Demo, not verified" : `Taken here · ${place}`}</Text>
    </View>
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
  pill: { alignSelf: "center", height: 30, borderRadius: 15, backgroundColor: "#18181C", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 13, maxWidth: "92%" },
  pillLight: { backgroundColor: "#EBE8EC" },
  pillText: { fontFamily: font.sans, color: "#fff", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  message: { alignItems: "center", paddingHorizontal: 32, gap: 6 },
  messageTitle: { fontFamily: font.sans, fontSize: 19, fontWeight: "700", color: "#fff", textAlign: "center" },
  messageBody: { fontFamily: font.sans, fontSize: 15, lineHeight: 20, color: "#8E8E93", textAlign: "center" },
  messageButton: { marginTop: 18, height: 40, borderRadius: 11, backgroundColor: "#fff", paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  messageButtonText: { fontFamily: font.sans, fontSize: 15, fontWeight: "600", color: "#000" },
});
