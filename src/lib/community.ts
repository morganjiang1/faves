// Popular days for the community feed. The days are built by the planner from each city's
// real top places; the people and counts are sample data (labeled "Sample" everywhere)
// until real users post. Notes are never invented: a post shows a real scraped quote
// about one of its stops, with the source.
import type { City, Quote } from "@/data/types";
import { parseRequest } from "./parser";
import { makePlan, planFromStops, type FixedStop, type Plan } from "./planner";
import { cityClock, wallDateFor } from "./time";

export interface CommunityDay {
  id: string;
  city: string;
  plan: Plan;
  author: { name: string; handle: string };
  sample: true;
  doneCount: number;
  likes: number;
  daysAgo: number;
  quote: { placeName: string; quote: Quote } | null;
}

const SEEDS = [
  "date saturday afternoon: something fun, then dinner and a view",
  "me and 3 friends saturday: bowling then tacos then drinks",
  "pickleball then hot pot with friends saturday 1pm to 7pm",
  "rainy saturday: a museum, coffee and a bookstore",
  "cheap sunday: a park, tacos and ice cream",
  "catching up with an old friend sunday: coffee, a record store and pizza",
  "date night saturday 5pm: sushi and a view",
  "family saturday morning: aquarium, a park and ice cream",
  "friends saturday night: dinner, karaoke and drinks",
  "solo sunday: a museum, a bookstore and coffee",
];

const PEOPLE = [
  ["Maya", "maya.eats"], ["Jordan", "jordanw"], ["Priya", "priyaexplores"], ["Leo", "leo.k"], ["Ana", "anagoesout"],
  ["Kai", "kaiplans"], ["Noor", "noor.n"], ["Sam", "samsweekends"], ["Theo", "theo.b"], ["Rosa", "rosa.r"],
];

// Small deterministic hash so a city's sample feed is the same every time.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

// The next Saturday at 9 AM in the city, as a fixed "now" for building sample days.
function nextSaturday(city: City): Date {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + ((6 - now.getUTCDay() + 7) % 7 || 7), 9 - city.utcOffset));
  return d;
}

// Featured days: hand-picked stops from the city's real places (the person is still sample data).
interface Featured { id: string; title: string; raw: string; transport: "walk" | "transit" | "drive" | "bike"; author: [string, string]; stops: FixedStop[] }
const FEATURED: Record<string, Featured[]> = {
  "san-francisco": [{
    id: "san-francisco-saturday-in-sf",
    title: "Saturday in SF",
    raw: "Saturday in SF: pastries, padel, pizza, the arcade, sunset and a cocktail",
    transport: "transit",
    author: ["Maya", "maya.eats"],
    stops: [
      { placeId: "ChIJJ09d9DmHhYARkrToDt9JCy8", start: 9 * 60, duration: 45, label: "morning pastries" }, // Arsicault Bakery, Richmond District
      { placeId: "ChIJN6BQnN2BhYARZiaQR4CPSD8", start: 10 * 60 + 30, duration: 105, label: "padel" }, // Bay Padel - Treasure Island
      { placeId: "ChIJmx3iW_GAhYARrlV9H2vyE-E", start: 12 * 60 + 45, duration: 75, label: "lunch" }, // Golden Boy Pizza, North Beach
      { placeId: "ChIJCQAzVOKAhYARuOpiALmomu0", start: 14 * 60 + 20, duration: 140, label: "the arcade" }, // Musee Mecanique
      { placeId: "ChIJdx6kBe6AhYARsPFmpUAvvcY", start: 17 * 60 + 15, duration: 85, label: "sunset" }, // Ina Coolbrith Park
      { placeId: "ChIJg67PeyeBhYAROkno8i7ZxlI", start: 19 * 60, duration: 150, label: "night cocktails" }, // The Interval at Long Now
    ],
  }],
};

