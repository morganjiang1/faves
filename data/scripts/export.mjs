// Slim per-city export for the app: only the fields the screens and the planner use.
// Reads data/out/<city>.json (from build.mjs), writes src/data/cities/<city>.json plus an index.
// Usage: node data/scripts/export.mjs --city san-francisco|all
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const appData = join(here, "..", "..", "src", "data", "cities");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const exists = (p) => access(p).then(() => true, () => false);

// Standard UTC offset (hours) per city; the app applies US daylight saving itself.
const UTC_OFFSET = {
  "new-york": -5, boston: -5, miami: -5, "washington-dc": -5,
  chicago: -6, austin: -6,
  "los-angeles": -8, "san-francisco": -8, seattle: -8, "san-diego": -8,
};

// Google hours text ("11 AM to 2:30 PM, 5 to 10 PM", "Open 24 hours", "Closed") to minute
// ranges from midnight. A range that ends after midnight ends past 1440 ("5 PM to 2 AM" = [1020, 1560]).
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function toMinutes(text, meridiem) {
  const m = String(text).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  const mer = (m[3] ?? meridiem ?? "").toUpperCase();
  if (mer === "PM") h += 12;
  return h * 60 + Number(m[2] ?? 0);
}
export function parseRanges(text) {
  const t = String(text).replace(/[  ]/g, " ").replace(/[–—]/g, " to ").trim();
  if (/^closed$/i.test(t)) return [];
  if (/open 24 hours/i.test(t)) return [[0, 1440]];
  const out = [];
  for (const part of t.split(/,\s*/)) {
    const [a, b] = part.split(/\s+to\s+/i);
    if (!a || !b) return null;
    const endMer = b.match(/(AM|PM)/i)?.[1];
    let close = toMinutes(b);
    let open = toMinutes(a, /(AM|PM)/i.test(a) ? undefined : endMer);
    if (open == null || close == null) return null;
    // "12 to 7 PM" reads as noon; "11 to 2 PM" means 11 AM.
    if (!/(AM|PM)/i.test(a) && open > close) open -= 12 * 60;
    if (close <= open) close += 1440;
    out.push([open, close]);
  }
  return out;
}
function parseWeek(hours) {
  if (!hours?.length) return null;
  const week = Array(7).fill(null);
  for (const { day, hours: text } of hours) {
    const i = DAYS.indexOf(day);
    if (i < 0) continue;
    const ranges = parseRanges(text);
    if (ranges == null) return null;
    week[i] = ranges;
  }
  return week.some((d) => d == null) ? null : week;
}

// Entry is free at public parks, beaches, viewpoints, trails, plazas, piers and courts.
const FREE = /\b(park|city park|beach|scenic spot|vista point|viewpoint|hiking area|trail|plaza|square|bridge|pier|fishing pier|lookout|stairs|steps|notable street|nature preserve|state park|national park|playground|skatepark|tennis court|basketball court|pickleball court|public library|library|garden)\b/i;
const NOT_FREE = /botanical|amusement|water park|theme park|trampoline/i;

const round = (n, d = 5) => Math.round(n * 10 ** d) / 10 ** d;
const short = (s, n) => (s && s.length > n ? `${s.slice(0, n - 1).trim()}…` : s ?? null);

