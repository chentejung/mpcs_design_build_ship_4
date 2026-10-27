// Browse on TMDB fixtures: feeds, genre chips, Load more, URL state and the empty and failure states.
import { copyFileSync, rmSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { FIXTURES, nowPlaying, topRated } from "./tmdb-fixtures";

const films = (page: Page) => page.getByRole("list", { name: "Films" }).getByRole("listitem");
const titles = (page: Page) => films(page).getByRole("heading");
const feedTab = (page: Page, name: string) => page.getByRole("navigation", { name: "Feeds" }).getByRole("link", { name });
const genreChip = (page: Page, name: string) => page.getByRole("group", { name: "Filter by genre" }).getByRole("link", { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
});

test("Browse opens on Now Playing, 20 films at a time, most popular first", async ({ page }) => {
  await page.goto("/");
  await expect(feedTab(page, "Now Playing")).toHaveAttribute("aria-current", "page");
  await expect(genreChip(page, "All")).toHaveAttribute("aria-current", "true");
  await expect(films(page)).toHaveCount(20);
  await expect(titles(page).first()).toHaveText(nowPlaying(1).results[0].title);
});

test("Top Rated is one tab away, and stays chosen after a refresh", async ({ page }) => {
  await page.goto("/");
  await feedTab(page, "Top Rated").click();
  await expect(page).toHaveURL("/?feed=top-rated");
  await expect(feedTab(page, "Top Rated")).toHaveAttribute("aria-current", "page");
  const first = topRated(1).results[0].title;
  await expect(titles(page).first()).toHaveText(first);

  await page.reload();
  await expect(feedTab(page, "Top Rated")).toHaveAttribute("aria-current", "page");
  await expect(titles(page).first()).toHaveText(first);
});

test("a genre chip narrows the whole feed, and Load more keeps the genre", async ({ page }) => {
  await page.goto("/?feed=top-rated");
  await genreChip(page, "Science Fiction").click();
  await expect(page).toHaveURL("/?feed=top-rated&genre=878");
  await expect(genreChip(page, "Science Fiction")).toHaveAttribute("aria-current", "true");
  await expect(films(page)).toHaveCount(20);
  await expect(films(page)).toContainText(Array(20).fill("Science Fiction"));

  await page.getByRole("button", { name: "Load more" }).click();
  await expect(films(page)).toHaveCount(40);
  await expect(titles(page).nth(20)).toHaveText(topRated(2, "with_genres=878").results[0].title);
  await expect(films(page)).toContainText(Array(40).fill("Science Fiction"));
});

test("Load more adds the next 20 of Now Playing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(films(page)).toHaveCount(40);
  await expect(page.getByText("Showing 40 films")).toBeVisible();
});

test("a card shows the original-language title when it differs", async ({ page }) => {
  await page.goto("/?feed=top-rated");
  const film = topRated(1).results.find((m) => m.original_title !== m.title)!;
  const card = films(page).filter({ has: page.getByRole("heading", { name: film.title, exact: true }) });
  await expect(card.getByText(film.original_title, { exact: true })).toBeVisible();
});

test("synopses can be hidden and shown again", async ({ page }) => {
  await page.goto("/");
  const synopsis = page.getByText(nowPlaying(1).results[0].overview);
  const toggle = page.getByRole("switch", { name: "Show synopses" });
  await expect(synopsis).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(synopsis).toBeHidden();
  await toggle.click();
  await expect(synopsis).toBeVisible();
});

test("invalid feed and genre values fall back to the defaults", async ({ page }) => {
  const response = await page.goto("/?feed=upcoming&genre=action");
  expect(response?.status()).toBe(200);
  await expect(feedTab(page, "Now Playing")).toHaveAttribute("aria-current", "page");
  await expect(genreChip(page, "All")).toHaveAttribute("aria-current", "true");
  await expect(titles(page).first()).toHaveText(nowPlaying(1).results[0].title);
});

test("a genre with no films says so, with a way back to every genre", async ({ page }) => {
  await page.goto("/?feed=top-rated&genre=10770"); // Top Rated leaves TV movies out
  await expect(page.getByText("No films here!")).toBeVisible();
  await page.getByRole("link", { name: "Show every genre" }).click();
  await expect(page).toHaveURL("/?feed=top-rated");
  await expect(films(page)).toHaveCount(20);
});

test("the TMDB token never reaches the browser", async ({ page, request }) => {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  test.skip(!token, "needs TMDB_READ_ACCESS_TOKEN in .env.local");
  const urls: string[] = [];
  page.on("request", (r) => urls.push(r.url()));

  await page.goto("/");
  await page.getByRole("button", { name: "Load more" }).click();
  await expect(films(page)).toHaveCount(40);

  expect(urls.filter((u) => new URL(u).hostname === "api.themoviedb.org")).toEqual([]);
  const scripts = urls.filter((u) => u.endsWith(".js"));
  expect(scripts.length).toBeGreaterThan(0);
  for (const url of [page.url(), ...scripts]) expect(await (await request.get(url)).text(), url).not.toContain(token);
  for (const header of Object.values((await request.get("/")).headers())) expect(header).not.toContain(token);
});

test.describe("when TMDB fails", () => {
  // The test saves a fixture mid-run, so it runs once, on desktop, where no other test reads it.
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "writes a fixture"));

  test("the projector jams, and Retry shows the films once TMDB answers", async ({ page }) => {
    const action = nowPlaying(1, "with_genres=28").name;
    const war = path.join(FIXTURES, action.replace("with_genres=28", "with_genres=10752")); // no saved answer: TMDB fails
    try {
      await page.goto("/?genre=10752");
      await expect(page.getByText("The projector jammed!")).toBeVisible();

      copyFileSync(path.join(FIXTURES, action), war);
      await page.getByRole("button", { name: "Retry" }).click();
      await expect(films(page).first()).toBeVisible();
      await expect(page.getByText("The projector jammed!")).toBeHidden();
    } finally {
      rmSync(war, { force: true });
    }
  });
});
