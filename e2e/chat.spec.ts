// Group chats between two people (two browsers) through the chat relay, a plan ticket both
// answer, and typing into every main text field.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { startOnboarded, watchConsole } from "./helpers";

const run = Math.random().toString(36).slice(2, 7);

// "Sat 1:15 PM · ..." or a ticket stub's "1:15\nPM" -> minutes after midnight.
function clockOf(text: string): number {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/);
  if (!m) throw new Error(`no time in "${text}"`);
  return (Number(m[1]) % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + Number(m[2] ?? 0);
}

async function typeInto(page: Page, testID: string, text: string) {
  const input = page.getByTestId(testID);
  await input.click();
  await input.pressSequentially(text, { delay: 5 });
  await expect(input).toHaveValue(text);
}

test("two friends share a group chat live, plan a hangout in it and both answer the ticket", async ({ browser }) => {
  const a = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const b = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const problemsA = watchConsole(a), problemsB = watchConsole(b);
  // Maya opens Faves first, so the relay knows her username.
  await startOnboarded(b, "/chats", { name: "Maya", handle: `maya${run}` });
  await expect(b.getByTestId("chats-screen")).toBeVisible();
  await expect(b.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });

  await startOnboarded(a, "/chats", { name: "Morgan", handle: `morgan${run}` });
  await expect(a.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });
  await a.getByTestId("chats-new").click();
  await typeInto(a, "group-name", "Saturday crew");
  await typeInto(a, "add-handle", `maya${run}`);
  await a.getByTestId("add-handle-go").click();
  await expect(a.getByTestId("new-group")).toContainText("Maya");
  await a.getByTestId("create-group").click();
  await expect(a.getByTestId("chat-screen")).toBeVisible();
  await expect(a.getByTestId("chat-title")).toContainText("Saturday crew");

  await typeInto(a, "composer-input", "pickleball saturday?");
  await a.getByTestId("composer-send").click();

  // Maya sees the group and the message without reloading.
  await expect(b.getByTestId("chat-row-0")).toContainText("Saturday crew", { timeout: 15_000 });
  await b.getByTestId("chat-row-0").click();
  await expect(b.getByTestId("chat-messages")).toContainText("pickleball saturday?");
  await typeInto(b, "composer-input", "I'm in");
  await b.getByTestId("composer-send").click();
  await expect(a.getByTestId("chat-messages")).toContainText("I'm in", { timeout: 15_000 });

  // Morgan plans it in the chat; both see the ticket and Maya says she's in.
  await a.getByTestId("composer-plan").click();
  await expect(a.getByTestId("plan-sheet")).toBeVisible();
  await a.getByTestId("plan-make").click();
  const ticketB = b.locator('[data-testid^="ticket-"][data-testid$="-rsvp-in"]').first();
  await expect(ticketB).toBeVisible({ timeout: 15_000 });
  await ticketB.click();
  await expect(a.locator('[data-testid^="ticket-"][data-testid$="-rsvp-in"]').first()).toContainText("In 2", { timeout: 15_000 });

  expect(problemsA, problemsA.join("\n")).toEqual([]);
  expect(problemsB, problemsB.join("\n")).toEqual([]);
});

test("typing works in the plan builder and search", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/builder");
  await typeInto(page, "builder-input", "tacos then a view");
  await page.goto("/search");
  await typeInto(page, "search-input", "pizza");
  expect(problems, problems.join("\n")).toEqual([]);
});