function slimPlace(p) {
  const kindText = [p.kind, ...(p.kinds ?? [])].filter(Boolean).join(" ");
  const g = p.ratings.google, y = p.ratings.yelp, t = p.ratings.tripadvisor;
  return {
    id: p.id,
    n: p.name,
    c: p.category,
    k: p.kind,
    kw: [...new Set((p.kinds ?? []).map((k) => k.toLowerCase()))].join("|") || null,
    la: round(p.lat),
    lo: round(p.lng),
    a: p.address?.replace(/, United States$/, "") ?? null,
    h: p.neighborhood,
    p: p.priceLevel ?? null,
    // Free entry is judged from the main kind only ("beer garden" in a cafe's extra tags is not a park).
    f: !["food", "sweets", "night", "classes"].includes(p.category) && FREE.test(p.kind ?? "") && !NOT_FREE.test(kindText),
    img: p.image,
    ph: (p.photos ?? []).slice(0, 3).map((x) => x.url),
    hr: parseWeek(p.hours),
    rs: p.reserveUrl,
    w: p.website,
    t: p.phone,
    g: p.googleUrl,
    tc: p.temporarilyClosed || undefined,
    rt: {
      g: g ? [g.rating, g.count] : undefined,
      y: y ? [round(y.rating, 1), y.count, y.url] : undefined,
      ta: t?.rating ? [t.rating, t.count] : undefined,
    },
    me: [p.mentions.reddit, p.mentions.redditVotes, p.mentions.tiktok, p.mentions.tiktokViews],
    q: p.quotes.slice(0, 3).map((q) => ({ s: q.source, t: q.text, u: q.url })),
    sc: [p.scores.locals, p.scores.quality, p.scores.localLove, p.scores.exposure],
    gem: p.hiddenGem || undefined,
    lp: p.localPick || undefined,
    tp: p.tiktokPick || undefined,
    d: short(p.description, 180),
    mo: p.moments?.length
      ? p.moments.slice(0, 12).map((m) => ({ id: m.id, u: m.creator, v: m.views, l: m.likes, at: m.postedAt, cap: m.caption, dur: m.duration, cv: m.cover ?? undefined }))
      : undefined,
  };
}

async function exportCity(city) {
  const src = join(root, "out", `${city.slug}.json`);
  if (!(await exists(src))) return console.warn(`${city.slug}: no build yet, skipping`);
  const data = JSON.parse(await readFile(src, "utf8"));
  // Keep what the app can recommend: decent scores, anything locals talk about, hidden gems,
  // locals picks and every court. The long tail of low-scored, never-mentioned places is dropped.
  const places = data.places.filter((p) => p.category !== "other" && p.lat && p.lng && (
    p.scores.locals >= 20 || p.mentions.reddit + p.mentions.tiktok > 0 || p.localPick || p.tiktokPick || p.hiddenGem || p.category === "courts"
  ));
  // City center: the median of the best-scored places (robust to far-off day-trip spots).
  const top = [...places].sort((a, b) => b.scores.locals - a.scores.locals).slice(0, 200);
  const median = (xs) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const center = [round(median(top.map((p) => p.lat))), round(median(top.map((p) => p.lng)))];
  const hoods = [...new Set(places.map((p) => p.neighborhood).filter(Boolean))].sort();
  const out = {
    v: 1,
    slug: city.slug,
    name: city.name,
    subreddit: city.subreddit,
    utcOffset: UTC_OFFSET[city.slug] ?? -5,
    builtAt: data.builtAt,
    center,
    hoods,
    places: places.map(slimPlace),
    courts: data.courts.map((c) => ({ id: c.id, s: c.sport, la: round(c.lat), lo: round(c.lng), n: c.count, nm: c.name, sf: c.surface, lit: c.lit || undefined, ac: c.access, pid: c.placeId ?? undefined })),
    views: data.viewpoints.map((v) => ({ id: v.id, nm: v.name, la: round(v.lat), lo: round(v.lng), pid: v.placeId ?? undefined })),
  };
  await mkdir(appData, { recursive: true });
  const json = JSON.stringify(out);
  await writeFile(join(appData, `${city.slug}.json`), json);
  const unparsed = data.places.filter((p) => p.hours?.length && !parseWeek(p.hours)).length;
  console.log(`${city.slug}: ${out.places.length} places, ${out.courts.length} courts, ${out.views.length} views, ${(json.length / 1024).toFixed(0)} KB (${unparsed} hour tables not parsed)`);
  return { slug: city.slug, name: city.name, center, places: out.places.length, courts: out.courts.length, utcOffset: out.utcOffset };
}

const cities = JSON.parse(await readFile(join(root, "config/cities.json"), "utf8"));
const slug = arg("city", "all");
const done = [];
for (const city of slug === "all" ? cities : cities.filter((c) => c.slug === slug)) {
  const row = await exportCity(city);
  if (row) done.push(row);
}
// The index lists every exported city (kept in sync even when one city is re-exported).
const indexPath = join(appData, "index.json");
const prev = (await exists(indexPath)) ? JSON.parse(await readFile(indexPath, "utf8")) : [];
const merged = cities
  .map((c) => done.find((d) => d.slug === c.slug) ?? prev.find((d) => d.slug === c.slug))
  .filter(Boolean);
await writeFile(indexPath, JSON.stringify(merged, null, 1));
