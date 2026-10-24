import { PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display/700Bold";
import { PlayfairDisplay_800ExtraBold } from "@expo-google-fonts/playfair-display/800ExtraBold";
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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold });
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => { hydrate(); }, []);
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
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#fff" } }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="onboarding" options={{ animation: "fade", gestureEnabled: false }} />
                <Stack.Screen name="builder" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
                <Stack.Screen name="city" options={{ presentation: "modal" }} />
                <Stack.Screen name="search" options={{ animation: "fade" }} />
                <Stack.Screen name="rank" options={{ presentation: "transparentModal", animation: "fade" }} />
                <Stack.Screen name="moments/[id]" options={{ presentation: "fullScreenModal", animation: "fade" }} />
                <Stack.Screen name="post-moment/[id]" options={{ presentation: "fullScreenModal" }} />
                <Stack.Screen name="plus" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
              </Stack>
            </View>
          </View>
        </CityProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Platform.OS === "web" ? "#F2F2F2" : "#fff" },
  page: { flex: 1, alignItems: "center" },
  // On the web, the app sits in a phone-width column like a mobile site.
  column: { flex: 1, width: "100%", maxWidth: Platform.OS === "web" ? 520 : undefined, backgroundColor: "#fff", overflow: "hidden" },
});
