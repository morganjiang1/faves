// Group chats between two people (two browsers) through the chat relay, a plan ticket both
// answer, and typing into every main text field.
import { expect, test, type Page } from "@playwright/test";
import { startOnboarded, watchConsole } from "./helpers";

const run = Math.random().toString(36).slice(2, 7);

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
