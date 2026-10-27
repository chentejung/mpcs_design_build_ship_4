// History (#9), as test user A on TMDB fixtures: every past month, newest first, read-only, with Add it to this month
// for the films not watched yet. A's History is the one seeded month, September 2026 (scripts/seed-history.sql);
// tests read it and never change it. Desktop only, one test at a time: the tests share the user, whose current-month
// Entries are cleared before each one.
import { clerk } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  andWaitForServer, card, clearThisMonth, entry, expectListCount, expectTotals, listRows, notice, saveFromBrowse, sectionRows, signIn,
  skipWithoutTestUsers, undoButton, USER_A, visit, watchedSwitch,
} from "./signed-in";

const SEPTEMBER = ["The Matrix", "Pulp Fiction", "The Godfather", "Spirited Away", "Clayface"]; // in the order added
const NOT_WATCHED = ["Pulp Fiction", "The Godfather", "Clayface"];

const months = (page: Page) => page.getByRole("region", { name: /^[A-Z][a-z]+ \d{4}$/ }); // "September 2026"
const month = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const pastEntry = (page: Page, title: string) =>
  months(page).getByRole("listitem").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
const addButton = (page: Page, title: string) => pastEntry(page, title).getByRole("button", { name: `Add ${title} to this month` });

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
});

test("past months are listed newest first with their planned and watched counts, read-only", async ({ page }) => {
  await visit(page, "/my-list/history");
  await expect(months(page).getByRole("heading", { level: 2 })).toHaveText(["September 2026"]);
  const september = month(page, "September 2026");
  await expect(september.getByText(/planned/)).toHaveText("5 planned · 2 watched");
  await expect(september.getByRole("listitem").getByRole("heading", { level: 3 })).toHaveText(SEPTEMBER);

  // Past months can't be edited: no Watched toggle, no Remove. Only the films not watched yet can be added again.
  await expect(september.getByRole("switch")).toHaveCount(0);
  await expect(september.getByRole("button", { name: /^Remove / })).toHaveCount(0);
  await expect(september.getByRole("button", { name: /to this month$/ })).toHaveCount(NOT_WATCHED.length);
  for (const title of NOT_WATCHED) await expect(addButton(page, title)).toBeVisible();
  await expect(pastEntry(page, "The Matrix")).toContainText("Watched Sep 12");
});

test("the month and title filters work alone and together, survive refresh, and ignore invalid values", async ({ page }) => {
  const monthSelect = page.getByRole("combobox", { name: "Month" });
  const search = page.getByRole("searchbox", { name: "Search titles" });
  const titles = months(page).getByRole("listitem").getByRole("heading", { level: 3 });

  await visit(page, "/my-list/history");
  await expect(monthSelect).toHaveValue("");
  await expect(monthSelect.getByRole("option")).toHaveText(["All months", "September 2026"]);

  // The month alone.
  await monthSelect.selectOption({ label: "September 2026" });
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page).toHaveURL(/[?&]month=2026-09(&|$)/);
  await expect(titles).toHaveText(SEPTEMBER);
  await page.reload();
  await clerk.loaded({ page }); // as visit() does
  await expect(monthSelect).toHaveValue("2026-09");
  await expect(titles).toHaveText(SEPTEMBER);

  // The title too: title or original title, any case, across the chosen month.
  await search.fill("GOD");
  await page.getByRole("button", { name: "Show" }).click();
  await expect(page).toHaveURL(/[?&]q=GOD(&|$)/);
  await expect(page).toHaveURL(/[?&]month=2026-09(&|$)/);
  await expect(titles).toHaveText(["The Godfather"]);
  await page.reload();
  await clerk.loaded({ page }); // as visit() does
  await expect(search).toHaveValue("GOD");
  await expect(monthSelect).toHaveValue("2026-09");
  await expect(titles).toHaveText(["The Godfather"]);

  // The title alone, by the original title.
  await visit(page, "/my-list/history?q=千と千尋");
  await expect(titles).toHaveText(["Spirited Away"]);
  await expect(monthSelect).toHaveValue("");

  // A past month with no list, or a search that matches nothing (% taken literally), is Browse's empty state.
  for (const url of ["/my-list/history?month=2026-08", "/my-list/history?q=%25", "/my-list/history?month=2026-09&q=zqxjvwk"]) {
    await visit(page, url);
    await expect(page.getByText("No films here!")).toBeVisible();
    await expect(titles).toHaveCount(0);
  }
  await page.getByRole("search").getByRole("link", { name: "Clear filters" }).click();
  await expect(page).toHaveURL("/my-list/history");
  await expect(titles).toHaveText(SEPTEMBER);

  // Invalid values are ignored, not errors: every past month, unfiltered.
  for (const url of ["/my-list/history?month=2026-13", "/my-list/history?month=September&q=%20", "/my-list/history?month=2026-10"]) {
    await visit(page, url);
    await expect(titles).toHaveText(SEPTEMBER);
    await expect(monthSelect).toHaveValue("");
  }
});

