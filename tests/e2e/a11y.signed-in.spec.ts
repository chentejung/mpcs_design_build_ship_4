// Keyboard and screen-reader access on every signed-in page, as test user A on TMDB fixtures: Browse with a film
// already saved, My List in cards and in rows and empty, and History with and without results. Tab reaches every
// control, each shows a focus ring and has a name, and axe finds no violations (tests/e2e/checks.ts). Desktop only,
// one test at a time: the tests share the user, whose current-month Entries are cleared first.
import { expect, test, type Page } from "@playwright/test";
import { expectAccessible } from "./checks";
import {
  andWaitForServer, clearThisMonth, notice, saveFromBrowse, signIn, skipWithoutTestUsers, USER_A, visit, watchedSwitch,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

test.describe.configure({ mode: "serial" });

const [first, , third] = nowPlaying(1).results.map((m) => m.title);

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
});

async function check(page: Page, url: string, name: string) {
  await visit(page, url);
  await page.waitForLoadState("networkidle");
  await expectAccessible(page, name);
}

test("every signed-in page works by keyboard and passes axe", async ({ page }) => {
  test.setTimeout(120_000); // seven pages, each tabbed through and scanned
  await check(page, "/my-list", "My List, empty");

  await saveFromBrowse(page, [first, third]);
  await check(page, "/", "Browse, with films already saved");
  await check(page, "/?feed=top-rated", "Browse, Top Rated, signed in");

  await visit(page, "/my-list");
  await andWaitForServer(page, () => watchedSwitch(page, first).click());
  // The Watched toast's Undo lasts 3 s, less than a Tab walk over the page takes: let it go first, so the walk doesn't
  // look for a control that has since left (toasts.signed-in.spec.ts covers the toast itself).
  await expect(notice(page)).toHaveCount(0, { timeout: 5000 });
  for (const view of ["Cards", "Rows"]) {
    await page.getByText(view, { exact: true }).click();
    await expect(page.getByRole("radio", { name: view })).toBeChecked();
    await expectAccessible(page, `My List in ${view.toLowerCase()}`);
  }
  await page.getByText("Cards", { exact: true }).click();

  await check(page, "/my-list/history", "History");
  await check(page, "/my-list/history?month=2026-09&q=zqxjvwk", "History, nothing matches");
});
