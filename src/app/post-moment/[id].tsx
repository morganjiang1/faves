// Post a Spot Moment from the spot (full-screen modal).
// - Gate: your phone must be within 150 m of the place while it's open (components/moments/gate.ts).
//   Demo mode (settings.demoHere) lets anyone post, stamped "Demo, not verified".
// - Blocked: BeReal's "Share to view" card (references/moments/bereal/appstore_05_share_to_view_post_a_bereal.png):
//   blurred photo card (radius 16.4), eye-slash icon, bold title, one line, white 117 x 35 pt
//   button (radius 11), on black with BeReal's header (⌄ close in a 45 pt #101012 circle, wordmark).
// - Location off: TikTok's settings prompt (references/moments/tiktok/press_01_poi_page_favorite_write_review.png):
//   white card, bold title, how-to line, a mini Settings row, "Cancel" / "Open settings".
// - Camera: BeReal's camera (references/moments/bereal/yt_FMZgxjwSkfo_t030_camera_photo_video_shutter.png):
//   3:4 rounded viewfinder, flash and flip on its bottom corners, "1x" chip, VIDEO / PHOTO bold caps
//   (selected #DEE532), 77.6 pt ring shutter 75 pt above the bottom. While recording the disc turns
//   TikTok's record red (references/moments/tiktok/appstore_05_camera_record_button.png, 15 s max).
// - Preview: BeReal's post preview (references/moments/bereal/yt_FMZgxjwSkfo_t062_post_preview_location_on_send.png):
//   "Add a caption..." above the photo, chips on its bottom edge, a big "SEND ▸".
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { keepClip } from "@/components/moments/clipFile";
import { distanceText, POST_RADIUS_M, postingGate, type Gate } from "@/components/moments/gate";
import { DarkError, DarkMessage, TakenHerePill } from "@/components/moments/parts";
import { Icon, LoadingPill, OfflineBanner, Toast } from "@/components/ui";
import type { Moment, Place } from "@/data/types";
import { openDirections } from "@/lib/links";
import { useCity } from "@/state/city";
import { currentLocation, useCityClock, useOnline } from "@/state/device";
import { actions, useStore } from "@/state/store";
import { shareMoment } from "@/chat/moments";
import { font, palette } from "@/theme/tokens";
import { VIDEO_FILL } from "@/components/video/fill";

type Shot = { uri: string; kind: "photo" | "video"; seconds: number };
const MAX_SECONDS = 15;
const YELLOW = palette.sunset; // the selected mode label
const RECORD_RED = palette.rose; // the record button

