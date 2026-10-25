// The group agent end to end, for screenshots: node scripts/butler-shots.mjs [base]
// Needs the web build on :8090 (built with EXPO_PUBLIC_CONVEX_URL), Convex (npm run convex) and
// the Faves server (npm run chat-server). Two people set where they start from, ask the agent
// for a plan, answer it, lock it in; the agent books and schedules reminders.
// Writes docs/screens/butler-1-plan.png, butler-2-vote.png, butler-3-locked.png, butler-4-tldr.png.
import { chromium } from "@playwright/test";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://localhost:8090";
const run = Math.random().toString(36).slice(2, 6);
const shot = (page, name) => page.screenshot({ path: join(root, `docs/screens/${name}.png`) });
const browser = await chromium.launch();
const open = async (name, handle) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(`${base}/__blank`);
  await page.evaluate((p) => { localStorage.clear(); localStorage.setItem("faves:v1", JSON.stringify({ profile: { name: p.name, handle: p.handle, city: "san-francisco", interests: ["courts", "food", "views"], crew: "friends", transport: "transit", onboarded: true, memberSince: "2026-10-24T09:00:00.000Z" } })); }, { name, handle });
  await page.goto(`${base}/chats`);
  await page.getByTestId("chats-screen").waitFor();
  await page.waitForTimeout(1500);
  return page;
};
const startFrom = async (page, hood) => {
  await page.getByTestId("chat-info").click();
  await page.getByTestId("group-info").waitFor();
  await page.getByTestId("info-start").click();
  await page.getByTestId("info-hood-search").fill(hood);
  await page.locator('[data-testid^="hood-"]').first().click();
  await page.waitForTimeout(500);
  await page.getByTestId("start-sheet-close").click();
  await page.getByTestId("info-back").click();
  await page.getByTestId("chat-screen").waitFor();
};
const say = async (page, text) => {
  await page.getByTestId("composer-input").fill(text);
  await page.getByTestId("composer-send").click();
};

const maya = await open("Maya", `maya${run}`);
const morgan = await open("Morgan", `morgan${run}`);
await morgan.getByTestId("chats-new").click();
await morgan.getByTestId("group-name").fill("Saturday crew");
await morgan.getByTestId("add-handle").fill(`maya${run}`);
await morgan.getByTestId("add-handle-go").click();
await morgan.waitForTimeout(600);
await morgan.getByTestId("create-group").click();
await morgan.getByTestId("chat-screen").waitFor();
await startFrom(morgan, "Richmond");
await maya.getByTestId("chat-row-0").click();
await maya.getByTestId("chat-screen").waitFor();
await startFrom(maya, "Mission");
await say(maya, "pickleball then food this weekend?");
await say(morgan, "@fave plan pickleball then hot pot on saturday afternoon");
const lock = morgan.locator('[data-testid^="ticket-"][data-testid$="-lock"]').first();
await lock.waitFor({ timeout: 30_000 });
await morgan.waitForTimeout(1200);
await shot(morgan, "butler-1-plan");
await maya.locator('[data-testid^="ticket-"][data-testid$="-rsvp-in"]').first().click();
await maya.waitForTimeout(1500);
await shot(maya, "butler-2-vote");
await lock.click();
await morgan.getByText(/remind everyone/).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
await morgan.waitForTimeout(1200);
await shot(morgan, "butler-3-locked");
await say(maya, "@fave tl;dr");
await maya.getByText(/tl;dr:/).filter({ visible: true }).first().waitFor({ timeout: 30_000 });
await maya.waitForTimeout(1000);
await shot(maya, "butler-4-tldr");
console.log("wrote docs/screens/butler-1-plan.png ... butler-4-tldr.png");
await browser.close();
