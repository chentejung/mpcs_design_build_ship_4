// The required cross-user isolation test (AGENTS.md → Testing). Test users A and B sign in in separate browser
// contexts; A saves film X and B saves film Y. Each My List shows only its own film, and on Browse each sees the
// other's film as Save, not Already saved. RLS is the only thing separating them (the app never filters by user_id),
// so this measures the policies; docs/rls-isolation-test.md records it failing under a loosened select policy.
import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  alreadySaved, andWaitForServer, clearThisMonth, expectListCount, listRows, saveButton, signIn, skipWithoutTestUsers, userDatabase, USER_A, USER_B,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

const [X, Y] = nowPlaying(1).results.slice(2).map((m) => m.title);

// Each user's seeded History (September 2026, docs/rls-isolation-test.md), never shown to the other.
const HISTORY = { A: ["The Matrix", "Pulp Fiction", "The Godfather"], B: ["Fight Club", "Forrest Gump", "The Dark Knight"] };

async function userPage(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, email);
  await clearThisMonth(page);
  return page;
}

async function save(page: Page, title: string) {
  await page.goto("/");
  await andWaitForServer(page, () => saveButton(page, title).click());
  await expect(alreadySaved(page, title)).toBeVisible();
  await expectListCount(page, 1);
}

async function expectOnlyOwn(page: Page, own: string, other: string, ownHistory: string[], otherHistory: string[]) {
  await page.goto("/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(own)]);
  await expectListCount(page, 1);

  await page.goto("/");
  await expect(alreadySaved(page, own)).toBeVisible();
  await expect(saveButton(page, other)).toBeVisible();
  await expect(alreadySaved(page, other)).toHaveCount(0);

  await page.goto("/my-list/history");
  await expect(page.getByRole("heading", { level: 1, name: "History" })).toBeVisible();
  for (const title of otherHistory) await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  // The History UI is still the #9 placeholder. Prove isolation against its existing seeded rows via the Data API
  // as this user's real session; no user_id filter can mask a broken SELECT policy.
  const db = await userDatabase(page);
  const history = await db.from("movie_list_entries").select("title").eq("month", "2026-09-01");
  expect(history.error).toBeNull();
  expect(history.data!.map((row) => row.title).sort()).toEqual([...ownHistory].sort());
}

test("each user sees only their own Entries", async ({ browser }) => {
  skipWithoutTestUsers();
  const a = await userPage(browser, USER_A!);
  const b = await userPage(browser, USER_B!);

  await save(a, X);
  await save(b, Y);

  await expectOnlyOwn(a, X, Y, HISTORY.A, HISTORY.B);
  await expectOnlyOwn(b, Y, X, HISTORY.B, HISTORY.A);

  // Leave this month empty, so a later run (or a loosened-policy demo) starts from nothing.
  await clearThisMonth(a);
  await clearThisMonth(b);
  await a.context().close();
  await b.context().close();
});
