// Helpers for the signed-in specs (*.signed-in.spec.ts and signed-in.spec.ts): sign in as a test user, clear their
// current-month Entries through the app's own Remove (AGENTS.md → Testing), and find the controls a user would.
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/database.types";

export const USER_A = process.env.TEST_USER_A_EMAIL;
export const USER_B = process.env.TEST_USER_B_EMAIL;

export const skipWithoutTestUsers = () =>
  test.skip(!USER_A || !USER_B, "run scripts/create-test-users.mjs first");

// Direct RLS probes use the real browser session and publishable key, never a privileged database credential.
export async function userDatabase(page: Page) {
  await clerk.loaded({ page });
  await expect.poll(() => page.evaluate(() => !!window.Clerk.session)).toBe(true);
  const token = await page.evaluate(() => window.Clerk.session!.getToken());
  expect(token).toBeTruthy();
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    accessToken: async () => token,
  });
}

export async function signIn(page: Page, emailAddress: string) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  // By email: a Backend API sign-in token, so Clerk's new-device check on password sign-ins doesn't stop the test.
  await clerk.signIn({ page, emailAddress });
  // Clerk refreshes the route after setActive. A second goto can race the onboarding redirect in Firefox.
  await expect(page.getByRole("button", { name: /open user (button|menu)/i })).toBeVisible();
  await expect(page.getByLabel("What should we call you?").or(page.getByText(/^Welcome, .+!$/))).toBeVisible();
  if (new URL(page.url()).pathname === "/onboarding") {
    await page.getByLabel("What should we call you?").fill(emailAddress === USER_A ? "Bijou A" : "Bijou B");
    await page.getByRole("checkbox", { name: "Action", exact: true }).check();
    await page.getByRole("button", { name: "Start browsing" }).click();
    await expect(page).toHaveURL("/");
  }
  await expect(page.getByText(/^Welcome, .+!$/)).toBeVisible();
}

// Goes to a page and waits for Clerk's script to finish loading there. Leaving a page while Clerk is still setting up
// cuts its requests short, and the next page's handshake (on a development instance) can then come back signed out.
export async function visit(page: Page, url: string) {
  await page.goto(url);
  await clerk.loaded({ page });
}

// Reloads the page, then waits for Clerk as visit() does.
export async function reload(page: Page) {
  await page.reload();
  await clerk.loaded({ page });
}

export const myListTab = (page: Page) => page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: /^My List/ });

// "My List · Oct (2)" → 2
export async function expectListCount(page: Page, n: number) {
  await expect(myListTab(page)).toHaveText(new RegExp(`^My List · [A-Z][a-z]{2} \\(${n}\\)$`));
}

// A film's card on Browse, by its exact title.
export const card = (page: Page, title: string) =>
  page.getByRole("list", { name: "Films" }).getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
export const saveButton = (page: Page, title: string) => card(page, title).getByRole("button", { name: `Save ${title}` });
export const alreadySaved = (page: Page, title: string) => card(page, title).getByRole("button", { name: "Already saved" });

// This month's Entries on My List, Not watched yet first, then Watched; or one section's.
export type Section = "Not watched yet" | "Watched";
export const sectionRows = (page: Page, name: Section) => page.getByRole("list", { name, exact: true }).getByRole("listitem");
export const listRows = (page: Page) =>
  page.getByRole("main").getByRole("list", { name: /^(Not watched yet|Watched)$/ }).getByRole("listitem");
export const entry = (page: Page, title: string) =>
  listRows(page).filter({ has: page.getByRole("heading", { name: title, exact: true }) });
export const watchedSwitch = (page: Page, title: string) => entry(page, title).getByRole("switch", { name: `Watched: ${title}` });
export const removeButton = (page: Page, title: string) => entry(page, title).getByRole("button", { name: `Remove ${title}` });

// My List's comic-issue header, "OCTOBER 2026 · 8 films · 3 watched · 11h 20m to go", after its month.
export async function expectTotals(page: Page, totals: string) {
  await expect(page.getByRole("main").getByText(/^[A-Z]+ \d{4} · \d+ films? · /)).toHaveText(new RegExp(`^[A-Z]+ \\d{4} · ${totals}$`));
}

// Saves each film from Browse, waiting for the server each time.
export async function saveFromBrowse(page: Page, titles: string[]) {
  await visit(page, "/");
  for (const title of titles) {
    await andWaitForServer(page, () => saveButton(page, title).click());
    await expect(alreadySaved(page, title)).toBeVisible();
  }
}

// The shared toast: changes are announced politely with an Undo, failed writes as an alert.
export const notice = (page: Page) => page.getByRole("status").filter({ has: page.locator(".ds-toast") });
export const errorToast = (page: Page) => page.getByRole("alert").filter({ has: page.locator(".ds-toast") });
export const undoButton = (page: Page) => notice(page).getByRole("button", { name: "Undo" });

// Does `act` and waits for the Server Action it starts to answer. The page shows a change before the server has made it
// (optimistic UI), so a test that reloads or leaves straight after would cut the write short.
// It waits for the request `act` sends, not just the next answer: an earlier write still in flight (a Remove whose
// Undo `act` clicks) would answer first, and the test would move on with `act`'s own write unfinished.
export async function andWaitForServer(page: Page, act: () => Promise<void>) {
  const sent = page.waitForRequest((r) => r.method() === "POST" && !!r.headers()["next-action"]);
  await act();
  await (await (await sent).response())?.finished();
}

// Empties this month's list the way a user would: Remove, one Entry at a time. Each waits for its Undo toast, which
// appears once the server has deleted the row, so leaving the page can't cut a removal short.
export async function clearThisMonth(page: Page) {
  await visit(page, "/my-list");
  await expect(page.getByRole("heading", { level: 1, name: "My List" })).toBeVisible();
  const remove = page.getByRole("button", { name: /^Remove / });
  for (let n = await remove.count(); n > 0; n--) {
    const title = (await remove.first().getAttribute("aria-label"))!.replace(/^Remove /, "");
    await remove.first().click();
    await expect(remove).toHaveCount(n - 1);
    await expect(notice(page)).toContainText(`Removed ${title}`);
  }
  await expectListCount(page, 0);
}

// A field's rule, shown under it (for the genres, under the last of their chips) in bold red once it is left empty.
export async function expectWarningUnder(field: Locator, warning: Locator) {
  await expect(warning).toBeVisible();
  // Both measured at once: the page may still be smooth-scrolling after the last key press.
  const [fieldBottom, warningTop] = await Promise.all([field.elementHandle(), warning.elementHandle()]).then(([f, w]) =>
    f!.evaluate((el, other) => [el.getBoundingClientRect().bottom, other.getBoundingClientRect().top], w!));
  expect(warningTop, "the warning sits under its field").toBeGreaterThanOrEqual(fieldBottom - 1);
  const { weight, color } = await warning.evaluate((el) => ({ weight: Number(getComputedStyle(el).fontWeight), color: getComputedStyle(el).color }));
  expect(weight, "bold").toBeGreaterThanOrEqual(700);
  const [r, g, b] = color.match(/\d+/g)!.map(Number);
  expect(r > 150 && g < 90 && b < 90, `red, not ${color}`).toBe(true);
}

// Deletes a throwaway account a test signed up, through Clerk's Backend API (its Entries must be removed first).
export async function deleteClerkUser(email: string) {
  const headers = { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` };
  const found = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, { headers });
  for (const user of (await found.json()) as { id: string }[])
    await fetch(`https://api.clerk.com/v1/users/${user.id}`, { method: "DELETE", headers });
}
