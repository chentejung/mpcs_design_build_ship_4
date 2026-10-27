import { defineConfig, devices } from "@playwright/test";

// Browser tests drive the built app (`next build && next start`) on port 3001, answering TMDB from fixtures.
// Signed-out pages and layout run on desktop and phone (AGENTS.md → Testing).
const PORT = 3001;

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "phone", use: { browserName: "firefox", viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `next build && next start -p ${PORT}`,
    env: { TMDB_FIXTURES: "1" },
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
});
