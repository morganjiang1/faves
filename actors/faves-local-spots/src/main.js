// Faves Local Spots: the spots locals love for a vibe in a city.
// 1. Find the city (and neighborhood) on OpenStreetMap (Nominatim).
// 2. Pull the named places that fit the vibe from OpenStreetMap (Overpass).
// 3. Read the top threads on the city's ask-locals subreddit about that vibe, comments too.
// 4. Rank: the Locals Score weighs how often and how warmly locals name each place.
import { Actor, log } from "apify";
import { kindFor, overpassQuery, rank, vibeTags } from "./rank.js";

const UA = "FavesLocalSpots/0.1 (Apify Actor; https://apify.com)";
const SUBS = { "san francisco": "AskSF", "new york": "AskNYC", "los angeles": "AskLosAngeles", chicago: "AskChicago", seattle: "Seattle", boston: "boston", austin: "Austin", miami: "Miami", "washington": "washingtondc", "san diego": "sandiego" };

await Actor.init();
const input = (await Actor.getInput()) ?? {};
const city = String(input.city || "San Francisco").trim();
const vibe = String(input.vibe || "").trim();
const max = Math.min(50, Math.max(1, Number(input.maxResults) || 10));
const threads = Math.min(20, Math.max(0, Number(input.redditThreads ?? 6)));
if (!vibe) throw new Error("Say what you're looking for in \"vibe\", like \"cozy bookstore\".");

let dispatcher;
if (input.useApifyProxy) {
  const { ProxyAgent } = await import("undici");
  const proxy = await Actor.createProxyConfiguration();
  const url = await proxy?.newUrl();
  if (url) dispatcher = new ProxyAgent(url);
}

async function getJson(url, { proxied = false, tries = 3, body } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: body ? "POST" : "GET", body, headers: { "User-Agent": UA, Accept: "application/json", ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) }, ...(proxied && dispatcher ? { dispatcher } : {}) });
      if (res.ok) return await res.json();
      log.warning(`${new URL(url).host} answered ${res.status}`);
      if (res.status === 403 || res.status === 404) return null;
    } catch (e) {
      log.warning(`${new URL(url).host}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return null;
}

// 1. Where.
const place = (await getJson(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(city)}`))?.[0];
if (!place) throw new Error(`Couldn't find the city "${city}" on OpenStreetMap.`);
let [south, north, west, east] = place.boundingbox.map(Number);
let center = { lat: Number(place.lat), lng: Number(place.lon) };
if (input.neighborhood) {
  const hood = (await getJson(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${input.neighborhood}, ${city}`)}`))?.[0];
  if (hood) {
    center = { lat: Number(hood.lat), lng: Number(hood.lon) };
    const d = 0.025; // about 2.5 km around the neighborhood
    [south, north, west, east] = [center.lat - d, center.lat + d, center.lng - d * 1.25, center.lng + d * 1.25];
  }
}
// Big metros: keep the box to the core city (about 25 km across).
const clamp = (lo, hi, mid, half) => [Math.max(lo, mid - half), Math.min(hi, mid + half)];
[south, north] = clamp(south, north, center.lat, 0.12);
[west, east] = clamp(west, east, center.lng, 0.15);

// 2. What.
const { groups, lit } = vibeTags(vibe);
log.info(`Looking for ${groups.map((g) => g.kind).join(", ")} in ${place.display_name.split(",")[0]}`);
const osm = await getJson("https://overpass-api.de/api/interpreter", { body: `data=${encodeURIComponent(overpassQuery(groups, [south, west, north, east]))}`, tries: 3 });
const elements = osm?.elements ?? [];
log.info(`${elements.length} places on OpenStreetMap`);

// 3. What locals say: Reddit's JSON first; when Reddit blocks us (it often blocks servers),
// Apify's Reddit scraper reads the same threads through residential proxies, within a small budget.
const sub = input.subreddit || SUBS[Object.keys(SUBS).find((k) => city.toLowerCase().includes(k)) ?? ""] || city.replace(/[^A-Za-z]/g, "");
const texts = [];
let reddit = threads === 0 ? "skipped" : "unavailable";
if (threads > 0) {
  const search = await getJson(`https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(vibe)}&restrict_sr=1&sort=relevance&t=all&limit=${threads}`, { proxied: true, tries: 1 });
  const posts = search?.data?.children?.map((c) => c.data) ?? [];
  if (search) reddit = "reddit.com";
  for (const p of posts) {
    texts.push({ text: `${p.title} ${p.selftext ?? ""}`, upvotes: p.score, thread: p.id, url: `https://www.reddit.com${p.permalink}` });
    const thread = await getJson(`https://www.reddit.com${p.permalink}.json?limit=300&depth=5`, { proxied: true });
    const walk = (node) => {
      for (const c of node?.data?.children ?? []) {
        if (c.kind !== "t1") continue;
        texts.push({ text: c.data.body ?? "", upvotes: c.data.score, thread: p.id, url: `https://www.reddit.com${c.data.permalink}` });
        if (c.data.replies) walk(c.data.replies);
      }
    };
    walk(thread?.[1]);
  }
  const token = process.env.APIFY_TOKEN;
  if (!search && token && input.redditScraper !== false) {
    const budget = Math.min(1, Number(input.redditBudgetUsd ?? 0.3));
    const actor = String(input.redditScraperActor || "harshmaur/reddit-scraper").replace("/", "~");
    const body = { searchTerms: [vibe], withinCommunity: sub, searchPosts: true, searchComments: true, searchSort: "relevance", searchTime: "all", maxPostsCount: threads, maxCommentsCount: 40, crawlCommentsPerPost: false, includeNSFW: false };
    try {
      const res = await fetch(`https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${token}&timeout=150&maxTotalChargeUsd=${budget}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const items = res.ok ? await res.json() : [];
      for (const it of items) {
        const isPost = it.dataType === "post";
        texts.push({ text: `${isPost ? `${it.title ?? it.postTitle ?? ""} ` : ""}${it.body ?? ""}`, upvotes: Number(it.score ?? it.upVotes ?? it.commentUpVotes ?? 0), thread: it.parsedPostId ?? it.postId ?? it.id, url: it.url });
      }
      if (items.length) reddit = `Apify ${actor.replace("~", "/")}`;
      else log.warning(`The Reddit scraper returned nothing (${res.status}).`);
    } catch (e) {
      log.warning(`The Reddit scraper failed: ${e.message}`);
    }
  }
  log.info(`Read ${texts.length} Reddit posts and comments on r/${sub} (${reddit})`);
}

// 4. Rank.
const spots = rank(elements, texts, { center, lit, max, kindOf: kindFor(groups), groups });
await Actor.pushData(spots.map((s) => ({ ...s, city, vibe })));
await Actor.setValue("OUTPUT", {
  city, vibe, subreddit: sub, reddit,
  placesConsidered: elements.length, redditPostsRead: texts.length, spots,
});
log.info(`Top: ${spots.slice(0, 3).map((s) => `${s.name} (${s.localsScore})`).join(", ") || "nothing found"}`);
await Actor.exit();
