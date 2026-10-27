// History's pure rules (AGENTS.md → Routes and URL state, Queries the app needs): the URL state, read leniently.
import type { SearchParams } from "./browse";

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export type HistoryState = { month: string | null; q: string | null };

// `?month=YYYY-MM` narrows to one past month (as the date on its first day, "2026-09-01"). Anything else, this month
// or a later one included, is ignored rather than an error, so a mistyped or stale link still shows History.
export function parseHistoryParams(sp: SearchParams, current: string): HistoryState {
  const m = first(sp.month)?.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const month = m && `${m[1]}-${m[2]}-01` < current ? `${m[1]}-${m[2]}-01` : null;
  return { month, q: first(sp.q)?.trim() || null };
}

// The ilike pattern for a title search: the words anywhere in the title, with LIKE's own characters (%, _ and the
// escape \) taken literally, so "100%" finds "100%" and not everything starting "100". PostgREST reads * as % and
// can't escape it, so a * matches any one character instead.
export const titlePattern = (q: string) => `%${q.replace(/[\\%_]/g, "\\$&").replaceAll("*", "_")}%`;

export type MonthTotals = { month: string; planned: number; watched: number };

// Each past month once, newest first, with its planned (every Entry) and watched counts, from rows of
// { month, watched_at } in any order.
export function monthTotals(rows: { month: string; watched_at: string | null }[]): MonthTotals[] {
  const by = new Map<string, MonthTotals>();
  for (const r of rows) {
    const t = by.get(r.month) ?? { month: r.month, planned: 0, watched: 0 };
    t.planned++;
    if (r.watched_at !== null) t.watched++;
    by.set(r.month, t);
  }
  return [...by.values()].sort((a, b) => b.month.localeCompare(a.month));
}
