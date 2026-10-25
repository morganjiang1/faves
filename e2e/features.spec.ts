// Other main features: switching cities, search, Spot Moments, posting rules, the rewards
// wallet and payout, and Faves Plus.
import { expect, test } from "@playwright/test";
import { startOnboarded, watchConsole } from "./helpers";

const GOLDEN_GATE = "ChIJw____96GhYARCVVwg5cT7c0";

test("switch city and search", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/");
  await page.getByTestId("city-switcher").click();
  await expect(page.getByTestId("city-picker")).toBeVisible();
  await page.getByTestId("city-row-chicago").click();
  await page.getByTestId("city-continue").click();
  await expect(page.getByTestId("city-switcher")).toContainText(/chicago/i);
  await expect(page.getByTestId("top10-top")).toBeVisible();

  // Search is one tap from Popular days.
  await page.getByTestId("more-days").click();
  await page.getByTestId("feed-search").click();
  await page.getByTestId("search-input").fill("pizza");
  await page.getByTestId("search-submit-row").click();
  await expect(page.getByTestId("search-results")).toBeVisible();
  await expect(page.getByTestId("result-card-0")).toBeVisible();
  await page.getByTestId("result-card-0").click();
  await expect(page.getByTestId("place-page")).toBeVisible();

  expect(problems, problems.join("\n")).toEqual([]);
});

test("a spot's page: its postcard clips, the essentials, the postcard wall and the be-here-to-post rule", async ({ page, context }) => {
  const problems = watchConsole(page);
  // Far from the bridge: posting must be blocked.
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 37.7599, longitude: -122.4148 });
  await startOnboarded(page, `/place/${GOLDEN_GATE}`);
  await expect(page.getByTestId("place-page")).toBeVisible();
  await expect(page.getByTestId("place-name")).toContainText("Golden Gate Bridge");
  await expect(page.getByTestId("spot-clip").first()).toBeVisible();
  await expect(page.getByTestId("place-dots")).toBeVisible();
  await expect(page.getByTestId("locals-score-row")).toBeVisible();
  // Clips read as Faves posts, and the score line opens what people on Faves did.
  await expect(page.getByTestId("place-media-0")).not.toContainText(/tiktok/i);
  await expect(page.getByTestId("score-line")).toContainText(/from [\d,]+ locals/);
  await page.getByTestId("score-line").click();
  await expect(page.getByTestId("signal-ranked")).toBeVisible();
  await page.getByTestId("scores-section-close").click();
  await expect(page.getByTestId("details-section")).toBeVisible();

  // Send to a chat offers a new group for the spot.
  await page.getByTestId("send-to-chat").click();
  await expect(page.getByTestId("send-sheet")).toBeVisible();
  await expect(page.getByTestId("send-new-group")).toBeVisible();
  await page.getByTestId("send-sheet-close").click();

  await page.getByTestId("moments-anchor").click();
  await expect(page.getByTestId("moments-page")).toBeVisible();
  await expect(page.getByTestId("moment-tile-0")).toBeVisible();
  await page.getByTestId("moments-close").click();
  await expect(page.getByTestId("moments-page")).toBeHidden();

  await page.getByTestId("post-moment").filter({ visible: true }).click();
  await expect(page.getByTestId("post-blocked")).toBeVisible();
  await expect(page.getByTestId("be-here-card")).toContainText("Be here to post");

  expect(problems, problems.join("\n")).toEqual([]);
});

test("a spot's floating header gets a paper backdrop once the page scrolls", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, `/place/${GOLDEN_GATE}`);
  await expect(page.getByTestId("place-name")).toContainText("Golden Gate Bridge");
  const top = page.getByTestId("place-top");
  const bg = () => top.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg()).toBe("rgba(0, 0, 0, 0)");
  await page.getByTestId("place-scroll").evaluate((el) => {
    const scroller = [el, ...Array.from(el.querySelectorAll("*"))].find((x) => x.scrollHeight > x.clientHeight + 10 && getComputedStyle(x).overflowY !== "visible") ?? el;
    scroller.scrollTop = 600;
    scroller.dispatchEvent(new Event("scroll"));
  });
  await expect.poll(bg).toBe("rgba(255, 248, 241, 0.98)");
  expect(problems, problems.join("\n")).toEqual([]);
});

