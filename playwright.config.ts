// End-to-end flows on the exported web build at iPhone size.
//   npx expo export --platform web && npx playwright test
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8090",
    ...devices["iPhone 13"],
    browserName: "chromium",
    viewport: { width: 390, height: 844 },
    trace: "retain-on-failure",
  },
  webServer: [
    { command: "node scripts/serve-web.mjs 8090", url: "http://localhost:8090", reuseExistingServer: true, timeout: 30_000 },
    // The chat relay (npm run chat-server) for the group chat tests.
    { command: "node server/chat-server.mjs", url: "http://localhost:8787/health", reuseExistingServer: true, timeout: 30_000 },
  ],
});