test("Add it to this month copies a film into this month's list, with a 3-second Undo, and leaves the past Entry alone", async ({ page }) => {
  await visit(page, "/my-list/history");
  const september = month(page, "September 2026");

  await andWaitForServer(page, () => addButton(page, "Pulp Fiction").click());
  await expect(notice(page)).toContainText("Added Pulp Fiction to this month’s list.");
  await expect(pastEntry(page, "Pulp Fiction").getByRole("button", { name: "Already saved" })).toBeVisible();
  await expectListCount(page, 1);

  // Undo takes the new Entry away again; September is as it was throughout.
  await andWaitForServer(page, () => undoButton(page).click());
  await expect(addButton(page, "Pulp Fiction")).toBeVisible();
  await expectListCount(page, 0);
  await expect(september.getByText(/planned/)).toHaveText("5 planned · 2 watched");
  await expect(pastEntry(page, "Pulp Fiction")).toContainText("Not watched yet");

  // Added for good: the toast's Undo is gone after 3 seconds, and this month's list has the film, details and all
  // copied from the September Entry (Pulp Fiction has no TMDB fixture, so they can't have come from TMDB).
  await andWaitForServer(page, () => addButton(page, "Pulp Fiction").click());
  await expect(undoButton(page)).toBeVisible();
  await expect(undoButton(page)).toHaveCount(0, { timeout: 4000 });
  await page.reload();
  await clerk.loaded({ page }); // as visit() does
  await expect(pastEntry(page, "Pulp Fiction").getByRole("button", { name: "Already saved" })).toBeVisible();
  await expect(september.getByText(/planned/)).toHaveText("5 planned · 2 watched");
  await expect(september.getByRole("listitem").getByRole("heading", { level: 3 })).toHaveText(SEPTEMBER);

  await visit(page, "/my-list");
  await expect(listRows(page)).toHaveText([/Pulp Fiction/]);
  await expect(entry(page, "Pulp Fiction")).toContainText("1994");
  await expectTotals(page, "1 film · 0 watched · 2h 34m to go");
});

test("a film already in this month's list shows Already saved, and watching it now leaves September's record alone", async ({ page }) => {
  await saveFromBrowse(page, ["Clayface"]); // in Now Playing, and Not watched yet in September
  await visit(page, "/my-list/history");
  const already = pastEntry(page, "Clayface").getByRole("button", { name: "Already saved" });
  await expect(already).toHaveAttribute("aria-disabled", "true");
  await expect(already).toHaveAccessibleDescription("Remove it from My List");
  await expect(addButton(page, "Clayface")).toHaveCount(0);

  await visit(page, "/my-list");
  await andWaitForServer(page, () => watchedSwitch(page, "Clayface").click());
  await expect(sectionRows(page, "Watched")).toHaveText([/Clayface/]);

  await visit(page, "/my-list/history");
  await expect(pastEntry(page, "Clayface")).toContainText("Not watched yet");
  await expect(already).toBeVisible();
  await expect(month(page, "September 2026").getByText(/planned/)).toHaveText("5 planned · 2 watched");
});

test("on Browse, a film from a past month's list says which month", async ({ page }) => {
  await visit(page, "/");
  // Clayface was in A's September list; Buddy was only in B's.
  await expect(card(page, "Clayface")).toContainText("In your Sep 2026 list");
  await expect(page.getByRole("list", { name: "Films" }).getByText(/^In your .* list$/)).toHaveCount(1);
  await expect(card(page, "Buddy")).not.toContainText("In your");
});
