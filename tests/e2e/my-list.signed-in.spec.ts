// My List for this month (#8), as test user A on TMDB fixtures: the Watched toggle moves a film between Not watched
// yet and Watched, Remove takes it off this month's list, and every change shows at once with a 3-second Undo that
// writes the previous state back exactly (AGENTS.md → Product rules 6). Desktop only, one test at a time: the tests
// share the user, whose current-month Entries are cleared before each one.
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  andWaitForServer, clearThisMonth, entry, errorToast, expectListCount, expectTotals, listRows, notice, removeButton,
  saveButton, saveFromBrowse, sectionRows, signIn, skipWithoutTestUsers, undoButton, USER_A, watchedSwitch, visit,
  reload,
} from "./signed-in";
import { expectFitsWidth, PHONE_WIDTHS } from "./checks";
import { nowPlaying } from "./tmdb-fixtures";

test.describe.configure({ mode: "serial" });

// The three films with a saved TMDB snapshot: Clayface (109 min), Street Fighter (120 min), Resident Evil (95 min).
const [first, , third, fourth] = nowPlaying(1).results.map((m) => m.title);

// An Entry's dates as the page states them, in full: <time datetime="…"> for Added and, once Watched, Watched. Waits
// for the Entry first: straight after a reload the list may still be streaming in.
async function dates(page: Page, title: string) {
  await expect(entry(page, title)).toBeVisible();
  return entry(page, title).locator("time").evaluateAll((ts) => ts.map((t) => t.getAttribute("datetime")));
}

test.beforeEach(async ({ page }) => {
  skipWithoutTestUsers();
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await signIn(page, USER_A!);
  await clearThisMonth(page);
});

test("marking Watched moves a film to Watched and updates the totals; unmarking moves it back", async ({ page }) => {
  await saveFromBrowse(page, [first, third]);
  await visit(page, "/my-list");
  await expectTotals(page, "2 films · 0 watched · 3h 49m to go");
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first), new RegExp(third)]);
  await expect(sectionRows(page, "Watched")).toHaveCount(0);

  await andWaitForServer(page, () => watchedSwitch(page, first).click());
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(third)]);
  await expect(sectionRows(page, "Watched")).toHaveText([new RegExp(first)]);
  await expect(watchedSwitch(page, first)).toHaveAttribute("aria-checked", "true");
  await expectTotals(page, "2 films · 1 watched · 2h 0m to go");

  await reload(page);
  await expect(sectionRows(page, "Watched")).toHaveText([new RegExp(first)]);
  await expectTotals(page, "2 films · 1 watched · 2h 0m to go");

  await watchedSwitch(page, first).click();
  await expect(sectionRows(page, "Watched")).toHaveCount(0);
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first), new RegExp(third)]);
  await expectTotals(page, "2 films · 0 watched · 3h 49m to go");
});

test("Remove takes a film off this month's list, and Browse shows it as Save again", async ({ page }) => {
  await saveFromBrowse(page, [first, third]);
  await visit(page, "/my-list");
  await andWaitForServer(page, () => removeButton(page, first).click());
  await expect(listRows(page)).toHaveText([new RegExp(third)]);
  await expect(notice(page)).toContainText(`Removed ${first}`);
  await expectTotals(page, "1 film · 0 watched · 2h 0m to go");
  await expectListCount(page, 1);

  await visit(page, "/");
  await expect(saveButton(page, first)).toBeVisible();
});

test("Undo of Remove puts back the very same Entry, with its added and watched dates", async ({ page }) => {
  await saveFromBrowse(page, [first, third]);
  await visit(page, "/my-list");
  await andWaitForServer(page, () => watchedSwitch(page, first).click());
  await reload(page);
  const before = await dates(page, first);
  expect(before).toHaveLength(2); // added and watched

  await removeButton(page, first).click();
  await expect(entry(page, first)).toHaveCount(0);
  await expectListCount(page, 1);
  await andWaitForServer(page, () => undoButton(page).click());
  await expect(sectionRows(page, "Watched")).toHaveText([new RegExp(first)]);
  await expectListCount(page, 2);

  await reload(page);
  await expect(sectionRows(page, "Watched")).toHaveText([new RegExp(first)]);
  expect(await dates(page, first)).toEqual(before);
  await expectTotals(page, "2 films · 1 watched · 2h 0m to go");
});

