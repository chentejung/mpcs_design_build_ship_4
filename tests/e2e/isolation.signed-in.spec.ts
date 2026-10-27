// The required cross-user isolation test (AGENTS.md → Testing). Test users A and B sign in in separate browser
// contexts; A saves film X and B saves film Y. Each My List shows only its own film, and on Browse each sees the
// other's film as Save, not Already saved. Each History shows only its own seeded month (scripts/seed-history.sql),
// and Browse's "In your Sep 2026 list" only for its own past films. RLS is the only thing separating them (the app never filters by user_id),
// so this measures the policies; docs/rls-isolation-test.md records it failing under a loosened select policy.
import { expect, test, type Browser, type Page } from "@playwright/test";
import {
  alreadySaved, andWaitForServer, card, clearThisMonth, expectListCount, listRows, saveButton, signIn, skipWithoutTestUsers,
  userDatabase, USER_A, USER_B, visit,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

const [X, Y] = nowPlaying(1).results.slice(2).map((m) => m.title);

// Each user's seeded History (September 2026, scripts/seed-history.sql), never shown to the other, and the film in it
// that's also in Now Playing, which Browse notes for its owner alone.
const HISTORY = {
  A: { titles: ["The Matrix", "Pulp Fiction", "The Godfather", "Spirited Away", "Clayface"], counts: "5 planned · 2 watched", nowPlaying: "Clayface" },
  B: { titles: ["Fight Club", "Forrest Gump", "The Dark Knight", "Buddy"], counts: "4 planned · 2 watched", nowPlaying: "Buddy" },
};
type History = (typeof HISTORY)["A"];

async function userPage(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, email);
  await clearThisMonth(page);
  return page;
}

async function save(page: Page, title: string) {
  await visit(page, "/");
  await andWaitForServer(page, () => saveButton(page, title).click());
  await expect(alreadySaved(page, title)).toBeVisible();
  await expectListCount(page, 1);
}

async function expectOnlyOwn(page: Page, own: string, other: string, ownHistory: History, otherHistory: History) {
  await visit(page, "/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(own)]);
  await expectListCount(page, 1);

  await visit(page, "/");
  await expect(alreadySaved(page, own)).toBeVisible();
  await expect(saveButton(page, other)).toBeVisible();
  await expect(alreadySaved(page, other)).toHaveCount(0);
  await expect(card(page, ownHistory.nowPlaying)).toContainText("In your Sep 2026 list");
  await expect(card(page, otherHistory.nowPlaying)).not.toContainText("In your");

  await visit(page, "/my-list/history");
  const september = page.getByRole("region", { name: "September 2026", exact: true });
  await expect(september.getByRole("listitem").getByRole("heading", { level: 3 })).toHaveText(ownHistory.titles);
  await expect(september.getByText(/planned/)).toHaveText(ownHistory.counts);
  for (const title of otherHistory.titles) await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  // Not even by searching for it.
  await visit(page, `/my-list/history?q=${encodeURIComponent(otherHistory.titles[0])}`);
  await expect(page.getByText("No films here!")).toBeVisible();
  // And at the database itself, as this user's real session: no user_id filter can mask a broken SELECT policy.
  const db = await userDatabase(page);
  const history = await db.from("movie_list_entries").select("title").eq("month", "2026-09-01");
  expect(history.error).toBeNull();
  expect(history.data!.map((row) => row.title).sort()).toEqual([...ownHistory.titles].sort());
}

test("each user sees only their own Entries", async ({ browser }) => {
  skipWithoutTestUsers();
  test.setTimeout(60_000); // two users, each through My List, Browse and History
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
