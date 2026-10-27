import { expect, test, type Page } from "@playwright/test";
import { signIn, skipWithoutTestUsers, USER_A, USER_B } from "./signed-in";

test.beforeEach(skipWithoutTestUsers);

async function choose(page: Page, name: string, genre: string) {
  await page.goto("/preferences");
  await page.getByLabel("What should we call you?").fill(name);
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.uncheck();
  await page.getByRole("checkbox", { name: genre, exact: true }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Preferences saved." })).toBeVisible();
}

test("name and favorite genres persist, update the greeting, and remain private to each account", async ({ page, browser }) => {
  await signIn(page, USER_A!);
  await choose(page, "Ellie’s cinema", "Mystery");
  await page.reload();
  await expect(page.getByLabel("What should we call you?")).toHaveValue("Ellie’s cinema");
  await expect(page.getByRole("checkbox", { name: "Mystery", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(1);
  await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "Browse", exact: true }).click();
  await expect(page.getByText("Welcome, Ellie’s cinema!", { exact: true })).toBeVisible();
  await page.goto("/onboarding");
  await expect(page).toHaveURL("/");

  const contextB = await browser.newContext();
  try {
    const pageB = await contextB.newPage();
    await signIn(pageB, USER_B!);
    await choose(pageB, "B’s screening room", "Comedy");
    await page.goto("/preferences");
    await expect(page.getByLabel("What should we call you?")).toHaveValue("Ellie’s cinema");
    await expect(page.getByRole("checkbox", { name: "Mystery", exact: true })).toBeChecked();
    await pageB.reload();
    await expect(pageB.getByLabel("What should we call you?")).toHaveValue("B’s screening room");
    await expect(pageB.getByRole("checkbox", { name: "Comedy", exact: true })).toBeChecked();
  } finally { await contextB.close(); }
});

test("at least one genre is required and invalid answers do not overwrite the saved preferences", async ({ page }) => {
  await signIn(page, USER_A!);
  await choose(page, "Bijou A", "Action");
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.uncheck();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Choose at least one" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Action", exact: true })).toBeChecked();
  await page.getByLabel("What should we call you?").fill("   ");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Enter a name" })).toBeVisible();
});
