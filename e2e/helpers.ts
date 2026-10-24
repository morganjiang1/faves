import { expect, type Page } from "@playwright/test";

// Console errors and warnings fail the test, except network noise from third-party
// map tiles and images that the test machine may not reach.
const IGNORE = [/tile\.openstreetmap\.org/, /Failed to load resource/, /tiktok\.com/, /ERR_/, /net::/];

export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on("console", (m) => {
    if ((m.type() === "error" || m.type() === "warning") && !IGNORE.some((re) => re.test(m.text()))) problems.push(`${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

export const ONBOARDED = {
  profile: { name: "Morgan", handle: "morgan", city: "san-francisco", interests: ["courts", "food", "views", "games"], crew: "friends", transport: "transit", onboarded: true, memberSince: "2026-10-24T09:00:00.000Z" },
};

// Start with a saved, onboarded San Francisco profile.
export async function startOnboarded(page: Page, path = "/") {
  await page.goto("/__blank");
  await page.evaluate((state) => { localStorage.clear(); localStorage.setItem("faves:v1", JSON.stringify(state)); }, ONBOARDED);
  await page.goto(path);
}

export async function onboard(page: Page, name = "Morgan") {
  await page.getByTestId("get-started").click();
  await page.getByTestId("name-input").fill(name);
  await page.getByTestId("onboarding-next").click();
  await expect(page.getByTestId("city-san-francisco")).toBeVisible();
  await page.getByTestId("onboarding-next").click();
  for (const id of ["interest-courts", "interest-food", "interest-views"]) await page.getByTestId(id).click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("crew-friends").click();
  await page.getByTestId("onboarding-next").click();
  await page.getByTestId("move-transit").click();
  await page.getByTestId("finish-onboarding").click();
}
