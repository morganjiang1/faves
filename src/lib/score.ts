// How the Locals Score and its parts read on screen, on a 10-point scale. The score is what
// people on Faves say about a spot (rankings, moments, saves; see lib/signals.ts). The launch
// cities' scores were seeded by data/scripts/build.mjs from what locals already share publicly.
import type { Place } from "@/data/types";
import { communitySignals } from "./signals";

export const scoreOutOf10 = (locals: number) => (Math.max(0, Math.min(100, locals)) / 10).toFixed(1);

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

// How many locals ranked it: the count on the score stamp.
export const rankedBy = (p: Place): number => communitySignals(p).ranked;

// Everything behind the seeded score, for sorting by popularity (never shown as a count).
export function signalCount(p: Place): number {
  return (p.google?.count ?? 0) + (p.yelp?.count ?? 0) + (p.tripadvisor?.count ?? 0) + p.reddit.mentions + p.tiktok.mentions;
}

// A hidden gem's line: locals rate it highly and few visitors have found it yet.
export function gemLine(p: Place): string | null {
  if (!p.hiddenGem) return null;
  const g = p.google?.count ?? 0;
  if (g && g < 1000) return "loved by locals, few visitors yet";
  if (p.reddit.mentions) return `${communitySignals(p).ranked} locals vouch for it`;
  return "locals love it, tourists haven't found it";
}

// Corner's vibe line: a short descriptor in lowercase.
export function vibeLine(p: Place): string {
  const k = (p.kind ?? "").toLowerCase();
  if (p.court) return `${p.court.count > 1 ? `${p.court.count} courts` : "1 court"}${p.court.lit ? ", lit at night" : ""}`;
  if (p.hiddenGem && k) return `lowkey ${k}`;
  if (p.localLove >= 80 && k) return `locals' favorite ${k}`;
  return k || p.category;
}

// One plain line on why locals rate it, from what people on Faves do with it.
export function whyLocals(p: Place): string {
  const s = communitySignals(p);
  if (!s.ranked) return "No rankings yet";
  return [`ranked by ${s.ranked} locals`, s.moments ? `${s.moments} moments posted` : "", s.saves ? `saved ${compact(s.saves)} times` : ""].filter(Boolean).join(", ");
}

// Yelp's own price ranges per person.
const YELP_PRICE = { 1: "Under $10", 2: "$11 to 30", 3: "$31 to 60", 4: "Over $61" } as const;
// What one person actually spends at each price level, by kind of place: a "$$" cafe is a
// $7 coffee, a "$$" restaurant a $22 meal.
const SPEND: Record<string, Record<1 | 2 | 3 | 4, number>> = {
  sweets: { 1: 5, 2: 7, 3: 12, 4: 20 },
  food: { 1: 12, 2: 22, 3: 40, 4: 75 },
  night: { 1: 10, 2: 16, 3: 28, 4: 45 },
  default: { 1: 8, 2: 18, 3: 35, 4: 60 },
};
// Typical spend per person when no price is listed (used only for plan budgets, marked "est.").
// Parks, views, public courts and markets you walk through cost nothing.
const TYPICAL: Record<string, number> = { food: 18, sweets: 6, night: 14, games: 22, active: 20, culture: 15, shops: 0, classes: 40, views: 0, courts: 0 };
const FREE_KIND = /\b(park|garden|beach|trail|viewpoint|vista point|scenic|plaza|square|pier|bridge|stairs|steps|lookout|playground|court|recreation center|library|public)\b/i;

export interface Cost { label: string; perPerson: number; estimated: boolean; dollars: string | null }

export function costOf(p: Place): Cost {
  if (p.priceLevel) return { label: `${YELP_PRICE[p.priceLevel]} per person`, perPerson: (SPEND[p.category] ?? SPEND.default)[p.priceLevel], estimated: false, dollars: "$".repeat(p.priceLevel) };
  if (p.free || p.court) return { label: "Free", perPerson: 0, estimated: false, dollars: null };
  if (FREE_KIND.test(p.kind ?? "") && !/museum|club|gym|studio|center for/i.test(p.kind ?? "")) return { label: "Free to visit", perPerson: 0, estimated: true, dollars: null };
  return { label: "Price not listed", perPerson: TYPICAL[p.category] ?? 15, estimated: true, dollars: null };
}

// A quote that talks about another platform ("I saw it on TikTok") isn't shown: Faves shows what
// locals say, never where else they said it.
export const mentionsElsewhere = (text: string): boolean => /\b(google|yelp|tripadvisor|reddit|tiktok)\b|\br\/[a-z]/i.test(text);

// The local quote worth showing: a real sentence, not just the place's name.
export function bestQuote<Q extends { text: string }>(place: { name: string; quotes: Q[] }): Q | null {
  const name = place.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return place.quotes.find((q) => {
    if (mentionsElsewhere(q.text)) return false;
    const t = q.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return t.length >= 24 && t !== name && t.split(" ").length >= 5;
  }) ?? null;
}
