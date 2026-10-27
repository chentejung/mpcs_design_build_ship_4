// Phone layouts: nothing scrolls sideways and nothing runs into anything else, from the smallest phones up.
import { expect, test, type Locator, type Page } from "@playwright/test";

const pages = ["/"];
const widths = [320, 360, 390];

// Viewport sizes are set per test, so run them once, on the phone project.
test.beforeEach(({}, info) => test.skip(info.project.name !== "phone", "phone layouts"));

const box = async (l: Locator) => (await l.boundingBox())!;

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
