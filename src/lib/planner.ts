// The planner agent, deterministic path. Given a parsed request and a city, it builds the
// day: which kinds of stops, which place for each (Locals Score, category, open when you get
// there, close to the last stop, inside the budget), in what order, with travel legs, a
// Plan B per stop and a plain reason for every pick. Sunset is computed, not fetched.
import type { City, Place } from "@/data/types";
import type { CategoryId } from "@/theme/tokens";
import { CATEGORIES } from "@/theme/tokens";
import { bestLeg, legFor, metersBetween, type LatLng, type Leg, type Mode } from "./geo";
import { fairnessFor, fairPick, middleOf, type Fairness, type Start } from "./fair";
import { isOpenAt, nextOpen, openForVisit } from "./hours";
import type { Activity, PlanRequest, Sport, Who } from "./parser";
import { costOf, compact, scoreOutOf10 } from "./score";
import { sunTimes } from "./sunset";
import { cityClock, formatClock, offsetHours, wallDateFor, DAY_NAMES, MONTHS } from "./time";

export interface Slot {
  label: string;
  categories: CategoryId[];
  keywords: string[];
  sport?: Sport;
  mustDo: boolean;
  interest?: string;
  anchor?: "meal" | "sunset" | "late" | "morning";
  duration: number;
}

export interface PlanStop {
  key: string;
  placeId: string;
  slot: Slot;
  start: number;
  end: number;
  leg: Leg | null;
  why: string;
  planB: string[];
  warnings: string[];
}

export interface Plan {
  id: string;
  citySlug: string;
  cityName: string;
  createdAt: string;
  request: PlanRequest;
  title: string;
  dateISO: string;
  dayLabel: string;
  weekday: number;
  start: number;
  end: number;
  transport: Mode;
  groupSize: number;
  stops: PlanStop[];
  sunset: number | null;
  notes: string[];
  source: "rules" | "model";
  revision: number;
  log: string[];
  legModes?: Record<string, Mode>; // a leg's travel mode picked by hand (by stop key)
  fairness?: Fairness | null; // group plans: each member's trip to the first stop and home
}

export interface PlanContext {
  city: City;
  now?: Date;
  origin?: LatLng | null;
  defaultTransport?: Mode;
  profileInterests?: CategoryId[];
  exclude?: Set<string>;
  idSeed?: string;
  includePlace?: string; // "Add to a day" from a place page: the day is built around it
  starts?: Start[]; // group plans: everyone's starting point; the first stop is fair to all
}

// How long people stay, by kind of stop (minutes).
const DURATION: Record<CategoryId, number> = { food: 75, sweets: 35, night: 90, games: 75, active: 90, views: 45, culture: 90, shops: 40, classes: 120, courts: 90 };
const OUTDOOR = new Set<CategoryId>(["views", "courts"]);
const OUTDOOR_WORDS = /\b(park|beach|trail|hiking|garden|viewpoint|scenic|kayak|bike|outdoor|pier|lookout|stairs|steps|plaza|dunes|field|playground)\b/i;
const ACTIVITY: CategoryId[] = ["games", "culture", "active", "classes", "shops", "courts", "views"];

const slot = (label: string, categories: CategoryId[], extra: Partial<Slot> = {}): Slot => ({
  label, categories, keywords: [], mustDo: false, duration: DURATION[categories[0]], ...extra,
});

