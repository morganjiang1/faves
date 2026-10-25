// The ranking: no network here, so it is easy to test.
// - vibeTags: plain words ("cozy bookstore", "lit pickleball") to OpenStreetMap tags
// - overpassQuery: the places with those tags inside a box
// - mentions: how often, and how warmly (upvotes), locals name each place on Reddit
// - rank: the Locals Score (0 to 10) and the hidden-gem flag

const VIBES = [
  { words: ["bookstore", "bookshop", "books", "book store", "book shop"], tags: [["shop", "books"]], kind: "bookstore" },
  { words: ["coffee", "cafe", "café", "espresso"], tags: [["amenity", "cafe"]], kind: "cafe" },
  { words: ["bar", "bars", "drinks", "cocktail", "cocktails", "beer", "pub", "wine"], tags: [["amenity", "bar"], ["amenity", "pub"]], kind: "bar" },
  { words: ["pickleball"], tags: [["sport", "pickleball"]], kind: "pickleball courts", sport: true },
  { words: ["tennis"], tags: [["sport", "tennis"]], kind: "tennis courts", sport: true },
  { words: ["basketball", "hoops"], tags: [["sport", "basketball"]], kind: "basketball courts", sport: true },
  { words: ["climbing", "bouldering", "climb"], tags: [["sport", "climbing"]], kind: "climbing", sport: true },
  { words: ["view", "views", "viewpoint", "sunset", "lookout", "overlook", "vista"], tags: [["tourism", "viewpoint"]], kind: "viewpoint" },
  { words: ["park", "picnic"], tags: [["leisure", "park"]], kind: "park" },
  { words: ["museum", "museums"], tags: [["tourism", "museum"]], kind: "museum" },
  { words: ["gallery", "galleries"], tags: [["tourism", "gallery"], ["shop", "art"]], kind: "gallery" },
  { words: ["arcade", "pinball"], tags: [["leisure", "amusement_arcade"]], kind: "arcade" },
  { words: ["karaoke"], tags: [["amenity", "karaoke_box"]], kind: "karaoke" },
  { words: ["bowling"], tags: [["leisure", "bowling_alley"]], kind: "bowling" },
  { words: ["ramen"], tags: [["cuisine", "ramen"]], kind: "ramen", cuisine: true },
  { words: ["hot pot", "hotpot", "shabu"], tags: [["cuisine", "hot_pot"], ["cuisine", "hotpot"], ["cuisine", "shabu-shabu"], ["cuisine", "shabu_shabu"]], kind: "hot pot", cuisine: true, nameLike: "hot ?pot|shabu" },
  { words: ["taco", "tacos", "taqueria", "burrito", "burritos"], tags: [["cuisine", "mexican"]], kind: "tacos", cuisine: true },
  { words: ["pizza"], tags: [["cuisine", "pizza"]], kind: "pizza", cuisine: true },
  { words: ["sushi"], tags: [["cuisine", "sushi"]], kind: "sushi", cuisine: true },
  { words: ["dim sum", "dumpling", "dumplings"], tags: [["cuisine", "dim_sum"], ["cuisine", "dumpling"], ["cuisine", "dumplings"]], kind: "dumplings", cuisine: true },
  { words: ["bakery", "pastry", "pastries", "croissant", "croissants"], tags: [["shop", "bakery"]], kind: "bakery" },
  { words: ["ice cream", "gelato"], tags: [["amenity", "ice_cream"]], kind: "ice cream" },
  { words: ["vintage", "thrift"], tags: [["shop", "second_hand"]], kind: "vintage" },
  { words: ["record store", "records", "vinyl"], tags: [["shop", "music"]], kind: "records" },
  { words: ["board game", "board games", "game store"], tags: [["shop", "games"]], kind: "games" },
  { words: ["brunch", "breakfast"], tags: [["cuisine", "breakfast"], ["cuisine", "brunch"]], kind: "brunch", cuisine: true },
  { words: ["restaurant", "dinner", "lunch", "food", "eat"], tags: [["amenity", "restaurant"]], kind: "restaurant" },
];

