import { BricolageGrotesque_600SemiBold } from "@expo-google-fonts/bricolage-grotesque/600SemiBold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque/800ExtraBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CityProvider } from "@/state/city";
import { hydrate, useStore } from "@/state/store";
import { palette } from "@/theme/tokens";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold });
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => { hydrate(); }, []);
  // Web: inputs keep the border their reference shows instead of the browser's focus ring.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById("faves-web-style")) return;
    const st = document.createElement("style");
    st.id = "faves-web-style";
    st.textContent = "input,textarea{outline:none!important}html,body{overscroll-behavior:none}";
    document.head.appendChild(st);
  }, []);
  const ready = (fontsLoaded || Boolean(fontError)) && hydrated;
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <CityProvider>
          <View style={styles.page}>
            <View style={styles.column}>
              <StatusBar style="dark" />
              {/* iOS full-screen modals keep their default slide: a custom animation there drops the safe-area insets. */}
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.paper } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ animation: "fade", gestureEnabled: false }} />
                <Stack.Screen name="builder" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="plan/[id]" />
                <Stack.Screen name="place/[id]" />
                <Stack.Screen name="feed" />
                <Stack.Screen name="saved" />
                <Stack.Screen name="chat/[id]" />
                <Stack.Screen name="chat/new" options={{ presentation: "modal" }} />
                <Stack.Screen name="chat/info/[id]" />
                <Stack.Screen name="join/[code]" />
                <Stack.Screen name="search" options={{ animation: "fade" }} />
                <Stack.Screen name="city" options={{ presentation: "modal" }} />
                <Stack.Screen name="day/[id]" />
                <Stack.Screen name="recap/[id]" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="group/[id]" />
                <Stack.Screen name="rank" options={{ presentation: "transparentModal", animation: "fade" }} />
                <Stack.Screen name="rankings" />
                <Stack.Screen name="moments/[id]" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="reel" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="post-moment/[id]" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="wallet" />
                <Stack.Screen name="payout" options={{ presentation: "modal" }} />
                <Stack.Screen name="plus" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="settings" />
              </Stack>
            </View>
          </View>
        </CityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Platform.OS === "web" ? palette.paperDeep : palette.paper },
  page: { flex: 1, alignItems: "center" },
  // On the web, the app sits in a phone-width column like a mobile site.
  column: { flex: 1, width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined, backgroundColor: palette.paper, overflow: "hidden" },
});
