// A stop's clip beside its info in a day or itinerary list (a compact 9:16 tile that plays
// muted while on screen); tapping it opens the full-screen swipe viewer at that stop.
import { router } from "expo-router";
import { View } from "react-native";
import type { Place } from "@/data/types";
import { SpotMedia } from "./SpotMedia";
import { useOnScreen } from "./viewport";

export function StopClip({ place, reel, width = 72, height = 128, radius = 8, testID }: { place: Place; reel: string; width?: number; height?: number; radius?: number; testID?: string }) {
  const seen = useOnScreen();
  return (
    <View ref={seen.ref as never} onLayout={seen.onLayout} collapsable={false}>
      <SpotMedia testID={testID} place={place} active={seen.visible} radius={radius} credit={false} style={{ width, height }} onPress={() => router.push(reel as never)} />
    </View>
  );
}
