// The Pulp shell every page sits in: masthead, hero, credits with TMDB's attribution, and the footer.
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Browse opens on The Bijou's masthead and hero", async ({ page }) => {
  await expect(page).toHaveTitle("The Bijou");
  await expect(page.getByRole("banner").getByRole("link", { name: "The Bijou" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Pick this month’s films." })).toBeVisible();
});

test("the credits name TMDB as the source of film data, with its required notice", async ({ page }) => {
  const credits = page.getByRole("region", { name: "Credits" });
  await expect(credits.getByRole("link", { name: "TMDB home" }).getByRole("img", { name: "TMDB" })).toBeVisible();
  await expect(credits).toContainText("This product uses the TMDB API but is not endorsed or certified by TMDB.");
});

test("the page closes on the footer", async ({ page }) => {
  await expect(page.getByRole("contentinfo")).toContainText("The Bijou · Design Build Ship, Week 4");
});
