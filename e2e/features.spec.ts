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
  await expect(page.getByTestId("city-switcher")).toContainText("Chicago");
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

test("Spot Moments: the reel, the viewer, and the be-here-to-post rule", async ({ page, context }) => {
  const problems = watchConsole(page);
  // Far from the bridge: posting must be blocked.
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 37.7599, longitude: -122.4148 });
  await startOnboarded(page, `/place/${GOLDEN_GATE}`);
  await expect(page.getByTestId("moments-section")).toBeVisible();
  await expect(page.getByTestId("moment-tile-0")).toBeVisible();
  await page.getByTestId("moment-tile-0").click();
  await expect(page.getByTestId("moments-viewer")).toBeVisible();
  await expect(page.getByTestId("tiktok-player")).toBeVisible();
  await page.getByTestId("moments-close").click();

  await page.getByTestId("post-moment").click();
  await expect(page.getByTestId("post-blocked")).toBeVisible();
  await expect(page.getByTestId("be-here-card")).toContainText("Be here to post");

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
