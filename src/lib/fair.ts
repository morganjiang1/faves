// Meet in the middle: when a group plans together, the first stop should be fair to
// everyone. Each member has a starting point (a neighborhood-level point, never an exact
// location) and a way of getting around. Fairness first: the longest trip to the first stop
// is as short as possible (in 5-minute steps, so tiny differences don't override taste);
// then the total travel; then the Locals Score. Travel is the keyless estimate from geo.ts.
import type { City } from "@/data/types";
import { bestLeg, metersBetween, type LatLng, type Mode } from "./geo";

export interface Start { memberId: string; name: string; hood: string | null; lat: number; lng: number; mode: Mode }
export interface TravelLine { memberId: string; name: string; hood: string | null; mode: Mode; minutes: number; miles: number }
export interface Fairness { toFirst: TravelLine[]; home: TravelLine[]; maxMinutes: number; startsKey: string }

const STEP = 5; // minutes: trips within the same 5 minutes count as equally fair
const QUALITY_GAP = 30; // only consider stops within this many points of the best one

export function travelLines(starts: Start[], to: LatLng): TravelLine[] {
  return starts.map((s) => {
    const leg = bestLeg(s, to, s.mode);
    return { memberId: s.memberId, name: s.name, hood: s.hood, mode: leg.mode, minutes: leg.minutes, miles: leg.miles };
  });
}

export function fairPick<T extends { place: LatLng & { id: string }; score: number }>(cands: T[], starts: Start[]): T | null {
  if (!cands.length) return null;
  if (starts.length < 2) return cands[0];
  const best = Math.max(...cands.map((c) => c.score));
  const pool = cands
    .filter((c) => c.score >= best - QUALITY_GAP)
    .map((c) => {
      const lines = travelLines(starts, c.place);
      return { c, max: Math.max(...lines.map((l) => l.minutes)), total: lines.reduce((t, l) => t + l.minutes, 0) };
    });
  pool.sort((a, b) => Math.ceil(a.max / STEP) - Math.ceil(b.max / STEP) || a.total - b.total || b.c.score - a.c.score);
  return pool[0]?.c ?? cands[0];
}

// The middle of everyone's starting points (pulls later picks toward the group).
export function middleOf(starts: Start[]): LatLng | null {
  if (!starts.length) return null;
  return { lat: starts.reduce((t, s) => t + s.lat, 0) / starts.length, lng: starts.reduce((t, s) => t + s.lng, 0) / starts.length };
}

export const startsKey = (starts: Start[]) => starts.map((s) => `${s.memberId}:${s.lat.toFixed(2)},${s.lng.toFixed(2)}:${s.mode}`).sort().join("|");

export function fairnessFor(first: LatLng | null, last: LatLng | null, starts: Start[]): Fairness | null {
  if (!first || !starts.length) return null;
  const toFirst = travelLines(starts, first);
  const home = last ? starts.map((s) => {
    const leg = bestLeg(last, s, s.mode);
    return { memberId: s.memberId, name: s.name, hood: s.hood, mode: leg.mode, minutes: leg.minutes, miles: leg.miles };
  }) : [];
  return { toFirst, home, maxMinutes: Math.max(...toFirst.map((l) => l.minutes)), startsKey: startsKey(starts) };
}

// Privacy: a point is shared only as its neighborhood: the center of the city's spots in the
// nearest neighborhood, rounded to about a kilometer.
export function neighborhoodPoint(city: City, at: LatLng): { hood: string | null; lat: number; lng: number } {
  let best: { hood: string; d: number } | null = null;
  for (const p of city.places) {
    if (!p.hood) continue;
    const d = metersBetween(at, p);
    if (!best || d < best.d) best = { hood: p.hood, d };
  }
  if (!best || best.d > 4000) return { hood: null, lat: round(at.lat), lng: round(at.lng) };
  return hoodPoint(city, best.hood) ?? { hood: best.hood, lat: round(at.lat), lng: round(at.lng) };
}

export function hoodPoint(city: City, hood: string): { hood: string; lat: number; lng: number } | null {
  const inHood = city.places.filter((p) => p.hood === hood);
  if (!inHood.length) return null;
  return { hood, lat: round(inHood.reduce((t, p) => t + p.lat, 0) / inHood.length), lng: round(inHood.reduce((t, p) => t + p.lng, 0) / inHood.length) };
}

const round = (x: number) => Math.round(x * 100) / 100;

export function fairLine(f: Fairness): string {
  const m = f.maxMinutes;
  return m <= 30 ? `everyone's within ${Math.max(10, Math.ceil(m / 5) * 5)} min` : `the longest trip is ${m} min`;
}
