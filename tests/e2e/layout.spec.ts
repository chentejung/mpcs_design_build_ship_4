// Phone layouts: nothing scrolls sideways and nothing runs into anything else, from the smallest phones up.
import { expect, test, type Locator, type Page } from "@playwright/test";

const pages = ["/", "/?feed=top-rated", "/?feed=top-rated&genre=10770", "/?q=alien", "/?q=zqxjvwk"];
const widths = [320, 360, 390];

// Viewport sizes are set per test, so run them once, on the phone project.
test.beforeEach(({}, info) => test.skip(info.project.name !== "phone", "phone layouts"));

const box = async (l: Locator) => (await l.boundingBox())!;
const apart = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;

async function open(page: Page, path: string, width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await page.goto(path, { waitUntil: "networkidle" });
}

for (const width of widths) {
  test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
    for (const path of pages) {
      await open(page, path, width);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `${path} is ${scrollWidth}px wide`).toBeLessThanOrEqual(width);
    }
  });

  test(`the masthead's brand and the hero heading stay in view at ${width}px`, async ({ page }) => {
    await open(page, "/", width);
    for (const part of [page.getByRole("link", { name: "The Bijou" }), page.getByRole("heading", { level: 1 })]) {
      const b = await box(part);
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width);
    }
  });
}

for (const width of widths) {
  test(`film cards keep title, synopsis and Save apart at ${width}px`, async ({ page }) => {
    await open(page, "/", width);
    for (const card of (await page.getByRole("list", { name: "Films" }).getByRole("listitem").all()).slice(0, 6)) {
      const title = await box(card.getByRole("heading"));
      const synopsis = await box(card.locator("p").last());
      const save = await box(card.getByRole("button"));
      expect(title.y + title.height).toBeLessThanOrEqual(synopsis.y);
      expect(synopsis.y + synopsis.height).toBeLessThanOrEqual(save.y);
      expect(apart(title, save)).toBe(true);
    }
  });
}

test("More genres reveals every illustrated genre on a phone without sideways scrolling", async ({ page }) => {
  await open(page, "/", 320);
  const chips = page.getByRole("group", { name: "Filter by genre" }).getByRole("link");
  await expect(page.getByRole("link", { name: "Western", exact: true })).toBeHidden();
  await page.getByText("More genres", { exact: false }).click();
  expect(await chips.count()).toBe(20); // All + TMDB's 19 genres
  for (const chip of await chips.all()) {
    await expect(chip).toBeVisible();
    await expect(chip.locator("svg.ds-genre-icon")).toHaveCount(1);
    const b = await box(chip);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(320);
  }
  await page.getByRole("link", { name: "Western", exact: true }).click();
  await expect(page.getByRole("link", { name: "Western", exact: true })).toHaveAttribute("aria-current", "true");
  await page.reload();
  await expect(page.getByRole("link", { name: "Western", exact: true })).toBeVisible();
});

test("the hero's screening lines appear only above phone width", async ({ page }) => {
  const eyebrow = page.getByText("Now showing · Every month");
  const kicker = page.getByText("Now playing! Top rated! All of TMDB!");

  await open(page, "/", 390);
  await expect(eyebrow).toBeHidden();
  await expect(kicker).toBeHidden();

  await open(page, "/", 640);
  await expect(eyebrow).toBeVisible();
  await expect(kicker).toBeVisible();
});
