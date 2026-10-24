// Search over a city's spots and community days. Spots match by name first, then by what the
// request asks for (parseRequest's activities and interests, scored with the planner's
// keywordStrength), a category word, or a neighborhood on its own.
import type { City, Place } from "@/data/types";
import type { CommunityDay } from "@/lib/community";
import { isOpenAt } from "@/lib/hours";
import { parseRequest } from "@/lib/parser";
import { keywordStrength } from "@/lib/planner";
import { signalCount } from "@/lib/score";
import { CATEGORIES, type CategoryId } from "@/theme/tokens";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'");
const STOP = new Set(["the", "and", "for", "with", "near", "best", "good", "spot", "spots", "place", "places", "some", "any", "around", "nearby", "locals", "local", "love", "loved", "find", "where", "what", "want", "something", "tonight", "today", "open", "now", "cheap", "fun", "new"]);

export interface SpotSearch { hits: Place[]; what: string; hood: string | null; scores: Map<string, number> }

export function searchSpots(city: City, raw: string): SpotSearch {
  const q = norm(raw.trim());
  const scores = new Map<string, number>();
  if (!q) return { hits: [], what: "", hood: null, scores };
  const req = parseRequest(raw, { hoods: city.hoods });
  const hood = req.hood;
  const acts = [...req.mustDos, ...req.interests.flatMap((i) => i.activities)];
  const kws = [...new Set(acts.flatMap((a) => a.keywords))];
  const sport = acts.find((a) => a.sport)?.sport ?? null;
  const hoodWords = hood ? norm(hood).split(/\s+/) : [];
  const cityWords = norm(city.name).split(/[^a-z]+/);
  const words = q.split(/[^a-z0-9&']+/).filter((w) => w.length > 2 && !STOP.has(w) && !hoodWords.includes(w) && !cityWords.includes(w));
  const phrase = words.join(" ");
  const cat = CATEGORIES.find((c) => [c.id, c.short, c.label.toLowerCase()].some((x) => x === phrase || x === q));

  const hits: Place[] = [];
  for (const p of city.places) {
    if (p.temporarilyClosed) continue;
    const name = norm(p.name);
    let s = 0;
    if (name === q) s = 220;
    else if (q.length >= 3 && name.includes(q)) s = 140;
    else if (words.length && words.every((w) => name.includes(w))) s = 110;
    if (kws.length) s = Math.max(s, keywordStrength(p, kws) * 30);
    else if (words.length && !cat) s = Math.max(s, keywordStrength(p, words) * 25);
    if (sport && p.court?.sport === sport) s = Math.max(s, 95);
    if (cat && p.category === cat.id) s = Math.max(s, 60);
    if (hood) {
      if (p.hood !== hood) continue;
      if (!s && !kws.length && !words.length && !cat) s = 40; // a neighborhood on its own
    }
    if (s <= 0) continue;
    scores.set(p.id, s + (p.unrated ? 10 : p.locals * 0.45) + (p.hiddenGem ? 4 : 0));
    hits.push(p);
  }
  hits.sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
  const what = acts.length ? [...new Set(acts.map((a) => a.label))].join(" and ") : cat ? cat.label.toLowerCase() : words.join(" ");
  return { hits: hits.slice(0, 60), what, hood, scores };
}

export type ResultTab = "foryou" | "popular" | "gems" | "open";

export function arrangeHits(s: SpotSearch, tab: ResultTab, interests: CategoryId[], day: number, minute: number): Place[] {
  const score = (p: Place) => (s.scores.get(p.id) ?? 0) + (interests.includes(p.category) ? 8 : 0);
  if (tab === "popular") return [...s.hits].sort((a, b) => signalCount(b) - signalCount(a));
  if (tab === "gems") return s.hits.filter((p) => p.hiddenGem);
  if (tab === "open") return s.hits.filter((p) => isOpenAt(p.hours, day, minute) === true || (p.hours == null && (p.free || p.category === "views" || Boolean(p.court))));
  return [...s.hits].sort((a, b) => score(b) - score(a));
}

export function answerLine(n: number, s: SpotSearch, raw: string): string {
  const what = s.what || raw.trim();
  if (!n) return `No spots matched "${raw.trim()}".`;
  const where = s.hood ? (what ? ` in ${s.hood}` : s.hood) : "";
  return `Found ${n} ${n === 1 ? "spot" : "spots"} locals love${what ? ` for ${what}` : " in"}${where}.`;
}

// "get more specific": the most common kinds and neighborhoods among the results.
export function refinements(s: SpotSearch, raw: string): { label: string; query: string }[] {
  const q = norm(raw);
  const kinds = new Map<string, number>();
  const hoods = new Map<string, number>();
  for (const p of s.hits.slice(0, 30)) {
    const k = (p.kind ?? "").toLowerCase();
    if (k && !q.includes(k) && !k.includes(q)) kinds.set(k, (kinds.get(k) ?? 0) + 1);
    if (p.hood && !s.hood) hoods.set(p.hood, (hoods.get(p.hood) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, n: number) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
  return [
    ...top(kinds, 2).map((k) => ({ label: `+ ${k}`, query: s.hood ? `${k} in ${s.hood}` : k })),
    ...top(hoods, 2).map((h) => ({ label: `+ in ${h}`, query: `${raw.trim()} in ${h}` })),
  ];
}

export type BrowseChip = "recs" | "trending" | "gems" | "open";

export function browse(city: City, chip: BrowseChip, interests: CategoryId[], day: number, minute: number): Place[] {
  const rated = city.places.filter((p) => !p.unrated && !p.temporarilyClosed);
  if (chip === "trending") return rated.filter((p) => p.tiktok.views > 0 || p.moments.length).sort((a, b) => b.tiktok.views + b.moments.length * 50_000 - (a.tiktok.views + a.moments.length * 50_000)).slice(0, 30);
  if (chip === "gems") return rated.filter((p) => p.hiddenGem).sort((a, b) => b.locals - a.locals).slice(0, 30);
  if (chip === "open") return rated.filter((p) => isOpenAt(p.hours, day, minute) === true).sort((a, b) => b.locals - a.locals).slice(0, 30);
  const mine = interests.length ? rated.filter((p) => interests.includes(p.category)) : rated;
  return mine.sort((a, b) => b.locals - a.locals).slice(0, 30);
}

export function searchDays(days: CommunityDay[], city: City, raw: string): CommunityDay[] {
  const q = norm(raw.trim());
  if (!q) return days;
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  return days.filter((d) => {
    const hay = norm([d.plan.title, ...d.plan.stops.map((s) => city.byId.get(s.placeId)?.name ?? ""), ...d.plan.stops.map((s) => city.byId.get(s.placeId)?.kind ?? "")].join(" | "));
    return words.every((w) => hay.includes(w));
  });
}
