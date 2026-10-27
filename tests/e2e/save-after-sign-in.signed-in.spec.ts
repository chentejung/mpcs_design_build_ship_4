// Save after sign-in (AGENTS.md → Product rules 7), as test user A on TMDB fixtures: a signed-out Save opens Clerk's
// sign-in modal over Browse, and signing in there saves that film to this month, no second click. Closing the modal
// saves nothing. Desktop only, one test at a time: each starts from A's current-month Entries cleared, then signed out.
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import {
  alreadySaved, clearThisMonth, expectListCount, listRows, notice, saveButton, signIn, skipWithoutTestUsers, undoButton,
  USER_A, saveFromBrowse, visit, deleteClerkUser,
} from "./signed-in";
import { nowPlaying } from "./tmdb-fixtures";

test.describe.configure({ mode: "serial" });

const [first] = nowPlaying(1).results.map((m) => m.title);

const signInModal = (page: Page) => page.getByRole("dialog").filter({ has: page.locator(".cl-signIn-root") });

// Signs in the way a visitor would, in the modal: email address, then the emailed code. A +clerk_test address gets no
// mail; Clerk's development instance takes 424242 as its code. By code rather than password, so neither Clerk's
// new-device check nor a rerun of scripts/create-test-users.mjs (a new password) gets in the way.
async function signInThroughModal(page: Page) {
  const modal = signInModal(page);
  await modal.getByLabel("Email address").fill(USER_A!);
  await modal.getByRole("button", { name: "Continue", exact: true }).click();
  await modal.getByRole("link", { name: "Use another method" }).click();
  await modal.getByRole("button", { name: /^Email code to / }).click();
  await modal.getByRole("textbox").first().pressSequentially("424242");
  await expect(modal).toHaveCount(0, { timeout: 15_000 });
}

async function signOutToBrowse(page: Page) {
  await clerk.signOut({ page });
  await page.waitForLoadState("networkidle"); // Clerk refreshes the page once the session ends
  await setupClerkTestingToken({ page });
  await visit(page, "/");
  await expect(page.getByRole("banner").getByRole("button", { name: "Sign in" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
});

test("a signed-out Save opens the sign-in modal over Browse", async ({ page }) => {
  await signOutToBrowse(page);
  const url = page.url();
  await saveButton(page, first).click();
  await expect(signInModal(page)).toBeVisible();
  expect(page.url()).toBe(url);
});

test("signing in through that modal saves the film to this month, no second click", async ({ page }) => {
  await signOutToBrowse(page);
  await saveButton(page, first).click();
  await signInThroughModal(page);

  await expect(alreadySaved(page, first)).toBeVisible();
  await expect(notice(page)).toContainText(`Saved ${first}`);
  await expect(undoButton(page)).toBeVisible();
  await expectListCount(page, 1);
  await expect(page).not.toHaveURL(/[?&]save=/); // used once, not again on reload

  await visit(page, "/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(first)]);
});

test("signing in for a film already in this month's list saves no second copy", async ({ page }) => {
  await saveFromBrowse(page, [first]);
  await signOutToBrowse(page);
  await saveButton(page, first).click();
  await signInThroughModal(page);

  await expect(alreadySaved(page, first)).toBeVisible();
  await expect(notice(page)).toContainText(`${first} is already in this month’s list`);
  await expectListCount(page, 1);

  await visit(page, "/my-list");
  await expect(listRows(page)).toHaveText([new RegExp(first)]);
});

test("closing the modal saves nothing, even after a later sign-in", async ({ page }) => {
  await signOutToBrowse(page);
  await saveButton(page, first).click();
  await expect(signInModal(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(signInModal(page)).toHaveCount(0);
  await expect(saveButton(page, first)).toBeVisible();

  // Later, the visitor signs in from the masthead instead.
  await page.getByRole("banner").getByRole("button", { name: "Sign in" }).click();
  await signInThroughModal(page);

  await expectListCount(page, 0);
  await expect(saveButton(page, first)).toBeVisible();
  await expect(notice(page)).toHaveCount(0);
  await visit(page, "/my-list");
  await expect(listRows(page)).toHaveCount(0);
});

// A brand-new account has to finish onboarding (AGENTS.md → Product rules 9) before Browse lets it in, so the Film
// pressed before signing up has to come through /onboarding too. The account is made through the modal's own sign-up
// form, with a +clerk_test address (code 424242), and deleted afterwards through Clerk's Backend API.
test("signing up through that modal saves the film once onboarding is done", async ({ page }) => {
  const email = `bijou-signup-${Date.now()}+clerk_test@example.com`;
  try {
    await signOutToBrowse(page);
    await saveButton(page, first).click();
    const modal = page.getByRole("dialog");
    await modal.getByRole("link", { name: "Sign up" }).click();
    await modal.getByLabel("Email address").fill(email);
    await modal.getByLabel("Password", { exact: true }).fill(`Bj-${crypto.randomUUID()}`);
    await modal.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(modal.getByRole("heading", { name: "Verify your email" })).toBeVisible();
    await modal.getByRole("textbox", { name: "Enter verification code" }).pressSequentially("424242");

    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByLabel("What should we call you?").fill("New Bijou");
    await page.getByRole("checkbox", { name: "Action", exact: true }).check();
    await page.getByRole("button", { name: "Start browsing" }).click();

    await expect(page.getByText("Welcome, New Bijou!")).toBeVisible();
    await expect(alreadySaved(page, first)).toBeVisible();
    await expect(notice(page)).toContainText(`Saved ${first}`);
    await expectListCount(page, 1);
    await expect(page).not.toHaveURL(/[?&]save=/);
  } finally {
    await clearThisMonth(page).catch(() => {}); // the new account's Entries, through the app: no webhook removes them
    await deleteClerkUser(email);
  }
});
