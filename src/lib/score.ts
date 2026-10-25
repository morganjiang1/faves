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

// A quote as people should read it: no list bullet, markdown or extra spaces.
export const cleanQuote = (text: string): string => {
  const t = text.replace(/\*\*|__/g, "").replace(/^\s*(?:\\?[-•*]+|\d+[.)])\s*/, "").replace(/\s+/g, " ").trim().replace(/^(and|also|plus) (?=[A-Z])/i, "");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const fold = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const GENERIC = new Set(["the", "and", "park", "street", "cafe", "restaurant", "bar", "museum", "shop", "store", "house", "center", "san", "francisco", "new", "york", "los", "angeles"]);
// Trip planning and tourist checklists, not a take on the spot itself.
const TRIP = /\b(tourist(y)? stuff|touristy|itinerary|my trip|our trip|this trip|the trip|trip to|day \d+|first time (in|visiting|to)|we('| a)re doing|we want to|looking for|any (recs|recommendations|suggestions)|what should|planning|bus tour|hop on|layover|honeymoon|visiting (sf|san francisco|the city)|my list|top list|your list)\b/i;
const LOVE = /\b(best|great|love[sd]?|favou?rite|amazing|awesome|underrated|gem|incredible|epic|perfect|spectacular|killer|delicious|iconic|institution|must)\b/i;
const LIKE = /\b(good|nice|cool|fun|lovely|pretty|views?|solid|beautiful|gorgeous|stunning|charming|cozy|chill|worth|famous|tasty|recommend)\b/i;
const TIP = /\b(check out|go|get|try|grab|walk|hike|bring|don'?t miss|order)\b/i;
const TIP_FIRST = /^(also |definitely |just )?(check out|go|get|try|grab|walk|hike|bring|don'?t miss|order)\b/i;
// A local's take is a reason to go: never lukewarm, hedged or a knock on the spot.
const LUKEWARM = /\b(not (a |really a |that much of a )?must|not worth|not really worth|overrated|over-rated|but i don'?t know|i don'?t know if|meh|skip|stay away|avoid|touristy|tourist trap|crowded|imo|imho|in my opinion|underwhelming|disappointing|mediocre|don'?t bother|not that (great|good|special))\b/i;

// How good a local quote is as the take on this spot, or null to never show it. It has to be
// about the spot (it names it or its kind), a real sentence (praise, a tip, or a full thought),
// and never lukewarm or a knock ("not a must-see", "stay away", "IMO"), a trip plan, a question,
// a mid-sentence fragment, a list (of places, or lines split by "/"), or a mention of another
// platform. Praise counts most.
export function quoteScore(text: string, place: { name: string; kind?: string | null }): number | null {
  const t = cleanQuote(text);
  const words = t.split(" ").filter((w) => /[a-z0-9]/i.test(w));
  const straight = t.replace(/[’‘]/g, "'");
  if (mentionsElsewhere(t) || TRIP.test(straight) || LUKEWARM.test(straight) || /^(\.\.\.|…)/.test(t) || /\?\s*$/.test(t) || words.length < 6) return null;
  // A line that's mostly a list ("NightLife at Cal Academy / After Dark at the Exploratorium").
  if (/\s\/\s|\n/.test(text) || (t.match(/\//g) ?? []).length >= 2) return null;
  // A list of three or more places ("Alcatraz, Golden Gate Bridge, Painted Ladies, ...").
  const named = t.split(/[,;/()]|\band\b/).map((x) => x.trim()).filter((x) => /^[A-Z]/.test(x) && x.split(" ").length <= 4);
  if (named.length >= 3) return null;
  // About the spot: it names it (or its kind), and not only in an aside in parentheses.
  const body = fold(t.replace(/\([^)]*\)/g, " "));
  if (fold(place.name).replace(/[^a-z0-9]+/g, " ").trim() === body.replace(/[^a-z0-9]+/g, " ").trim()) return null;
  const keys = [...fold(place.name).split(/[^a-z0-9]+/), ...fold(place.kind ?? "").split(/[^a-z0-9]+/)].filter((w) => w.length >= 4 && !GENERIC.has(w));
  if (!keys.some((k) => body.includes(k))) return null;
  const praise = LOVE.test(t) ? 3 : LIKE.test(t) ? 2 : 0;
  if (!praise && !TIP.test(t) && words.length < 10) return null;
  return praise + (TIP_FIRST.test(t) ? 1 : 0) + (t.length >= 30 && t.length <= 180 ? 1 : 0) - (t.length > 240 ? 1 : 0);
}

// The local quote worth showing: the best-scoring one about this spot, cleaned up, or none.
export function bestQuote<Q extends { text: string }>(place: { name: string; kind?: string | null; quotes: Q[] }): Q | null {
  let best: { q: Q; score: number } | null = null;
  for (const q of place.quotes) {
    const score = quoteScore(q.text, place);
    if (score != null && (!best || score > best.score)) best = { q, score };
  }
  return best ? { ...best.q, text: cleanQuote(best.q.text) } : null;
}
