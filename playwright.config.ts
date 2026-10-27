import { existsSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Browser tests drive the built app (`next build && next start`): on port 3001 answering TMDB from fixtures, and on
// port 3002 against live TMDB for the one smoke test. Signed-out pages and layout run on desktop and phone
// (AGENTS.md → Testing); signed-in tests (*signed-in.spec.ts) run on desktop only, one at a time, as the test users in .env.test.local
// (scripts/create-test-users.mjs). Tests read .env.local too, for Clerk's keys and to check the TMDB token never
// reaches the browser.
loadEnvConfig(process.cwd());
if (existsSync(".env.test.local")) process.loadEnvFile(".env.test.local");
const FIXTURES = 3001;
const LIVE = 3002;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: `http://localhost:${FIXTURES}`, trace: "retain-on-failure" },
  projects: [
    { name: "clerk setup", testMatch: /global\.setup\.ts/ },
    { name: "desktop", testIgnore: /(live|signed-in)\.spec/, use: { ...devices["Desktop Firefox"] } },
    { name: "phone", testIgnore: /(live|signed-in)\.spec/, use: { browserName: "firefox", viewport: { width: 390, height: 844 } } },
    {
      name: "signed in",
      testMatch: /signed-in\.spec/,
      dependencies: ["clerk setup"],
      fullyParallel: false,
      workers: 1, // every signed-in spec shares test users A and B and their rows
      use: { ...devices["Desktop Firefox"] },
    },
    { name: "live", testMatch: /live\.spec/, use: { ...devices["Desktop Firefox"], baseURL: `http://localhost:${LIVE}` } },
  ],
  // Playwright starts these in order, so the second reuses the first one's build.
  webServer: [
    {
      command: `next build && next start -p ${FIXTURES}`,
      env: { TMDB_FIXTURES: "1" },
      url: `http://localhost:${FIXTURES}`,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `next start -p ${LIVE}`,
      env: { TMDB_FIXTURES: "" },
      url: `http://localhost:${LIVE}`,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
