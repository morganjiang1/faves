// Two people in one group chat, for screenshots: node scripts/two-phones.mjs [base]
// Needs the web build on :8090 and the relay on :8787. Writes docs/screens/chat-a.png, chat-b.png.
import { chromium } from "@playwright/test";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2] ?? "http://localhost:8090";
const run = Math.random().toString(36).slice(2, 6);
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
const maya = await open("Maya", `maya${run}`);
const morgan = await open("Morgan", `morgan${run}`);
await morgan.getByTestId("chats-new").click();
await morgan.getByTestId("group-name").fill("Saturday crew");
await morgan.getByTestId("emoji-🎾").click();
await morgan.getByTestId("add-handle").fill(`maya${run}`);
await morgan.getByTestId("add-handle-go").click();
await morgan.waitForTimeout(600);
await morgan.getByTestId("create-group").click();
await morgan.getByTestId("chat-screen").waitFor();
await morgan.getByTestId("composer-input").fill("pickleball then food on saturday?");
await morgan.getByTestId("composer-send").click();
await maya.getByTestId("chat-row-0").click();
await maya.getByTestId("chat-screen").waitFor();
await maya.getByTestId("composer-input").fill("yes!! I'm starting from the Mission");
await maya.getByTestId("composer-send").click();
await morgan.waitForTimeout(800);
await morgan.getByTestId("composer-plan").click();
await morgan.getByTestId("plan-what").fill("pickleball then hot pot");
await morgan.getByTestId("plan-make").click();
await maya.waitForTimeout(1500);
await maya.locator('[data-testid^="ticket-"][data-testid$="-rsvp-in"]').first().click();
await morgan.waitForTimeout(1500);
await morgan.screenshot({ path: join(root, "docs/screens/chat-a.png") });
await maya.screenshot({ path: join(root, "docs/screens/chat-b.png") });
await morgan.locator('[data-testid="chat-messages"]').evaluate((el) => { el.scrollTop = 0; });
console.log("wrote docs/screens/chat-a.png and chat-b.png");
await browser.close();
