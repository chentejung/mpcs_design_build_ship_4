import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Browser tests drive the built app (`next build && next start`): on port 3001 answering TMDB from fixtures, and on
// port 3002 against live TMDB for the one smoke test. Signed-out pages and layout run on desktop and phone
// (AGENTS.md → Testing). Tests read .env.local too, to check the TMDB token never reaches the browser.
loadEnvConfig(process.cwd());
const FIXTURES = 3001;
const LIVE = 3002;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: `http://localhost:${FIXTURES}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", testIgnore: /live\.spec/, use: { ...devices["Desktop Firefox"] } },
    { name: "phone", testIgnore: /live\.spec/, use: { browserName: "firefox", viewport: { width: 390, height: 844 } } },
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
