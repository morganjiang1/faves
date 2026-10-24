// Google Routes API (computeRoutes) for real travel times and route lines, used only when
// EXPO_PUBLIC_GOOGLE_MAPS_KEY is set. Without it, legs come from lib/geo.ts estimates and
// the map draws straight lines between stops.
import type { LatLng, Mode } from "../geo";

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
const MODE = { walk: "WALK", transit: "TRANSIT", drive: "DRIVE", bike: "BICYCLE" } as const;

export interface RouteLeg { minutes: number; meters: number; points: LatLng[] }

// Google's encoded polyline format.
export function decodePolyline(encoded: string): LatLng[] {
  const pts: LatLng[] = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    for (const which of [0, 1]) {
      let shift = 0, result = 0, b: number;
      do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      const d = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += d; else lng += d;
    }
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}

export async function routeLeg(from: LatLng, to: LatLng, mode: Mode): Promise<RouteLeg | null> {
  if (!KEY) return null;
  try {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline" },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: from.lat, longitude: from.lng } } },
        destination: { location: { latLng: { latitude: to.lat, longitude: to.lng } } },
        travelMode: MODE[mode],
      }),
    });
    if (!res.ok) return null;
    const r = (await res.json())?.routes?.[0];
    if (!r) return null;
    return { minutes: Math.round(parseInt(String(r.duration), 10) / 60), meters: r.distanceMeters ?? 0, points: decodePolyline(r.polyline?.encodedPolyline ?? "") };
  } catch {
    return null;
  }
}
