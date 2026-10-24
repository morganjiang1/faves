// TikTok clips play through TikTok's official embed player (https://www.tiktok.com/player/v1/<id>)
// inside a WebView on iPhone: inline playback, autoplay allowed. Links that leave the player
// (the creator, "watch on TikTok") open outside the app instead of inside the viewer.
import { Linking, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { tiktokPlayerUrl } from "./clips";

export function TikTokPlayer({ id, onReady, onError }: { id: string; onReady: () => void; onError: () => void }) {
  return (
    <View style={StyleSheet.absoluteFill} testID="tiktok-player">
      <WebView
        source={{ uri: tiktokPlayerUrl(id) }}
        style={styles.web}
        containerStyle={styles.web}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        javaScriptEnabled
        domStorageEnabled
        bounces={false}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        onLoadEnd={onReady}
        onError={onError}
        onHttpError={(e) => { if (e.nativeEvent.statusCode >= 400) onError(); }}
        onShouldStartLoadWithRequest={(req) => {
          if (req.url.startsWith("https://www.tiktok.com/player/") || req.url === "about:blank" || req.isTopFrame === false) return true;
          if (/^https?:/.test(req.url)) Linking.openURL(req.url).catch(() => {});
          return false;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: "#000" },
});