function featuredDay(city: City, f: Featured, now: Date, topCount: number): CommunityDay | null {
  if (!f.stops.every((s) => city.byId.has(s.placeId))) return null;
  const plan = planFromStops(city, { id: f.id, title: f.title, date: wallDateFor(city.utcOffset, { weekday: 6 }, now), transport: f.transport, raw: f.raw, stops: f.stops });
  const quote = bestQuote(city, plan);
  return {
    id: f.id, city: city.slug, plan, author: { name: f.author[0], handle: f.author[1] }, sample: true,
    doneCount: topCount + 137, likes: Math.round(topCount * 0.6) + 41, daysAgo: 2,
    quote,
  };
}

// "Do this day": the same stops, today (or this Saturday when the day's start has passed).
export function doThisDay(day: CommunityDay, city: City, now: Date = new Date()): Plan {
  const today = wallDateFor(city.utcOffset, { offsetDays: 0 }, now);
  const first = day.plan.stops[0]?.start ?? 600;
  const date = cityClock(city.utcOffset, now).minutes > first + 60 ? wallDateFor(city.utcOffset, { offsetDays: 1 }, now) : today;
  const copy = planFromStops(city, {
    id: `${day.id}-mine-${now.getTime().toString(36)}`,
    title: day.plan.title,
    date,
    transport: day.plan.transport,
    raw: day.plan.request.raw,
    groupSize: day.plan.groupSize,
    stops: day.plan.stops.map((s) => ({ placeId: s.placeId, start: s.start, duration: s.end - s.start, label: s.slot.label })),
  });
  copy.log = [`Copied from ${day.author.name}'s day. Swap any stop or re-plan as you go.`];
  return copy;
}

// The clearest real quote about any stop: Reddit first, a readable length, not a list of pins.
function bestQuote(city: City, plan: Plan): CommunityDay["quote"] {
  const all = plan.stops.flatMap((s) => {
    const p = city.byId.get(s.placeId);
    return p ? p.quotes.map((q) => ({ placeName: p.name, quote: q })) : [];
  });
  const score = (x: { quote: Quote }) => (x.quote.source === "reddit" ? 2 : 0) + (x.quote.text.length >= 30 && x.quote.text.length <= 170 ? 2 : 0) - (/📍|\n|#/.test(x.quote.text) ? 3 : 0);
  return all.sort((a, b) => score(b) - score(a))[0] ?? null;
}

const cache = new Map<string, CommunityDay[]>();

export function communityDays(city: City): CommunityDay[] {
  const hit = cache.get(city.slug);
  if (hit) return hit;
  const now = nextSaturday(city);
  const days: CommunityDay[] = [];
  SEEDS.forEach((seed, i) => {
    const req = parseRequest(seed, { hoods: city.hoods });
    const plan = makePlan(req, { city, now, idSeed: `${city.slug}-day${i}` });
    if (plan.stops.length < 2) return;
    plan.id = `${city.slug}-day${i}`;
    const h = hash(`${city.slug}:${i}`);
    const quality = plan.stops.reduce((s, x) => s + (city.byId.get(x.placeId)?.locals ?? 50), 0) / plan.stops.length;
    const [name, handle] = PEOPLE[(i + hash(city.slug)) % PEOPLE.length];
    days.push({
      id: plan.id,
      city: city.slug,
      plan,
      author: { name, handle },
      sample: true,
      doneCount: Math.round(quality * 2.4 + (h % 120)),
      likes: Math.round(quality * 1.1 + (h % 60)),
      daysAgo: 1 + (h % 6),
      quote: bestQuote(city, plan),
    });
  });
  days.sort((a, b) => b.doneCount - a.doneCount);
  const featured = (FEATURED[city.slug] ?? []).map((f) => featuredDay(city, f, now, days[0]?.doneCount ?? 200)).filter((d): d is CommunityDay => Boolean(d));
  days.unshift(...featured);
  cache.set(city.slug, days);
  return days;
}

export function findDay(city: City, id: string): CommunityDay | undefined {
  return communityDays(city).find((d) => d.id === id);
}
