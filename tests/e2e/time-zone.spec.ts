// The browser tells the server its time zone, so "this month" follows the visitor's own midnight.
import { expect, test } from "@playwright/test";

test.use({ timezoneId: "Asia/Tokyo" });

test("the first visit stores the browser's time zone in the tz cookie", async ({ page, context }) => {
  await page.goto("/");
  await expect.poll(async () => (await context.cookies()).find((c) => c.name === "tz")?.value).toBe("Asia/Tokyo");
});