// Faves is a community app: a spot's score card shows what people on Faves rank, post and save,
// and no screen names an outside source (booking links like "Reserve on Google" are fine).
const SOURCES = /\b(google|yelp|tripadvisor|reddit|tiktok)\b|\br\/[a-z]/i;
const pageText = async (page: import("@playwright/test").Page) => (await page.locator("body").innerText()).replace(/Reserve on Google/g, "");

test("a spot's score card shows community signals and no outside sources", async ({ page }) => {
  const problems = watchConsole(page);
  for (const id of [GOLDEN_GATE, "ChIJdx6kBe6AhYARsPFmpUAvvcY" /* Ina Coolbrith Park */, "ChIJXfZJOaB_j4ARqpK7DW1C0JE"]) {
    await startOnboarded(page, `/place/${id}`);
    await page.getByTestId("score-line").click({ timeout: 20_000 });
    const card = page.getByTestId("scores-section");
    await expect(card).toBeVisible();
    await expect(card).toContainText(/where the score comes from/i);
    await expect(page.getByTestId("signal-ranked")).toContainText(/locals?/);
    await expect(page.getByTestId("signal-moments")).toBeVisible();
    await expect(page.getByTestId("signal-saves")).toBeVisible();
    await expect(page.getByTestId("signal-days")).toBeVisible();
    await expect(page.getByTestId("signals-footnote")).toHaveText("From people on Faves: rankings, moments and saves.");
    const quote = page.getByTestId("quote-who");
    if (await quote.count()) await expect(quote).toHaveText(/^a local/);
    expect(await pageText(page)).not.toMatch(SOURCES);
  }
  // The Settings community section and Home say the same.
  await page.goto("/settings");
  await expect(page.getByTestId("settings-rankings")).toBeVisible();
  expect(await pageText(page)).not.toMatch(SOURCES);
  await page.goto("/");
  await expect(page.getByTestId("top10-top")).toBeVisible({ timeout: 20_000 });
  expect(await pageText(page)).not.toMatch(SOURCES);
  expect(problems, problems.join("\n")).toEqual([]);
});

test("a map pin opens the spot full screen", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/explore");
  await expect(page.getByTestId("explore-map")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.locator(".leaflet-marker-icon").first().dispatchEvent("click");
  await expect(page.getByTestId("place-page")).toBeVisible();
  await expect(page.getByTestId("place-name")).toBeVisible();
  expect(problems, problems.join("\n")).toEqual([]);
});

test("rewards wallet, cash out and Faves Plus (test mode)", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/wallet");
  await expect(page.getByTestId("wallet-screen")).toBeVisible();
  await expect(page.getByTestId("wallet-test-note")).toContainText(/test data/i);
  await page.getByTestId("wallet-cash-out").click();
  await expect(page.getByTestId("payout-screen")).toBeVisible();
  await page.getByTestId("payout-kind-gift").click();
  await page.getByTestId("payout-confirm").click();
  await expect(page.getByTestId("payout-done")).toBeVisible();

  await page.goto("/plus");
  await expect(page.getByTestId("plus-paywall")).toBeVisible();
  await expect(page.getByTestId("plus-plan-annual")).toContainText("$42.90");
  await expect(page.getByTestId("plus-plan-monthly")).toContainText("$5.79");
  await page.getByTestId("plus-continue").click();
  await expect(page.getByTestId("plus-active")).toBeVisible();

  expect(problems, problems.join("\n")).toEqual([]);
});

