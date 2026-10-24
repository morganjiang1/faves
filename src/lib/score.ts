// How the Locals Score and its parts read on screen. The score itself is computed by
// data/scripts/build.mjs (quality from review-count-adjusted ratings, local love from Reddit
// and TikTok mentions); here it is shown Beli-style on a 10-point scale.
import type { Place } from "@/data/types";

export const scoreOutOf10 = (locals: number) => (Math.max(0, Math.min(100, locals)) / 10).toFixed(1);

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}K`;
  return String(n);
}

// Number of signals behind the score (Beli's "2k" count badge).
export function signalCount(p: Place): number {
  return (p.google?.count ?? 0) + (p.yelp?.count ?? 0) + (p.tripadvisor?.count ?? 0) + p.reddit.mentions + p.tiktok.mentions;
}

// Corner's quantified rarity line: "only 22 reviews on google".
export function gemLine(p: Place): string | null {
  if (!p.hiddenGem) return null;
  const g = p.google?.count ?? 0;
  if (g && g < 1000) return `only ${g} reviews on google`;
  if (p.reddit.mentions) return `${p.reddit.mentions} locals vouch for it on reddit`;
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

// One plain sentence on why locals rate it, built only from the real signals.
export function whyLocals(p: Place, subreddit?: string): string {
  const parts: string[] = [];
  if (p.reddit.mentions) parts.push(`named ${p.reddit.mentions} ${p.reddit.mentions === 1 ? "time" : "times"} on r/${subreddit ?? "city"}`);
  if (p.tiktok.mentions) parts.push(`in ${p.tiktok.mentions} TikTok ${p.tiktok.mentions === 1 ? "post" : "posts"} (${compact(p.tiktok.views)} views)`);
  if (p.google) parts.push(`${p.google.rating.toFixed(1)} on Google from ${compact(p.google.count)} reviews`);
  if (!parts.length) return "No ratings yet";
  return parts.join(", ");
}

// Yelp's own price ranges per person.
const YELP_PRICE = { 1: "Under $10", 2: "$11 to 30", 3: "$31 to 60", 4: "Over $61" } as const;
const PRICE_MID = { 1: 8, 2: 20, 3: 45, 4: 80 } as const;
// Typical spend per person when no price is listed (used only for plan budgets, marked "est.").
const TYPICAL: Record<string, number> = { food: 20, sweets: 8, night: 15, games: 25, active: 30, culture: 20, shops: 0, classes: 45, views: 0, courts: 0 };

export interface Cost { label: string; perPerson: number; estimated: boolean; dollars: string | null }

export function costOf(p: Place): Cost {
  if (p.priceLevel) return { label: `${YELP_PRICE[p.priceLevel]} per person`, perPerson: PRICE_MID[p.priceLevel], estimated: false, dollars: "$".repeat(p.priceLevel) };
  if (p.free) return { label: "Free", perPerson: 0, estimated: false, dollars: null };
  return { label: "Price not listed", perPerson: TYPICAL[p.category] ?? 15, estimated: true, dollars: null };
}
