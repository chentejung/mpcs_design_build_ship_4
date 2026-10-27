// Keyboard and screen-reader access on every signed-out page, desktop and phone: Tab reaches every control, each
// shows a focus ring and has a name, and axe finds no violations (tests/e2e/checks.ts).
import { test } from "@playwright/test";
import { expectAccessible } from "./checks";

const pages = {
  "Browse, Now Playing": "/",
  "Browse, Top Rated": "/?feed=top-rated",
  "Browse, a genre with no films": "/?feed=top-rated&genre=10770",
  "Browse, a search": "/?q=alien",
  "Browse, a search with no results": "/?q=zqxjvwk",
  "the sign-in page": "/sign-in",
};

test.beforeEach(async ({ page }) => {
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
});

for (const [name, path] of Object.entries(pages))
  test(`${name} works by keyboard and passes axe`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await expectAccessible(page, name);
  });
