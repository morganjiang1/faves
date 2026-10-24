// The "Taken here" rule (docs/plan.md, Spot Moments): a clip can be posted to a place only when
// the phone is within 150 m of it, while it's open. Places with no listed hours count as open
// when they are free, outdoor or courts (parks, viewpoints, public courts).
import type { Place } from "@/data/types";
import { formatMiles, metersBetween, toMiles, type LatLng } from "@/lib/geo";
import { statusAt } from "@/lib/hours";

export const POST_RADIUS_M = 150;
const ALWAYS_OPEN = new Set(["views", "courts"]);

export interface OpenCheck { ok: boolean; why: string | null }

export function openForPosting(place: Place, day: number, minute: number): OpenCheck {
  const st = statusAt(place, day, minute);
  if (st.state === "open") return { ok: true, why: null };
  if (st.state === "unknown") {
    if (place.free || place.court || ALWAYS_OPEN.has(place.category)) return { ok: true, why: null };
    return { ok: false, why: "We can't confirm it's open right now: it has no listed hours." };
  }
  return { ok: false, why: `It's closed right now${st.detail ? ` (${st.detail.charAt(0).toLowerCase()}${st.detail.slice(1)})` : ""}.` };
}

export type Gate =
  | { kind: "ok"; demo: boolean }
  | { kind: "blocked"; meters: number; near: boolean; open: OpenCheck }
  | { kind: "denied" }
  | { kind: "unavailable" };

export function postingGate(place: Place, fix: LatLng | null, status: "granted" | "denied" | "unavailable" | string, day: number, minute: number, demoHere: boolean): Gate {
  const open = openForPosting(place, day, minute);
  if (fix) {
    const meters = metersBetween(fix, place);
    const near = meters <= POST_RADIUS_M;
    if (near && open.ok) return { kind: "ok", demo: false };
    if (demoHere) return { kind: "ok", demo: true };
    return { kind: "blocked", meters, near, open };
  }
  if (demoHere) return { kind: "ok", demo: true };
  return { kind: status === "denied" ? "denied" : "unavailable" };
}

export function distanceText(meters: number): string {
  if (meters < 160) return `${Math.round(meters)} m`;
  return formatMiles(toMiles(meters));
}