export default function PostMoment() {
  const params = useLocalSearchParams<{ id: string }>();
  const placeId = decodeURIComponent(String(params.id));
  const { city, status, error, retry } = useCity();
  const place = city?.byId.get(placeId) ?? null;
  const clock = useCityClock(city?.utcOffset);
  const demoHere = useStore((s) => s.settings.demoHere);
  const online = useOnline();
  const insets = useSafeAreaInsets();
  const [gate, setGate] = useState<Gate | null>(null);
  const [check, setCheck] = useState(0);

  const close = useCallback(() => (router.canGoBack() ? router.back() : router.replace(place ? `/place/${encodeURIComponent(place.id)}` : "/")), [place]);

  useEffect(() => {
    if (!place) return;
    let live = true;
    setGate(null);
    currentLocation(true).then(({ fix, status: st }) => {
      if (live) setGate(postingGate(place, fix, st, clock.day, clock.minutes, demoHere));
    });
    return () => { live = false; };
    // Re-check when asked, or when demo mode changes; the clock is read at check time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id, check, demoHere]);

  const frame = (children: ReactNode, testID: string, title = "faves") => (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID={testID}>
      <TopBar onClose={close} title={title} />
      {children}
      {!online ? <OfflineBanner /> : null}
    </View>
  );

  if (status === "loading") return frame(<Center><LoadingPill text="Loading" /></Center>, "post-loading");
  if (status === "error") return frame(<Center><DarkError title="Couldn't load this spot. Tap to retry." body={error ?? "Check your connection and try again."} onRetry={retry} /></Center>, "post-error");
  if (!place) return frame(<Center><DarkMessage testID="post-missing" title="Spot not found" body="This spot isn't in the city you have open." cta="Back" onCta={close} /></Center>, "post-missing-screen");
  if (!gate) return frame(<Center><LoadingPill text="Checking you're here" /></Center>, "post-checking");
  if (gate.kind === "unavailable") {
    return frame(<Center><DarkError testID="post-location-error" title="Couldn't find your location. Tap to retry." body="Turn on Location Services, then try again." onRetry={() => setCheck((n) => n + 1)} /></Center>, "post-unavailable");
  }
  if (gate.kind === "denied") return frame(<LocationPrompt place={place} onCancel={close} onRetry={() => setCheck((n) => n + 1)} />, "post-denied");
  if (gate.kind === "blocked") {
    return frame(
      <BeHereCard
        place={place}
        gate={gate}
        onDirections={() => openDirections({ lat: place.lat, lng: place.lng, name: place.name }, "transit")}
        onNotNow={close}
        onDemo={() => actions.setSetting({ demoHere: true })}
      />,
      "post-blocked",
    );
  }
  return <Capture place={place} demo={gate.demo} onClose={close} online={online} />;
}

function TopBar({ onClose, title }: { onClose: () => void; title: string }) {
  return (
    <View style={styles.top}>
      <Pressable testID="post-close" accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.closeCircle}>
        <Icon name="chevron-down" size={24} tint="#fff" />
      </Pressable>
      <Text style={styles.wordmark} numberOfLines={1}>{title}</Text>
      <View style={{ width: 45 }} />
    </View>
  );
}

const Center = ({ children }: { children: ReactNode }) => <View style={{ flex: 1, justifyContent: "center", paddingBottom: 80 }}>{children}</View>;

// BeReal "Share to view": header (photo, name, grey line), blurred card, eye-slash, title, line, button.
function BeHereCard({ place, gate, onDirections, onNotNow, onDemo }: { place: Place; gate: Extract<Gate, { kind: "blocked" }>; onDirections: () => void; onNotNow: () => void; onDemo: () => void }) {
  const away = gate.near ? "You're here" : `${distanceText(gate.meters)} away`;
  const line = gate.near
    ? `Moments can only be posted from ${place.name} while it's open. You're here, but ${gate.open.why?.replace(/^It's/, "it's") ?? "it isn't open now."}`
    : `Moments can only be posted from ${place.name} (within ${POST_RADIUS_M} m), while it's open. You're ${distanceText(gate.meters)} away.`;
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
      <View style={styles.postHead}>
        <Image source={place.image ? { uri: place.image } : undefined} style={styles.postAvatar} contentFit="cover" />
        <View style={{ flex: 1 }}>
          <Text style={styles.postName} numberOfLines={1}>{place.name}</Text>
          <Text style={styles.postLate}>{away}</Text>
        </View>
      </View>
      <View style={styles.card} testID="be-here-card">
        {place.image ? <Image source={{ uri: place.image }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={36} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: "#2A2A2E" }]} />}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)" }]} />
        <View style={styles.cardInner}>
          <Icon name="eye-off" size={34} tint="#fff" />
          <Text style={styles.cardTitle}>Be here to post</Text>
          <Text style={styles.cardLine}>{line}</Text>
          {gate.near ? (
            <Pressable testID="post-see-hours" accessibilityRole="button" onPress={onNotNow} style={({ pressed }) => [styles.cardButton, pressed && { opacity: 0.85 }]}>
              <Text style={styles.cardButtonText}>See hours</Text>
            </Pressable>
          ) : (
            <>
              <Pressable testID="post-directions" accessibilityRole="button" onPress={onDirections} style={({ pressed }) => [styles.cardButton, pressed && { opacity: 0.85 }]}>
                <Text style={styles.cardButtonText}>Get directions</Text>
              </Pressable>
              <Pressable testID="post-not-now" accessibilityRole="button" hitSlop={8} onPress={onNotNow} style={{ marginTop: 14 }}>
                <Text style={styles.notNow}>Not now</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
      <Pressable testID="post-demo-mode" accessibilityRole="button" onPress={onDemo} style={styles.demoRow}>
        <Text style={styles.demoText}>Trying Faves from somewhere else? <Text style={styles.demoLink}>Use demo mode</Text>. Demo clips are marked "Demo, not verified".</Text>
      </Pressable>
    </ScrollView>
  );
}

