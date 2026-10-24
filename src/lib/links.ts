// Links out of the app: shareable URLs, directions, calls, websites.
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { ActionSheetIOS, Platform } from "react-native";

// A link anyone can open: the deployed website when EXPO_PUBLIC_WEB_URL is set, this site's
// own address on the web, or the app's deep link on a phone.
export function shareUrl(path: string): string {
  const base = process.env.EXPO_PUBLIC_WEB_URL;
  if (base) return `${base.replace(/\/$/, "")}${path}`;
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}${path}`;
  return Linking.createURL(path);
}

export async function openUrl(url: string | null | undefined) {
  if (!url) return;
  try {
    if (/^https?:/.test(url)) await WebBrowser.openBrowserAsync(url);
    else await Linking.openURL(url);
  } catch {
    // Nothing to do: the link could not be opened on this device.
  }
}

// Wanderlog's "What app would you like to use?" picker on iPhone; Google Maps on the web.
export function openDirections(to: { lat: number; lng: number; name?: string }, mode: "walk" | "transit" | "drive" | "bike" = "transit") {
  const g = `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=${{ walk: "walking", transit: "transit", drive: "driving", bike: "bicycling" }[mode]}`;
  const apple = `http://maps.apple.com/?daddr=${to.lat},${to.lng}&dirflg=${{ walk: "w", transit: "r", drive: "d", bike: "w" }[mode]}${to.name ? `&q=${encodeURIComponent(to.name)}` : ""}`;
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      { title: "What app would you like to use?", options: ["Apple Maps", "Google Maps", "Cancel"], cancelButtonIndex: 2 },
      (i) => { if (i === 0) Linking.openURL(apple); if (i === 1) Linking.openURL(g); },
    );
    return;
  }
  openUrl(g);
}

export const callNumber = (phone: string | null) => phone && Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
