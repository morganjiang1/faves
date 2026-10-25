// One shape for every post in the Community feed and on a day page: the sample community
// days (real places, sample people) and the user's own posted days. Notes are never
// invented: a post shows the user's own note or a real scraped quote about one of its
// stops, with its source.
import type { City, Place, Quote } from "@/data/types";
import type { CommunityDay } from "@/lib/community";
import type { Plan } from "@/lib/planner";
import type { Who } from "@/lib/parser";
import type { AppState, MyPost } from "@/state/store";
import type { IconName } from "@/components/ui";
import { mentionsElsewhere } from "@/lib/score";

export interface DayPost {
  id: string; // the /day/<id> route id
  kind: "community" | "mine";
  plan: Plan;
  author: { name: string; handle: string };
  sample: boolean;
  doneCount: number | null; // sample count for community days
  likes: number; // likes before the user's own
  at: Date;
  quote: { placeName: string; quote: Quote } | null;
  note: string | null; // the user's own note on their post
}

const DAY = 86_400_000;
const clean = (t: string) => t.replace(/\s+/g, " ").trim();

export function fromCommunity(day: CommunityDay, city: City, now: number): DayPost {
  return {
    id: day.id,
    kind: "community",
    plan: day.plan,
    author: day.author,
    sample: true,
    doneCount: day.doneCount,
    likes: day.likes,
    at: new Date(now - day.daysAgo * DAY),
    quote: day.quote ? { placeName: day.quote.placeName, quote: { ...day.quote.quote, text: clean(day.quote.quote.text) } } : bestQuote(day.plan, city, null),
    note: null,
  };
}

export function fromMine(post: MyPost, plan: Plan, city: City, profile: AppState["profile"]): DayPost {
  return {
    id: post.id,
    kind: "mine",
    plan,
    author: { name: profile.name || "You", handle: profile.handle || "you" },
    sample: false,
    doneCount: null,
    likes: 0,
    at: new Date(post.at),
    quote: post.note.trim() ? null : bestQuote(plan, city, null),
    note: post.note.trim() || null,
  };
}

// A plan the user made but never posted still opens as a day page.
export function fromPlan(plan: Plan, city: City, profile: AppState["profile"]): DayPost {
  return { ...fromMine({ id: plan.id, planId: plan.id, city: plan.citySlug, title: plan.title, note: "", at: plan.createdAt }, plan, city, profile), id: plan.id };
}

// Prefer the community day's own quote; if it is only a name or a scrap, use a fuller real
// quote from another stop. Quotes are shown exactly as scraped (whitespace tidied).
export function bestQuote(plan: Plan, city: City, preferred: { placeName: string; quote: Quote } | null): { placeName: string; quote: Quote } | null {
  if (preferred && clean(preferred.quote.text).length >= 40 && !mentionsElsewhere(preferred.quote.text)) return { placeName: preferred.placeName, quote: { ...preferred.quote, text: clean(preferred.quote.text) } };
  for (const s of plan.stops) {
    const p = city.byId.get(s.placeId);
    const q = p?.quotes.find((x) => clean(x.text).length >= 40 && clean(x.text).length <= 260 && !mentionsElsewhere(x.text));
    if (p && q) return { placeName: p.name, quote: { ...q, text: clean(q.text) } };
  }
  return preferred && !mentionsElsewhere(preferred.quote.text) ? preferred : null;
}

export function stopPlaces(plan: Plan, city: City): Place[] {
  return plan.stops.map((s) => city.byId.get(s.placeId)).filter((p): p is Place => Boolean(p));
}

// The day's Locals Score: the average of its rated stops, Beli-style out of 10.
export function dayScore(plan: Plan, city: City): number | null {
  const rated = stopPlaces(plan, city).filter((p) => !p.unrated);
  if (!rated.length) return null;
  return rated.reduce((s, p) => s + p.locals, 0) / rated.length;
}

export function mainHood(plan: Plan, city: City): string {
  const counts = new Map<string, number>();
  for (const p of stopPlaces(plan, city)) if (p.hood) counts.set(p.hood, (counts.get(p.hood) ?? 0) + 1);
  let best: string | null = null, n = 0;
  for (const [h, c] of counts) if (c > n) { best = h; n = c; }
  return best ?? plan.request.hood ?? city.name;
}

export function mainCategory(plan: Plan, city: City): string {
  return stopPlaces(plan, city)[0]?.category ?? "food";
}

// "with friends" after the title, unless the title already says who it was with.
export function withWhom(who: Who | null, size: number, title = ""): string {
  const t = title.toLowerCase();
  if ((who === "date" && t.includes("date")) || (who === "friends" && t.includes("friend")) || (who === "family" && t.includes("family")) || (who === "solo" && t.includes("solo")) || (who === "catch-up" && t.includes("catch"))) return "";
  switch (who) {
    case "friends": return size > 2 ? "with friends" : "with a friend";
    case "date": return "on a date";
    case "family": return "with family";
    case "solo": return "solo";
    case "catch-up": return "with an old friend";
    default: return "";
  }
}

// Beli's grey category glyph in the meta line (its fork-and-knife), from Ionicons.
const GLYPH: Record<string, IconName> = {
  courts: "tennisball-outline", food: "restaurant-outline", sweets: "cafe-outline", night: "wine-outline", games: "game-controller-outline",
  active: "bicycle-outline", views: "sunny-outline", culture: "color-palette-outline", shops: "bag-handle-outline", classes: "school-outline",
};
export const categoryGlyph = (category: string): IconName => GLYPH[category] ?? "location-outline";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// Beli's post date: "January 17" (with the year when it isn't this year).
export function postDate(d: Date, now = new Date()): string {
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

export function monthYear(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Plans copied with "Do this day" carry the source day's id (lib/community.ts doThisDay).
export const copiedFrom = (plan: { id: string }): string | null => (plan.id.includes("-mine-") ? plan.id.slice(0, plan.id.indexOf("-mine-")) : null);
