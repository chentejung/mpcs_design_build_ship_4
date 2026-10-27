// What a signed-out visitor sees of accounts: Sign in in the masthead, no My List, and no way into it.
import { expect, test } from "@playwright/test";

test("the masthead offers Browse and Sign in, but no My List", async ({ page }) => {
  await page.goto("/");
  const site = page.getByRole("navigation", { name: "Site" });
  await expect(site.getByRole("link", { name: "Browse" })).toHaveAttribute("aria-current", "page");
  await expect(site.getByRole("link", { name: /My List/ })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("button", { name: "Sign in" })).toBeVisible();
});

for (const path of ["/my-list", "/my-list/history"]) {
  test(`opening ${path} signed out leads to sign-in, never to the page`, async ({ page }) => {
    const pageRequests: number[] = [];
    page.on("response", (r) => { if (new URL(r.url()).pathname === path) pageRequests.push(r.status()); });
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in/);
    expect(pageRequests.every((s) => s >= 300 && s < 400), `${path} answered ${pageRequests}`).toBe(true);
    await expect(page.getByRole("heading", { name: /My List|History/ })).toHaveCount(0);
  });
}