// TikTok's location prompt: white card, bold title, how-to line, a mini Settings row, two text buttons.
function LocationPrompt({ place, onCancel, onRetry }: { place: Place; onCancel: () => void; onRetry: () => void }) {
  const web = Platform.OS === "web";
  return (
    <View style={{ flex: 1 }}>
      <View style={[StyleSheet.absoluteFill, { margin: 12, borderRadius: 16.4, overflow: "hidden" }]}>
        {place.image ? <Image source={{ uri: place.image }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={36} /> : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)" }]} />
      </View>
      <View style={styles.promptWrap}>
        <View style={styles.prompt} testID="location-prompt">
          <Text style={styles.promptTitle}>Turn on location to post here</Text>
          <Text style={styles.promptBody}>{web ? "Allow location for this site in your browser's settings, then try again. Faves only checks it when you post." : "Open your device settings and go to Location > While Using the App. Faves only checks it when you post."}</Text>
          <View style={styles.mini}>
            <Text style={styles.miniTitle}>Faves</Text>
            <View style={styles.miniRow}>
              <View style={styles.miniIcon}><Icon name="navigate" size={12} tint="#fff" /></View>
              <Text style={styles.miniLabel}>Location</Text>
              <View style={styles.miniValue}><Text style={styles.miniValueText}>While Using ›</Text></View>
            </View>
          </View>
          <View style={styles.promptButtons}>
            <Pressable testID="prompt-cancel" accessibilityRole="button" onPress={onCancel} style={styles.promptButton}><Text style={styles.promptButtonText}>Cancel</Text></Pressable>
            <Pressable testID="prompt-settings" accessibilityRole="button" onPress={() => (web ? onRetry() : Linking.openSettings().catch(() => onRetry()))} style={styles.promptButton}>
              <Text style={[styles.promptButtonText, { fontWeight: "600" }]}>{web ? "Try again" : "Open settings"}</Text>
            </Pressable>
          </View>
        </View>
        {!web ? <Pressable testID="prompt-retry" accessibilityRole="button" onPress={onRetry} style={{ marginTop: 18 }}><Text style={styles.notNow}>I turned it on, check again</Text></Pressable> : null}
      </View>
    </View>
  );
}

function Capture({ place, demo, onClose, online }: { place: Place; demo: boolean; onClose: () => void; online: boolean }) {
  const citySlug = useStore((st) => st.profile.city);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const handle = useStore((s) => s.profile.handle);
  const [camPerm, requestCam] = useCameraPermissions();
  const [micPerm, requestMic] = useMicrophonePermissions();
  const web = Platform.OS === "web";
  const cam = useRef<CameraView>(null);
  const [mode, setMode] = useState<"video" | "photo">(web ? "photo" : "video");
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [flash, setFlash] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [ready, setReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const started = useRef(0);

  const w = Math.min(width, 520) - 4;
  const h = Math.round((w * 4) / 3);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed(Math.min(MAX_SECONDS, Math.floor((Date.now() - started.current) / 1000))), 250);
    return () => clearInterval(t);
  }, [recording]);

  const takePhoto = async () => {
    if (!cam.current || !ready) return;
    try {
      const pic = await cam.current.takePictureAsync(web ? { quality: 0.4, scale: 0.5, imageType: "jpg" } : { quality: 0.7, imageType: "jpg" });
      if (pic?.uri) setShot({ uri: pic.uri, kind: "photo", seconds: 7 });
    } catch {
      setToast("Couldn't take the photo. Try again.");
    }
  };

  const toggleRecord = async () => {
    if (!cam.current || !ready) return;
    if (recording) { cam.current.stopRecording(); return; }
    if (!micPerm?.granted) {
      const r = await requestMic();
      if (!r.granted) { setToast("Allow the microphone to record video, or switch to PHOTO."); return; }
    }
    try {
      started.current = Date.now();
      setElapsed(0);
      setRecording(true);
      const res = await cam.current.recordAsync({ maxDuration: MAX_SECONDS });
      const secs = Math.max(1, Math.min(MAX_SECONDS, Math.round((Date.now() - started.current) / 1000)));
      setRecording(false);
      if (res?.uri) setShot({ uri: res.uri, kind: "video", seconds: secs });
    } catch {
      setRecording(false);
      setToast("Couldn't record. Try again.");
    }
  };

  const send = async () => {
    if (!shot || sending) return;
    setSending(true);
    const id = `faves-${Date.now().toString(36)}`;
    const uri = await keepClip(shot.uri, id, shot.kind);
    const m: Moment = {
      id, source: "faves", creator: handle || "you", views: 0, likes: 0, postedAt: new Date().toISOString(),
      caption: caption.trim(), duration: shot.seconds, uri, kind: shot.kind, takenHere: !demo, demo,
    };
    actions.addMoment(place.id, m);
    // Everyone sees it on the spot's postcard wall when chats run on Convex (file storage).
    void shareMoment(place.id, citySlug, m);
    setSending(false);
    if (router.canGoBack()) router.back();
    else router.replace(`/place/${encodeURIComponent(place.id)}`);
  };

  const shell = (children: ReactNode, testID: string) => (
    <View style={[styles.screen, { paddingTop: insets.top }]} testID={testID}>
      <TopBar onClose={onClose} title="faves" />
      {children}
      {!online ? <OfflineBanner /> : null}
      <Toast text={toast} onHide={() => setToast(null)} top={insets.top + 60} />
    </View>
  );

  // Preview after capture.
  if (shot) {
    return shell(
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ alignItems: "center", paddingBottom: insets.bottom + 20 }}>
          <TextInput
            testID="post-caption"
            accessibilityLabel="Caption"
            value={caption}
            onChangeText={setCaption}
            maxLength={120}
            placeholder="Add a caption..."
            placeholderTextColor={palette.inkMuted}
            style={[styles.caption, { width: w - 24 }, Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : null]}
          />
          <View style={[styles.finder, { width: w, height: h }]} testID="post-preview">
            {shot.kind === "video" ? <PreviewVideo uri={shot.uri} /> : <Image source={{ uri: shot.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />}
            <View style={styles.chips}>
              <Pressable testID="post-retake" accessibilityRole="button" accessibilityLabel="Retake" onPress={() => setShot(null)} style={styles.chipCircle}>
                <Icon name="refresh" size={18} tint="#fff" />
              </Pressable>
              <View style={styles.chipCircle} accessibilityLabel="Everyone can see it on the place page"><Icon name="globe-outline" size={18} tint="#fff" /></View>
              <View style={{ flexShrink: 1 }}><TakenHerePill place={place.name} demo={demo} testID="post-location-pill" /></View>
            </View>
          </View>
          <Pressable testID="post-send" accessibilityRole="button" accessibilityLabel="Send" disabled={sending} onPress={send} style={({ pressed }) => [styles.send, (pressed || sending) && { opacity: 0.7 }]}>
            <Text style={styles.sendText}>{sending ? "SENDING" : "SEND"}</Text>
            <Icon name="play" size={28} tint="#fff" />
          </Pressable>
          <Text style={styles.sendNote}>{demo ? "Demo mode: this clip is marked \"Demo, not verified\"." : `Posts to ${place.name}'s Highlights and Right now.`}</Text>
        </ScrollView>
      </KeyboardAvoidingView>,
      "post-preview-screen",
    );
  }

  // Camera permission.
  if (!camPerm) return shell(<Center><LoadingPill text="Starting the camera" /></Center>, "post-camera-loading");
  if (!camPerm.granted) {
    return shell(
      <View style={styles.promptWrap}>
        <View style={styles.prompt} testID="camera-prompt">
          <Text style={styles.promptTitle}>Allow the camera to post a moment</Text>
          <Text style={styles.promptBody}>Faves uses the camera only when you post a moment from the spot you're at.</Text>
          {!camPerm.canAskAgain && !web ? (
            <View style={styles.mini}>
              <Text style={styles.miniTitle}>Faves</Text>
              <View style={styles.miniRow}>
                <View style={[styles.miniIcon, { backgroundColor: "#8E8E93" }]}><Icon name="camera" size={12} tint="#fff" /></View>
                <Text style={styles.miniLabel}>Camera</Text>
                <View style={styles.miniValue}><Text style={styles.miniValueText}>Allow</Text></View>
              </View>
            </View>
          ) : null}
          <View style={styles.promptButtons}>
            <Pressable testID="camera-cancel" accessibilityRole="button" onPress={onClose} style={styles.promptButton}><Text style={styles.promptButtonText}>Not now</Text></Pressable>
            <Pressable
              testID="camera-allow"
              accessibilityRole="button"
              onPress={() => (camPerm.canAskAgain || web ? requestCam() : Linking.openSettings().catch(() => {}))}
              style={styles.promptButton}
            >
              <Text style={[styles.promptButtonText, { fontWeight: "600" }]}>{camPerm.canAskAgain || web ? "Allow camera" : "Open settings"}</Text>
            </Pressable>
          </View>
        </View>
      </View>,
      "post-camera-permission",
    );
  }

  return shell(
    <View style={{ flex: 1 }}>
      <View style={[styles.finder, { width: w, height: h, alignSelf: "center" }]} testID="post-camera">
        {camError ? (
          <View style={[StyleSheet.absoluteFill, { justifyContent: "center", backgroundColor: "#111" }]}>
            <DarkError testID="camera-error" title="Couldn't start the camera. Tap to retry." body={camError} onRetry={() => { setCamError(null); setReady(false); setAttempt((a) => a + 1); }} />
          </View>
        ) : (
          <CameraView
            key={attempt}
            ref={cam}
            style={StyleSheet.absoluteFill}
            facing={facing}
            mode={mode === "video" ? "video" : "picture"}
            flash={flash ? "on" : "off"}
            enableTorch={mode === "video" && flash}
            zoom={zoomed ? 0.15 : 0}
            videoQuality="720p"
            onCameraReady={() => setReady(true)}
            onMountError={(e) => setCamError(e.message || "This device has no camera Faves can use.")}
          />
        )}
        {recording ? (
          <View style={[styles.timer, demo && { top: 50 }]} testID="post-recording"><View style={styles.timerDot} /><Text style={styles.timerText}>{`0:${String(elapsed).padStart(2, "0")} / 0:${MAX_SECONDS}`}</Text></View>
        ) : null}
        <Pressable testID="post-flash" accessibilityRole="button" accessibilityLabel={flash ? "Flash on" : "Flash off"} hitSlop={10} onPress={() => setFlash((f) => !f)} style={[styles.corner, { left: 16 }]}>
          <Icon name={flash ? "flash" : "flash-off"} size={24} tint="#fff" />
        </Pressable>
        <Pressable testID="post-zoom" accessibilityRole="button" accessibilityLabel="Zoom" onPress={() => setZoomed((z) => !z)} style={styles.zoom}>
          <Text style={styles.zoomText}>{zoomed ? "2x" : "1x"}</Text>
        </Pressable>
        <Pressable testID="post-flip" accessibilityRole="button" accessibilityLabel="Flip camera" hitSlop={10} disabled={recording} onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))} style={[styles.corner, { right: 16 }]}>
          <Icon name="sync" size={26} tint="#fff" />
        </Pressable>
      </View>

      <View style={styles.modes}>
        <Pressable testID="post-mode-video" accessibilityRole="tab" accessibilityState={{ selected: mode === "video" }} disabled={recording} onPress={() => (web ? setToast("Video works in the iPhone app. On the web, take a photo.") : setMode("video"))}>
          <Text style={[styles.mode, mode === "video" && { color: YELLOW }, web && { opacity: 0.45 }]}>VIDEO</Text>
        </Pressable>
        <Pressable testID="post-mode-photo" accessibilityRole="tab" accessibilityState={{ selected: mode === "photo" }} disabled={recording} onPress={() => setMode("photo")}>
          <Text style={[styles.mode, mode === "photo" && { color: YELLOW }]}>PHOTO</Text>
        </Pressable>
      </View>
      {web ? <Text style={styles.webNote}>Video posting works in the iPhone app.</Text> : null}

      <View style={[styles.shutterArea, { bottom: Math.max(75 - 38.8, insets.bottom + 8) }]}>
        <Pressable
          testID="post-shutter"
          accessibilityRole="button"
          accessibilityLabel={mode === "photo" ? "Take photo" : recording ? "Stop recording" : "Start recording"}
          disabled={!ready}
          onPress={mode === "photo" ? takePhoto : toggleRecord}
          style={({ pressed }) => [styles.shutter, (!ready || pressed) && { opacity: 0.6 }]}
        >
          <View style={[styles.shutterDisc, recording && { backgroundColor: RECORD_RED, width: 34, height: 34, borderRadius: 8 }]} />
        </Pressable>
      </View>
      {demo ? <View style={styles.demoBadge}><TakenHerePill place={place.name} demo /></View> : null}
    </View>,
    "post-camera-screen",
  );
}

function PreviewVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => { p.loop = true; p.muted = true; p.play(); });
  return <VideoView player={player} style={VIDEO_FILL} contentFit="cover" nativeControls={false} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  top: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  closeCircle: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: "#101012", alignItems: "center", justifyContent: "center" },
  wordmark: { flex: 1, textAlign: "center", fontFamily: font.sans, fontSize: 23, fontWeight: "800", color: "#fff", letterSpacing: -0.4 },
  postHead: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 },
  postAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#333" },
  postName: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#fff" },
  postLate: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 1 },
  card: { marginHorizontal: 18, aspectRatio: 3 / 4, borderRadius: 16.4, overflow: "hidden", backgroundColor: "#1C1C1E", justifyContent: "center" },
  cardInner: { alignItems: "center", paddingHorizontal: 26 },
  cardTitle: { fontFamily: font.sans, fontSize: 16, fontWeight: "700", color: "#fff", marginTop: 12 },
  cardLine: { fontFamily: font.sans, fontSize: 14, lineHeight: 19, color: "#fff", textAlign: "center", marginTop: 6 },
  cardButton: { marginTop: 22, width: 117, height: 35, borderRadius: 11, backgroundColor: palette.card, alignItems: "center", justifyContent: "center" },
  cardButtonText: { fontFamily: font.sans, fontSize: 13, fontWeight: "600", color: palette.ink },
  notNow: { fontFamily: font.sans, fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)", textAlign: "center" },
  demoRow: { paddingHorizontal: 28, paddingTop: 18 },
  demoText: { fontFamily: font.sans, fontSize: 13, lineHeight: 18, color: palette.inkMuted, textAlign: "center" },
  demoLink: { color: "#fff", fontWeight: "700", textDecorationLine: "underline" },
  promptWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 34, paddingBottom: 60 },
  prompt: { width: "100%", maxWidth: 300, backgroundColor: palette.card, borderRadius: 14, paddingTop: 20, overflow: "hidden" },
  promptTitle: { fontFamily: font.sans, fontSize: 18, lineHeight: 23, fontWeight: "700", color: palette.ink, textAlign: "center", paddingHorizontal: 18 },
  promptBody: { fontFamily: font.sans, fontSize: 14, lineHeight: 19, color: palette.ink, textAlign: "center", paddingHorizontal: 18, marginTop: 8 },
  mini: { marginTop: 16, marginHorizontal: 18, borderRadius: 12, backgroundColor: palette.paperDeep, padding: 10, gap: 8 },
  miniTitle: { fontFamily: font.sans, fontSize: 13, fontWeight: "700", color: palette.ink, textAlign: "center" },
  miniRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: palette.card, borderRadius: 8, paddingHorizontal: 8, height: 34 },
  miniIcon: { width: 20, height: 20, borderRadius: 5, backgroundColor: palette.roseInk, alignItems: "center", justifyContent: "center" },
  miniLabel: { flex: 1, fontFamily: font.sans, fontSize: 13, color: palette.ink },
  miniValue: { borderWidth: 1, borderStyle: "dashed", borderColor: "#3A8FB7", borderRadius: 12, paddingHorizontal: 8, height: 24, justifyContent: "center" },
  miniValueText: { fontFamily: font.sans, fontSize: 12, color: palette.inkMuted },
  promptButtons: { flexDirection: "row", marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.line },
  promptButton: { flex: 1, height: 48, alignItems: "center", justifyContent: "center" },
  promptButtonText: { fontFamily: font.sans, fontSize: 16, color: "#3A8FB7" },
  finder: { borderRadius: 18, overflow: "hidden", backgroundColor: "#111", alignSelf: "center" },
  corner: { position: "absolute", bottom: 16, width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  zoom: { position: "absolute", bottom: 16, alignSelf: "center", width: 35, height: 35, borderRadius: 17.5, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  zoomText: { fontFamily: font.sans, color: "#fff", fontSize: 13, fontWeight: "800" },
  timer: { position: "absolute", top: 14, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 14, paddingHorizontal: 10, height: 28 },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: RECORD_RED },
  timerText: { fontFamily: font.sans, color: "#fff", fontSize: 13, fontWeight: "700" },
  modes: { flexDirection: "row", justifyContent: "center", gap: 32, marginTop: 18 },
  mode: { fontFamily: font.sans, fontSize: 15, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  webNote: { fontFamily: font.sans, fontSize: 12, color: palette.inkMuted, textAlign: "center", marginTop: 6 },
  shutterArea: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  shutter: { width: 77.6, height: 77.6, borderRadius: 38.8, borderWidth: 4, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  shutterDisc: { width: 61.6, height: 61.6, borderRadius: 30.8, backgroundColor: palette.card },
  demoBadge: { position: "absolute", top: 8, left: 0, right: 0, alignItems: "center" },
  caption: { fontFamily: font.sans, fontSize: 17, fontWeight: "700", color: "#fff", paddingVertical: 10 },
  chips: { position: "absolute", left: 12, right: 12, bottom: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  chipCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(30,30,30,0.6)", alignItems: "center", justifyContent: "center" },
  chip: { height: 30, borderRadius: 15, backgroundColor: "rgba(30,30,30,0.6)", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11 },
  chipText: { fontFamily: font.sans, color: "#fff", fontSize: 14, fontWeight: "700" },
  send: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 28, paddingHorizontal: 20, paddingVertical: 6 },
  sendText: { fontFamily: font.sans, fontSize: 38, fontWeight: "900", color: "#fff", letterSpacing: 0.5 },
  sendNote: { fontFamily: font.sans, fontSize: 13, color: palette.inkMuted, marginTop: 8, textAlign: "center", paddingHorizontal: 24 },
});
