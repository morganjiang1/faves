// Put a city's bundled spot clips (and their posters) into Convex file storage, so a deployed
// Convex can serve them (clips.forCity) instead of shipping every clip inside the app.
//   npx tsx scripts/convex-upload-clips.ts [city ...]     (default: san-francisco)
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

const root = join(__dirname, "..");
const env = Object.fromEntries(readFileSync(join(root, ".env.local"), "utf8").split("\n").filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const url = process.env.CONVEX_URL ?? env.EXPO_PUBLIC_CONVEX_URL;
if (!url) throw new Error("No Convex URL: run npm run convex first.");
const client = new ConvexHttpClient(url);

type Entry = { video: string; poster?: string; creator?: string; views?: number; more?: Entry[] };

async function upload(file: string, type: string): Promise<string> {
  const target = (await client.mutation(anyApi.clips.uploadUrl, {})) as string;
  const res = await fetch(target, { method: "POST", headers: { "Content-Type": type }, body: readFileSync(file) });
  return ((await res.json()) as { storageId: string }).storageId;
}

(async () => {
  const cities = process.argv.slice(2).length ? process.argv.slice(2) : ["san-francisco"];
  for (const city of cities) {
    const dir = join(root, "assets/videos", city);
    const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as Record<string, Entry>;
    let n = 0;
    for (const [placeId, first] of Object.entries(manifest)) {
      for (const [order, clip] of [first, ...(first.more ?? [])].entries()) {
        const video = join(dir, clip.video);
        if (!existsSync(video)) continue;
        const poster = clip.poster && existsSync(join(dir, clip.poster)) ? await upload(join(dir, clip.poster), "image/jpeg") : undefined;
        await client.mutation(anyApi.clips.save, { placeId, city, order, video: await upload(video, "video/mp4"), poster, creator: clip.creator, plays: clip.views });
        n++;
      }
    }
    console.log(`${city}: ${n} clips in Convex file storage`);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