test("the group's butler plans in the chat, and locking the plan books it and sets reminders", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/chats", { name: "Morgan", handle: `morganb${run}` });
  await expect(page.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });
  await page.getByTestId("chats-new").click();
  await typeInto(page, "group-name", "Butler test");
  await page.getByTestId("add-samples").click();
  await page.getByTestId("create-group").click();
  await expect(page.getByTestId("chat-screen")).toBeVisible();
  await typeInto(page, "composer-input", "@fave plan pickleball then hot pot on saturday afternoon");
  await page.getByTestId("composer-send").click();
  // The butler (on the server) answers with a ticket.
  const lock = page.locator('[data-testid^="ticket-"][data-testid$="-lock"]').first();
  await expect(lock).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("chat-messages")).toContainText(/Here's a plan/);
  await lock.click();
  // The plan flow: booked, then reminders scheduled, all said in the chat.
  await expect(page.getByTestId("chat-messages")).toContainText("Locked in!", { timeout: 30_000 });
  await expect(page.getByTestId("chat-messages")).toContainText(/remind everyone/, { timeout: 30_000 });
  await expect(page.getByTestId("chat-pinned")).toBeVisible();
  expect(problems, problems.join("\n")).toEqual([]);
});

test("an agent's plan becomes a group chat: the invite link opens it with the ticket and the butler's hello", async ({ page, request }) => {
  const problems = watchConsole(page);
  // What the Fetch.ai Butler does at the end of a chat in ASI:One.
  const plan = await (await request.post("http://localhost:8787/api/plan", { data: { text: "pickleball then hot pot saturday 1pm to 7pm", city: "san-francisco", friends: [{ name: "Ana", from: "Inner Richmond" }, { name: "Ben", from: "Mission" }] } })).json();
  const group = await (await request.post("http://localhost:8787/api/group", { data: { planId: plan.planId } })).json();
  expect(group.code).toMatch(/^[A-Z0-9]{6}$/);
  expect(group.web).toContain(`/join/${group.code}`);
  await startOnboarded(page, `/join/${group.code}`, { name: "Ana", handle: `anaj${run}` });
  await expect(page.getByTestId("chat-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("chat-messages")).toContainText("I'm Fave, this group's butler");
  await expect(page.locator('[data-testid^="ticket-"][data-testid$="-rsvp-in"]').first()).toBeVisible();
  await expect(page.getByTestId("chat-messages")).toContainText("Ana joined with the invite link");
  expect(problems, problems.join("\n")).toEqual([]);
});

test("rename the butler, then use its quick asks: plan, book it, remind us", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/chats", { name: "Morgan", handle: `morganc${run}` });
  await expect(page.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });
  await page.getByTestId("chats-new").click();
  await typeInto(page, "group-name", "Chips test");
  await page.getByTestId("add-samples").click();
  await page.getByTestId("create-group").click();
  await expect(page.getByTestId("chat-screen")).toBeVisible();
  // Name the butler Jarvis in group info.
  await page.getByTestId("chat-info").click();
  const name = page.getByTestId("info-butler-name");
  await name.fill("Jarvis");
  await name.blur();
  await expect(page.getByTestId("group-info")).toContainText("Ask with @jarvis");
  await page.getByTestId("info-back").click();
  await expect(page.getByTestId("chat-messages")).toContainText("named the butler Jarvis");
  await expect(page.getByTestId("butler-chips")).toContainText("Jarvis");
  // "Plan something" starts the ask; finish it and send.
  await page.getByTestId("butler-plan").click();
  await expect(page.getByTestId("composer-input")).toHaveValue("@jarvis plan ");
  await page.getByTestId("composer-input").pressSequentially("pickleball then hot pot on saturday afternoon", { delay: 2 });
  await page.getByTestId("composer-send").click();
  const lock = page.locator('[data-testid^="ticket-"][data-testid$="-lock"]').first();
  await expect(lock).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("butler-book").click();
  await expect(page.getByTestId("chat-messages")).toContainText("Here's how to book it", { timeout: 30_000 });
  await lock.click();
  await expect(page.getByTestId("chat-messages")).toContainText("Locked in!", { timeout: 30_000 });
  await page.getByTestId("butler-remind").click();
  await expect(page.getByTestId("chat-messages")).toContainText("Reminders are set", { timeout: 30_000 });
  expect(problems, problems.join("\n")).toEqual([]);
});

