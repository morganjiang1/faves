// The numbers a day recap shows, all computed from the plan, the places' real data and
// your own thumbs. Nothing here is estimated beyond what the planner already planned.
import type { City, Place } from "@/data/types";
import type { IconName } from "@/components/ui";
import { planTravel, type Plan } from "@/lib/planner";
import { scoreOutOf10 } from "@/lib/score";
import type { Group, Recap } from "@/state/store";
import { DEMO_VOTERS } from "@/components/group/demo";
import { DEMO_ID } from "./demo";

export interface StopStat { key: string; place: Place; minutes: number; rating: "up" | "down" | null; start: number }
export interface LegStat { to: Place; miles: number; minutes: number; mode: string }

export interface DayStats {
  stops: StopStat[];
  legs: LegStat[];
  miles: number;
  travelMinutes: number;
  hoursOut: number;
  avgScore: string | null;
  top: { stop: StopStat; why: "favorite" | "liked" | "locals" } | null;
  loved: StopStat[]; // liked stops, favorite first (the order from "Which did you like more?")
  longest: StopStat | null;
}

export function dayStats(plan: Plan, city: City, recap: Recap | undefined, likedOrder?: string[]): DayStats {
  const stops: StopStat[] = plan.stops.flatMap((s) => {
    const place = city.byId.get(s.placeId);
    return place ? [{ key: s.key, place, minutes: Math.max(0, s.end - s.start), rating: recap?.ratings[s.key] ?? null, start: s.start }] : [];
  });
  const legs: LegStat[] = plan.stops.flatMap((s) => {
    const to = city.byId.get(s.placeId);
    return s.leg && to ? [{ to, miles: s.leg.miles, minutes: s.leg.minutes, mode: s.leg.mode }] : [];
  });
  const travel = planTravel(plan);
  const first = plan.stops[0], last = plan.stops[plan.stops.length - 1];
  const hoursOut = first && last ? Math.max(0, last.end - first.start) / 60 : 0;
  const rated = stops.filter((s) => !s.place.unrated);
  const avgScore = rated.length ? (rated.reduce((t, s) => t + s.place.locals, 0) / rated.length) : null;
  const liked = stops.filter((s) => s.rating === "up");
  const order = likedOrder ?? (recap?.favorite ? [recap.favorite] : []);
  const loved = [...liked].sort((a, b) => rank(order, a.key) - rank(order, b.key));
  const fav = recap?.favorite ? stops.find((s) => s.key === recap.favorite) : undefined;
  const byLocals = [...stops].sort((a, b) => b.place.locals - a.place.locals);
  const top = fav ? { stop: fav, why: "favorite" as const } : loved[0] ? { stop: [...loved].sort((a, b) => b.place.locals - a.place.locals)[0], why: "liked" as const } : byLocals[0] ? { stop: byLocals[0], why: "locals" as const } : null;
  const longest = [...stops].sort((a, b) => b.minutes - a.minutes)[0] ?? null;
  return { stops, legs, miles: travel.miles, travelMinutes: travel.minutes, hoursOut, avgScore: avgScore === null ? null : scoreOutOf10(avgScore), top, loved, longest };
}

const rank = (order: string[], key: string) => {
  const i = order.indexOf(key);
  return i < 0 ? 999 : i;
};

// Who came, for Strava's "Top fans": everyone who voted in a group for this plan except
// you, most "Going" votes first. Only real names people typed in when they voted.
// The demo group's test voters come back marked as test data.
export interface Fan { name: string; going: number; test: boolean }
export function topFans(groups: Record<string, Group>, planId: string, me: string): Fan[] {
  const g = Object.values(groups).find((x) => x.planId === planId);
  if (!g) return [];
  return Object.entries(g.votes)
    .filter(([name]) => name.trim().toLowerCase() !== me.trim().toLowerCase())
    .map(([name, row]) => ({ name, going: Object.values(row).filter((v) => v === "going").length, test: g.id === DEMO_ID && DEMO_VOTERS.includes(name) }))
    .sort((a, b) => b.going - a.going || a.name.localeCompare(b.name));
}

// Ionicons outline glyph per category (Strava's orange outline sport icon on the summary).
export const CATEGORY_ICON: Record<string, IconName> = {
  courts: "tennisball-outline", food: "restaurant-outline", sweets: "cafe-outline", night: "wine-outline", games: "game-controller-outline",
  active: "bicycle-outline", views: "sunny-outline", culture: "color-palette-outline", shops: "bag-handle-outline", classes: "school-outline",
};

export const fmt1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, "");
