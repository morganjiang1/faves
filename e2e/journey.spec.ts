// The main journey: onboarding, Home, plan a day, the itinerary, a place page, live
// re-plan and the recap.
import { expect, test } from "@playwright/test";
import { onboard, startOnboarded, watchConsole } from "./helpers";

test("onboarding to Home to a planned day to a place page", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/__blank");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page.getByTestId("onboarding-splash")).toBeVisible();
  await onboard(page);

  // Home with the city loaded: the deck, the plan prompt, one row of postcards, popular days.
  await expect(page.getByTestId("home-prompt")).toBeVisible();
  await expect(page.getByTestId("city-switcher")).toContainText(/san francisco/i);
  await expect(page.getByTestId("top10-top")).toBeVisible();
  await expect(page.getByTestId("row-tonight").or(page.getByTestId("row-weekend")).first()).toBeVisible();
  await expect(page.getByTestId("more-days")).toBeVisible();

  // Plan a day from a plain request.
  await page.getByTestId("home-prompt").click();
  await expect(page.getByTestId("builder-ask")).toBeVisible();
  await page.getByTestId("builder-input").fill("me and 3 friends, pickleball then hot pot, 2pm to 9pm, by bus");
  await page.getByTestId("builder-send").click();
  await expect(page.getByTestId("builder-building")).toBeVisible();
  await expect(page.getByTestId("building-answer")).toContainText("pickleball");

  // The itinerary opens by itself when the answer finishes.
  await expect(page.getByTestId("itinerary")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("plan-title")).toContainText(/Pickleball and hot pot/i);
  await expect(page.getByTestId("stop-0")).toContainText(/pickleball/i);
  await expect(page.getByTestId("leg-1")).toContainText(/min .* • .* mi/);

  // A stop's clip opens the full-screen swipe viewer through the day's stops.
  await page.getByTestId("stop-1-clip").click();
  await expect(page.getByTestId("reel")).toBeVisible();
  await expect(page.getByTestId("reel-page-1")).toBeVisible();
  await page.getByTestId("reel-close").click();
  await expect(page.getByTestId("itinerary")).toBeVisible();

  // A stop opens its place page with the facts line, the Locals Score and the details sheet.
  await page.getByTestId("stop-0-open").click();
  await expect(page.getByTestId("place-page")).toBeVisible();
  await expect(page.getByTestId("locals-score-row")).toBeVisible();
  await expect(page.getByTestId("open-status")).toBeVisible();
  await page.getByTestId("details-section").click();
  await expect(page.getByTestId("place-details")).toBeVisible();
  await expect(page.getByTestId("address-row")).toContainText("Directions");
  await page.getByTestId("place-details-close").click();
  await expect(page.getByTestId("place-details")).toBeHidden();
  await page.getByTestId("place-back").click();
  await expect(page.getByTestId("itinerary")).toBeVisible();

  expect(problems, problems.join("\n")).toEqual([]);
});

test("live re-plan: rain, running late and a swap", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/builder");
  await page.getByTestId("builder-input").fill("date saturday 1pm to 8pm, a hike then sushi then a view, by car");
  await page.getByTestId("builder-send").click();
  await expect(page.getByTestId("itinerary")).toBeVisible({ timeout: 30_000 });

  const stopsText = async () => (await page.locator('[data-testid^="stop-"][data-testid$="-open"]').allInnerTexts()).join("|");
  const before = await stopsText();
  // The live re-plans live in the "Change plans" sheet.
  await page.getByTestId("change-plans").click();
  await expect(page.getByTestId("change-sheet")).toBeVisible();
  await page.getByTestId("quick-0").click(); // It's raining
  await expect(page.getByTestId("agent-note")).toContainText(/takes its place|already indoors/);
  // Outdoor stops are replaced; indoor ones stay.
  if (/takes its place/.test(await page.getByTestId("agent-note").innerText())) expect(await stopsText()).not.toEqual(before);

  await page.getByTestId("change-plans").click();
  await page.getByTestId("replan-input").fill("we're running 45 min late");
  await page.getByTestId("replan-send").click();
  await expect(page.getByTestId("agent-note")).toContainText("45 min");

  // Swap a stop from the sheet.
  const second = await page.getByTestId("stop-1").innerText();
  await page.getByTestId("stop-1-swap").click();
  await expect(page.getByTestId("swap-sheet")).toBeVisible();
  await page.getByTestId("swap-rec-0").click();
  await expect(page.getByTestId("agent-note")).toContainText("Swapped");
  expect(await page.getByTestId("stop-1").innerText()).not.toEqual(second);

  expect(problems, problems.join("\n")).toEqual([]);
});

test("a popular day from Home, Do this day, the recap, and posting it", async ({ page }) => {
  const problems = watchConsole(page);
  await startOnboarded(page, "/");
  await page.getByTestId("more-days").click();
  await expect(page.getByTestId("feed-screen")).toBeVisible();
  await page.getByTestId("post-0-open").click();
  await expect(page).toHaveURL(/\/day\/san-francisco-saturday-in-sf/);
  await expect(page.getByTestId("day-page")).toContainText("Saturday in SF");
  for (const name of ["Arsicault Bakery", "Presidio Wall Pickleball Courts", "Golden Boy Pizza", "Musée Mécanique", "Ina Coolbrith Park", "The Interval at Long Now"]) {
    await expect(page.getByTestId("day-page")).toContainText(name);
  }
  await page.getByTestId("day-do").click();
  await expect(page.getByTestId("itinerary")).toBeVisible();
  await expect(page.getByTestId("stop-5")).toContainText("The Interval at Long Now");

  await page.getByTestId("plan-menu").click();
  await page.getByTestId("menu-recap").click();
  await expect(page).toHaveURL(/\/recap\//);
  await expect(page.getByTestId("recap-screen")).toBeVisible();

  // Thumbs up on three stops, a thumbs down on one, then Beli's comparison.
  for (const i of [0, 1, 2]) await page.getByTestId(`rate-stop-${i}-up`).click();
  await page.getByTestId("rate-stop-3-down").click();
  await page.getByTestId("recap-continue").click();
  for (let k = 0; k < 8 && (await page.getByTestId("compare-a").isVisible()); k++) {
    await page.getByTestId("compare-a").click();
    await page.waitForTimeout(250);
  }
  // Strava-style slides, then the Wrapped share card and posting the day.
  await expect(page.getByTestId("recap-story")).toBeVisible();
  for (let k = 0; k < 10 && !(await page.getByTestId("recap-make-card").isVisible()); k++) {
    await page.getByTestId("recap-story-next").click();
    await page.waitForTimeout(250);
  }
  await page.getByTestId("recap-make-card").click();
  await expect(page.getByTestId("recap-share-card")).toBeVisible();
  await page.getByTestId("recap-post").click();
  await expect(page.getByTestId("posted-modal")).toBeVisible();

  // The posted day shows at the top of the community feed.
  await page.goto("/feed");
  await expect(page.getByTestId("feed-screen")).toContainText("Saturday in SF");

  expect(problems, problems.join("\n")).toEqual([]);
});
