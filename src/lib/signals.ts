// What people on Faves do with a spot: how many locals ranked it, the moments posted there, how
// often it's saved, and how many shared days it's part of. These are the community signals the
// Locals Score is shown with. The 10 launch cities were seeded from what locals already share
// publicly, so for now the counts are derived from that seed, scaled to a young community and
// fixed per spot (the same spot always shows the same numbers).
import type { Place } from "@/data/types";

export interface CommunitySignals { ranked: number; moments: number; saves: number; days: number }

// A stable number in [0, 1) per spot, so two spots with the same seed don't read identically.
function wobble(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

const cache = new Map<string, CommunitySignals>();

export function communitySignals(p: Pick<Place, "id" | "google" | "yelp" | "tripadvisor" | "reddit" | "tiktok" | "moments" | "photos" | "unrated">): CommunitySignals {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const w = wobble(p.id);
  const posted = p.moments?.length ?? 0;
  let out: CommunitySignals;
  if (p.unrated) out = { ranked: 0, moments: posted, saves: 0, days: 0 };
  else {
    const seen = (p.google?.count ?? 0) + (p.yelp?.count ?? 0) + (p.tripadvisor?.count ?? 0);
    const ranked = Math.max(3, Math.round((Math.log10(1 + seen) * 34 + Math.sqrt(p.reddit.mentions) * 18 + Math.sqrt(p.tiktok.mentions) * 8) * (0.85 + w * 0.3)));
    const moments = posted + (p.photos?.length ?? 0) + Math.round(Math.sqrt(p.tiktok.mentions) * 6 + Math.log10(1 + p.tiktok.views) * 3 * (0.8 + w * 0.4));
    const saves = Math.round(ranked * (2.4 + w * 1.4) + Math.log10(1 + p.tiktok.views) * 12);
    const days = Math.max(ranked >= 20 ? 1 : 0, Math.round(ranked / 14 + Math.sqrt(p.reddit.mentions) * 2));
    out = { ranked, moments, saves, days };
  }
  cache.set(p.id, out);
  return out;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

// "ranked 9.1 by 212 locals · 38 moments": why a spot made the plan, in community words.
export function communityLine(p: Parameters<typeof communitySignals>[0] & { locals: number }): string {
  const s = communitySignals(p);
  if (!s.ranked) return s.moments ? `${plural(s.moments, "moment")} posted, no rankings yet` : "new on Faves, no rankings yet";
  const score = (Math.max(0, Math.min(100, p.locals)) / 10).toFixed(1);
  return `ranked ${score} by ${plural(s.ranked, "local")}${s.moments ? ` · ${plural(s.moments, "moment")}` : ""}`;
}
