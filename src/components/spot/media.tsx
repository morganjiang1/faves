// What fills one page of a spot's player: a clip (bundled with the app or posted on this phone),
// muted and looping while the page is on screen, or a photo with a slow zoom (spots without a
// clip). The poster sits underneath so a page is never blank while the clip loads.
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import type { Moment, Place } from "@/data/types";
import { OwnClip } from "../moments/parts";
import type { SpotPage } from "../moments/clips";
import { PlaceImage } from "../ui";

const NATIVE = Platform.OS !== "web";

function BundledClip({ video, playing, startAt = 0 }: { video: number; playing: boolean; startAt?: number }) {
  const player = useVideoPlayer(video, (p) => {
    p.loop = true;
    p.muted = true;
    if (startAt) p.currentTime = startAt;
  });
  useEffect(() => {
    if (playing) player.play();
    else player.pause();
  }, [playing, player]);
  return (
    <View testID="spot-clip" style={StyleSheet.absoluteFill} pointerEvents="none">
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} allowsPictureInPicture={false} playsInline pointerEvents="none" />
    </View>
  );
}

// A slow zoom that drifts a little to the side and back (9 s each way).
export function SlowZoom({ uri, category, active }: { uri: string | null; category: Place["category"]; active: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) { v.stopAnimation(); return; }
    const ease = Easing.inOut(Easing.quad);
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 9000, easing: ease, useNativeDriver: NATIVE }),
      Animated.timing(v, { toValue: 0, duration: 9000, easing: ease, useNativeDriver: NATIVE }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [active, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });
  return (
    <Animated.View testID="spot-photo" style={[StyleSheet.absoluteFill, { transform: [{ scale }, { translateX }] }]}>
      <PlaceImage uri={uri} category={category} style={StyleSheet.absoluteFill} emojiSize={72} />
    </Animated.View>
  );
}

export function PageMedia({ page, place, active, onFail }: { page: SpotPage; place: Place; active: boolean; onFail?: () => void }) {
  if (page.kind === "photo") return <SlowZoom uri={page.uri} category={place.category} active={active} />;
  const m: Moment = page.moment;
  if (m.asset) {
    return (
      <View style={StyleSheet.absoluteFill}>
        {m.asset.poster != null ? <Image source={m.asset.poster} style={StyleSheet.absoluteFill} contentFit="cover" /> : <PlaceImage uri={place.image} category={place.category} style={StyleSheet.absoluteFill} />}
        {active ? <BundledClip video={m.asset.video} playing={active} startAt={m.asset.startAt} /> : null}
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill}>
      <PlaceImage uri={place.image} category={place.category} style={StyleSheet.absoluteFill} />
      {active ? <OwnClip moment={m} paused={!active} onReady={noop} onError={onFail ?? noop} /> : null}
    </View>
  );
}

const noop = () => {};

// The tile image for a page in the Spot Moments grid.
export function PageThumb({ page, place }: { page: SpotPage; place: Place }) {
  if (page.kind === "photo") return <PlaceImage uri={page.uri} category={place.category} style={StyleSheet.absoluteFill} />;
  const m = page.moment;
  if (m.asset?.poster != null) return <Image source={m.asset.poster} style={StyleSheet.absoluteFill} contentFit="cover" />;
  if (m.uri && m.kind === "photo") return <PlaceImage uri={m.uri} category={place.category} style={StyleSheet.absoluteFill} />;
  return <PlaceImage uri={place.image} category={place.category} style={StyleSheet.absoluteFill} />;
}
