// Scrape every source for one or more cities into data/raw/<city>/<source>.json.
// Usage: node data/scripts/scrape.mjs --city san-francisco|all --source google|yelp|tiktok|reddit|tripadvisor|osm|all [--force]
// Needs APIFY_TOKEN for the Apify sources. Skips files that already exist unless --force.
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startRun, waitForRun, downloadDataset } from "./apify.mjs";
import { SOURCES } from "./sources.mjs";
import { cityBox, courtsAndViews } from "./osm.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const force = process.argv.includes("--force");
const exists = (p) => access(p).then(() => true, () => false);

const cities = JSON.parse(await readFile(join(root, "config/cities.json"), "utf8"));
const categories = JSON.parse(await readFile(join(root, "config/categories.json"), "utf8"));
const citySlug = arg("city", "all");
const sourceName = arg("source", "all");
const chosenCities = citySlug === "all" ? cities : cities.filter((c) => c.slug === citySlug);
const chosenSources = sourceName === "all" ? [...Object.keys(SOURCES), "osm"] : [sourceName];
if (!chosenCities.length) throw new Error(`Unknown city ${citySlug}`);

// Apify caps concurrent runs per account, so at most MAX_RUNS run at once; a start that
// is refused for capacity waits and retries.
const MAX_RUNS = 20;
let active = 0;
const queue = [];
async function withSlot(fn) {
  if (active >= MAX_RUNS) await new Promise((resolve) => queue.push(resolve));
  active += 1;
  try { return await fn(); } finally { active -= 1; queue.shift()?.(); }
}

async function runActor(actor, input, maxChargeUsd) {
  return withSlot(async () => {
    for (let attempt = 1; ; attempt++) {
      try {
        const run = await startRun(actor, input, { maxChargeUsd });
        return await waitForRun(run.id);
      } catch (err) {
        if (attempt >= 5) throw err;
        await new Promise((r) => setTimeout(r, 30000 * attempt));
      }
    }
  });
}

async function scrapeApify(city, name) {
  const source = SOURCES[name];
  const inputs = source.runs(city, categories);
  console.log(`${city.slug}/${name}: ${inputs.length} run(s) queued`);
  const finished = await Promise.all(inputs.map((input) => runActor(source.actor, input, source.maxChargeUsd)));
  const items = [];
  for (const run of finished) {
    if (run.status !== "SUCCEEDED") console.warn(`${city.slug}/${name}: run ${run.id} ended ${run.status}`);
    items.push(...(await downloadDataset(run.defaultDatasetId)));
  }
  const cost = finished.reduce((sum, r) => sum + (r.usageTotalUsd ?? 0), 0);
  return { items, meta: { actor: source.actor, runs: finished.map((r) => ({ id: r.id, status: r.status, usd: r.usageTotalUsd })), usd: cost } };
}

async function scrapeOsm(city) {
  const box = await cityBox(city.google);
  const items = await courtsAndViews(box);
  return { items, meta: { box, usd: 0 } };
}

async function scrape(city, name) {
  const out = join(root, "raw", city.slug, `${name}.json`);
  if (!force && (await exists(out))) return console.log(`${city.slug}/${name}: already scraped, skipping`);
  const { items, meta } = name === "osm" ? await scrapeOsm(city) : await scrapeApify(city, name);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(items));
  await writeFile(out.replace(/\.json$/, ".meta.json"), JSON.stringify({ ...meta, count: items.length, at: new Date().toISOString() }, null, 2));
  console.log(`${city.slug}/${name}: ${items.length} items, $${meta.usd.toFixed(2)}`);
}

// Apify sources run in parallel (bounded by MAX_RUNS). OpenStreetMap's free services allow
// about one request per second, so those run one city at a time.
const apifyJobs = chosenCities.flatMap((city) => chosenSources.filter((n) => n !== "osm").map((name) => scrape(city, name)));
const osmJob = (async () => {
  if (!chosenSources.includes("osm")) return;
  for (const city of chosenCities) {
    await scrape(city, "osm").catch((err) => console.error(`${city.slug}/osm failed:`, err.message));
    await new Promise((r) => setTimeout(r, 2000));
  }
})();
const results = await Promise.allSettled([...apifyJobs, osmJob]);
results.filter((r) => r.status === "rejected").forEach((r) => console.error("failed:", r.reason.message));
