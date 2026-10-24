// What Home shows, in the order people want on open: what's worth doing this week, then
// tonight, this weekend, the most-done days and hidden gems.
import type { City, Place } from "@/data/types";
import { CLIPS } from "@/data/videos";
import { isOpenAt } from "./hours";
import { sunTimes } from "./sunset";
import { cityClock, offsetHours, wallDateFor } from "./time";

const hasClip = (p: Place) => Boolean(CLIPS[p.id]);

// "This week" weight: the Locals Score, how much locals are talking about it right now
// (TikTok and Reddit), and a nudge for spots with a clip to show.
export function buzz(p: Place): number {
  return p.locals + Math.min(12, Math.log10(1 + p.tiktok.views) * 2) + Math.min(8, p.reddit.mentions * 1.5) + (p.tiktokPick ? 6 : 0) + (hasClip(p) ? 10 : 0);
}

function diverse(list: Place[], n: number, perCategory = 2): Place[] {
  const counts = new Map<string, number>();
  const out: Place[] = [];
  for (const p of list) {
    const c = counts.get(p.category) ?? 0;
    if (c >= perCategory) continue;
    counts.set(p.category, c + 1);
    out.push(p);
    if (out.length >= n) break;
  }
  return out;
}

const showable = (p: Place) => !p.unrated && !p.court && !p.temporarilyClosed && (p.image || hasClip(p));

export function topTen(city: City): Place[] {
  return diverse(city.places.filter(showable).sort((a, b) => buzz(b) - buzz(a)), 10);
}

// Open tonight (from 7 PM, or now if later): food, drinks, shows, games, and views around sunset.
export function tonight(city: City, now = new Date(), exclude: Set<string> = new Set()): { places: Place[]; sunset: number | null; from: number } {
  const clock = cityClock(city.utcOffset, now);
  const from = Math.max(19 * 60, clock.minutes + 30);
  const date = wallDateFor(city.utcOffset, { offsetDays: 0 }, now);
  const sun = sunTimes(city.center.lat, city.center.lng, date, offsetHours(city.utcOffset, now));
  const night = new Set(["night", "food", "games", "culture", "sweets"]);
  const list = city.places.filter((p) => showable(p) && !exclude.has(p.id) && (
    (night.has(p.category) && isOpenAt(p.hours, clock.day, from) === true) ||
    (p.category === "views" && sun != null && clock.minutes < sun.sunset && (p.hours == null || isOpenAt(p.hours, clock.day, sun.sunset - 30) === true))
  ));
  return { places: diverse(list.sort((a, b) => buzz(b) - buzz(a)), 10, 3), sunset: sun?.sunset ?? null, from };
}

// Open Saturday afternoon: the best of every kind of thing to do.
export function thisWeekend(city: City, exclude: Set<string>, now = new Date()): Place[] {
  const sat = wallDateFor(city.utcOffset, { weekday: 6 }, now);
  const day = sat.getUTCDay();
  const list = city.places.filter((p) => showable(p) && !exclude.has(p.id) && p.category !== "food" && (isOpenAt(p.hours, day, 14 * 60) === true || (p.hours == null && (p.free || p.category === "views"))));
  return diverse(list.sort((a, b) => buzz(b) - buzz(a)), 10, 2);
}

export function hiddenGems(city: City, exclude: Set<string>): Place[] {
  return city.places.filter((p) => showable(p) && p.hiddenGem && !exclude.has(p.id)).sort((a, b) => buzz(b) - buzz(a)).slice(0, 12);
}