test("Undo of a Watched change restores the previous watched date exactly", async ({ page }) => {
  await saveFromBrowse(page, [first]);
  await visit(page, "/my-list");

  // Mark, then Undo: Not watched yet again.
  await watchedSwitch(page, first).click();
  await expect(sectionRows(page, "Watched")).toHaveCount(1);
  await andWaitForServer(page, () => undoButton(page).click());
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first)]);
  await reload(page);
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first)]);
  await expect(watchedSwitch(page, first)).toHaveAttribute("aria-checked", "false");

  // Mark for real, then unmark, then Undo: Watched again, on the first date, not a new one.
  await andWaitForServer(page, () => watchedSwitch(page, first).click());
  await reload(page);
  const watched = await dates(page, first);
  expect(watched).toHaveLength(2);
  await watchedSwitch(page, first).click();
  await expect(sectionRows(page, "Not watched yet")).toHaveCount(1);
  await expectTotals(page, "1 film · 0 watched · 1h 49m to go");
  await andWaitForServer(page, () => undoButton(page).click());
  await expect(sectionRows(page, "Watched")).toHaveText([new RegExp(first)]);
  await expectTotals(page, "1 film · 1 watched · 0m to go");
  await reload(page);
  expect(await dates(page, first)).toEqual(watched);
});

test("a failed write leaves the list as the database has it, with an error toast", async ({ page }) => {
  await saveFromBrowse(page, [first, third]);
  await visit(page, "/my-list");
  // Server Actions are POSTs carrying a Next-Action header; failing them is a network that drops the write.
  await page.route("**/*", (route) =>
    route.request().method() === "POST" && route.request().headers()["next-action"] ? route.abort() : route.fallback(),
  );

  await watchedSwitch(page, first).click();
  await expect(errorToast(page)).toContainText(`Couldn’t mark ${first} Watched`);
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first), new RegExp(third)]);
  await expect(watchedSwitch(page, first)).toHaveAttribute("aria-checked", "false");
  await expectTotals(page, "2 films · 0 watched · 3h 49m to go");
  await expect(undoButton(page)).toHaveCount(0);

  await removeButton(page, third).click();
  await expect(errorToast(page)).toContainText(`Couldn’t remove ${third}`);
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first), new RegExp(third)]);
  await expectListCount(page, 2);

  await page.unrouteAll({ behavior: "ignoreErrors" });
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await reload(page);
  await expect(sectionRows(page, "Not watched yet")).toHaveText([new RegExp(first), new RegExp(third)]);
  await expect(sectionRows(page, "Watched")).toHaveCount(0);
});

test("cards or rows, and the sort, are remembered on the device", async ({ page }) => {
  await saveFromBrowse(page, [first, third, fourth]);
  await visit(page, "/my-list");
  const view = (name: "Cards" | "Rows") => page.getByRole("radio", { name });
  const sort = page.getByRole("combobox", { name: "Sort by" });
  const titles = (...t: string[]) => t.map((x) => new RegExp(x));

  // By default: cards, by date added, oldest first.
  await expect(view("Cards")).toBeChecked();
  await expect(sort).toHaveValue("added");
  await expect(listRows(page)).toHaveText(titles(first, third, fourth));
  await expect(listRows(page).getByRole("article")).toHaveCount(3);

  await page.getByText("Rows", { exact: true }).click(); // the label: Pulp's box sits over the radio itself
  await sort.selectOption({ label: "Title" });
  await expect(listRows(page).getByRole("article")).toHaveCount(0);
  await expect(listRows(page)).toHaveText(titles(first, fourth, third)); // Clayface, Resident Evil, Street Fighter

  await sort.selectOption({ label: "Runtime" });
  await expect(listRows(page)).toHaveText(titles(fourth, first, third)); // 95, 109, 120 minutes

  await reload(page);
  await expect(view("Rows")).toBeChecked();
  await expect(sort).toHaveValue("runtime");
  await expect(listRows(page)).toHaveText(titles(fourth, first, third));
  await expect(listRows(page).getByRole("article")).toHaveCount(0);
  await expect(watchedSwitch(page, first)).toBeVisible(); // rows keep the Watched toggle and Remove
  await expect(removeButton(page, first)).toBeVisible();
});

