// Merge every source into one scored place list per city: data/out/<city>.json.
// Usage: node data/scripts/build.mjs --city san-francisco|all
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const exists = (p) => access(p).then(() => true, () => false);
const load = async (p, fallback = []) => ((await exists(p)) ? JSON.parse(await readFile(p, "utf8")) : fallback);

// Words that name a kind of place rather than a specific one. A name made only of these
// ("The Park", "Coffee Bar") is too generic to search for in Reddit comments or TikTok captions.
const GENERIC = new Set("the a an and of at on in by park beach museum cafe coffee bar pizza sushi garden gardens theater theatre cinema market bakery gym store shop club lounge kitchen house room hall center centre trail point view street square plaza pier tower bridge hill tea boba ramen tacos taco grill bbq korean dim sum hot pot food court courts tennis basketball pickleball san francisco new york los angeles chicago seattle boston austin miami washington dc diego sf la nyc city".split(" "));

for (const w of "observation deck lookout vista studio academy lessons class classes rental rentals for with from your our you this that".split(" ")) GENERIC.add(w);

// Everyday English words (the system dictionary). A one-word name like "Noise" or "Butter"
// would match ordinary sentences, so one-word dictionary names are never searched for.
const DICTIONARY = new Set(
  (await readFile("/usr/share/dict/words", "utf8").catch(() => "")).split("\n").filter((w) => w && w === w.toLowerCase())
);

const clean = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const tokens = (s) => clean(s).split(" ").filter(Boolean);
function searchable(name) {
  const meaningful = tokens(name).filter((t) => t.length >= 3 && !GENERIC.has(t));
  if (!meaningful.length || clean(name).length < 5) return false;
  if (tokens(name).length === 1 && DICTIONARY.has(meaningful[0])) return false;
  return true;
}
// Names whose only specific word is an everyday word ("For The Record") must appear with
// the same capitals as the name, so "for the record, my partner..." doesn't count.
function needsCase(name) {
  const meaningful = tokens(name).filter((t) => t.length >= 3 && !GENERIC.has(t));
  return meaningful.length === 1 && DICTIONARY.has(meaningful[0]);
}

// Captions read better without hashtags, and promo posts aren't local opinions.
const PROMO = /link in (my )?bio|use (my )?code|sponsored|#ad\b|sign up/i;
const tidyCaption = (s) => String(s).replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s+/g, " ").trim();

