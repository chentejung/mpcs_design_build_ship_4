// The minimal My List (#7), as test user A on TMDB fixtures: Remove is a change like Save, with a 3-second Undo that
// puts the very same Entry back from the server-signed copy (AGENTS.md → Product rules 6).
import { expect, test } from "@playwright/test";
import {
  alreadySaved, andWaitForServer, clearThisMonth, expectListCount, listRows, notice, saveButton, signIn, skipWithoutTestUsers, undoButton,
  USER_A,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

const [first, , third] = nowPlaying(1).results.map((m) => m.title);

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
});

test("Remove shows an Undo, and Undo brings the same Entry back", async ({ page }) => {
  await page.goto("/");
  for (const title of [first, third]) {
    await andWaitForServer(page, () => saveButton(page, title).click());
    await expect(alreadySaved(page, title)).toBeVisible();
  }
  await expectListCount(page, 2);

  await page.goto("/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(first), new RegExp(third)]); // oldest first
  await page.getByRole("button", { name: `Remove ${first}` }).click();
  await expect(listRows(page)).toHaveText([new RegExp(third)]);
  await expectListCount(page, 1);
  await expect(notice(page)).toContainText(`Removed ${first}`);

  await andWaitForServer(page, () => undoButton(page).click());
  await expectListCount(page, 2);
  // The same row, not a new save: it keeps its added_at, so it is back ahead of the film saved after it.
  await expect(listRows(page)).toHaveText([new RegExp(first), new RegExp(third)]);
  await page.reload();
  await expect(listRows(page)).toHaveText([new RegExp(first), new RegExp(third)]);
});
