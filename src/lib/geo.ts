// Distances and travel legs with no API key: haversine distance, a street-grid detour factor,
// and average city speeds per mode. Google Routes replaces these when a key is set.

export interface LatLng { lat: number; lng: number }
export type Mode = "walk" | "transit" | "drive" | "bike";

export function metersBetween(a: LatLng, b: LatLng): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const toMiles = (m: number) => m / 1609.344;

// Streets are not straight lines: real walking and driving routes run about 30% longer.
const DETOUR = 1.3;
// Average door-to-door speeds in km/h, plus fixed overhead in minutes (waiting, parking).
const SPEED: Record<Mode, { kmh: number; overhead: number }> = {
  walk: { kmh: 4.8, overhead: 0 },
  bike: { kmh: 14, overhead: 2 },
  transit: { kmh: 19, overhead: 7 },
  drive: { kmh: 24, overhead: 4 },
};

export interface Leg { mode: Mode; minutes: number; meters: number; miles: number }

export function legFor(a: LatLng, b: LatLng, mode: Mode): Leg {
  const meters = metersBetween(a, b) * DETOUR;
  const s = SPEED[mode];
  const minutes = Math.max(1, Math.round((meters / 1000 / s.kmh) * 60 + (meters > 150 ? s.overhead : 0)));
  return { mode, minutes, meters, miles: toMiles(meters) };
}

// The mode you'd actually use for this hop given how you said you get around:
// nobody takes the bus 400 m, and nobody walks 4 km between stops.
export function modeFor(pref: Mode, meters: number): Mode {
  const routeMeters = meters * DETOUR;
  if (routeMeters < 900) return "walk";
  if (pref === "walk") return routeMeters > 2600 ? "transit" : "walk";
  if (pref === "bike") return routeMeters > 9000 ? "transit" : "bike";
  return pref;
}

export function bestLeg(a: LatLng, b: LatLng, pref: Mode): Leg {
  return legFor(a, b, modeFor(pref, metersBetween(a, b)));
}

export function formatMiles(miles: number): string {
  if (miles < 0.1) return "0.1 mi";
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}

const MODE_WORD: Record<Mode, string> = { walk: "walk", bike: "bike", transit: "transit", drive: "drive" };

// Wanderlog's leg row text: "5 min walk • 0.4 mi".
export function formatLeg(leg: Leg): string {
  return `${formatDuration(leg.minutes)} ${MODE_WORD[leg.mode]} • ${formatMiles(leg.miles)}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export function distanceLabel(from: LatLng | null, to: LatLng): string | null {
  if (!from) return null;
  return formatMiles(toMiles(metersBetween(from, to)));
}
