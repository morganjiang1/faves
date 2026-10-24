// Loads one city at a time. Each city is its own JSON module behind a dynamic import, so the
// web build splits it into its own chunk and the app only pays for the city you pick.
import index from "./cities/index.json";
import type { City, CityIndexRow, Place, RawCity, RawCourt, RawPlace } from "./types";
import { metersBetween } from "@/lib/geo";

export const CITY_INDEX = index as CityIndexRow[];
export const DEFAULT_CITY = "san-francisco";

const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  "new-york": () => import("./cities/new-york.json"),
  "los-angeles": () => import("./cities/los-angeles.json"),
  "san-francisco": () => import("./cities/san-francisco.json"),
  chicago: () => import("./cities/chicago.json"),
  seattle: () => import("./cities/seattle.json"),
  boston: () => import("./cities/boston.json"),
  austin: () => import("./cities/austin.json"),
  miami: () => import("./cities/miami.json"),
  "washington-dc": () => import("./cities/washington-dc.json"),
  "san-diego": () => import("./cities/san-diego.json"),
};

export function toPlace(r: RawPlace): Place {
  return {
    id: r.id,
    name: r.n,
    category: r.c,
    kind: r.k,
    kinds: r.kw ? r.kw.split("|") : [],
    lat: r.la,
    lng: r.lo,
    address: r.a,
    hood: r.h,
    priceLevel: r.p,
    free: r.f,
    image: r.img,
    photos: r.ph ?? [],
    hours: r.hr,
    reserveUrl: r.rs,
    website: r.w,
    phone: r.t,
    googleUrl: r.g,
    temporarilyClosed: Boolean(r.tc),
    google: r.rt.g ? { rating: r.rt.g[0], count: r.rt.g[1] } : null,
    yelp: r.rt.y ? { rating: r.rt.y[0], count: r.rt.y[1], url: r.rt.y[2] } : null,
    tripadvisor: r.rt.ta ? { rating: r.rt.ta[0], count: r.rt.ta[1] } : null,
    reddit: { mentions: r.me[0], votes: r.me[1] },
    tiktok: { mentions: r.me[2], views: r.me[3] },
    quotes: r.q.map((q) => ({ source: q.s, text: q.t, url: q.u })),
    locals: r.sc[0],
    quality: r.sc[1],
    localLove: r.sc[2],
    exposure: r.sc[3],
    hiddenGem: Boolean(r.gem),
    localPick: Boolean(r.lp),
    description: r.d,
    moments: (r.mo ?? []).map((m) => ({
      id: m.id, source: "tiktok", creator: m.u, views: m.v, likes: m.l, postedAt: m.at, caption: m.cap, duration: m.dur,
    })),
  };
}

const SPORT = { tennis: "Tennis", basketball: "Basketball", pickleball: "Pickleball" } as const;

// OpenStreetMap courts become places too, so the map, search and planner treat them alike.
// A court next to a Google-listed park takes that park's name, hood, photo and score.
function courtPlace(c: RawCourt, slug: string, near: (lat: number, lng: number) => Place | undefined, byId: Map<string, Place>): Place | null {
  if (c.ac === "private" || c.ac === "no") return null;
  const host = c.pid ? byId.get(c.pid) : undefined;
  const nearest = host ?? near(c.la, c.lo);
  const sport = SPORT[c.s];
  const courts = c.n > 1 ? `${sport} courts` : `${sport} court`;
  const name = c.nm ? (/court/i.test(c.nm) ? c.nm : `${c.nm} ${sport.toLowerCase()} ${c.n > 1 ? "courts" : "court"}`) : host ? `${host.name} ${sport.toLowerCase()} ${c.n > 1 ? "courts" : "court"}` : `${courts}${nearest?.hood ? `, ${nearest.hood}` : ""}`;
  return {
    id: `court-${slug}-${c.id}`,
    name,
    category: "courts",
    kind: courts,
    kinds: [c.s, "court", "outdoor"],
    lat: c.la,
    lng: c.lo,
    address: host?.address ?? null,
    hood: host?.hood ?? nearest?.hood ?? null,
    priceLevel: null,
    free: true,
    image: host?.image ?? null,
    photos: [],
    hours: host?.hours ?? null,
    reserveUrl: null,
    website: host?.website ?? null,
    phone: null,
    googleUrl: `https://www.google.com/maps/search/?api=1&query=${c.la},${c.lo}`,
    temporarilyClosed: false,
    google: host?.google ?? null,
    yelp: null,
    tripadvisor: null,
    reddit: host?.reddit ?? { mentions: 0, votes: 0 },
    tiktok: host?.tiktok ?? { mentions: 0, views: 0 },
    quotes: host?.quotes ?? [],
    locals: host?.locals ?? 0,
    quality: host?.quality ?? 0,
    localLove: host?.localLove ?? 0,
    exposure: host?.exposure ?? 0,
    hiddenGem: false,
    localPick: false,
    description: null,
    moments: [],
    unrated: !host,
    court: { sport: c.s, count: c.n, surface: c.sf, lit: Boolean(c.lit), access: c.ac },
  };
}

export function buildCity(raw: RawCity): City {
  const places = raw.places.map(toPlace);
  const byId = new Map(places.map((p) => [p.id, p]));
  // Coarse grid so "nearest place" stays fast for thousands of courts.
  const cell = (lat: number, lng: number) => `${Math.round(lat * 50)}:${Math.round(lng * 50)}`;
  const grid = new Map<string, Place[]>();
  for (const p of places) {
    if (!p.hood) continue;
    const k = cell(p.lat, p.lng);
    grid.set(k, [...(grid.get(k) ?? []), p]);
  }
  const near = (lat: number, lng: number) => {
    let best: Place | undefined, bestD = Infinity;
    const [a, b] = [Math.round(lat * 50), Math.round(lng * 50)];
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      for (const p of grid.get(`${a + i}:${b + j}`) ?? []) {
        const d = metersBetween({ lat, lng }, p);
        if (d < bestD) { bestD = d; best = p; }
      }
    }
    return best;
  };
  const courts = raw.courts.map((c) => courtPlace(c, raw.slug, near, byId)).filter((c): c is Place => Boolean(c));
  for (const c of courts) byId.set(c.id, c);
  return {
    slug: raw.slug,
    name: raw.name,
    subreddit: raw.subreddit,
    utcOffset: raw.utcOffset,
    builtAt: raw.builtAt,
    center: { lat: raw.center[0], lng: raw.center[1] },
    hoods: raw.hoods,
    places: [...places, ...courts],
    byId,
  };
}

const cache = new Map<string, City>();
const pending = new Map<string, Promise<City>>();

export function cachedCity(slug: string): City | undefined {
  return cache.get(slug);
}

export function loadCity(slug: string): Promise<City> {
  const hit = cache.get(slug);
  if (hit) return Promise.resolve(hit);
  const inflight = pending.get(slug);
  if (inflight) return inflight;
  const loader = loaders[slug];
  if (!loader) return Promise.reject(new Error(`We don't have ${slug} yet.`));
  const p = loader()
    .then((m) => {
      const city = buildCity(((m as { default?: unknown }).default ?? m) as RawCity);
      cache.set(slug, city);
      return city;
    })
    .finally(() => pending.delete(slug));
  pending.set(slug, p);
  return p;
}

export function cityName(slug: string) {
  return CITY_INDEX.find((c) => c.slug === slug)?.name ?? slug;
}
