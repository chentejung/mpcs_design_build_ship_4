// Save, as test user A on TMDB fixtures: a saved film joins this month's list, its card turns Already saved, the My List
// tab counts it, and a 3-second Undo toast can take it back. A failed write rolls back with an error. Desktop only, one
// test at a time: the tests share the user, whose current-month Entries are cleared before each one.
import { expect, test } from "@playwright/test";
import {
  alreadySaved, card, clearThisMonth, errorToast, expectListCount, listRows, notice, saveButton, signIn,
  skipWithoutTestUsers, undoButton, USER_A,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

test.describe.configure({ mode: "serial" });

const [first, second] = nowPlaying(1).results.map((m) => m.title);

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
  await page.goto("/");
});

test("Save adds the film to this month: the card turns Already saved and the tab counts it", async ({ page }) => {
  await expectListCount(page, 0);
  await saveButton(page, first).click();

  const saved = alreadySaved(page, first);
  await expect(saved).toHaveAttribute("aria-disabled", "true");
  await expect(saved).toHaveAccessibleDescription("Remove it from My List");
  await expectListCount(page, 1);
  await expect(notice(page)).toContainText(`Saved ${first}`);

  // Still focusable, so a keyboard or screen reader user meets the hint; pressing it changes nothing.
  await saved.focus();
  await expect(saved).toBeFocused();
  await page.keyboard.press("Enter");
  await expectListCount(page, 1);

  await page.reload();
  await expect(alreadySaved(page, first)).toBeVisible();
  await expect(saveButton(page, second)).toBeVisible();
  await page.goto("/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(first)]);
});

test("Undo within 3 seconds takes the Save back, and the count with it", async ({ page }) => {
  await saveButton(page, first).click();
  await expectListCount(page, 1);
  await undoButton(page).click();

  await expect(saveButton(page, first)).toBeVisible();
  await expectListCount(page, 0);
  await expect(notice(page)).toHaveCount(0);

  await page.reload();
  await expect(saveButton(page, first)).toBeVisible();
  await page.goto("/my-list");
  await expect(listRows(page)).toHaveCount(0);
});

test("the Undo toast is gone after 3 seconds, and the Entry stays", async ({ page }) => {
  await saveButton(page, first).click();
  await expect(undoButton(page)).toBeVisible();
  const shown = Date.now();
  await expect(notice(page)).toHaveCount(0, { timeout: 6000 });
  expect(Date.now() - shown).toBeGreaterThan(2000);

  await expect(alreadySaved(page, first)).toBeVisible();
  await expectListCount(page, 1);
  await page.goto("/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(first)]);
});

test("a failed save rolls back, with an error toast", async ({ page }) => {
  // Server Actions are POSTs carrying a Next-Action header; failing them is a network that drops the write.
  await page.route("**/*", (route) =>
    route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.fallback(),
  );
  await saveButton(page, first).click();

  await expect(errorToast(page)).toContainText(`Couldn’t save ${first}`);
  await expect(saveButton(page, first)).toBeVisible();
  await expectListCount(page, 0);
  await expect(undoButton(page)).toHaveCount(0);

  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await page.goto("/my-list");
  await expect(listRows(page)).toHaveCount(0);
});

test("the same film can't be saved twice in one month", async ({ page, context }) => {
  // A second tab still showing Save, from before the first tab saved it.
  const other = await context.newPage();
  await other.route("https://image.tmdb.org/**", (route) => route.abort());
  await other.goto("/");
  await expect(saveButton(other, first)).toBeVisible();

  await saveButton(page, first).click();
  await expect(alreadySaved(page, first)).toBeVisible();

  await saveButton(other, first).click();
  await expect(alreadySaved(other, first)).toBeVisible();
  await expect(notice(other)).toContainText(`${first} is already in this month’s list`);
  await expect(undoButton(other)).toHaveCount(0);
  await expect(errorToast(other)).toHaveCount(0);
  await expectListCount(other, 1);

  await page.goto("/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(first)]);
  await expect(card(page, first)).toHaveCount(0);
});
