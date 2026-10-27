// The shared toast across every change (AGENTS.md → Product rules 6), as test user A on TMDB fixtures: Save, mark and
// unmark Watched, Remove and Add it to this month each show the one toast, in one wording (lib/toast-messages.ts), with
// an Undo that lasts 3 seconds; a failed write shows the error toast instead. Desktop only, one test at a time: the
// tests share the user, whose current-month Entries are cleared before each one.
import { expect, test, type Page } from "@playwright/test";
import {
  andWaitForServer, clearThisMonth, errorToast, notice, removeButton, saveButton, saveFromBrowse, signIn, skipWithoutTestUsers,
  undoButton, USER_A, visit, watchedSwitch,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

test.describe.configure({ mode: "serial" });

const [first] = nowPlaying(1).results.map((m) => m.title);
const addButton = (page: Page, title: string) =>
  page.getByRole("region", { name: "September 2026", exact: true }).getByRole("button", { name: `Add it to this month: ${title}`, exact: true });

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
});

// `act`'s toast says `message` and offers Undo for 3 seconds: still there after 2, gone by 4.
async function expectUndoToast(page: Page, act: () => Promise<void>, message: string) {
  await andWaitForServer(page, act);
  await expect(notice(page)).toHaveText(`${message}Undo`);
  const shown = Date.now();
  await expect(undoButton(page)).toHaveCount(0, { timeout: 5000 });
  expect(Date.now() - shown, `${message} lasted`).toBeGreaterThan(2000);
  await expect(errorToast(page)).toHaveCount(0);
}

test("every change shows the shared toast in one wording, with a 3-second Undo", async ({ page }) => {
  await visit(page, "/");
  await expectUndoToast(page, () => saveButton(page, first).click(), `Saved ${first} to this month’s list.`);

  await visit(page, "/my-list");
  await expectUndoToast(page, () => watchedSwitch(page, first).click(), `Marked ${first} Watched.`);
  await expectUndoToast(page, () => watchedSwitch(page, first).click(), `Marked ${first} Not watched yet.`);
  await expectUndoToast(page, () => removeButton(page, first).click(), `Removed ${first} from this month’s list.`);

  await visit(page, "/my-list/history");
  await expectUndoToast(page, () => addButton(page, "Pulp Fiction").click(), "Added Pulp Fiction to this month’s list.");
});

test("every failed write shows the error toast in the same wording, with no Undo", async ({ page }) => {
  await saveFromBrowse(page, [first]);
  await visit(page, "/my-list");
  await andWaitForServer(page, () => watchedSwitch(page, first).click());
  await expect(undoButton(page)).toHaveCount(0, { timeout: 5000 });

  // Server Actions are POSTs carrying a Next-Action header; failing them is a network that drops the write.
  await page.route("**/*", (route) =>
    route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.fallback(),
  );
  const expectError = async (act: () => Promise<void>, message: string) => {
    await act();
    await expect(errorToast(page)).toHaveText(message);
    await expect(undoButton(page)).toHaveCount(0);
  };

  await expectError(() => watchedSwitch(page, first).click(), `Couldn’t mark ${first} Not watched yet. Try again.`);
  await expectError(() => removeButton(page, first).click(), `Couldn’t remove ${first} from this month’s list. Try again.`);
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expectError(() => addButton(page, "Pulp Fiction").click(), "Couldn’t add Pulp Fiction to this month’s list. Try again.");
  await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Browse" }).click();
  await expect(saveButton(page, nowPlaying(1).results[1].title)).toBeVisible();
  await expectError(() => saveButton(page, nowPlaying(1).results[1].title).click(), `Couldn’t save ${nowPlaying(1).results[1].title} to this month’s list. Try again.`);
});