function metersBetween(a, b) {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function sameName(a, b) {
  const A = new Set(tokens(a).filter((t) => !GENERIC.has(t))), B = new Set(tokens(b).filter((t) => !GENERIC.has(t)));
  if (!A.size || !B.size) return clean(a) === clean(b);
  const shared = [...A].filter((t) => B.has(t)).length;
  return shared / Math.min(A.size, B.size) >= 0.75;
}

// Locals pass: a Google result counts only when its title is the spot locals named.
// "Getty Villa" matches "The Getty Villa"; "Indian" does not match "Vaisakhi Indian Kitchen".
const norm = (s) => clean(String(s ?? "").replace(/['’`]/g, "")).replace(/^the /, "");
const meaningfulTokens = (s) => norm(s).split(" ").filter((t) => t.length >= 3 && !GENERIC.has(t) && t !== "restaurant");
function titleMatches(title, candidate) {
  const t = norm(title), c = norm(candidate);
  if (!t || !c) return false;
  if (t === c) return true;
  const T = new Set(meaningfulTokens(title)), C = new Set(meaningfulTokens(candidate));
  if (!T.size || !C.size) return false;
  const shared = [...C].filter((x) => T.has(x)).length;
  const within = (small, big) => ` ${big} `.includes(` ${small} `);
  // The candidate line carried extra words around the real name ("Milano Market Italian Restaurant").
  if (within(t, c) && (t.split(" ").length >= 2 || !DICTIONARY.has(t))) return true;
  // The candidate is a shortened name ("Getty Villa") covering most of the title.
  if (within(c, t) && shared / T.size >= 0.6) return true;
  return shared / Math.max(T.size, C.size) >= 0.6;
}

// Google's category for a locals pick, mapped onto our 10 categories. Kinds that are not
// somewhere to spend an afternoon (hotels, offices, clinics, neighborhoods) map to null.
const CATEGORY_RULES = [
  [null, /hotel|motel|hostel|apartment|condominium|office|company|consultant|publisher|clinic|doctor|dentist|hospital|cannabis|adult|school district|church|parking|post office|city hall|station|ferry|bank|real estate|salon|spa\b|massage|tattoo|non-profit|association|organization|manufacturer|storage|car |auto |gas station|insurance|lawyer|attorney|university|college|grocery|supermarket|convenience|pharmacy|building$|cottage|residential|county|locality|neighborhood/],
  ["courts", /pickleball|tennis court|basketball court|tennis club|racquet/],
  ["sweets", /coffee|cafe|café|bakery|dessert|ice cream|gelato|tea house|tea store|bubble tea|boba|donut|doughnut|patisserie|pastry|chocolate|bagel|creamery|frozen yogurt/],
  ["food", /restaurant|food|pizza|taqueria|diner|deli|sandwich|bbq|barbecue|grill|bistro|eatery|noodle|ramen|sushi|dumpling|hot pot|steak|buffet|izakaya|brunch|kitchen|chicken|burger|taco/],
  ["night", /\bbar\b|pub|night club|nightclub|lounge|brewery|brewpub|winery|wine bar|cocktail|karaoke|comedy|jazz|live music|music venue|speakeasy|beer hall|beer garden|dance club|event venue/],
  ["games", /bowling|arcade|escape room|miniature golf|mini golf|go-kart|go kart|axe|billiard|pool hall|board game|trampoline|batting|skating|amusement|ferris wheel|laser tag|game center|bingo|casino|photo booth/],
  ["classes", /class|workshop|pottery|ceramic|cooking school|dance school|dance studio|art studio|paint/],
  ["active", /climbing|bouldering|hiking|trail|kayak|canoe|paddle|bike|bicycle|surf|\bski|skate|rowing|boat rental|sports club|recreation center|golf course|swimming|pool$/],
  ["culture", /museum|gallery|aquarium|zoo|planetarium|theater|theatre|cinema|movie|art center|historical|landmark|monument|library|performing arts|concert hall|opera|memorial|historic site|cultural|\btours?\b|temple|shrine|stadium|arena/],
  ["views", /park|beach|scenic|viewpoint|vista|observation|garden|nature preserve|lake|island|bridge|pier|harbor|harbour|waterfront|lookout|tourist attraction|notable street|plaza|square|forest|falls|canyon|national|state park|wildlife|seashore|mountain|peak|hill/],
  ["shops", /store|shop|market|mall|boutique|book|record|vintage|thrift|antique|flea|hobby|toy|comic|gift|florist|outlet|emporium/],
];
function categoryFor(g) {
  if (!g.categoryName) return null;
  // Google's main category decides; the extra categories only break a tie.
  for (const text of [g.categoryName, (g.categories ?? []).join(" | ")]) {
    for (const [id, re] of CATEGORY_RULES) if (re.test(String(text).toLowerCase())) return id;
  }
  return null;
}

// A TikTok location tag names this exact place (stricter than titleMatches: a tag of
// "Castro" is the neighborhood, not The Castro Theatre).
function sameTag(name, tag) {
  const a = norm(name), b = norm(tag);
  if (a === b) return true;
  const A = a.split(" "), B = b.split(" ");
  if (A.length === B.length && A.every((w) => B.includes(w))) return true;
  // The tag may add a city or address after the name ("Le Marais Bakery (1138 Sutter Street)"),
  // but a place whose name merely contains the tag sits in that area ("North Beach Gyros").
  return A.length >= 2 && meaningfulTokens(name).length >= 1 && ` ${b} `.includes(` ${a} `);
}

// Percentile rank of each value within its list (0 = lowest, 1 = highest).
function percentiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return values.map((v) => (sorted.length < 2 ? 0.5 : sorted.findLastIndex((x) => x <= v) / (sorted.length - 1)));
}

// The sentence or line around a mention, short enough for a quote card.
function snippet(text, name) {
  const parts = String(text).split(/\n+|(?<=[.!?])\s+/);
  const hit = (parts.find((p) => clean(p).includes(clean(name))) ?? parts[0]).trim();
  if (hit.length <= 180) return hit;
  // Long sentence: keep a window centered on the mention.
  const at = Math.max(0, hit.toLowerCase().indexOf(String(name).toLowerCase().split(/\s+/)[0]));
  const start = Math.max(0, at - 70);
  const piece = hit.slice(start, start + 175).trim();
  return `${start > 0 ? "..." : ""}${piece}${start + 175 < hit.length ? "..." : ""}`;
}

function clusterCourts(elements) {
  const pts = elements
    .map((e) => ({ tags: e.tags ?? {}, lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon }))
    .filter((p) => p.lat && p.lng);
  const courts = [], views = [];
  for (const p of pts) {
    if (p.tags.tourism === "viewpoint") {
      views.push({ id: `osm-view-${views.length}`, name: p.tags.name ?? null, lat: p.lat, lng: p.lng, wheelchair: p.tags.wheelchair ?? null });
      continue;
    }
    const sports = String(p.tags.sport).split(";").filter((s) => ["tennis", "basketball", "pickleball"].includes(s));
    for (const sport of sports) {
      const near = courts.find((c) => c.sport === sport && metersBetween(c, p) < 80);
      if (near) { near.count += 1; near.lit ||= p.tags.lit === "yes"; continue; }
      courts.push({ id: `osm-court-${courts.length}`, sport, lat: p.lat, lng: p.lng, count: 1, name: p.tags.name ?? null, surface: p.tags.surface ?? null, lit: p.tags.lit === "yes", access: p.tags.access ?? null });
    }
  }
  return { courts, views };
}

async function buildCity(city, categoryOf) {
  const dir = join(root, "raw", city.slug);
  const [google, yelp, trip, tiktok, reddit, osm, googleLocals, candidates] = await Promise.all(
    ["google", "yelp", "tripadvisor", "tiktok", "reddit", "osm", "google_locals", "locals_candidates"].map((s) => load(join(dir, `${s}.json`)))
  );
  if (!google.length) return console.warn(`${city.slug}: no Google data yet, skipping`);

  // Locals pass: spots locals named on Reddit and TikTok, looked up on Google Maps.
  // Keep a result only when its title is the named spot and it maps onto one of our categories.
  const candidateNames = new Set(candidates.map((c) => norm(c.name)));
  const known = new Set(google.map((g) => g.placeId));
  let localsKept = 0;
  const locals = [];
  for (const g of googleLocals) {
    if (!g.location || g.permanentlyClosed || known.has(g.placeId)) continue;
    if (!candidateNames.has(norm(g.searchString)) || !titleMatches(g.title, g.searchString)) continue;
    const category = categoryFor(g);
    if (!category) continue;
    known.add(g.placeId);
    locals.push({ ...g, _category: category, _localPick: true });
    localsKept += 1;
  }

  const places = [...google, ...locals]
    .filter((g) => g.location && !g.permanentlyClosed)
    .map((g) => ({
      id: g.placeId,
      name: g.title,
      category: g._category ?? categoryOf.get(clean(g.searchString)) ?? "other",
      kind: g.categoryName ?? null,
      kinds: (g.categories ?? []).slice(0, 4),
      description: g.description ?? null,
      localPick: Boolean(g._localPick),
      lat: g.location.lat,
      lng: g.location.lng,
      address: g.address ?? null,
      neighborhood: g.neighborhood ?? null,
      price: g.price ?? null,
      image: g.imageUrl ?? null,
      hours: (g.openingHours ?? []).map((h) => ({ day: h.day, hours: String(h.hours).replace(/ /g, " ") })),
      reserveUrl: g.reserveTableUrl ?? null,
      website: g.website ?? null,
      phone: g.phone ?? null,
      googleUrl: g.url ?? null,
      temporarilyClosed: Boolean(g.temporarilyClosed),
      ratings: { google: g.totalScore ? { rating: g.totalScore, count: g.reviewsCount ?? 0 } : null, yelp: null, tripadvisor: null },
      mentions: { reddit: 0, redditVotes: 0, tiktok: 0, tiktokViews: 0 },
      quotes: [],
    }));

  // The same place sometimes has two Google listings: keep the one with more reviews.
  places.sort((a, b) => (b.ratings.google?.count ?? 0) - (a.ratings.google?.count ?? 0));
  for (let i = places.length - 1; i >= 0; i--) {
    if (places.findIndex((p) => clean(p.name) === clean(places[i].name) && metersBetween(p, places[i]) < 100) < i) places.splice(i, 1);
  }

  // Attach Yelp and TripAdvisor ratings to the same place (similar name, within 200 m).
  const attach = (rows, key, pick) => {
    for (const r of rows) {
      const at = { lat: Number(r.latitude), lng: Number(r.longitude) };
      if (!at.lat || !at.lng) continue;
      const match = places.find((p) => metersBetween(p, at) < 200 && titleMatches(r.name, p.name));
      if (match && !match.ratings[key]) match.ratings[key] = pick(r);
    }
  };
  attach(yelp, "yelp", (y) => ({
    rating: y.unrounded_avg_rating ?? y.avg_rating,
    count: y.review_count ?? 0,
    url: y.alias ? `https://www.yelp.com/biz/${y.alias}` : null,
    price: y.price ?? null,
    categories: (y.categories ?? []).map((c) => c.name),
    photos: (y.photos ?? []).filter((ph) => ph.url_prefix).slice(0, 4).map((ph) => ({ url: `${ph.url_prefix}l${ph.url_suffix ?? ".jpg"}`, caption: ph.caption ?? null })),
  }));
  // Yelp's price level (1 to 4) and photos live on the place itself.
  for (const p of places) {
    const y = p.ratings.yelp;
    if (!y) continue;
    p.priceLevel = y.price;
    p.photos = y.photos;
    p.kinds = [...new Set([...p.kinds, ...y.categories])].slice(0, 6);
    delete y.price; delete y.photos; delete y.categories;
  }
  attach(trip, "tripadvisor", (t) => ({ rating: Number(t.rating) || null, count: t.numberOfReviews ?? 0, rank: t.rankingString ?? null }));

  // Find places locals mention by name on Reddit and TikTok.
  const named = places.filter((p) => searchable(p.name)).map((p) => ({ p, key: ` ${clean(p.name)} `, exact: needsCase(p.name) ? p.name : null }));
  const texts = [
    ...reddit.map((r) => ({ source: "reddit", text: r.dataType === "comment" ? r.body : `${r.title ?? ""}\n${r.body ?? ""}`, url: r.url ?? r.postUrl, weight: Number(r.commentUpVotes ?? r.upVotes ?? r.score ?? 0) })),
    ...tiktok.map((t) => ({ source: "tiktok", text: `${tidyCaption(t.title ?? "")} ${t.poi?.poiName ?? ""}`, url: t.postPage, weight: Number(t.views ?? 0), promo: PROMO.test(t.title ?? "") })),
  ];
  for (const t of texts) {
    const hay = ` ${clean(t.text)} `;
    for (const { p, key, exact } of named) {
      if (!hay.includes(key) || (exact && !String(t.text).includes(exact))) continue;
      if (t.source === "reddit") { p.mentions.reddit += 1; p.mentions.redditVotes += Math.max(0, t.weight); }
      else { p.mentions.tiktok += 1; p.mentions.tiktokViews += Math.max(0, t.weight); }
      if (!t.promo && p.quotes.length < 4) p.quotes.push({ source: t.source, text: snippet(t.text, p.name), url: t.url, weight: t.weight });
    }
  }
  // Spot Moments: public TikTok videos whose location tag is this place, shown through
  // TikTok's official embed and credited to the creator.
  for (const t of tiktok) {
    const tag = t.poi?.poiName;
    if (!tag || !t.id || !t.channel?.username) continue;
    const match = places.find((p) => sameTag(p.name, tag));
    if (!match) continue;
    (match.moments ??= []).push({
      id: String(t.id),
      url: t.postPage ?? `https://www.tiktok.com/@${t.channel.username}/video/${t.id}`,
      creator: t.channel.username,
      views: Number(t.views ?? 0),
      likes: Number(t.likes ?? 0),
      postedAt: t.uploadedAtFormatted ?? null,
      caption: tidyCaption(t.title ?? "").slice(0, 140),
      duration: t.video?.duration ?? null,
      tag,
    });
  }
  for (const p of places) p.moments?.sort((a, b) => b.likes - a.likes);

  // Best-supported quotes first: Reddit upvotes, then TikTok views.
  for (const p of places) p.quotes.sort((a, b) => (a.source === b.source ? b.weight - a.weight : a.source === "reddit" ? -1 : 1));

  // Scores. Ratings are blended across sources, then pulled toward the city average when
  // few people have rated a place, so a 4.9 from 12 reviews doesn't beat a 4.7 from 2,000.
  const rated = places.filter((p) => p.ratings.google?.count >= 10);
  const cityMean = rated.reduce((s, p) => s + p.ratings.google.rating, 0) / Math.max(rated.length, 1);
  const PRIOR = 100;
  for (const p of places) {
    const rs = Object.values(p.ratings).filter((r) => r?.rating && r.count);
    const votes = rs.reduce((s, r) => s + r.count, 0);
    const avg = votes ? rs.reduce((s, r) => s + r.rating * r.count, 0) / votes : cityMean;
    p._quality = (votes / (votes + PRIOR)) * avg + (PRIOR / (votes + PRIOR)) * cityMean;
    p._love = p.mentions.reddit + Math.log1p(p.mentions.redditVotes) + p.mentions.tiktok + Math.log10(1 + p.mentions.tiktokViews) / 2;
    p._exposure = Math.log1p(votes) + (p.ratings.tripadvisor ? 1 : 0);
  }
  const q = percentiles(places.map((p) => p._quality));
  const loved = places.filter((p) => p._love > 0);
  const lovePct = new Map(percentiles(loved.map((p) => p._love)).map((v, i) => [loved[i].id, v]));
  const ex = percentiles(places.map((p) => p._exposure));
  places.forEach((p, i) => {
    const love = lovePct.get(p.id) ?? 0;
    p.scores = {
      locals: Math.round(100 * (0.65 * q[i] + 0.35 * love)),
      quality: Math.round(100 * q[i]),
      localLove: Math.round(100 * love),
      exposure: Math.round(100 * ex[i]),
    };
    // A hidden gem: rated well, not overexposed, and either vouched for by locals or
    // near the top of the city with enough reviews to trust it.
    const count = p.ratings.google?.count ?? 0;
    p.hiddenGem = q[i] >= 0.6 && ex[i] <= 0.5 && (love > 0 || (q[i] >= 0.9 && count >= 80));
    delete p._quality; delete p._love; delete p._exposure;
  });

  // Courts and viewpoints from OpenStreetMap, named after the nearest Google place when unnamed.
  const { courts, views } = clusterCourts(osm);
  for (const spot of [...courts, ...views]) {
    if (spot.name) continue;
    const near = places.filter((p) => metersBetween(p, spot) < 150).sort((a, b) => metersBetween(a, spot) - metersBetween(b, spot))[0];
    spot.name = near?.name ?? null;
    spot.placeId = near?.id ?? null;
  }

  const out = { city: { slug: city.slug, name: city.name }, builtAt: new Date().toISOString(), places, courts, viewpoints: views.filter((v) => v.name) };
  await mkdir(join(root, "out"), { recursive: true });
  await writeFile(join(root, "out", `${city.slug}.json`), JSON.stringify(out));
  const gems = places.filter((p) => p.hiddenGem).length;
  const mentioned = places.filter((p) => p.mentions.reddit + p.mentions.tiktok > 0).length;
  const withMoments = places.filter((p) => p.moments?.length).length;
  console.log(`${city.slug}: ${places.length} places (${localsKept} locals picks, ${mentioned} mentioned by locals, ${gems} hidden gems, ${withMoments} with Spot Moments), ${courts.length} court spots, ${out.viewpoints.length} named viewpoints`);
}

const cities = JSON.parse(await readFile(join(root, "config/cities.json"), "utf8"));
const categories = JSON.parse(await readFile(join(root, "config/categories.json"), "utf8"));
const categoryOf = new Map(categories.flatMap((c) => (c.google ?? []).map((q) => [clean(q), c.id])));
const slug = arg("city", "all");
for (const city of slug === "all" ? cities : cities.filter((c) => c.slug === slug)) await buildCity(city, categoryOf);