const has = (text, w) => new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`).test(text);

export function vibeTags(vibe) {
  const t = String(vibe || "").toLowerCase();
  const hits = VIBES.filter((v) => v.words.some((w) => has(t, w)));
  // Nothing we know: any named place that's a restaurant, cafe, bar or attraction.
  const picked = hits.length ? hits : [VIBES.find((v) => v.kind === "restaurant"), VIBES.find((v) => v.kind === "cafe"), VIBES.find((v) => v.kind === "bar")];
  return { groups: picked, lit: /\b(lit|night|lights?)\b/.test(t), words: t.split(/[^a-z0-9]+/).filter((w) => w.length > 2) };
}

export function overpassQuery(groups, box, limit = 1500) {
  const [s, w, n, e] = box.map((x) => Number(x).toFixed(5));
  const lines = [];
  for (const g of groups) {
    for (const [k, v] of g.tags) {
      // Courts are usually unnamed pitches: take them all and name them after their park.
      if (g.sport) lines.push(`nwr["${k}"~"(^|;)${v}($|;)"](${s},${w},${n},${e});`);
      else lines.push(g.cuisine ? `nwr["${k}"~"(^|;)${v}($|;)"]["name"](${s},${w},${n},${e});` : `nwr["${k}"="${v}"]["name"](${s},${w},${n},${e});`);
    }
    if (g.sport) lines.push(`way["leisure"="park"]["name"](${s},${w},${n},${e});relation["leisure"="park"]["name"](${s},${w},${n},${e});`);
    if (g.nameLike) lines.push(`nwr["amenity"="restaurant"]["name"~"${g.nameLike}",i](${s},${w},${n},${e});`);
  }
  return `[out:json][timeout:50];(${lines.join("")});out center tags ${limit};`;
}

export const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const SUFFIX = /\s+(books|bookstore|bookshop|cafe|coffee|coffee shop|bar|pub|restaurant|kitchen|bakery|park|museum|gallery|courts?|club)$/;
const GENERIC = new Set(["the park", "park", "cafe", "the bar", "coffee", "starbucks coffee", "playground", "tennis courts", "pickleball courts", "basketball court"]);

// The ways locals write a place's name: "Green Apple Books" is also "Green Apple".
export function nameVariants(name, park) {
  const out = new Set();
  for (const raw of [name, park].filter(Boolean)) {
    const n = norm(raw).replace(/^the\s+/, "");
    out.add(n);
    const short = n.replace(SUFFIX, "");
    if (short !== n && (short.split(" ").length >= 2 || short.length >= 7)) out.add(short);
  }
  return [...out].filter((v) => v.length >= 4 && !GENERIC.has(v));
}

// texts: [{ text, upvotes, thread, url }]. Returns a Map(placeKey -> { count, upvotes, weight, threads:Set, evidence[] }).
export function mentions(places, texts) {
  const out = new Map();
  const prepared = texts.map((t) => ({ ...t, n: ` ${norm(t.text)} ` }));
  for (const p of places) {
    const vs = nameVariants(p.name, p.tags?.["faves:park"]);
    if (!vs.length) continue;
    const res = vs.map((v) => new RegExp(` ${v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} `));
    for (const t of prepared) {
      if (!res.some((r) => r.test(t.n))) continue;
      const m = out.get(p.key) ?? { count: 0, upvotes: 0, weight: 0, threads: new Set(), evidence: [] };
      const up = Math.max(0, t.upvotes || 0);
      m.count += 1;
      m.upvotes += up;
      m.weight += 1 + Math.log(1 + up);
      m.threads.add(t.thread);
      if (m.evidence.length < 3 && t.url) m.evidence.push({ source: "reddit", url: t.url, upvotes: up });
      out.set(p.key, m);
    }
  }
  return out;
}

export function metersBetween(a, b) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// The Locals Score, 0 to 10: what locals say first (upvote-weighted mentions), then whether the
// place is real and open (hours, a website). A place nobody has named yet tops out under 5.
export function localsScore(m, tags = {}) {
  const complete = (tags.opening_hours ? 0.4 : 0) + (tags.website || tags["contact:website"] ? 0.3 : 0) + (tags["addr:street"] ? 0.1 : 0);
  if (!m || !m.weight) return Math.round((4 + complete) * 10) / 10;
  return Math.round(Math.min(9.8, 5.4 + 1.55 * Math.log(1 + m.weight) + complete * 0.5) * 10) / 10;
}

// Hidden gem: locals who mention it love it (well upvoted), but it comes up far less than the
// famous ones (a quarter as often as the most-named spot, or once), and it isn't a chain.
export function hiddenGem(m, tags = {}, topCount = 1) {
  if (!m || !m.count || tags.brand || tags["brand:wikidata"]) return false;
  return m.count <= Math.max(1, Math.floor(topCount / 4)) && m.count < topCount && m.upvotes / m.count >= 5;
}

export function rank(elements, texts, { center = null, lit = false, max = 10, kindOf = () => null, groups = [] } = {}) {
  const places = [];
  const seen = new Set();
  const sports = groups.filter((g) => g.sport);
  const wantParks = groups.some((g) => g.kind === "park");
  const at = (el) => ({ lat: el.lat ?? el.center?.lat, lng: el.lon ?? el.center?.lon });
  // Parks name the courts in them; they're results only when you asked for a park.
  const isPark = (el) => el.tags?.leisure === "park";
  const parks = sports.length ? elements.filter(isPark).map((el) => ({ name: el.tags.name, ...at(el) })).filter((p) => p.lat != null) : [];
  for (const raw of elements) {
    if (sports.length && !wantParks && isPark(raw)) continue;
    const el = { ...raw, tags: { ...(raw.tags || {}) } };
    const tags = el.tags;
    const { lat, lng } = at(el);
    if (lat == null || lng == null) continue;
    if (!tags.name) {
      const sport = sports.find((g) => g.tags.some(([k, v]) => String(tags[k] || "").split(";").includes(v)));
      const park = sport ? parks.map((p) => ({ p, d: metersBetween(p, { lat, lng }) })).sort((a, b) => a.d - b.d)[0] : null;
      if (!sport || !park || park.d > 400) continue;
      tags.name = `${park.p.name} ${sport.kind}`;
      tags["faves:park"] = park.p.name;
    }
    const key = `${norm(tags.name)}|${lat.toFixed(3)}|${lng.toFixed(3)}`;
    const dedupe = norm(tags.name);
    // One entry per name within ~300 m (a park's courts and the park, two OSM objects for one shop).
    if ([...seen].some((s) => s.startsWith(`${dedupe}|`) && metersBetween({ lat, lng }, { lat: Number(s.split("|")[1]), lng: Number(s.split("|")[2]) }) < 300)) continue;
    seen.add(`${dedupe}|${lat}|${lng}`);
    places.push({ key, name: tags.name, tags, lat, lng, type: el.type, id: el.id });
  }
  const said = mentions(places, texts);
  const topCount = Math.max(0, ...[...said.values()].map((m) => m.count));
  const scored = places.map((p) => {
    const m = said.get(p.key);
    let score = localsScore(m, p.tags);
    if (lit && p.tags.lit === "yes") score = Math.min(9.9, score + 0.4);
    const dist = center ? metersBetween(center, p) : 0;
    return {
      name: p.name,
      kind: kindOf(p.tags),
      neighborhood: p.tags["addr:suburb"] || p.tags["addr:neighbourhood"] || p.tags["addr:quarter"] || null,
      address: [p.tags["addr:housenumber"], p.tags["addr:street"]].filter(Boolean).join(" ") || null,
      lat: p.lat,
      lng: p.lng,
      localsScore: score,
      hiddenGem: hiddenGem(m, p.tags, topCount),
      redditMentions: m?.count ?? 0,
      redditUpvotes: m?.upvotes ?? 0,
      evidence: m?.evidence ?? [],
      lit: p.tags.lit === "yes" ? true : p.tags.lit === "no" ? false : null,
      openingHours: p.tags.opening_hours ?? null,
      website: p.tags.website ?? p.tags["contact:website"] ?? null,
      osmUrl: `https://www.openstreetmap.org/${p.type}/${p.id}`,
      distanceMeters: center ? Math.round(dist) : null,
    };
  });
  scored.sort((a, b) => b.localsScore - a.localsScore || (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  return scored.slice(0, max).map((s, i) => ({ rank: i + 1, ...s }));
}

export function kindFor(groups) {
  return (tags) => {
    for (const g of groups) for (const [k, v] of g.tags) {
      const val = String(tags[k] || "");
      if (g.cuisine ? val.split(";").includes(v) : val === v) return g.kind;
    }
    return groups[0]?.kind ?? null;
  };
}
