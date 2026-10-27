import { randomUUID } from "node:crypto";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteClerkUser, expectWarningUnder, skipWithoutTestUsers } from "./signed-in";

test("a fresh signup must save both answers before entering signed-in pages", async ({ page }, testInfo) => {
  skipWithoutTestUsers();
  test.setTimeout(90_000);
  // Clerk test addresses receive no mail. Keep the test identity in the report for development-account cleanup.
  const email = `bijou-onboarding-${randomUUID()}+clerk_test@example.com`;
  await testInfo.attach("signup-test-email", { body: email, contentType: "text/plain" });
  try {
    await setupClerkTestingToken({ page });
    await page.goto("/sign-up");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(`Bijou!${randomUUID()}`);
    // Clerk renders the code input before its asynchronous preparation finishes.
    const verificationReady = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith("/prepare_verification") && response.request().method() === "POST");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    expect((await verificationReady).ok()).toBe(true);
    await page.getByRole("textbox", { name: /verification code/i }).fill("424242");
    await expect(page).toHaveURL("/onboarding", { timeout: 20_000 });
    for (const path of ["/", "/my-list", "/my-list/history", "/preferences"]) {
      await page.goto(path);
      await expect(page).toHaveURL("/onboarding");
    }
    await page.getByLabel("What should we call you?").fill("   ");
    await page.getByRole("button", { name: "Start browsing" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Enter a name" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "Choose at least one" })).toBeVisible();
    await page.getByLabel("What should we call you?").fill("New Bijou visitor");
    await page.getByRole("checkbox", { name: "Mystery", exact: true }).check();
    await page.getByRole("button", { name: "Start browsing" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText("Welcome, New Bijou visitor!", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText("Welcome, New Bijou visitor!", { exact: true })).toBeVisible();
    await page.goto("/preferences");
    await expect(page.getByLabel("What should we call you?")).toHaveValue("New Bijou visitor");
    await expect(page.getByRole("checkbox", { name: "Mystery", exact: true })).toBeChecked();
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/");
  } finally {
    await deleteClerkUser(email);
  }
});

// Signs a brand-new +clerk_test account up on /sign-up and returns on /onboarding.
async function signUpFresh(page: Page) {
  const email = `bijou-onboarding-${randomUUID()}+clerk_test@example.com`;
  await setupClerkTestingToken({ page });
  await page.goto("/sign-up");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(`Bijou!${randomUUID()}`);
  const verificationReady = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith("/prepare_verification") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  expect((await verificationReady).ok()).toBe(true);
  await page.getByRole("textbox", { name: /verification code/i }).fill("424242");
  await expect(page).toHaveURL("/onboarding", { timeout: 20_000 });
  return email;
}

test("onboarding locks the site until it is saved, numbers its steps, and warns under an empty field", async ({ page }) => {
  skipWithoutTestUsers();
  test.setTimeout(90_000);
  const email = await signUpFresh(page);
  try {
    const site = page.getByRole("navigation", { name: "Site" });

    // The masthead can't be used to leave: no links in the tab bar, the logo isn't a link, the account menu stays.
    await expect(site.getByRole("link")).toHaveCount(0);
    for (const name of ["Browse", /^My List/, "Preferences"]) await expect(site.getByText(name)).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("banner").getByRole("link", { name: "The Bijou" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open user menu" })).toBeVisible();
    await site.getByText("Browse").click({ force: true });
    await expect(page).toHaveURL("/onboarding");

    // Two numbered steps.
    await expect(page.getByText("Step 1 of 2")).toBeVisible();
    await expect(page.getByText("Step 2 of 2")).toBeVisible();

    // No warnings until a field is touched; then the rule, under the field, in bold red, until it is filled.
    const name = page.getByLabel("What should we call you?");
    const nameRule = page.getByRole("alert").filter({ hasText: "Enter a name" });
    const genreRule = page.getByRole("alert").filter({ hasText: "Choose at least one" });
    await expect(nameRule).toHaveCount(0);
    await expect(genreRule).toHaveCount(0);
    await name.focus();
    await page.keyboard.press("Tab");
    await expectWarningUnder(name, nameRule);
    await name.fill("Locked Out");
    await expect(nameRule).toHaveCount(0);
    const mystery = page.getByRole("checkbox", { name: "Mystery", exact: true });
    await mystery.check();
    await mystery.uncheck();
    await expectWarningUnder(page.getByRole("group", { name: /What kinds of films do you like/ }).getByRole("checkbox").last(), genreRule);
    await mystery.check();
    await expect(genreRule).toHaveCount(0);

    // Submitting with a field empty shows its rule too, and stays.
    await name.fill("");
    await page.getByRole("button", { name: "Start browsing" }).click();
    await expectWarningUnder(name, nameRule);
    await expect(page).toHaveURL("/onboarding");

    // Saved: the landing page, with the tab bar working again.
    await name.fill("Locked Out");
    await page.getByRole("button", { name: "Start browsing" }).click();
    await expect(page).toHaveURL("/");
    await expect(site.getByRole("link", { name: "Browse", exact: true })).toBeVisible();
    await expect(site.getByRole("link", { name: /^My List/ })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "The Bijou" })).toBeVisible();
  } finally {
    await deleteClerkUser(email);
  }
});