test("an empty month shows the Pulp empty state, with the way back to Browse", async ({ page }) => {
  await visit(page, "/my-list");
  await expectTotals(page, "0 films · 0 watched · 0m to go");
  await expect(page.getByText("Nothing saved yet!")).toBeVisible();
  for (const width of PHONE_WIDTHS) {
    await expectFitsWidth(page, width, "My List, empty");
    expect(await totalsLineBreaks(page), `the totals at ${width}px`).toEqual([]);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole("main").getByRole("link", { name: "Browse films" }).click();
  await expect(page).toHaveURL("/");
});

// The totals line ("OCTOBER 2026 · 2 films · 1 watched · 2h 0m to go") wraps only at its dots: the parts it splits
// inside, if any.
async function totalsLineBreaks(page: Page) {
  return page.getByRole("main").getByText(/^[A-Z]+ \d{4} · \d+ films? · /).evaluate((p) => {
    const chars: { ch: string; top: number }[] = [];
    const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode())
      for (let i = 0; i < n.textContent!.length; i++) {
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        chars.push({ ch: n.textContent![i], top: Math.round(r.getBoundingClientRect().top) });
      }
    const parts: { text: string; tops: Set<number> }[] = [{ text: "", tops: new Set() }];
    for (const { ch, top } of chars) {
      if (ch === "·") parts.push({ text: "", tops: new Set() });
      else if (ch.trim()) {
        parts.at(-1)!.text += ch;
        parts.at(-1)!.tops.add(top);
      } else parts.at(-1)!.text += " ";
    }
    return parts.filter((part) => part.tops.size > 1).map((part) => part.text.trim());
  });
}

// Phone layouts, as tests/e2e/layout.spec.ts checks the signed-out pages: nothing scrolls sideways and nothing runs into
// anything else, in both views, from the smallest phones up. Signed in, so it runs here on the desktop project.
test("on phones My List keeps to the screen, and each film's title, toggle and Remove apart", async ({ page }) => {
  await saveFromBrowse(page, [first, third]);
  await visit(page, "/my-list");
  await andWaitForServer(page, () => watchedSwitch(page, first).click());
  const box = async (l: Locator) => (await l.boundingBox())!;
  const apart = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
    a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y;

  for (const view of ["Cards", "Rows"]) {
    await page.getByText(view, { exact: true }).click();
    for (const width of PHONE_WIDTHS) {
      await expectFitsWidth(page, width, `My List in ${view}`);
      expect(await totalsLineBreaks(page), `the totals at ${width}px`).toEqual([]);
      for (const part of [page.getByRole("link", { name: "The Bijou" }), page.getByRole("heading", { level: 1 })]) {
        const b = await box(part);
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width).toBeLessThanOrEqual(width);
      }
      for (const title of [first, third]) {
        const parts = [entry(page, title).getByRole("heading"), watchedSwitch(page, title), removeButton(page, title)];
        const [heading, toggle, remove] = await Promise.all(parts.map(box));
        for (const b of [heading, toggle, remove]) expect(b.x + b.width, `${title} in ${view} at ${width}px`).toBeLessThanOrEqual(width);
        expect(apart(heading, toggle) && apart(heading, remove) && apart(toggle, remove), `${title} in ${view} at ${width}px`).toBe(true);
      }
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  }
});
