// The one test against real TMDB: the app's own server, without fixtures, shows this week's films.
import { expect, test } from "@playwright/test";

test("Now Playing loads live from TMDB", async ({ page }) => {
  test.skip(!process.env.TMDB_READ_ACCESS_TOKEN, "needs TMDB_READ_ACCESS_TOKEN in .env.local");
  await page.goto("/");
  await expect(page.getByRole("list", { name: "Films" }).getByRole("listitem")).toHaveCount(20);
});
