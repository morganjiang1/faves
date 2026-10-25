// A spot's clip (muted, looping, playing only while `active`) or, for a spot with no clip,
// its photo in the same frame so rows never look broken. Clips are bundled assets listed in
// src/data/videos.ts (scripts/make-video-index.mjs). expo-video plays them on iPhone and on
// the web (a muted, inline <video>).
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { CLIPS, type SpotClip } from "@/data/videos";
import type { Place } from "@/data/types";
import { font, palette } from "@/theme/tokens";
import { PlaceImage, UserDisc } from "../ui";
import { VIDEO_FILL } from "./fill";

export const clipFor = (placeId: string | null | undefined): SpotClip | null => (placeId ? CLIPS[placeId] ?? null : null);

function ClipPlayer({ clip, playing }: { clip: SpotClip; playing: boolean }) {
  const player = useVideoPlayer(clip.video, (p) => {
    p.loop = true;
    p.muted = true;
    // Start on the clip's best frame (the poster), not a dark or empty first second.
    if (clip.startAt) p.currentTime = clip.startAt;
  });
  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);
  // On the iPhone a video view is black until its first frame: keep the poster showing until
  // then. (On the web a <video> is see-through until it has a frame.)
  const [shown, setShown] = useState(Platform.OS === "web");
  return (
    <VideoView
      player={player}
      style={[VIDEO_FILL, { opacity: shown ? 1 : 0 }]}
      onFirstFrameRender={() => setShown(true)}
      contentFit="cover"
      nativeControls={false}
      allowsPictureInPicture={false}
      playsInline
      pointerEvents="none"
    />
  );
}

export function SpotMedia({ place, active, style, radius = 0, credit = true, onPress, testID, children, fallbackUri }: {
  place: Pick<Place, "id" | "image" | "category" | "name"> | null;
  active: boolean;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  credit?: boolean;
  onPress?: () => void;
  testID?: string;
  children?: ReactNode; // overlays (rank, name, score)
  fallbackUri?: string | null;
}) {
  const clip = clipFor(place?.id);
  // Poster first, then the spot's photo, then the designed card (PlaceImage): never blank.
  const [posterFailed, setPosterFailed] = useState(false);
  // With onPress, the Pressable carries the size and the frame fills it.
  const body = (
    <View style={[styles.frame, { borderRadius: radius }, onPress ? styles.fillParent : style]} testID={onPress ? undefined : testID}>
      {clip?.poster != null && !posterFailed ? (
        <Image testID="spot-poster" source={clip.poster} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => setPosterFailed(true)} />
      ) : (
        <PlaceImage uri={fallbackUri ?? place?.image} category={place?.category ?? "views"} style={StyleSheet.absoluteFill} emojiSize={36} />
      )}
      {/* Only the clips on screen get a player at all, so a long Home stays light. */}
      {clip && active ? <ClipPlayer clip={clip} playing={active} /> : null}
      {children}
      {credit && clip?.creator ? (
        <View style={styles.credit} pointerEvents="none">
          <UserDisc name={clip.creator.replace(/^@/, "")} size={14} />
          <Text style={styles.creditText} numberOfLines={1}>{clip.creator}</Text>
        </View>
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={place ? `Watch ${place.name}` : "Watch"} onPress={onPress} style={({ pressed }) => [style, pressed ? { opacity: 0.9 } : null]}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden", backgroundColor: palette.paperDeep },
  fillParent: { width: "100%", height: "100%" },
  credit: { position: "absolute", left: 8, bottom: 8, flexDirection: "row", alignItems: "center", gap: 3, maxWidth: "85%" },
  creditText: { fontFamily: font.sans, color: "#fff", fontSize: 11, fontWeight: "600", textShadowColor: "rgba(0,0,0,0.6)", textShadowRadius: 3 },
});

