// Search on TMDB fixtures: all of TMDB by title, kept in the URL, with Clear search back to the feed.
import { expect, test, type Page } from "@playwright/test";
import { searchFixture } from "./tmdb-fixtures";

const films = (page: Page) => page.getByRole("list", { name: "Films" }).getByRole("listitem");
const titles = (page: Page) => films(page).getByRole("heading");
const searchBox = (page: Page) => page.getByRole("searchbox", { name: "Search films" });
const feeds = (page: Page) => page.getByRole("navigation", { name: "Feeds" });
const genres = (page: Page) => page.getByRole("group", { name: "Filter by genre" });

test.beforeEach(async ({ page }) => {
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
});

test("searching shows matches from all of TMDB, with the feed tabs and genre chips hidden", async ({ page }) => {
  await page.goto("/?feed=top-rated&genre=878");
  await searchBox(page).fill("alien");
  await searchBox(page).press("Enter");
  await expect(page).toHaveURL(/[?&]q=alien/);
  await expect(titles(page).first()).toHaveText(searchFixture("alien")[0].title);
  await expect(films(page)).toHaveCount(20);
  await expect(feeds(page)).toBeHidden();
  await expect(genres(page)).toBeHidden();
});

test("Load more adds the next 20 matches", async ({ page }) => {
  await page.goto("/?q=alien");
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(films(page)).toHaveCount(40);
  await expect(titles(page).nth(20)).toHaveText(searchFixture("alien", 2)[0].title);
});

test("the search survives a refresh", async ({ page }) => {
  await page.goto("/?q=alien");
  await page.reload();
  await expect(searchBox(page)).toHaveValue("alien");
  await expect(titles(page).first()).toHaveText(searchFixture("alien")[0].title);
});

test("Clear search goes back to the feed and genre the visitor was on", async ({ page }) => {
  await page.goto("/?feed=top-rated&genre=878");
  await searchBox(page).fill("alien");
  await searchBox(page).press("Enter");
  await expect(feeds(page)).toBeHidden();

  await page.getByRole("link", { name: "Clear search" }).click();
  await expect(page).toHaveURL("/?feed=top-rated&genre=878");
  await expect(feeds(page).getByRole("link", { name: "Top Rated" })).toHaveAttribute("aria-current", "page");
  await expect(genres(page).getByRole("link", { name: "Science Fiction", exact: true })).toHaveAttribute("aria-current", "true");
  await expect(searchBox(page)).toHaveValue("");
});

test("an empty search is ignored", async ({ page }) => {
  await page.goto("/?q=%20%20");
  await expect(feeds(page).getByRole("link", { name: "Now Playing" })).toHaveAttribute("aria-current", "page");
  await expect(genres(page)).toBeVisible();
  await expect(films(page)).toHaveCount(20);
});

test("a search with no matches says so, with a way back", async ({ page }) => {
  await page.goto("/?q=zqxjvwk");
  await expect(page.getByText("No films here!")).toBeVisible();
  await expect(page.getByText("Nothing on TMDB matches “zqxjvwk”.")).toBeVisible();
  await page.getByRole("main").getByRole("link", { name: "Clear search" }).first().click();
  await expect(page).toHaveURL("/");
  await expect(films(page)).toHaveCount(20);
});
