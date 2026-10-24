// The locals pass: find the spots locals name on Reddit and TikTok that the Google category
// searches missed, then look each one up on Google Maps.
// Usage: node data/scripts/locals.mjs --city san-francisco|all [--dry] [--max 250]
//   --dry   only list the candidate names (no Apify spend)
import { readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startRun, waitForRun, downloadDataset } from "./apify.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const dry = process.argv.includes("--dry");
const max = Number(arg("max", 250));
const exists = (p) => access(p).then(() => true, () => false);
const load = async (p) => ((await exists(p)) ? JSON.parse(await readFile(p, "utf8")) : []);
const clean = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// Words that start a sentence or describe rather than name a place.
const NOT_A_NAME = new Set("i im i've ive the a an and but or if so my we our you your they it its this that these those there here what when where why how yes no also just try go get check honestly definitely love loved best good great favorite fav edit update lol tbh imo also highly anything everything something nothing anywhere somewhere".split(" "));

// Chat phrases that look like list items in comments.
const CHAT = /^(thanks?|thank you.*|hello.*|hey.*|hi|tl ?dr|note|notes|cons|pros|edit|update|morning|afternoon|evening|night|day \\d+|week \\d+|locals?|things .*|have a .*|be .*|cool .*|nice .*|my .*|also .*|overall|summary)$/;
// Kinds of places: a phrase of everyday words still counts if it names one ("Hawk Hill").
const PLACE_WORDS = new Set("park parks hill hills beach trail trails garden gardens alley lake pier point museum gallery cafe coffee tavern bar pub temple church cathedral market tower bridge falls cove bay creek canyon island stairs steps library theater theatre cinema studio club lounge diner bakery taqueria pizzeria kitchen grill house hall plaza square fort lighthouse woods forest monument seashore reserve preserve arcade rink courts court".split(" "));
const DICTIONARY = new Set(
  (await readFile("/usr/share/dict/words", "utf8").catch(() => "")).split("\n").filter((w) => w && w === w.toLowerCase())
);
function plausibleName(name) {
  // Real names are written like names: most longer words capitalized, no sentence breaks.
  if (/\.\s/.test(name)) return false;
  const longWords = name.split(/\s+/).filter((w) => w.replace(/[^\p{L}]/gu, "").length >= 3);
  const capitalized = longWords.filter((w) => /^[\p{Lu}0-9]/u.test(w)).length;
  // Every longer word capitalized ("Jack Early Park"); names of 3+ words may have one lowercase word.
  const lowercase = longWords.length - capitalized;
  if (lowercase > (longWords.length >= 3 ? 1 : 0)) return false;
  const words = clean(name).split(" ").filter(Boolean);
  if (!words.length || CHAT.test(clean(name))) return false;
  const specific = words.filter((w) => w.length >= 3 && !DICTIONARY.has(w));
  return specific.length > 0 || words.some((w) => PLACE_WORDS.has(w));
}

function candidatesFromReddit(items) {
  const out = [];
  for (const r of items) {
    const text = r.dataType === "comment" ? r.body : `${r.title ?? ""}\n${r.body ?? ""}`;
    const votes = Number(r.commentUpVotes ?? r.upVotes ?? r.score ?? 0);
    for (const raw of String(text ?? "").split(/\n+/)) {
      const line = raw.replace(/^\s*(?:[-*•>]|\d+[.)])\s*/, "").replace(/\*\*/g, "").trim();
      // List-style recommendations: "Four Kings - Chinatown", "Hedge Coffee: Mission", "Zuni (Hayes Valley)".
      const m = line.match(/^([A-Z0-9][\w'’&.!]*(?:\s+(?:[A-Za-z0-9][\w'’&.!]*)){0,5})\s*(?:[-–—:(]|$)/);
      if (!m) continue;
      const name = m[1].replace(/[.!]+$/, "").trim();
      const words = clean(name).split(" ");
      if (name.length < 4 || name.length > 40 || NOT_A_NAME.has(words[0]) || words.length > 6) continue;
      if (line.length > 90 && !/[-–—:(]/.test(line.slice(0, name.length + 3))) continue;
      out.push({ name, weight: 1 + Math.log1p(Math.max(0, votes)), source: "reddit" });
    }
  }
  return out;
}

function candidatesFromTiktok(items) {
  const out = [];
  for (const t of items) {
    const weight = 1 + Math.log10(1 + Number(t.views ?? 0)) / 2;
    if (t.poi?.poiName) out.push({ name: t.poi.poiName, weight, source: "tiktok" });
    for (const m of String(t.title ?? "").matchAll(/📍\s*@?([^📍#\n,|]{3,40})/gu)) {
      out.push({ name: m[1].trim().replace(/[.!:]+$/, ""), weight, source: "tiktok" });
    }
  }
  return out;
}

async function cityCandidates(city) {
  const dir = join(root, "raw", city.slug);
  const [reddit, tiktok, google] = await Promise.all(["reddit", "tiktok", "google"].map((s) => load(join(dir, `${s}.json`))));
  const known = new Set(google.map((g) => clean(g.title)));
  const cityWords = new Set([clean(city.name), clean(city.tiktok), clean(city.google.split(",")[0])]);
  const tally = new Map();
  for (const c of [...candidatesFromReddit(reddit), ...candidatesFromTiktok(tiktok)]) {
    const key = clean(c.name);
    if (!key || known.has(key) || cityWords.has(key) || !plausibleName(c.name)) continue;
    const prev = tally.get(key) ?? { name: c.name, score: 0, sources: new Set(), count: 0 };
    prev.score += c.weight; prev.count += 1; prev.sources.add(c.source);
    tally.set(key, prev);
  }
  return [...tally.values()]
    .map((c) => ({ ...c, score: c.score + (c.sources.size > 1 ? 2 : 0), sources: [...c.sources] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

const cities = JSON.parse(await readFile(join(root, "config/cities.json"), "utf8"));
const slug = arg("city", "all");
for (const city of slug === "all" ? cities : cities.filter((c) => c.slug === slug)) {
  const candidates = await cityCandidates(city);
  await writeFile(join(root, "raw", city.slug, "locals_candidates.json"), JSON.stringify(candidates, null, 1));
  if (dry) {
    console.log(`${city.slug}: ${candidates.length} candidates\n  ${candidates.slice(0, 60).map((c) => `${c.name} (${c.count}${c.sources.length > 1 ? ", both" : ""})`).join(" · ")}`);
    continue;
  }
  const out = join(root, "raw", city.slug, "google_locals.json");
  if (await exists(out)) { console.log(`${city.slug}: locals already looked up, skipping`); continue; }
  const run = await startRun("compass/crawler-google-places", {
    searchStringsArray: candidates.map((c) => c.name),
    locationQuery: city.google,
    maxCrawledPlacesPerSearch: 1,
    language: "en",
    maxReviews: 0,
    maxImages: 0,
  }, { maxChargeUsd: 1.5 });
  const done = await waitForRun(run.id);
  const items = await downloadDataset(done.defaultDatasetId);
  await writeFile(out, JSON.stringify(items));
  console.log(`${city.slug}: looked up ${candidates.length} local picks, got ${items.length} places, $${(done.usageTotalUsd ?? 0).toFixed(2)}`);
}
