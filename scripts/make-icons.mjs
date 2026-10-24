// Renders the app icon, splash mark and favicon from the one logo file in assets/brand/.
// Swap the logo by replacing assets/brand/heart_pin.svg (and brand.json), then run:
//   node scripts/make-icons.mjs
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = JSON.parse(await readFile(join(root, "assets/brand/brand.json"), "utf8"));
const svg = await readFile(join(root, "assets/brand", brand.logo), "utf8");

// iOS masks the icon itself, so the icon is full bleed: drop the rounded corner.
const fullBleed = svg.replace(/\s+rx="[^"]*"/, "");
// The splash and Android foreground show the glyph alone on the brand color.
const glyphOnly = svg.replace(/<rect[^>]*><\/rect>|<rect[^>]*\/>/, "");

const jobs = [
  { file: "assets/images/icon.png", svg: fullBleed, size: 1024 },
  { file: "assets/images/splash-icon.png", svg: glyphOnly, size: 512, transparent: true },
  { file: "assets/images/adaptive-icon.png", svg: glyphOnly, size: 1024, transparent: true },
  { file: "assets/images/favicon.png", svg, size: 96, transparent: true },
  { file: "assets/brand/mark.png", svg, size: 192, transparent: true },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const j of jobs) {
  const sized = j.svg.replace(/width="\d+" height="\d+"/, `width="${j.size}" height="${j.size}"`);
  await page.setViewportSize({ width: j.size, height: j.size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${sized}</body></html>`);
  await page.locator("svg").screenshot({ path: join(root, j.file), omitBackground: Boolean(j.transparent) });
  console.log(`wrote ${j.file} (${j.size}px)`);
}
await browser.close();
