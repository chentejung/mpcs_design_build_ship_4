// What a signed-out visitor sees of accounts: Sign in in the masthead, no My List, and no way into it.
import { expect, test } from "@playwright/test";

test("the masthead offers Browse and Sign in, but no My List", async ({ page }) => {
  await page.goto("/");
  const site = page.getByRole("navigation", { name: "Site" });
  await expect(site.getByRole("link", { name: "Browse" })).toHaveAttribute("aria-current", "page");
  await expect(site.getByRole("link", { name: /My List/ })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("button", { name: "Sign in" })).toBeVisible();
});

for (const path of ["/my-list", "/my-list/history", "/onboarding", "/preferences"]) {
  test(`opening ${path} signed out leads to sign-in, never to the page`, async ({ page }) => {
    const pageRequests: number[] = [];
    page.on("response", (r) => { if (new URL(r.url()).pathname === path) pageRequests.push(r.status()); });
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in/);
    expect(pageRequests.every((s) => s >= 300 && s < 400), `${path} answered ${pageRequests}`).toBe(true);
    await expect(page.getByRole("heading", { name: /My List|History/ })).toHaveCount(0);
  });
}

// Signed out, the only key anyone has is the publishable one, which makes Supabase treat them as `anon`: no grants, so
// every read and write of an Entry is refused (AGENTS.md → Row-level security), not merely filtered to nothing.
test("signed out, the database refuses every read and write of an Entry", async ({ request }) => {
  const url = `${process.env.SUPABASE_URL}/rest/v1/movie_list_entries`;
  const headers = { apikey: process.env.SUPABASE_PUBLISHABLE_KEY!, "Content-Type": "application/json" };
  const entry = { month: "2026-10-01", tmdb_id: 603, title: "The Matrix" };
  const tries = [
    request.get(`${url}?select=*`, { headers }),
    request.post(url, { headers, data: entry }),
    request.patch(`${url}?tmdb_id=eq.603`, { headers, data: { watched_at: new Date().toISOString() } }),
    request.delete(`${url}?tmdb_id=eq.603`, { headers }),
  ];
  for (const res of await Promise.all(tries)) {
    expect(res.status(), await res.text()).toBe(401);
    expect((await res.json()).code).toBe("42501"); // permission denied for table movie_list_entries
  }
});
