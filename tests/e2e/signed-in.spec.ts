// Signed in as test user A (scripts/create-test-users.mjs): My List appears, the account menu has no deletion, and
// signing out takes My List away again. Desktop only, one test at a time: the tests share the user.
import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const openAccountMenu = async (page: Page) => {
  await page.getByRole("button", { name: /open user (button|menu)/i }).click();
  return page.getByRole("dialog", { name: "Account panel" });
};
const myListTab = (page: Page) => page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: /^My List/ });

test.beforeEach(async ({ page }) => {
  test.skip(!process.env.TEST_USER_A_EMAIL, "run scripts/create-test-users.mjs first");
  await setupClerkTestingToken({ page });
  await page.goto("/");
  // By email: a Backend API sign-in token, so Clerk's new-device check on password sign-ins doesn't stop the test.
  await clerk.signIn({ page, emailAddress: process.env.TEST_USER_A_EMAIL! });
  await page.waitForLoadState("networkidle"); // Clerk refreshes the page once the session is set
  await page.goto("/");
});

test("signed in, the tab bar shows My List for this month, and it opens", async ({ page }) => {
  await expect(page.getByRole("banner").getByRole("button", { name: "Sign in" })).toHaveCount(0);
  await expect(myListTab(page)).toHaveText(/^My List · [A-Z][a-z]{2} \(\d+\)$/);
  await myListTab(page).click();
  await expect(page).toHaveURL("/my-list");
  await expect(myListTab(page)).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1, name: "My List" })).toBeVisible();
});

test("History opens for a signed-in user", async ({ page }) => {
  await page.goto("/my-list/history");
  await expect(page.getByRole("heading", { level: 1, name: "History" })).toBeVisible();
});

test("the account menu offers no account deletion", async ({ page }) => {
  await (await openAccountMenu(page)).getByRole("button", { name: "Manage account" }).click();
  const profile = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Security" }) });
  await profile.getByRole("button", { name: "Security" }).click();
  await expect(profile.getByText(/password|active devices/i).first()).toBeVisible();
  await expect(profile.getByRole("button", { name: /delete account/i })).toHaveCount(0);
  await expect(profile.getByText(/delete account/i)).toHaveCount(0);
});

test("signing out takes My List away again", async ({ page }) => {
  await expect(myListTab(page)).toBeVisible();
  await (await openAccountMenu(page)).getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("banner").getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(myListTab(page)).toHaveCount(0);
});
