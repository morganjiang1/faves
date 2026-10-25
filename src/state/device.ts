// Device signals: network (for offline states), location (for distances and the
// "Taken here" rule) and the city clock.
import NetInfo from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import type { LatLng } from "@/lib/geo";
import { cityClock, type CityClock } from "@/lib/time";

// Offline only when the phone says it has no connection at all. NetInfo's
// isInternetReachable is often null or false on simulators and right after launch even when
// online, so it is not trusted; screens that need the network show their own error when a
// real request fails. Rechecked whenever the app comes back to the foreground.
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const apply = (s: { isConnected: boolean | null }) => setOnline(s.isConnected !== false);
    const unsub = NetInfo.addEventListener(apply);
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") NetInfo.refresh().then(apply).catch(() => {}); });
    // On the web, the browser's own online and offline events are the reliable signal.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const on = () => setOnline(true), off = () => setOnline(false);
      setOnline(navigator.onLine !== false);
      window.addEventListener("online", on);
      window.addEventListener("offline", off);
      return () => { unsub(); sub.remove(); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
    }
    return () => { unsub(); sub.remove(); };
  }, []);
  return online;
}

let lastFix: LatLng | null = null;
let asked = false;

export type LocationStatus = "idle" | "asking" | "granted" | "denied" | "unavailable";

export async function currentLocation(ask = true): Promise<{ fix: LatLng | null; status: LocationStatus }> {
  try {
    const perm = ask && !asked ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
    asked = true;
    if (perm.status !== "granted") return { fix: null, status: "denied" };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    lastFix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    return { fix: lastFix, status: "granted" };
  } catch {
    return { fix: null, status: "unavailable" };
  }
}

// Location without prompting (used for distances once you've said yes elsewhere).
export function useKnownLocation(): LatLng | null {
  const [fix, setFix] = useState<LatLng | null>(lastFix);
  useEffect(() => {
    let live = true;
    Location.getForegroundPermissionsAsync()
      .then((p) => (p.status === "granted" ? Location.getLastKnownPositionAsync() : null))
      .then((pos) => { if (live && pos) { lastFix = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setFix(lastFix); } })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return fix;
}

export function useCityClock(utcOffset: number | undefined): CityClock {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return cityClock(utcOffset ?? -8, now);
}
