// Phone-size screenshots of the web app for the side-by-side screen audit.
// Headless Chrome has a minimum window width, so each page renders inside a 390 x 844 iframe
// on a wrapper page served from the app's own origin (so the app's saved state applies).
//
//   node scripts/shot.mjs <name> <path> [--state onboarded|fresh] [--wait ms] [--click testID ...] [--scroll px] [--base url]
//   e.g. node scripts/shot.mjs home / --state onboarded
// Writes docs/screens/<name>.png (1170 px wide, 3x like an iPhone).
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const [name, path = "/"] = args;
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i > -1 ? args[i + 1] : d; };
const all = (k) => args.flatMap((a, i) => (a === `--${k}` ? [args[i + 1]] : []));
const base = opt("base", "http://localhost:8081");
const wait = Number(opt("wait", "2500"));
const stateName = opt("state", "onboarded");
const city = opt("city", "san-francisco");
const scroll = Number(opt("scroll", "0"));
const W = 390, H = Number(opt("height", "844"));

export const ONBOARDED = (cityslug) => ({
  profile: { name: "Morgan", handle: "morgan", city: cityslug, interests: ["courts", "food", "views", "games"], crew: "friends", transport: "transit", onboarded: true, memberSince: "2026-10-24T09:00:00.000Z" },
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W + 40, height: H + 40 }, deviceScaleFactor: 3 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
await page.route(`${base}/__frame`, (r) => r.fulfill({ contentType: "text/html", body: `<!doctype html><html><body style="margin:0;background:#fff"><iframe id="f" style="border:0;width:${W}px;height:${H}px;display:block" src="about:blank"></iframe></body></html>` }));
await page.goto(`${base}/__frame`);
if (stateName !== "keep") {
  await page.evaluate(([s, c]) => {
    localStorage.clear();
    if (s === "onboarded") localStorage.setItem("faves:v1", JSON.stringify(c));
  }, [stateName, ONBOARDED(city)]);
}
const extra = opt("seed", null);
if (extra) await page.evaluate((json) => { const cur = JSON.parse(localStorage.getItem("faves:v1") || "{}"); localStorage.setItem("faves:v1", JSON.stringify({ ...cur, ...JSON.parse(json) })); }, extra);
await page.evaluate((src) => { document.getElementById("f").src = src; }, `${base}${path}`);
const frame = page.frameLocator("#f");
await page.waitForTimeout(wait);
for (const id of all("click")) {
  await frame.getByTestId(id).first().click();
  await page.waitForTimeout(900);
}
if (scroll) {
  await page.evaluate((y) => {
    const doc = document.getElementById("f").contentDocument;
    const els = [...doc.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== "visible");
    const target = els.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    if (target) target.scrollTop = y;
  }, scroll);
  await page.waitForTimeout(700);
}
await mkdir(join(root, "docs/screens"), { recursive: true });
const out = join(root, "docs/screens", `${name}.png`);
await page.locator("#f").screenshot({ path: out });
console.log(`wrote ${out}`);
if (errors.length) console.log(`console:\n${[...new Set(errors)].slice(0, 15).join("\n")}`);
await browser.close();
