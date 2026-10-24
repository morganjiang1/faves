// A stop's clip beside its info in a day or itinerary list. Copies YouTube's playlist row
// thumbnail (video/youtube/appstore_05_playlist_rows_thumb_duration.jpg) cropped to the 2:3
// Shorts shape at YouTube's 75 pt height: 50 x 75 pt, radius 7, the length badge bottom right
// (17.5 pt, black 80%, white 11 pt semibold) and a 3.4 pt watched bar in the brand color.
// It plays muted while on screen; tapping it opens the full-screen viewer at that stop.
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { Place } from "@/data/types";
import { color, font } from "@/theme/tokens";
import { SpotMedia, clipFor } from "./SpotMedia";
import { useOnScreen } from "./viewport";

export function StopClip({ place, reel, width = 50, height = 75, radius = 7, watched = false, testID }: { place: Place; reel: string; width?: number; height?: number; radius?: number; watched?: boolean; testID?: string }) {
  const seen = useOnScreen();
  const clip = clipFor(place.id);
  return (
    <View ref={seen.ref as never} onLayout={seen.onLayout} collapsable={false}>
      <SpotMedia testID={testID} place={place} active={seen.visible} radius={radius} credit={false} style={{ width, height }} onPress={() => router.push(reel as never)}>
        {clip?.seconds ? (
          <View style={styles.badge} pointerEvents="none"><Text style={styles.badgeText}>0:{String(clip.seconds).padStart(2, "0")}</Text></View>
        ) : null}
        {watched ? <View style={styles.watched} pointerEvents="none" /> : null}
      </SpotMedia>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", right: 4, bottom: 4, height: 17.5, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.8)", paddingHorizontal: 4, justifyContent: "center" },
  badgeText: { fontFamily: font.sans, color: "#fff", fontSize: 11, fontWeight: "600" },
  watched: { position: "absolute", left: 0, right: 0, bottom: 0, height: 3.4, backgroundColor: color.brand },
});
