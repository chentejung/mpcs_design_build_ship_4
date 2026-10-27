// Page-wide checks shared by the layout and accessibility specs, signed out and signed in (AGENTS.md → Testing):
// a page keeps to a phone's width with nothing running into anything else; every control can be reached by Tab,
// shows a focus ring and has a name; and axe finds nothing wrong with names, contrast or ARIA.
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const PHONE_WIDTHS = [320, 360, 390];

// Clerk's own widgets (its sign-in form and modal, and the account menu's internals) are Clerk's to lay out and make
// accessible.
const CLERK = ['[class*="cl-rootBox"]', '[class*="cl-modalBackdrop"]', '[class*="cl-userButtonPopoverCard"]'];

// At `width`: nothing scrolls sideways, and every visible control and heading sits inside the screen, clear of every
// other one (one inside another, like a heading in its link, is fine). The toasts float over the page by design;
// inside Clerk's own sign-in form (a password field holds its Show password button) only the fit is checked.
export async function expectFitsWidth(page: Page, width: number, label: string) {
  if (page.viewportSize()?.width !== width) await page.setViewportSize({ width, height: 800 });
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, `${label} at ${width}px is ${scrollWidth}px wide`).toBeLessThanOrEqual(width);

  const problems = await page.evaluate(([width, clerk]) => {
    const name = (el: Element) =>
      `<${el.tagName.toLowerCase()}> “${(el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40)}”`;
    const parts = [...document.querySelectorAll('a[href], button, select, input:not([type="radio"], [type="checkbox"]), [role="switch"], h1, h2, h3, .ds-box')]
      .filter((el) => !el.closest(".bijou-toasts") && el.checkVisibility({ visibilityProperty: true }))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 1 && r.height > 1);
    const found: string[] = [];
    for (const { el, r } of parts)
      if (r.left < -0.5 || r.right > width + 0.5) found.push(`${name(el)} runs off the screen (${Math.round(r.left)}–${Math.round(r.right)}px)`);
    for (let i = 0; i < parts.length; i++)
      for (let j = i + 1; j < parts.length; j++) {
        const [a, b] = [parts[i], parts[j]];
        if (a.el.contains(b.el) || b.el.contains(a.el) || (a.el.closest(clerk) && b.el.closest(clerk))) continue;
        const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (x > 1 && y > 1) found.push(`${name(a.el)} overlaps ${name(b.el)}`);
      }
    return found;
  }, [width, CLERK.join(", ")] as const);
  expect(problems, `${label} at ${width}px`).toEqual([]);
}

export async function expectNoAxeViolations(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).exclude(CLERK.join(", ")).analyze();
  const found = violations.map((v) => `${v.id} (${v.help}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(found, label).toEqual([]);
}

// Tabs through the whole page from the top. Every visible, enabled control must take focus (a radio group once, as
// Tab reaches only its checked radio), look different focused than not (its outline or box-shadow, or that of the
// box drawn beside a visually hidden input), and have an accessible name.
export async function expectKeyboardReachable(page: Page, label: string) {
  const controls = await page.evaluate(() => {
    const ring = (el: Element | null) => {
      if (!el) return "";
      const s = getComputedStyle(el);
      return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} | ${s.boxShadow}`;
    };
    const all = [...document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')].filter(
      (el) =>
        el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest("[inert], [hidden]") &&
        el.checkVisibility({ visibilityProperty: true }) && el.getClientRects().length > 0,
    );
    return all.map((el, i) => {
      el.dataset.kb = String(i);
      const radio = el instanceof HTMLInputElement && el.type === "radio" ? el.name : null;
      return { i, group: radio ? `radio:${radio}` : `#${i}`, unfocused: [ring(el), ring(el.nextElementSibling)] };
    });
  });

  // Start from the top of the page whatever was focused or clicked last: from a mark first in the body, out of the
  // Tab order itself.
  await page.evaluate(() => {
    const start = document.createElement("span");
    start.tabIndex = -1;
    document.body.prepend(start);
    start.focus();
    start.addEventListener("blur", () => start.remove(), { once: true });
  });
  const reached = new Map<number, string[]>();
  const strays: string[] = [];
  for (let presses = 0; presses < controls.length + 20; presses++) {
    await page.keyboard.press("Tab");
    const at = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const ring = (e: Element | null) => {
        if (!e) return "";
        const s = getComputedStyle(e);
        return `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor} | ${s.boxShadow}`;
      };
      return { kb: el.dataset.kb ?? null, what: el.outerHTML.slice(0, 120), focused: [ring(el), ring(el.nextElementSibling)] };
    });
    if (!at) {
      if (reached.size) break; // past the last control, focus leaves the page
      continue;
    }
    if (at.kb === null) {
      strays.push(at.what);
      continue;
    }
    const i = Number(at.kb);
    if (reached.has(i)) break; // round to the start again
    reached.set(i, at.focused);
  }

  const groupsReached = new Set([...reached.keys()].map((i) => controls[i].group));
  const missed = controls.filter((c) => !groupsReached.has(c.group));
  const describe = (i: number) => page.locator(`[data-kb="${i}"]`).evaluate((el) => el.outerHTML.slice(0, 120));
  expect(await Promise.all(missed.map((c) => describe(c.i))), `${label}: controls Tab never reaches`).toEqual([]);
  expect(strays, `${label}: Tab stops on something that isn't a control`).toEqual([]);

  const noRing = [...reached].filter(([i, focused]) => focused.every((r, k) => r === controls[i].unfocused[k]));
  expect(await Promise.all(noRing.map(([i]) => describe(i))), `${label}: controls with no visible focus ring`).toEqual([]);

  for (const i of reached.keys()) await expect(page.locator(`[data-kb="${i}"]`), `${label}: control ${await describe(i)}`).toHaveAccessibleName(/\S/);
}

export async function expectAccessible(page: Page, label: string) {
  await expectKeyboardReachable(page, label);
  await expectNoAxeViolations(page, label);
}