test("share a plan with friends: a new group with the butler and the ticket, then the invite screen", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/builder", { name: "Morgan", handle: `morgans${run}` });
  await page.getByTestId("builder-input").fill("me and 3 friends, pickleball then hot pot, 2pm to 9pm, by bus");
  await page.getByTestId("builder-send").click();
  await expect(page.getByTestId("itinerary")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("link-friends").click();
  await page.getByTestId("send-new-group").click();
  await expect(page.getByTestId("group-info")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("info-code")).toHaveText(/^[A-Z0-9]{6}$/);
  await page.getByTestId("info-back").click();
  await expect(page.getByTestId("chat-messages")).toContainText("I'm Fave, this group's butler");
  await expect(page.locator('[data-testid^="ticket-"][data-testid$="-rsvp-in"]').first()).toBeVisible();
  expect(problems, problems.join("\n")).toEqual([]);
});

test("a phone-only stop comes with its number for the group to call, and the ticket has no calling button", async ({ page, request }) => {
  const problems = watchConsole(page);
  const plan = await (await request.post("http://localhost:8787/api/plan", { data: { text: "pickleball then hot pot saturday 1pm to 7pm", city: "san-francisco" } })).json();
  const booked = await (await request.post("http://localhost:8787/api/book", { data: { planId: plan.planId } })).json();
  const byPhone = booked.bookings.find((b: { how: string }) => b.how === "phone");
  expect(byPhone?.phone).toBeTruthy();
  const group = await (await request.post("http://localhost:8787/api/group", { data: { planId: plan.planId } })).json();
  await startOnboarded(page, `/join/${group.code}`, { name: "Ana", handle: `anac${run}` });
  await expect(page.getByTestId("chat-screen")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[data-testid^="ticket-"][data-testid$="-open"]').first()).toBeVisible();
  await expect(page.locator('[data-testid^="ticket-"][data-testid$="-call"]')).toHaveCount(0);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("a moment posted at a spot is stored in Convex and shows on that spot for everyone", async ({ page, request }) => {
  const problems = watchConsole(page);
  const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const convex = env.match(/EXPO_PUBLIC_CONVEX_URL=(\S+)/)?.[1];
  test.skip(!convex, "needs npm run convex");
  const plan = await (await request.post("http://localhost:8787/api/plan", { data: { text: "pickleball then hot pot saturday 1pm to 7pm", city: "san-francisco" } })).json();
  const placeId: string = plan.raw.stops[0].placeId;
  // Another phone posts a photo there: upload to file storage, then post it.
  const call = async (path: string, args: Record<string, unknown>) => (await (await request.post(`${convex}/api/mutation`, { data: { path, args, format: "json" } })).json()).value;
  const uploadUrl: string = await call("clips:uploadUrl", {});
  const poster = readdirSync(join(__dirname, "..", "assets/videos/san-francisco")).find((f) => f.endsWith(".jpg"))!;
  const up = await request.post(uploadUrl, { headers: { "Content-Type": "image/jpeg" }, data: readFileSync(join(__dirname, "..", "assets/videos/san-francisco", poster)) });
  const { storageId } = await up.json();
  await call("clips:post", { placeId, city: "san-francisco", file: storageId, kind: "photo", caption: "Test data: posted from another phone", creator: `tester${run}`, postedBy: `u-tester-${run}`, takenHere: false, demo: true });
  await startOnboarded(page, `/moments/${encodeURIComponent(placeId)}`, { name: "Ana", handle: `anam${run}` });
  await expect(page.getByLabel(`Post by tester${run}`).first()).toBeVisible({ timeout: 20_000 });
  expect(problems, problems.join("\n")).toEqual([]);
});

test("the butler posts two options, the group votes with thumbs, and the butler locks in the winner", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/chats", { name: "Morgan", handle: `morganv${run}` });
  await expect(page.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });
  await page.getByTestId("chats-new").click();
  await typeInto(page, "group-name", "Vote test");
  await page.getByTestId("add-samples").click();
  await page.getByTestId("create-group").click();
  await expect(page.getByTestId("chat-screen")).toBeVisible();
  await page.getByTestId("butler-options").click();
  await page.getByTestId("composer-input").pressSequentially("saturday afternoon, pickleball then dinner", { delay: 2 });
  await page.getByTestId("composer-send").click();
  await expect(page.getByTestId("chat-messages")).toContainText("Option A", { timeout: 40_000 });
  await expect(page.getByTestId("chat-messages")).toContainText("Option B", { timeout: 40_000 });
  await expect(page.getByTestId("chat-messages")).toContainText("no stop in common");
  // Thumbs up on Option A (the first ticket posted is the older, higher one in the list).
  const thumbs = page.locator('[data-testid^="ticket-"][data-testid$="-thumb"]');
  await expect(thumbs).toHaveCount(2);
  await thumbs.last().click();
  await page.waitForTimeout(800);
  await typeInto(page, "composer-input", "@fave which one?");
  await page.getByTestId("composer-send").click();
  await expect(page.getByTestId("chat-messages")).toContainText(/Option [AB] wins with 1 vote/, { timeout: 30_000 });
  await expect(page.getByTestId("chat-messages")).toContainText("Locked in!", { timeout: 30_000 });
  expect(problems, problems.join("\n")).toEqual([]);
});

test("running late after the plan is locked: the butler moves the times and the reminders", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/chats", { name: "Morgan", handle: `morganl${run}` });
  await expect(page.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });
  await page.getByTestId("chats-new").click();
  await typeInto(page, "group-name", "Late test");
  await page.getByTestId("add-samples").click();
  await page.getByTestId("create-group").click();
  await typeInto(page, "composer-input", "@fave plan pickleball then hot pot on saturday afternoon");
  await page.getByTestId("composer-send").click();
  const lock = page.locator('[data-testid^="ticket-"][data-testid$="-lock"]').first();
  await expect(lock).toBeVisible({ timeout: 30_000 });
  await lock.click();
  await expect(page.getByTestId("chat-messages")).toContainText("remind everyone", { timeout: 30_000 });
  // The ticket stub and the pinned banner show the start time; both move with the stops.
  const stub = page.locator('[data-testid^="ticket-"][data-testid$="-stub"]').first();
  const startBefore = clockOf(await page.getByTestId("chat-pinned").innerText());
  expect(clockOf(await stub.innerText())).toBe(startBefore);
  await page.getByTestId("butler-late").click();
  await page.getByTestId("composer-send").click();
  await expect(page.getByTestId("chat-messages")).toContainText("Moved the reminders", { timeout: 30_000 });
  await expect(page.getByTestId("chat-messages")).toContainText(/Morgan asked/);
  await expect.poll(async () => clockOf(await page.getByTestId("chat-pinned").innerText())).toBe(startBefore + 15);
  await expect.poll(async () => clockOf(await stub.innerText())).toBe(startBefore + 15);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("a long chat keeps the butler's quick-ask chips full height", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/chats", { name: "Morgan", handle: `morganq${run}` });
  await expect(page.getByTestId("chats-local")).toBeHidden({ timeout: 15_000 });
  await page.getByTestId("chats-new").click();
  await typeInto(page, "group-name", "Long chat");
  await page.getByTestId("add-samples").click();
  await page.getByTestId("create-group").click();
  await expect(page.getByTestId("chat-screen")).toBeVisible();
  const chips = page.getByTestId("butler-chips");
  const full = (await chips.boundingBox())!.height;
  expect(full).toBeGreaterThan(30);
  for (let i = 1; i <= 24; i++) {
    await page.getByTestId("composer-input").fill(`message ${i}: who's bringing the paddles, and are we doing hot pot after?`);
    await page.getByTestId("composer-send").click();
  }
  await expect(page.getByTestId("chat-messages")).toContainText("message 24:");
  await expect(page.getByTestId("butler-tldr")).toBeVisible();
  expect((await chips.boundingBox())!.height).toBeGreaterThanOrEqual(full - 1);
  expect(problems, problems.join("\n")).toEqual([]);
});
