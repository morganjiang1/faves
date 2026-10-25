// Load the cities' spots into Convex for "find a spot by vibe" and booking details:
//   npx tsx scripts/convex-seed.ts [city ...]      (reads EXPO_PUBLIC_CONVEX_URL from .env.local)
import "../server/node-shim.cjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { CITY_INDEX, loadCity } from "../src/data/cities";
import { vibeLine } from "../src/lib/score";
import { vibeVector } from "../src/lib/vibe";

const env = Object.fromEntries(readFileSync(join(__dirname, "..", ".env.local"), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const url = process.env.CONVEX_URL ?? env.EXPO_PUBLIC_CONVEX_URL;
if (!url) throw new Error("No Convex URL: run npx convex dev first.");
const client = new ConvexHttpClient(url);

(async () => {
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : CITY_INDEX.map((c) => c.slug);
  for (const slug of slugs) {
    const city = await loadCity(slug);
    const rows = city.places.filter((p) => !p.court || p.locals > 0).map((p) => ({
      placeId: p.id, city: slug, name: p.name, kind: p.kind, hood: p.hood, locals: p.locals, reserveUrl: p.reserveUrl, phone: p.phone, lat: p.lat, lng: p.lng,
      // What it is counts most (name and kinds three times over), then how it feels.
      embedding: vibeVector([p.name, p.name, p.kind, p.kind, p.kind, ...p.kinds, ...p.kinds, p.category, vibeLine(p), p.description, p.hiddenGem ? "hidden gem lowkey local" : "", ...p.quotes.slice(0, 2).map((q) => q.text)].filter(Boolean).join(" ")),
    }));
    for (let i = 0; i < rows.length; i += 100) await client.mutation(anyApi.places.insertBatch, { rows: rows.slice(i, i + 100) });
    console.log(`${slug}: ${rows.length} spots`);
  }
})();
