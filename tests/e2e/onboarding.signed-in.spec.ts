import { randomUUID } from "node:crypto";
import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { skipWithoutTestUsers } from "./signed-in";

test("a fresh signup must save both answers before entering signed-in pages", async ({ page }, testInfo) => {
  skipWithoutTestUsers();
  test.setTimeout(90_000);
  // Clerk test addresses receive no mail. Keep the test identity in the report for development-account cleanup.
  const email = `bijou-onboarding-${randomUUID()}+clerk_test@example.com`;
  await testInfo.attach("signup-test-email", { body: email, contentType: "text/plain" });
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
});