test("rank a spot from its page, then vote on a day by link", async ({ page, browser, context }) => {
  const problems = watchConsole(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await startOnboarded(page, `/place/${GOLDEN_GATE}`);
  await page.getByTestId("action-rank").click();
  await expect(page.getByTestId("rank-screen")).toBeVisible();
  await page.getByTestId("rate-great").click();
  await expect(page.getByTestId("first-rank-modal-cta")).toBeVisible();

  // Plan a day, open its group vote and copy the invite link.
  await page.goto("/builder");
  await page.getByTestId("builder-input").fill("date saturday: something fun, dinner and a view");
  await page.getByTestId("builder-send").click();
  await expect(page.getByTestId("itinerary")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("plan-menu").click();
  await page.getByTestId("menu-group").click();
  await expect(page.getByTestId("group-screen")).toBeVisible();
  await page.getByTestId("group-invite").click();
  await expect(page.getByTestId("share-sheet")).toContainText("Anyone with the link can vote");
  await page.getByTestId("share-copy").click();
  const invite = await page.evaluate(() => navigator.clipboard.readText());
  expect(invite).toMatch(/\/group\/.+\?d=/);

  // A friend opens the link in a fresh browser (no app, no account) and votes.
  const friendContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const friend = await friendContext.newPage();
  const friendProblems = watchConsole(friend);
  await friend.goto(invite);
  await expect(friend.getByTestId("group-screen")).toBeVisible();
  await friend.getByTestId("group-row-0-opt-0").click();
  await expect(friend.getByTestId("rsvp-sheet")).toBeVisible();
  await friend.getByTestId("rsvp-going").click();
  await friend.getByTestId("rsvp-name").fill("Sam");
  await friend.getByTestId("rsvp-continue").click();
  await expect(friend.getByTestId("group-screen")).toContainText("Sam");
  await friendContext.close();

  expect([...problems, ...friendProblems], [...problems, ...friendProblems].join("\n")).toEqual([]);
});

// Every postcard on Home shows a real picture: the clip's poster, else the spot's photo (never a
// black or empty frame), and a playing clip fills its card instead of showing its top corner.
for (const city of ["san-francisco", "new-york", "los-angeles"]) {
  test(`every Home card in ${city} shows a picture that loaded, and playing clips fill their cards`, async ({ page }) => {
    const problems = watchConsole(page);
    await startOnboarded(page, "/", { city });
    await expect(page.getByTestId("top10-top")).toBeVisible({ timeout: 30_000 });
    const rows = ["row-tonight", "row-weekend", "section-gems"];
    for (const id of rows) {
      const row = page.getByTestId(id);
      if (!(await row.count())) continue;
      await row.scrollIntoViewIfNeeded();
      // Deal through the row so every card renders and loads.
      for (let x = 0; x <= 2400; x += 300) {
        await row.evaluate((el, left) => { const s = [el, ...Array.from(el.querySelectorAll("*"))].find((q) => q.scrollWidth > q.clientWidth + 10) ?? el; s.scrollLeft = left; }, x);
        await page.waitForTimeout(120);
      }
    }
    const cards = page.locator('[data-testid="top10-top"], [data-testid^="tonight-"], [data-testid^="weekend-"], [data-testid^="gems-"]');
    expect(await cards.count()).toBeGreaterThan(15);
    await expect.poll(async () => cards.evaluateAll((els) => els.filter((c) => !Array.from(c.querySelectorAll("img")).some((i) => i.complete && i.naturalWidth > 0)).map((c) => c.getAttribute("aria-label"))), { timeout: 30_000 }).toEqual([]);
    // A playing clip is the size of its card's picture, not the clip's own size.
    const oversized = await cards.evaluateAll((els) => els.flatMap((c) => Array.from(c.querySelectorAll("video")).filter((v) => v.getBoundingClientRect().width > c.getBoundingClientRect().width).map(() => c.getAttribute("aria-label"))));
    expect(oversized).toEqual([]);
    expect(problems, problems.join("\n")).toEqual([]);
  });
}
