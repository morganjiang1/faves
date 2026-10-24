// Placeholder clips for development, until the real ones land: a slow push-in on the place's
// own photo (no creator, marked placeholder in the manifest so the app shows no credit).
//   node scripts/make-placeholder-clips.mjs <city-slug> <placeId> [<placeId> ...]
// Real clips with the same file names replace these; then run make-video-index.mjs.
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [city, ...ids] = process.argv.slice(2);
const data = JSON.parse(await readFile(join(root, "src/data/cities", `${city}.json`), "utf8"));
const outDir = join(root, "assets/videos", city);
await mkdir(outDir, { recursive: true });
const mfPath = join(outDir, "manifest.json");
const manifest = await readFile(mfPath, "utf8").then(JSON.parse, () => ({}));
for (const id of ids) {
  if (manifest[id] && !manifest[id].placeholder) { console.log(`${id}: real clip present, skipped`); continue; }
  const p = data.places.find((x) => x.id === id);
  if (!p?.img) { console.warn(`${id}: no photo`); continue; }
  const src = p.img.replace(/=w\d+-h\d+[^&]*$/, "=s1600");
  const jpg = join(outDir, `${id}.jpg`), mp4 = join(outDir, `${id}.mp4`);
  execFileSync("curl", ["-sL", "-o", jpg, src]);
  // One input frame, 120 output frames: a gentle centered push-in over 4 seconds.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", jpg, "-vf",
    "scale=960:1708:force_original_aspect_ratio=increase,crop=960:1708,zoompan=z='1+0.0007*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=120:s=480x854:fps=30,format=yuv420p",
    "-frames:v", "120", "-c:v", "libx264", "-profile:v", "main", "-crf", "27", "-movflags", "+faststart", "-an", mp4]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-frames:v", "1", "-q:v", "4", jpg]);
  manifest[id] = { video: `${id}.mp4`, poster: `${id}.jpg`, creator: null, sourceUrl: null, placeholder: true };
  console.log(`${id}: ${(await stat(mp4)).size >> 10} KB (${p.n})`);
}
await writeFile(mfPath, JSON.stringify(manifest, null, 1));
