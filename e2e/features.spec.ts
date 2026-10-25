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
  await expect(page.getByTestId("day-card-0")).toBeVisible();

  await page.getByTestId("open-search").click();
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
  // Clips read as Faves posts; TikTok only appears as a score source.
  await expect(page.getByTestId("src-tiktok")).toBeVisible();
  await expect(page.getByTestId("place-media-0")).not.toContainText(/tiktok/i);
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
  await page.getByTestId("link-vote").click();
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
