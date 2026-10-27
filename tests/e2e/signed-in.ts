// Helpers for the signed-in specs (*.signed-in.spec.ts and signed-in.spec.ts): sign in as a test user, clear their
// current-month Entries through the app's own Remove (AGENTS.md → Testing), and find the controls a user would.
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

export const USER_A = process.env.TEST_USER_A_EMAIL;
export const USER_B = process.env.TEST_USER_B_EMAIL;

export const skipWithoutTestUsers = () =>
  test.skip(!USER_A || !USER_B, "run scripts/create-test-users.mjs first");

export async function signIn(page: Page, emailAddress: string) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  // By email: a Backend API sign-in token, so Clerk's new-device check on password sign-ins doesn't stop the test.
  await clerk.signIn({ page, emailAddress });
  await page.waitForLoadState("networkidle"); // Clerk refreshes the page once the session is set
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

// This month's titles on My List.
export const listRows = (page: Page) => page.getByRole("list", { name: "This month" }).getByRole("listitem");

// The shared toast: changes are announced politely with an Undo, failed writes as an alert.
export const notice = (page: Page) => page.getByRole("status").filter({ has: page.locator(".ds-toast") });
export const errorToast = (page: Page) => page.getByRole("alert").filter({ has: page.locator(".ds-toast") });
export const undoButton = (page: Page) => notice(page).getByRole("button", { name: "Undo" });

// Does `act` and waits for the Server Action it starts to answer. The page shows a change before the server has made it
// (optimistic UI), so a test that reloads or leaves straight after would cut the write short.
export async function andWaitForServer(page: Page, act: () => Promise<void>) {
  const answered = page.waitForResponse((r) => r.request().method() === "POST" && !!r.request().headers()["next-action"]);
  await act();
  await (await answered).finished();
}

// Empties this month's list the way a user would: Remove, one Entry at a time. Each waits for its Undo toast, which
// appears once the server has deleted the row, so leaving the page can't cut a removal short.
export async function clearThisMonth(page: Page) {
  await page.goto("/my-list");
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