function templateFor(req: PlanRequest, profile: CategoryId[] | undefined, start: number): Slot[] {
  const late = start >= 17 * 60 + 30;
  const morning = start < 11 * 60;
  const activityCats = (who: Who | null): CategoryId[] => {
    if (req.rain) return ["culture", "games", "classes", "shops"];
    if (who === "date") return ["culture", "games", "classes"];
    if (who === "family") return ["culture", "views", "games"];
    if (who === "solo") return ["culture", "shops", "views"];
    if (req.vibes.includes("active")) return ["active", "courts", "games"];
    if (req.vibes.includes("outdoors")) return ["views", "active"];
    if (profile?.length) return profile.filter((c) => !["food", "sweets", "night"].includes(c)).concat(["games", "culture"]) as CategoryId[];
    return ["games", "culture", "active"];
  };
  const act = slot("something to do", activityCats(req.who));
  const meal = slot(late ? "dinner" : morning ? "brunch" : "food", ["food"], { anchor: "meal", duration: req.who === "date" || req.who === "catch-up" ? 90 : 75 });
  const view = slot(req.rain ? "somewhere cozy" : "a view", req.rain ? ["culture", "sweets"] : ["views"], { anchor: req.rain ? undefined : "sunset", keywords: req.rain ? [] : ["view", "scenic", "lookout", "overlook", "observation", "beach", "park", "hill", "peak", "pier"] });
  const sweet = slot("dessert", ["sweets"]);
  const coffee = slot("coffee", ["sweets"], { keywords: ["coffee", "cafe", "espresso"], anchor: "morning" });
  const drinks = slot("drinks", ["night"], { anchor: "late" });

  if (late) {
    if (req.who === "date") return [meal, req.rain ? sweet : view, drinks];
    if (req.who === "family") return [meal, sweet];
    return [meal, drinks, req.vibes.includes("late") ? slot("late night", ["night", "games"], { anchor: "late" }) : sweet];
  }
  const lead = morning ? [coffee] : [];
  switch (req.who) {
    case "date": return [...lead, act, meal, view, sweet];
    case "friends": return [...lead, act, meal, drinks];
    case "family": return [...lead, act, view, meal, sweet];
    case "solo": return [...lead, act, sweet, view];
    case "catch-up": return [coffee, act, meal];
    default: return [...lead, act, meal, view];
  }
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
interface Hay { main: string; desc: string; quotes: string }
const hayCache = new WeakMap<Place, Hay>();
function hay(p: Place): Hay {
  let h = hayCache.get(p);
  if (!h) {
    h = {
      main: norm([p.name, p.kind, ...p.kinds, p.court?.sport ?? ""].join(" | ")),
      desc: norm(p.description ?? ""),
      quotes: norm(p.quotes.map((q) => q.text).join(" | ")),
    };
    hayCache.set(p, h);
  }
  return h;
}
const kwRe = new Map<string, RegExp>();
const re = (k: string) => {
  let r = kwRe.get(k);
  if (!r) { r = new RegExp(`\\b${esc(norm(k))}`); kwRe.set(k, r); }
  return r;
};
// How well a place matches a list of keywords: 3 = in its name or kind, 2 = in its
// description, 1 = only in what locals said about it, 0 = no match.
export function keywordStrength(p: Place, kws: string[]): number {
  const h = hay(p);
  let best = 0;
  for (const k of kws) {
    const r = re(k);
    if (r.test(h.main)) return 3;
    if (best < 2 && r.test(h.desc)) best = 2;
    else if (best < 1 && r.test(h.quotes)) best = 1;
  }
  return best;
}
export const matchesKeywords = (p: Place, kws: string[], withQuotes = false) => keywordStrength(p, kws) >= (withQuotes ? 1 : 2);

// How many of the keywords a place matches (name and kind count fully, the description a
// bit less, quotes the least): a model shop selling anime figures beats a cafe that once
// listed "hobby store" among its categories.
export function keywordHits(p: Place, kws: string[]): number {
  const h = hay(p);
  let hits = 0;
  for (const k of kws) {
    const r = re(k);
    hits += r.test(h.main) ? 1 : r.test(h.desc) ? 0.7 : r.test(h.quotes) ? 0.3 : 0;
  }
  return hits;
}

function sportMatch(p: Place, sport: Sport): boolean {
  if (p.court) return p.court.sport === sport;
  return hay(p).main.includes(sport);
}

function isOutdoor(p: Place): boolean {
  if (p.court) return !/indoor/.test(hay(p).main);
  return OUTDOOR.has(p.category) || OUTDOOR_WORDS.test(p.kind ?? "") || (p.category === "active" && !/gym|climbing|indoor/.test(hay(p).main));
}

function slotFromActivity(x: Activity, opts: { mustDo?: boolean; interest?: string } = {}): Slot {
  return {
    label: x.label,
    categories: x.category === "courts" ? ["courts"] : [x.category],
    keywords: x.keywords,
    sport: x.sport,
    mustDo: Boolean(opts.mustDo),
    interest: opts.interest,
    anchor: x.label === "coffee" || x.label === "bakery" ? "morning" : x.category === "food" ? "meal" : x.category === "night" ? "late" : x.label === "a view" ? "sunset" : undefined,
    duration: DURATION[x.category],
  };
}

// Put the request's must-dos and interests into the day's template.
// When in the day a stop is at its best (wall-clock minutes).
function idealTime(s: Slot, i: number, start: number, end: number, sunset: number | null): number {
  const spans = (a: number, b: number) => start <= b && end >= a;
  if (s.anchor === "morning") return start - 1;
  if (s.anchor === "sunset") return sunset != null && sunset - 40 >= start && sunset - 40 <= end ? sunset - 40 : start + (end - start) * 0.7;
  if (s.anchor === "late") return Math.max(20 * 60, end - 90);
  if (s.anchor === "meal") {
    if (spans(18 * 60, 19 * 60 + 30)) return Math.max(start, 18 * 60 + 15);
    if (spans(12 * 60, 13 * 60 + 30)) return Math.max(start, 12 * 60 + 15);
    return start + (end - start) * 0.5;
  }
  if (s.categories[0] === "sweets") return start + (end - start) * 0.75;
  return start + i * 10; // things to do lead the day
}

export function buildSlots(req: PlanRequest, start: number, profile?: CategoryId[], sunset: number | null = null, end: number | null = null): Slot[] {
  const slots = templateFor(req, profile, start);
  const fixed: Slot[] = [];
  for (const i of req.interests) fixed.push(slotFromActivity(i.activities[0], { interest: i.word }));
  for (const m of req.mustDos) fixed.push(slotFromActivity(m, { mustDo: true }));

  const used = new Set<number>();
  const placed: { at: number; s: Slot }[] = [];
  for (const f of fixed) {
    // Replace the first open template slot that takes this kind of stop.
    let idx = slots.findIndex((s, i) => !used.has(i) && s.categories.includes(f.categories[0]));
    if (idx < 0 && ACTIVITY.includes(f.categories[0])) idx = slots.findIndex((s, i) => !used.has(i) && s.label === "something to do");
    if (idx < 0) { slots.splice(Math.min(1, slots.length), 0, f); used.add(Math.min(1, slots.length - 1)); placed.push({ at: Math.min(1, slots.length - 1), s: f }); continue; }
    slots[idx] = f;
    used.add(idx);
    placed.push({ at: idx, s: f });
  }
  // Order the day by when each stop is best (coffee first, a view in the hour before
  // sunset, dinner at dinner time, drinks late), unless the request said "X then Y".
  if (sunset != null && end != null) {
    const ideal = slots.map((s, i) => ({ s, i, t: idealTime(s, i, start, end, sunset) }));
    ideal.sort((x, y) => x.t - y.t || x.i - y.i);
    slots.splice(0, slots.length, ...ideal.map((x) => x.s));
  }
  // "X then Y" keeps X before Y; with no sunset to plan around, keep the order said.
  const pairs: [string, string][] = sunset == null ? req.mustDos.slice(1).map((m, i) => [req.mustDos[i].label, m.label]) : req.then ?? [];
  for (let pass = 0; pass < 3; pass++) {
    for (const [x, y] of pairs) {
      const ix = slots.findIndex((s) => s.mustDo && s.label === x), iy = slots.findIndex((s) => s.mustDo && s.label === y);
      if (ix > iy && iy >= 0) { const [moved] = slots.splice(ix, 1); slots.splice(iy, 0, moved); }
    }
  }
  // Drop a generic template stop that now repeats a must-do's kind right next to it.
  return slots.filter((s, i) => s.mustDo || s.interest || !slots.some((o, j) => j !== i && (o.mustDo || o.interest) && o.categories[0] === s.categories[0] && s.categories.length === 1));
}

export interface Candidate { place: Place; score: number; arrive: number; leg: Leg | null; reasons: string[]; warnings: string[] }

interface PickState {
  city: City;
  req: PlanRequest;
  day: number;
  mode: Mode;
  used: Set<string>;
  exclude: Set<string>;
  sunset: number | null;
  windowStart: number;
  windowEnd: number;
  center: LatLng | null;
  toward?: LatLng | null; // the next stop when it is already fixed: pick things on the way
  ahead?: LatLng[]; // fixed stops later in the day (after the next one): don't stop near them now
}

function baseScore(p: Place, s: Slot, req: PlanRequest): number {
  if (s.interest && s.keywords.length) {
    // For a niche interest, how well it fits matters more than how famous it is.
    return p.locals * 0.5 + keywordHits(p, s.keywords) * 22 + (keywordStrength(p, s.keywords.slice(0, 2)) === 3 ? 25 : 0) + (p.hiddenGem ? 5 : 0);
  }
  let score = p.unrated ? 38 : p.locals;
  // A real court for the sport beats a club that lists it among many categories.
  if (s.sport && (p.court?.sport === s.sport || `${p.name} ${p.kind ?? ""}`.toLowerCase().includes(s.sport))) score += 15;
  if (p.court) score += (p.court.lit ? 6 : 0) + Math.min(12, p.court.count * 3);
  if (p.hiddenGem) score += req.vibes.includes("local") ? 18 : 10;
  if (p.localPick) score += 6;
  if (req.vibes.includes("local")) score += (100 - p.exposure) * 0.2;
  if (req.vibes.includes("fancy") && p.priceLevel) score += p.priceLevel * 5;
  if (req.budgetWord === "cheap" && (p.free || p.priceLevel === 1)) score += 8;
  if (s.keywords.length) {
    const k = keywordStrength(p, s.keywords);
    score += k === 3 ? (s.interest ? 35 : 20) : k === 2 ? (s.interest ? 15 : 10) : k === 1 ? 6 : 0;
    // The first keywords are the exact thing asked for ("gundam" before "hobby").
    if (k === 3 && keywordStrength(p, s.keywords.slice(0, 2)) === 3) score += 10;
    score += Math.min(18, Math.max(0, keywordHits(p, s.keywords) - 1) * 6);
  }
  return score;
}

const addressKey = (a: string | null) => (a ? a.toLowerCase().split(",")[0].replace(/\b(ste|suite|unit|#)\s*\S+/g, "").replace(/[^a-z0-9]/g, "") : "");

export function sameOuting(a: Place, b: Place): boolean {
  if (a.id === b.id) return true;
  if (metersBetween(a, b) < 150) return true;
  const ka = addressKey(a.address), kb = addressKey(b.address);
  if (ka && ka === kb) return true;
  const na = a.name.toLowerCase(), nb = b.name.toLowerCase();
  return na.startsWith(nb) || nb.startsWith(na);
}

export function rankCandidates(s: Slot, prev: LatLng | null, time: number, st: PickState, limit = 6): Candidate[] {
  const { req } = st;
  const budget = req.budget;
  const strictKeywords = s.keywords.length > 0 && (s.mustDo || s.interest);
  // One stop per spot: never two stops at the same address or within 150 m of each other (a
  // court named after its park is the same outing as the park).
  const usedPlaces = [...st.used].map((id) => st.city.byId.get(id)).filter(Boolean) as Place[];
  const sameSpot = (p: Place) => usedPlaces.some((u) => sameOuting(u, p));
  const pool = st.city.places.filter((p) => {
    if (st.used.has(p.id) || st.exclude.has(p.id) || p.temporarilyClosed || sameSpot(p)) return false;
    const catOk = s.categories.includes(p.category);
    if (s.sport) return sportMatch(p, s.sport);
    if (p.court && !s.categories.includes("courts")) return false;
    if (req.rain && isOutdoor(p)) return false;
    if (strictKeywords) return keywordStrength(p, s.keywords) >= (s.interest ? 2 : 3) && (catOk || s.interest != null);
    if (!catOk) return false;
    if (req.rain && isOutdoor(p)) return false;
    return true;
  });
  // Too few exact matches for an interest: widen to its category and say so.
  const relaxed = strictKeywords && pool.length === 0
    ? st.city.places.filter((p) => !st.used.has(p.id) && !st.exclude.has(p.id) && !p.temporarilyClosed && s.categories.includes(p.category))
    : null;
  const list = relaxed ?? pool;

  const out: Candidate[] = [];
  for (const p of list) {
    const leg = prev ? bestLeg(prev, p, st.mode) : null;
    if (leg && leg.minutes > (st.mode === "walk" ? 35 : 45)) continue;
    let arrive = time + (leg?.minutes ?? 0);
    const reasons: string[] = [], warnings: string[] = [];
    let score = baseScore(p, s, req);
    if (p.category === "night" && arrive < 16 * 60) continue;
    const dur = s.duration;
    const open = openForVisit(p.hours, st.day, arrive, Math.min(dur, 45));
    if (open === false) {
      // Worth a short wait if it opens soon.
      const n = nextOpen(p.hours, st.day, arrive);
      if (n && n.dayOffset === 0 && n.minute - arrive <= 40 && openForVisit(p.hours, st.day, n.minute, Math.min(dur, 45))) {
        score -= (n.minute - arrive) * 0.4;
        arrive = n.minute;
      } else continue;
    }
    if (open == null && !p.free && !p.court && p.category !== "views") { score -= 8; warnings.push("Hours not listed, call ahead"); }
    const cost = costOf(p);
    if (req.budgetWord === "free" && !(p.free || cost.perPerson === 0)) continue;
    if (budget != null && budget > 0 && cost.perPerson > budget * 0.9) { if (!cost.estimated) continue; score -= 10; }
    if (leg) score -= Math.max(0, leg.minutes - 6) * (st.mode === "walk" ? 1.8 : 1.4);
    if (st.center && prev) score -= Math.min(12, metersBetween(st.center, p) / 800);
    if (st.toward) score -= Math.min(40, bestLeg(p, st.toward, st.mode).minutes * 1.3);
    if (st.center && !prev) score -= Math.min(40, metersBetween(st.center, p) / 250);
    if (req.hood) {
      if (p.hood === req.hood) score += 15;
      else if (st.center) score -= Math.min(25, metersBetween(st.center, p) / 300);
    }
    // No doubling back: a stop that returns within 1 km of an earlier stop (not the one you
    // just left) costs points, so the route keeps moving forward.
    if (prev && usedPlaces.some((u) => (u.lat !== prev.lat || u.lng !== prev.lng) && metersBetween(u, p) < 1000)) score -= 14;
    // ...and the same ahead: stopping next to where you'll be later means coming back.
    if (st.ahead?.some((a) => metersBetween(a, p) < 1000)) score -= 14;
    if (relaxed) warnings.push(`No ${s.label} spot in our data, so this is the closest match`);
    const closing = p.hours ? closingWithin(p, st.day, arrive, dur) : null;
    if (closing != null) warnings.push(`Closes at ${formatClock(closing)}, ${closing - arrive} min after you arrive`);
    out.push({ place: p, score, arrive, leg, reasons, warnings });
  }
  out.sort((x, y) => y.score - x.score);
  // When scores are close (within 4 points), the one nearer the previous stop goes first.
  if (prev && out.length > 1) {
    const top = out[0].score;
    const near = out.filter((c) => c.score >= top - 4).sort((x, y) => (x.leg?.minutes ?? 0) - (y.leg?.minutes ?? 0))[0];
    if (near !== out[0] && (out[0].leg?.minutes ?? 0) - (near.leg?.minutes ?? 0) >= 5) out.splice(out.indexOf(near), 1), out.unshift(near);
  }
  // Keep the alternatives distinct (no two branches of the same chain).
  const seen = new Set<string>();
  const distinct: Candidate[] = [];
  for (const c of out) {
    const k = norm(c.place.name).split(/\s+/).slice(0, 2).join(" ");
    if (seen.has(k)) continue;
    seen.add(k);
    distinct.push(c);
    if (distinct.length >= limit) break;
  }
  return distinct;
}

function closingWithin(p: Place, day: number, arrive: number, dur: number): number | null {
  if (!p.hours) return null;
  for (const [o, c] of p.hours[day] ?? []) if (arrive >= o && arrive < c && c < arrive + dur) return c;
  return null;
}

const SOURCE_NAMES = (p: Place, subreddit: string) => {
  const bits: string[] = [];
  if (p.reddit.mentions) bits.push(`named ${p.reddit.mentions}x on r/${subreddit}`);
  if (p.tiktok.mentions) bits.push(`${p.tiktok.mentions} ${p.tiktok.mentions === 1 ? "TikTok" : "TikToks"}, ${compact(p.tiktok.views)} views`);
  if (p.google) bits.push(`${p.google.rating.toFixed(1)} on Google (${compact(p.google.count)})`);
  if (p.yelp) bits.push(`${p.yelp.rating.toFixed(1)} on Yelp`);
  return bits;
};

export function explain(c: Candidate, s: Slot, prevName: string | null, st: Pick<PickState, "city" | "sunset" | "day">): string {
  const p = c.place;
  const parts: string[] = [];
  if (s.interest) parts.push(`For the ${s.interest} fan: ${p.kind ? p.kind.toLowerCase() : "a spot"} that matches.`);
  else if (s.mustDo) parts.push(`You asked for ${s.label}.`);
  if (p.court) parts.push(`${p.court.count > 1 ? `${p.court.count} public ${p.court.sport} courts` : `A public ${p.court.sport} court`}${p.court.surface ? `, ${p.court.surface}` : ""}${p.court.lit ? ", lit at night" : ""}.`);
  if (!p.unrated) {
    const src = SOURCE_NAMES(p, st.city.subreddit);
    parts.push(`Locals Score ${scoreOutOf10(p.locals)}${src.length ? `: ${src.slice(0, 2).join(", ")}` : ""}.`);
  }
  if (p.hiddenGem) parts.push("Hidden gem: loved by locals, not overrun.");
  if (s.anchor === "sunset" && st.sunset != null && Math.abs(c.arrive - (st.sunset - 40)) <= 5) parts.push(`Sunset is ${formatClock(st.sunset)}, so you get there for golden hour.`);
  if (p.hours && isOpenAt(p.hours, st.day, c.arrive)) {
    const close = p.hours[st.day]?.find(([o, cl]) => c.arrive >= o && c.arrive < cl)?.[1];
    if (close) parts.push(`Open until ${formatClock(close)} on ${DAY_NAMES[st.day]}.`);
  }
  if (c.leg && prevName) parts.push(`${c.leg.minutes} min from ${prevName}.`);
  return parts.join(" ");
}

function hoodCenter(city: City, hood: string | null): LatLng | null {
  if (!hood) return null;
  const inHood = city.places.filter((p) => p.hood === hood);
  if (!inHood.length) return null;
  return { lat: inHood.reduce((s, p) => s + p.lat, 0) / inHood.length, lng: inHood.reduce((s, p) => s + p.lng, 0) / inHood.length };
}

const DEFAULT_HOURS: Record<string, number> = { date: 5, friends: 6, family: 5, solo: 4, "catch-up": 4 };

export function planWindow(req: PlanRequest, ctx: PlanContext): { date: Date; weekday: number; start: number; end: number; isToday: boolean } {
  const now = ctx.now ?? new Date();
  const off = ctx.city.utcOffset;
  let date = wallDateFor(off, req.day ?? { offsetDays: 0 }, now);
  const clock = cityClock(off, now);
  let isToday = date.getUTCDate() === clock.wall.getUTCDate() && date.getUTCMonth() === clock.wall.getUTCMonth();
  // "Saturday afternoon" asked on Saturday evening means next Saturday.
  if (isToday && req.day?.weekday != null && req.start != null) {
    const until = req.end ?? req.start + (req.durationHours ?? 3) * 60;
    if (until <= clock.minutes + 60) { date = new Date(date.getTime() + 7 * 24 * 3600_000); isToday = false; }
  }
  let start = req.start;
  if (start == null) {
    if (req.who === "family") start = 10 * 60 + 30;
    else if (req.who === "catch-up") start = 14 * 60;
    else if (req.who === "date") start = 15 * 60 + 30;
    else start = 12 * 60;
    if (isToday) start = Math.max(start, Math.ceil((clock.minutes + 15) / 15) * 15);
  }
  let end = req.end ?? start + (req.durationHours ?? DEFAULT_HOURS[req.who ?? ""] ?? 5) * 60;
  if (req.durationHours && req.end == null) end = start + req.durationHours * 60;
  end = Math.min(end, req.vibes.includes("late") ? 26 * 60 : 24 * 60 + 30);
  if (end - start < 60) end = start + 90;
  return { date, weekday: date.getUTCDay(), start, end, isToday };
}

let counter = 0;
export const newId = (seed = "p") => `${seed}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function titleFor(req: PlanRequest, stops: PlanStop[], city: City): string {
  const hoods = stops.map((s) => city.byId.get(s.placeId)?.hood).filter(Boolean) as string[];
  const top = req.hood ?? mostCommon(hoods) ?? city.name;
  const GENERIC = ["food", "dinner", "lunch", "a view", "drinks", "dessert", "park", "shopping", "coffee", "brunch"];
  const named = [...req.interests.map((i) => i.activities[0].label), ...req.mustDos.map((m) => m.label)].filter((l) => !GENERIC.includes(l));
  if (named.length) {
    const list = named.length === 1 ? named[0] : `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`;
    const lead = req.rain ? "Rainy day: " : req.who === "solo" ? "Solo day: " : req.who === "date" ? "Date: " : "";
    const text = `${list} in ${top}`;
    return lead ? `${lead}${text}` : `${text[0].toUpperCase()}${text.slice(1)}`;
  }
  const who = { date: "Date day", friends: "A day with friends", family: "Family day", solo: "Solo day", "catch-up": "Catch-up day" } as const;
  if (req.rain) return `Rainy day in ${top}`;
  return `${req.who ? who[req.who] : "A day out"} in ${top}`;
}

function mostCommon(xs: string[]): string | null {
  const m = new Map<string, number>();
  for (const x of xs) m.set(x, (m.get(x) ?? 0) + 1);
  let best: string | null = null, n = 0;
  for (const [k, v] of m) if (v > n) { best = k; n = v; }
  return best;
}

// Schedule the slots in order, picking a place for each.
function schedule(slots: Slot[], st: PickState, start: number, origin: LatLng | null, pinned: Map<number, Place> = new Map()): PlanStop[] {
  const stops: PlanStop[] = [];
  let time = start;
  let prev: LatLng | null = origin;
  let prevName: string | null = origin ? "you" : null;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (time >= st.windowEnd - 20 && !s.mustDo && !s.interest) continue;
    // Dinner at dinner time and a view before sunset: linger at the last stop a little
    // longer (or start later) instead of eating at 4 PM.
    if (s.anchor === "meal" || s.anchor === "sunset") {
      const target = idealTime(s, i, st.windowStart, st.windowEnd, st.sunset);
      const slack = target - time - 12;
      if (slack > 10) {
        const shift = Math.min(slack, s.anchor === "sunset" ? 75 : 45);
        const last = stops[stops.length - 1];
        if (last) last.end += shift;
        time += shift;
      }
    }
    const nextPin = pinned.get(i + 1);
    st.toward = nextPin && !pinned.get(i) ? nextPin : null;
    st.ahead = [...pinned.entries()].filter(([k]) => k > i + 1).map(([, p]) => p);
    const ranked = rankCandidates(s, prev, time, st, 4);
    st.toward = null;
    st.ahead = [];
    const pin = pinned.get(i);
    let pick = (pin && ranked.find((c) => c.place.id === pin.id)) || ranked[0];
    if (pin && pick?.place.id !== pin.id && s.mustDo && s.label === pin.name) {
      // A place you chose yourself stays, even when it isn't the agent's pick at this hour.
      const leg = prev ? bestLeg(prev, pin, st.mode) : null;
      pick = { place: pin, score: 0, arrive: time + (leg?.minutes ?? 0), leg, reasons: [], warnings: openForVisit(pin.hours, st.day, time + (leg?.minutes ?? 0), 30) === false ? ["May be closed at this time, check the hours"] : [] };
    }
    if (!pick) continue;
    // Clip a stop that runs past the end of the day, unless it is a must-do.
    let end = pick.arrive + s.duration;
    if (end > st.windowEnd + 30 && !s.mustDo && !s.interest) {
      if (st.windowEnd - pick.arrive >= Math.min(45, s.duration * 0.6)) end = st.windowEnd; else continue;
    }
    st.used.add(pick.place.id);
    stops.push({
      key: newId("s"),
      placeId: pick.place.id,
      slot: s,
      start: pick.arrive,
      end,
      leg: pick.leg,
      why: explain(pick, s, prevName, st),
      planB: ranked.slice(1, 3).map((c) => c.place.id),
      warnings: pick.warnings,
    });
    time = end;
    prev = pick.place;
    prevName = pick.place.name;
  }
  return stops;
}

// When each slot is likely to happen (the same lingering rules as schedule()), so the day's
// anchor stops are checked against their own hours, not the start of the day: a hot pot
// that opens at 5 PM is fine for dinner.
function slotTimes(slots: Slot[], start: number, end: number, sunset: number | null): number[] {
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.anchor === "meal" || s.anchor === "sunset") {
      const slack = idealTime(s, i, start, end, sunset) - t - 12;
      if (slack > 10) t += Math.min(slack, s.anchor === "sunset" ? 75 : 45);
    }
    times.push(t);
    t += s.duration + 15;
  }
  return times;
}

// Something to do that fills a long gap before dinner or sunset.
function fillerFor(req: PlanRequest): Slot {
  const cats: CategoryId[] = req.rain ? ["culture", "games", "shops"]
    : req.who === "date" ? ["culture", "shops", "games"]
    : req.who === "friends" ? ["games", "active", "shops"]
    : req.who === "family" ? ["culture", "views"]
    : ["shops", "culture", "games"];
  return slot("something to do", cats, { duration: 60 });
}

function withFillers(slots: Slot[], req: PlanRequest, start: number, end: number, sunset: number | null, fits: number): Slot[] {
  const out: Slot[] = [];
  let t = start;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    if (s.anchor === "meal" || s.anchor === "sunset") {
      const ideal = idealTime(s, i, start, end, sunset);
      if (ideal - t > 85 && out.length + (slots.length - i) < fits + 1) {
        const f = fillerFor(req);
        out.push(f);
        t += f.duration + 15;
      }
      t = Math.max(t, ideal);
    }
    out.push(s);
    t += s.duration + 15;
  }
  return out;
}

export function makePlan(req: PlanRequest, ctx: PlanContext): Plan {
  const { city } = ctx;
  const win = planWindow(req, ctx);
  const off = offsetHours(city.utcOffset, new Date(win.date.getTime() - city.utcOffset * 3600_000));
  const sun = sunTimes(city.center.lat, city.center.lng, win.date, off);
  const mode: Mode = req.transport ?? ctx.defaultTransport ?? "transit";
  // A real starting point (your location) gets a first travel leg; a neighborhood only
  // pulls the picks toward it.
  const origin = req.nearMe ? ctx.origin ?? null : null;
  const center = origin ?? hoodCenter(city, req.hood);
  const st: PickState = {
    city, req, day: win.weekday, mode,
    used: new Set(), exclude: ctx.exclude ?? new Set(),
    sunset: sun?.sunset ?? null, windowStart: win.start, windowEnd: win.end,
    center,
  };
  let slots = buildSlots(req, win.start, ctx.profileInterests, sun?.sunset ?? null, win.end);
  // Fit the number of stops to the time window (about 1 hr 45 min per stop with travel).
  const fits = Math.max(2, Math.round((win.end - win.start) / 95));
  while (slots.length > fits) {
    const drop = [...slots].reverse().findIndex((s) => !s.mustDo && !s.interest);
    if (drop < 0) break;
    slots.splice(slots.length - 1 - drop, 1);
  }
  slots = withFillers(slots, req, win.start, win.end, sun?.sunset ?? null, fits);

  // A place picked from its page takes the template slot of its kind (or leads the day).
  const included = ctx.includePlace ? city.byId.get(ctx.includePlace) : undefined;
  let includedAt = -1;
  if (included) {
    const own: Slot = { label: included.name, categories: [included.category], keywords: [], mustDo: true, duration: DURATION[included.category] };
    includedAt = slots.findIndex((s) => !s.mustDo && !s.interest && s.categories.includes(included.category));
    if (includedAt >= 0) slots[includedAt] = own; else { slots.unshift(own); includedAt = 0; }
  }

  // Anchor the day on its rarest stops (a Gundam shop, the pickleball courts): pick those
  // first, as a close-together pair when there are two, then build the route around them.
  let stops: PlanStop[];
  const free = { ...st, used: new Set<string>() };
  const at = slotTimes(slots, win.start, win.end, sun?.sunset ?? null);
  const constrained = slots
    .map((s, i) => ({ s, i, cands: (s.keywords.length && (s.mustDo || s.interest)) || s.sport ? rankCandidates(s, null, at[i], free, 40) : null }))
    .filter((c): c is { s: Slot; i: number; cands: Candidate[] } => Boolean(c.cands?.length))
    .sort((x, y) => x.cands.length - y.cands.length);
  const pinned = new Map<number, Place>();
  // Group plans: a stop that opens the day costs points for the longest trip to it.
  const groupStarts = ctx.starts ?? [];
  const worstTrip = (p: Place) => (groupStarts.length >= 2 ? Math.max(...groupStarts.map((g) => bestLeg(g, p, g.mode).minutes)) : 0);
  if (constrained.length >= 2) {
    const [a, b] = constrained;
    let best: [Place, Place] | null = null, bestScore = -Infinity;
    for (const x of a.cands.slice(0, groupStarts.length >= 2 ? 20 : 8)) for (const y of b.cands.slice(0, groupStarts.length >= 2 ? 20 : 10)) {
      if (sameOuting(x.place, y.place)) continue;
      const leg = bestLeg(x.place, y.place, mode);
      const first = a.i < b.i ? x.place : y.place;
      const score = x.score + y.score - leg.minutes * 1.5 - (center ? (metersBetween(center, x.place) + metersBetween(center, y.place)) / 400 : 0) - worstTrip(first) * 2.5;
      if (score > bestScore) { bestScore = score; best = [x.place, y.place]; }
    }
    if (best) { pinned.set(a.i, best[0]); pinned.set(b.i, best[1]); }
  } else if (constrained.length === 1) {
    const c = constrained[0];
    const pick = groupStarts.length >= 2 && c.i === 0 ? fairPick(c.cands, groupStarts)?.place : center ? rankCandidates(c.s, null, at[c.i], free, 1)[0]?.place : c.cands[0].place;
    if (pick) pinned.set(c.i, pick);
  }
  if (included) {
    pinned.set(includedAt, included);
    st.exclude = new Set([...st.exclude].filter((x) => x !== included.id));
  }
  // Meet in the middle: with two or more starting points, the first stop is the fairest
  // good one (shortest longest trip), and the rest of the day stays near the group.
  const starts = ctx.starts ?? [];
  if (starts.length >= 2 && !pinned.has(0)) {
    const fair = fairPick(rankCandidates(slots[0], null, win.start, { ...free, center: middleOf(starts) }, 40), starts);
    if (fair) pinned.set(0, fair.place);
  }
  if (starts.length >= 2 && !center) st.center = middleOf(starts);
  if (!center) {
    const anchor = included ?? (pinned.size ? [...pinned.values()][0] : rankCandidates(slots[0], null, win.start, st, 1)[0]?.place);
    st.center = anchor ?? city.center;
    if (!pinned.size && anchor) pinned.set(0, anchor);
  }
  stops = schedule(slots, st, win.start, origin, pinned);
  stops = untangle(stops, city, { weekday: win.weekday, mode, start: win.start, from: origin ?? (starts.length >= 2 ? middleOf(starts) : null) });

  const notes: string[] = [];
  if (sun) notes.push(`Sunset is at ${formatClock(sun.sunset)}.`);
  if (req.rain) notes.push("Rain plan: every stop is indoors.");
  const missing = [...req.mustDos, ...req.interests.map((i) => i.activities[0])].filter((m) => !stops.some((s) => s.slot.label === m.label));
  for (const m of missing) notes.push(`Couldn't fit ${m.label} into this window. Try a longer day or another neighborhood.`);

  const plan: Plan = {
    id: newId(ctx.idSeed ?? "plan"),
    citySlug: city.slug,
    cityName: city.name,
    createdAt: new Date().toISOString(),
    request: req,
    title: "",
    dateISO: win.date.toISOString().slice(0, 10),
    dayLabel: `${DAY_NAMES[win.weekday]}, ${MONTHS[win.date.getUTCMonth()].slice(0, 3)} ${win.date.getUTCDate()}`,
    weekday: win.weekday,
    start: win.start,
    end: win.end,
    transport: mode,
    groupSize: req.groupSize ?? (req.who === "date" || req.who === "catch-up" ? 2 : req.who === "solo" ? 1 : 3),
    stops,
    sunset: sun?.sunset ?? null,
    notes,
    source: "rules",
    revision: 0,
    log: [],
  };
  plan.title = titleFor(req, stops, city);
  if (starts.length) {
    const first = city.byId.get(stops[0]?.placeId ?? "") ?? null;
    const last = city.byId.get(stops[stops.length - 1]?.placeId ?? "") ?? null;
    plan.fairness = fairnessFor(first, last, starts);
  }
  return plan;
}

// Re-order the day's free stops (the ones with no fixed hour and no order you asked for) to
// cut travel: every order of them is tried (a day has at most a handful), from the group's
// fair start point when there is one, and kept only if every stop is still open when you
// get there and the day stays inside its window. Your "X then Y", dinner at dinner time and a
// view at sunset never move.
export function untangle(stops: PlanStop[], city: City, o: { weekday: number; mode: Mode; start: number; from: LatLng | null }): PlanStop[] {
  const movable = stops.map((s, i) => (!s.slot.anchor && !s.slot.mustDo && !s.slot.interest ? i : -1)).filter((i) => i >= 0);
  if (movable.length < 1 || stops.length < 3) return stops;
  const places = stops.map((s) => city.byId.get(s.placeId)!);
  const lastEnd = stops[stops.length - 1].end;
  const walk = (order: number[]) => {
    let t = o.start, prev: LatLng | null = o.from, travel = 0;
    const out: PlanStop[] = [];
    for (const i of order) {
      const s = stops[i], p = places[i];
      const leg = prev ? bestLeg(prev, p, o.mode) : null;
      travel += leg?.minutes ?? 0;
      let arrive = t + (leg?.minutes ?? 0);
      // Fixed-hour stops keep their time if we get there early.
      if (s.slot.anchor && arrive < s.start) arrive = s.start;
      if (openForVisit(p.hours, o.weekday, arrive, Math.min(s.slot.duration, 45)) === false) return null;
      const dur = s.end - s.start;
      // The "N min from <previous stop>" line follows the new order.
      const oldPrev = i > 0 ? places[i - 1].name : o.from ? "you" : null;
      const prevName = out.length ? places[order[out.length - 1]].name : o.from ? "you" : null;
      const why = s.leg && oldPrev ? s.why.replace(`${s.leg.minutes} min from ${oldPrev}.`, leg && prevName ? `${leg.minutes} min from ${prevName}.` : "").trim() : s.why;
      out.push({ ...s, why, leg: out.length || o.from ? leg : null, start: arrive, end: arrive + dur });
      t = arrive + dur;
      prev = p;
    }
    if (t > lastEnd + 20) return null;
    return { out, travel };
  };
  const base = walk(stops.map((_, i) => i));
  if (!base) return stops;
  let best = base;
  const perms = (xs: number[]): number[][] => (xs.length <= 1 ? [xs] : xs.flatMap((x, k) => perms([...xs.slice(0, k), ...xs.slice(k + 1)]).map((r) => [x, ...r])));
  for (const perm of perms(movable).slice(0, 120)) {
    const order = stops.map((_, i) => i);
    movable.forEach((pos, k) => { order[pos] = perm[k]; });
    const r = walk(order);
    if (r && r.travel < best.travel - 4) best = r;
  }
  if (best === base) return stops;
  // The first stop's leg is from the start point only when there is one.
  if (!o.from && best.out[0]) best.out[0] = { ...best.out[0], leg: null };
  return best.out;
}

export function planCost(plan: Plan, city: City): { perPerson: number; estimated: number } {
  let perPerson = 0, estimated = 0;
  for (const s of plan.stops) {
    const p = city.byId.get(s.placeId);
    if (!p) continue;
    const c = costOf(p);
    perPerson += c.perPerson;
    if (c.estimated && c.perPerson > 0) estimated += 1;
  }
  return { perPerson, estimated };
}

export function planTravel(plan: Plan): { minutes: number; miles: number } {
  return plan.stops.reduce((t, s) => ({ minutes: t.minutes + (s.leg?.minutes ?? 0), miles: t.miles + (s.leg?.miles ?? 0) }), { minutes: 0, miles: 0 });
}

// ---------------------------------------------------------------------------------------
// Live re-plan: "it's raining", "we're running late", "swap the sushi spot". It changes
// only what has to change and keeps the rest of the day.

export type ReplanIntent =
  | { kind: "rain" }
  | { kind: "late"; minutes: number }
  | { kind: "swap"; target: string }
  | { kind: "cheaper" }
  | { kind: "remove"; target: string }
  | { kind: "add"; activity: Activity }
  | { kind: "unknown" };

const NUM_WORDS: Record<string, number> = { an: 60, a: 60, half: 30, fifteen: 15, twenty: 20, thirty: 30, forty: 40, ten: 10, five: 5 };

export function parseReplan(text: string, lexicon: (t: string) => Activity[]): ReplanIntent {
  const t = ` ${text.toLowerCase().replace(/[’']/g, "'")} `;
  if (/\b(rain|raining|rainy|storm|pouring|wet|too cold|snow)\b/.test(t)) return { kind: "rain" };
  if (/\b(late|behind|delayed|running behind|overslept|push (it|everything) back)\b/.test(t)) {
    const m = t.match(/(\d{1,3})\s*(?:min|minutes|mins)\b/);
    const h = t.match(/\b(an|a|half an?|\d)\s*hour/);
    let minutes = m ? Number(m[1]) : h ? (h[1].startsWith("half") ? 30 : /\d/.test(h[1]) ? Number(h[1]) * 60 : 60) : 30;
    const w = t.match(/\b(fifteen|twenty|thirty|forty|ten|five)\b/);
    if (!m && !h && w) minutes = NUM_WORDS[w[1]];
    return { kind: "late", minutes };
  }
  if (/\b(cheaper|too expensive|less expensive|on a budget|save money|broke)\b/.test(t)) return { kind: "cheaper" };
  const swap = t.match(/\b(?:swap|change|replace|switch|different|another|instead of|not feeling|don't like|dont like|hate|skip and replace)\b(.*)/);
  const remove = t.match(/\b(?:skip|remove|drop|cut|no more|get rid of|delete)\b(.*)/);
  if (remove && !swap) return { kind: "remove", target: tidyTarget(remove[1]) };
  if (swap) return { kind: "swap", target: tidyTarget(swap[1]) };
  const add = t.match(/\b(?:add|also|one more|throw in|squeeze in|let's do|lets do|want)\b(.*)/);
  if (add) {
    const acts = lexicon(add[1]);
    if (acts.length) return { kind: "add", activity: acts[0] };
  }
  return { kind: "unknown" };
}

const tidyTarget = (s: string) => s.replace(/\b(the|a|an|that|this|our|my|spot|place|stop|one|it|with|for|something|else|please|out)\b/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

const ORDINALS: Record<string, number> = { first: 0, second: 1, third: 2, fourth: 3, fifth: 4, last: -1 };

export function findStop(plan: Plan, city: City, target: string): number {
  if (!target) return -1;
  for (const [w, i] of Object.entries(ORDINALS)) if (new RegExp(`\\b${w}\\b`).test(target)) return i < 0 ? plan.stops.length - 1 : Math.min(i, plan.stops.length - 1);
  const words = target.split(" ").filter((w) => w.length >= 3);
  let best = -1, bestScore = 0;
  plan.stops.forEach((s, i) => {
    const p = city.byId.get(s.placeId);
    const text = norm([s.slot.label, ...s.slot.keywords, s.slot.categories.join(" "), CATEGORIES.find((c) => c.id === s.slot.categories[0])?.label ?? "", p?.name ?? "", p?.kind ?? "", ...(p?.kinds ?? [])].join(" "));
    let score = 0;
    for (const w of words) if (text.includes(w) || (w.endsWith("s") && text.includes(w.slice(0, -1)))) score += 1;
    if (score > bestScore) { bestScore = score; best = i; }
  });
  return best;
}

// Re-time every stop from `from` on, keeping the places; a stop that is now closed is
// swapped for its Plan B (or the next best pick).
function retime(plan: Plan, city: City, from: number, startAt?: number, log?: string[]): void {
  const st = stateFor(plan, city);
  let time = startAt ?? (from === 0 ? plan.start : plan.stops[from - 1].end);
  let prev: Place | null = from === 0 ? null : city.byId.get(plan.stops[from - 1].placeId) ?? null;
  for (let i = from; i < plan.stops.length; i++) {
    const s = plan.stops[i];
    let p = city.byId.get(s.placeId)!;
    const forced = plan.legModes?.[s.key];
    let leg = prev ? (forced ? legFor(prev, p, forced) : bestLeg(prev, p, plan.transport)) : null;
    let arrive = time + (leg?.minutes ?? 0);
    if (openForVisit(p.hours, plan.weekday, arrive, Math.min(s.slot.duration, 45)) === false) {
      const n = nextOpen(p.hours, plan.weekday, arrive);
      if (n && n.dayOffset === 0 && n.minute - arrive <= 40) arrive = n.minute;
    }
    if (openForVisit(p.hours, plan.weekday, arrive, Math.min(s.slot.duration, 45)) === false) {
      st.used = new Set(plan.stops.map((x) => x.placeId));
      const alt = rankCandidates(s.slot, prev, time, st, 3)[0];
      if (alt) {
        log?.push(`${p.name} is closed by then, so ${alt.place.name} takes its place.`);
        s.planB = [s.placeId, ...s.planB.filter((x) => x !== alt.place.id)].slice(0, 2);
        s.placeId = alt.place.id;
        p = alt.place;
        leg = alt.leg;
        arrive = alt.arrive;
        s.why = explain(alt, s.slot, prev?.name ?? null, st);
      }
    }
    const dur = s.end - s.start || s.slot.duration;
    s.leg = leg;
    s.start = arrive;
    s.end = arrive + dur;
    time = s.end;
    prev = p;
  }
}

function stateFor(plan: Plan, city: City): PickState {
  return {
    city,
    req: plan.request,
    day: plan.weekday,
    mode: plan.transport,
    used: new Set(plan.stops.map((s) => s.placeId)),
    exclude: new Set(),
    sunset: plan.sunset,
    windowStart: plan.start,
    windowEnd: plan.end,
    center: null,
  };
}

const clone = (p: Plan): Plan => JSON.parse(JSON.stringify(p));

export interface ReplanResult { plan: Plan; message: string; changed: number[] }

export function replan(input: Plan, city: City, text: string, opts: { lexicon: (t: string) => Activity[]; now?: Date } = { lexicon: () => [] }): ReplanResult {
  const plan = clone(input);
  const intent = parseReplan(text, opts.lexicon);
  const changed: number[] = [];
  const log: string[] = [];
  const st = stateFor(plan, city);
  // Stops already finished (when the day is underway) are never touched.
  const clock = cityClock(city.utcOffset, opts.now ?? new Date());
  const today = plan.dateISO === wallDateFor(city.utcOffset, { offsetDays: 0 }, opts.now ?? new Date()).toISOString().slice(0, 10);
  const firstOpen = today ? Math.max(0, plan.stops.findIndex((s) => s.end > clock.minutes)) : 0;

  const replaceAt = (i: number, why: (oldName: string, newName: string) => string, filter?: (p: Place) => boolean) => {
    const s = plan.stops[i];
    const prev = i > 0 ? city.byId.get(plan.stops[i - 1].placeId)! : null;
    const old = city.byId.get(s.placeId)!;
    st.used = new Set(plan.stops.map((x) => x.placeId));
    const time = i > 0 ? plan.stops[i - 1].end : s.start - (s.leg?.minutes ?? 0);
    let ranked = rankCandidates(s.slot, prev, time, st, 8);
    if (filter) ranked = ranked.filter((c) => filter(c.place));
    // Prefer the stored Plan B when it still fits.
    const planB = ranked.find((c) => s.planB.includes(c.place.id));
    const pick = planB ?? ranked[0];
    if (!pick) return false;
    s.planB = [old.id, ...ranked.filter((c) => c.place.id !== pick.place.id).map((c) => c.place.id)].slice(0, 2);
    s.placeId = pick.place.id;
    s.why = explain(pick, s.slot, prev?.name ?? null, st);
    s.warnings = pick.warnings;
    changed.push(i);
    log.push(why(old.name, pick.place.name));
    return true;
  };

  switch (intent.kind) {
    case "rain": {
      plan.request = { ...plan.request, rain: true };
      st.req = plan.request;
      for (let i = firstOpen; i < plan.stops.length; i++) {
        const p = city.byId.get(plan.stops[i].placeId)!;
        if (!isOutdoor(p)) continue;
        const s = plan.stops[i];
        s.slot = { ...s.slot, categories: s.slot.categories.filter((c) => !OUTDOOR.has(c)).length ? s.slot.categories.filter((c) => !OUTDOOR.has(c)) : ["culture", "games"], keywords: [], sport: undefined, anchor: undefined, duration: Math.max(s.slot.duration, 60) };
        replaceAt(i, (a, b) => `${a} is outdoors, so ${b} takes its place.`, (c) => !isOutdoor(c));
      }
      if (!changed.length) log.push("Everything left on the plan is already indoors.");
      retime(plan, city, firstOpen, undefined, log);
      break;
    }
    case "late": {
      const startAt = (today && firstOpen < plan.stops.length ? Math.max(plan.stops[firstOpen].start, clock.minutes) : plan.stops[firstOpen]?.start ?? plan.start) + intent.minutes - (plan.stops[firstOpen]?.leg?.minutes ?? 0);
      retime(plan, city, firstOpen, startAt, log);
      // Drop optional stops from the end until the day fits again.
      while (plan.stops.length > 1 && plan.stops[plan.stops.length - 1].end > plan.end + 45) {
        const lastOptional = [...plan.stops].reverse().findIndex((s) => !s.slot.mustDo && !s.slot.interest);
        if (lastOptional < 0) break;
        const idx = plan.stops.length - 1 - lastOptional;
        log.push(`Dropped ${city.byId.get(plan.stops[idx].placeId)?.name} so the day still ends on time.`);
        plan.stops.splice(idx, 1);
        retime(plan, city, Math.max(firstOpen, idx), undefined, log);
      }
      log.unshift(`Pushed the rest of the day back ${intent.minutes} min.`);
      for (let i = firstOpen; i < plan.stops.length; i++) changed.push(i);
      break;
    }
    case "cheaper": {
      for (let i = firstOpen; i < plan.stops.length; i++) {
        const p = city.byId.get(plan.stops[i].placeId)!;
        if (costOf(p).perPerson < 20) continue;
        replaceAt(i, (a, b) => `${b} instead of ${a}: it costs less.`, (c) => costOf(c).perPerson < costOf(p).perPerson);
      }
      if (!changed.length) log.push("Every stop is already one of the cheaper picks.");
      retime(plan, city, firstOpen, undefined, log);
      break;
    }
    case "swap": {
      const i = findStop(plan, city, intent.target);
      if (i < 0) { log.push(`Couldn't tell which stop "${intent.target}" means. Tap Swap on the stop instead.`); break; }
      replaceAt(i, (a, b) => `Swapped ${a} for ${b}.`);
      retime(plan, city, i, undefined, log);
      break;
    }
    case "remove": {
      const i = findStop(plan, city, intent.target);
      if (i < 0) { log.push(`Couldn't tell which stop "${intent.target}" means.`); break; }
      log.push(`Removed ${city.byId.get(plan.stops[i].placeId)?.name}.`);
      plan.stops.splice(i, 1);
      if (i < plan.stops.length) { retime(plan, city, i, undefined, log); changed.push(i); }
      break;
    }
    case "add": {
      const s = slotFromActivity(intent.activity, { mustDo: true });
      const last = plan.stops[plan.stops.length - 1];
      const prev = last ? city.byId.get(last.placeId)! : null;
      const pick = rankCandidates(s, prev, last?.end ?? plan.start, st, 3)[0];
      if (!pick) { log.push(`Couldn't find ${s.label} open after ${formatClock(last?.end ?? plan.start)}.`); break; }
      plan.stops.push({ key: newId("s"), placeId: pick.place.id, slot: s, start: pick.arrive, end: pick.arrive + s.duration, leg: pick.leg, why: explain(pick, s, prev?.name ?? null, st), planB: [], warnings: pick.warnings });
      plan.end = Math.max(plan.end, pick.arrive + s.duration);
      changed.push(plan.stops.length - 1);
      log.push(`Added ${pick.place.name} for ${s.label}.`);
      break;
    }
    default:
      log.push("Try \"it's raining\", \"we're running 30 min late\", \"swap the sushi spot\", \"make it cheaper\" or \"add dessert\".");
  }
  plan.revision += 1;
  plan.log = [...log, ...plan.log].slice(0, 12);
  return { plan, message: log.join(" "), changed };
}

// Swap one stop for a specific place (from the Swap sheet).
export function swapStop(input: Plan, city: City, index: number, placeId: string): Plan {
  const plan = clone(input);
  const s = plan.stops[index];
  const old = s.placeId;
  const st = stateFor(plan, city);
  const prev = index > 0 ? city.byId.get(plan.stops[index - 1].placeId)! : null;
  const p = city.byId.get(placeId)!;
  s.planB = [old, ...s.planB.filter((x) => x !== placeId)].slice(0, 2);
  s.placeId = placeId;
  const leg = prev ? bestLeg(prev, p, plan.transport) : null;
  s.why = explain({ place: p, score: 0, arrive: s.start, leg, reasons: [], warnings: [] }, s.slot, prev?.name ?? null, st);
  retime(plan, city, index);
  plan.revision += 1;
  plan.log = [`Swapped ${city.byId.get(old)?.name} for ${p.name}.`, ...plan.log].slice(0, 12);
  return plan;
}

// Move a stop up or down and re-time the day.
export function moveStop(input: Plan, city: City, from: number, to: number): Plan {
  const plan = clone(input);
  const [s] = plan.stops.splice(from, 1);
  plan.stops.splice(to, 0, s);
  retime(plan, city, Math.min(from, to));
  plan.revision += 1;
  return plan;
}

// Alternatives for the Swap sheet: the slot's best picks near the previous stop.
export function alternativesFor(plan: Plan, city: City, index: number, limit = 8): Candidate[] {
  const st = stateFor(plan, city);
  const s = plan.stops[index];
  const prev = index > 0 ? city.byId.get(plan.stops[index - 1].placeId)! : null;
  const time = index > 0 ? plan.stops[index - 1].end : plan.start;
  return rankCandidates(s.slot, prev, time, st, limit);
}


// Pick a travel mode for one leg by hand (Wanderlog's leg mode sheet) and re-time the day.
export function setLegMode(input: Plan, city: City, index: number, mode: Mode): Plan {
  const plan = clone(input);
  plan.legModes = { ...(plan.legModes ?? {}), [plan.stops[index].key]: mode };
  retime(plan, city, index);
  plan.revision += 1;
  return plan;
}

// Rebuild a plan someone shared as a link (request, places and start time only).
export function planFromShared(city: City, shared: { id: string; raw: string; date: string; start: number; mode: Mode; places: string[]; title: string }, req: PlanRequest): Plan | null {
  const places = shared.places.map((id) => city.byId.get(id)).filter((p): p is Place => Boolean(p));
  if (!places.length) return null;
  const date = new Date(`${shared.date}T00:00:00Z`);
  const off = offsetHours(city.utcOffset, date);
  const sun = sunTimes(city.center.lat, city.center.lng, date, off);
  const plan: Plan = {
    id: shared.id, citySlug: city.slug, cityName: city.name, createdAt: new Date().toISOString(), request: req, title: shared.title,
    dateISO: shared.date, dayLabel: `${DAY_NAMES[date.getUTCDay()]}, ${MONTHS[date.getUTCMonth()].slice(0, 3)} ${date.getUTCDate()}`, weekday: date.getUTCDay(),
    start: shared.start, end: shared.start + places.length * 100, transport: shared.mode, groupSize: req.groupSize ?? 2,
    stops: places.map((p) => ({ key: newId("s"), placeId: p.id, slot: { label: p.kind ?? p.category, categories: [p.category], keywords: [], mustDo: false, duration: DURATION[p.category] }, start: 0, end: DURATION[p.category], leg: null, why: "", planB: [], warnings: [] })),
    sunset: sun?.sunset ?? null, notes: [], source: "rules", revision: 0, log: [],
  };
  retime(plan, city, 0, shared.start);
  const st = stateFor(plan, city);
  plan.stops.forEach((s, i) => {
    const p = city.byId.get(s.placeId)!;
    s.why = explain({ place: p, score: 0, arrive: s.start, leg: s.leg, reasons: [], warnings: [] }, s.slot, i > 0 ? city.byId.get(plan.stops[i - 1].placeId)?.name ?? null : null, st);
  });
  plan.end = Math.max(plan.end, plan.stops[plan.stops.length - 1].end);
  return plan;
}

export interface FixedStop { placeId: string; start: number; duration: number; label: string }

// A day made of chosen places (a featured community day, or "Do this day" on one): each
// stop starts at its target time or as soon as you can get there, with real legs between
// stops, a reason for each pick and a Plan B of the same kind nearby.
export function planFromStops(city: City, spec: { id: string; title: string; date: Date; transport: Mode; raw: string; stops: FixedStop[]; groupSize?: number }): Plan {
  const date = spec.date;
  const off = offsetHours(city.utcOffset, date);
  const sun = sunTimes(city.center.lat, city.center.lng, date, off);
  const req: PlanRequest = { ...parseRequestLite(spec.raw), groupSize: spec.groupSize ?? null };
  const st: PickState = {
    city, req, day: date.getUTCDay(), mode: spec.transport, used: new Set(spec.stops.map((s) => s.placeId)), exclude: new Set(),
    sunset: sun?.sunset ?? null, windowStart: spec.stops[0]?.start ?? 600, windowEnd: (spec.stops[spec.stops.length - 1]?.start ?? 1200) + 180, center: null,
  };
  const stops: PlanStop[] = [];
  let prev: Place | null = null;
  let time = spec.stops[0]?.start ?? 600;
  for (const f of spec.stops) {
    const p = city.byId.get(f.placeId);
    if (!p) continue;
    const leg = prev ? bestLeg(prev, p, spec.transport) : null;
    const arrive = Math.max(f.start, time + (leg?.minutes ?? 0));
    const slot: Slot = { label: f.label, categories: [p.category], keywords: [], mustDo: true, duration: f.duration };
    const alts = rankCandidates({ ...slot, mustDo: false }, prev, time, st, 3).filter((c) => c.place.id !== p.id);
    stops.push({
      key: newId("s"), placeId: p.id, slot, start: arrive, end: arrive + f.duration, leg,
      why: explain({ place: p, score: 0, arrive, leg, reasons: [], warnings: [] }, { ...slot, mustDo: false }, prev?.name ?? null, st),
      planB: alts.slice(0, 2).map((c) => c.place.id),
      warnings: openForVisit(p.hours, st.day, arrive, Math.min(45, f.duration)) === false ? ["May be closed at this time, check the hours"] : [],
    });
    time = arrive + f.duration;
    prev = p;
  }
  return {
    id: spec.id, citySlug: city.slug, cityName: city.name, createdAt: new Date().toISOString(), request: req, title: spec.title,
    dateISO: date.toISOString().slice(0, 10), dayLabel: `${DAY_NAMES[date.getUTCDay()]}, ${MONTHS[date.getUTCMonth()].slice(0, 3)} ${date.getUTCDate()}`, weekday: date.getUTCDay(),
    start: stops[0]?.start ?? 600, end: stops[stops.length - 1]?.end ?? 1200, transport: spec.transport, groupSize: spec.groupSize ?? 2,
    stops, sunset: sun?.sunset ?? null, notes: sun ? [`Sunset is at ${formatClock(sun.sunset)}.`] : [], source: "rules", revision: 0, log: [],
  };
}

// The request object for a fixed day (no parsing needed beyond the raw text).
function parseRequestLite(raw: string): PlanRequest {
  return { raw, who: null, groupSize: null, vibes: [], budget: null, budgetWord: null, start: null, end: null, durationHours: null, day: null, transport: null, mustDos: [], interests: [], hood: null, rain: false, nearMe: false, ordered: true, then: [] };
}
