// Popular days for the community feed. The days are built by the planner from each city's
// real top places; the people and counts are sample data (labeled "Sample" everywhere)
// until real users post. Notes are never invented: a post shows a real scraped quote
// about one of its stops, with the source.
import type { City, Quote } from "@/data/types";
import { parseRequest } from "./parser";
import { makePlan, type Plan } from "./planner";

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
    const quoted = plan.stops.map((s) => city.byId.get(s.placeId)).find((p) => p?.quotes.length);
    const [name, handle] = PEOPLE[(h + i) % PEOPLE.length];
    days.push({
      id: plan.id,
      city: city.slug,
      plan,
      author: { name, handle },
      sample: true,
      doneCount: Math.round(quality * 2.4 + (h % 120)),
      likes: Math.round(quality * 1.1 + (h % 60)),
      daysAgo: 1 + (h % 6),
      quote: quoted ? { placeName: quoted.name, quote: quoted.quotes[0] } : null,
    });
  });
  days.sort((a, b) => b.doneCount - a.doneCount);
  cache.set(city.slug, days);
  return days;
}

export function findDay(city: City, id: string): CommunityDay | undefined {
  return communityDays(city).find((d) => d.id === id);
}
