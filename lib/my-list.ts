// My List for this month (AGENTS.md → Product rules), kept pure so it can be tested on its own: the comic-issue
// header's totals, the changes the page makes optimistically and how each is taken back, and the view and sort the
// device remembers.
import type { Database } from "./database.types";
import { monthLong } from "./month";

// An Entry as the page holds it: its snapshot of the Film, when it was added, and when it was watched (null = Not
// watched yet). Timestamps are Postgres's own strings, so writing one back restores it exactly.
export type ListEntry = {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  originalLanguage: string | null;
  year: number | null;
  runtime: number | null; // minutes
  posterPath: string | null;
  genreIds: number[];
  overview: string | null;
  addedAt: string;
  watchedAt: string | null;
};

type Entry = Database["public"]["Tables"]["movie_list_entries"]["Row"];

export const toListEntry = (e: Entry): ListEntry => ({
  id: e.id,
  tmdbId: e.tmdb_id,
  title: e.title,
  originalTitle: e.original_title,
  originalLanguage: e.original_language,
  year: e.release_year,
  runtime: e.runtime,
  posterPath: e.poster_path,
  genreIds: e.genre_ids,
  overview: e.overview,
  addedAt: e.added_at,
  watchedAt: e.watched_at,
});

const duration = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`);

// "OCTOBER 2026 · 8 films · 3 watched · 11h 20m to go": the time to go is the runtime of the films not watched yet.
export function monthHeader(month: string, entries: ListEntry[]): string {
  const watched = entries.filter((e) => e.watchedAt !== null).length;
  const toGo = entries.reduce((sum, e) => sum + (e.watchedAt === null ? (e.runtime ?? 0) : 0), 0);
  const films = `${entries.length} ${entries.length === 1 ? "film" : "films"}`;
  return [monthLong(month).toUpperCase(), films, `${watched} watched`, `${duration(toGo)} to go`].join(" · ");
}

// A change the page shows at once, before the server has made it (and takes back if the write fails).
export type ListChange =
  | { kind: "watched"; id: string; watchedAt: string | null } // mark (a date) or unmark (null) Watched
  | { kind: "removed"; id: string }
  | { kind: "restored"; entry: ListEntry };

export function applyChange(list: ListEntry[], change: ListChange): ListEntry[] {
  switch (change.kind) {
    case "watched":
      return list.map((e) => (e.id === change.id ? { ...e, watchedAt: change.watchedAt } : e));
    case "removed":
      return list.filter((e) => e.id !== change.id);
    case "restored":
      return [...list.filter((e) => e.id !== change.entry.id), change.entry];
  }
}

// The change that takes `change` back, given the list as it was before: the previous watched date, or the removed
// Entry itself (AGENTS.md → Product rules 6).
export function undoOf(before: ListEntry[], change: ListChange): ListChange {
  const was = (id: string) => before.find((e) => e.id === id);
  switch (change.kind) {
    case "watched":
      return { kind: "watched", id: change.id, watchedAt: was(change.id)?.watchedAt ?? null };
    case "removed": {
      const entry = was(change.id);
      return entry ? { kind: "restored", entry } : change;
    }
    case "restored":
      return { kind: "removed", id: change.entry.id };
  }
}

// Cards or rows, and the order, remembered on the device (localStorage). Date added, oldest first, is the default.
export const VIEWS = [
  { id: "cards", label: "Cards" },
  { id: "rows", label: "Rows" },
] as const;
export const SORTS = [
  { id: "added", label: "Date added" },
  { id: "title", label: "Title" },
  { id: "year", label: "Year" },
  { id: "runtime", label: "Runtime" },
] as const;
export type View = (typeof VIEWS)[number]["id"];
export type Sort = (typeof SORTS)[number]["id"];
export type ListSettings = { view: View; sort: Sort };

export const SETTINGS_KEY = "bijou:my-list";
export const DEFAULT_SETTINGS: ListSettings = { view: "cards", sort: "added" };

const oneOf = <T extends string>(options: readonly { id: T }[], value: unknown, fallback: T): T =>
  options.find((o) => o.id === value)?.id ?? fallback;

// What localStorage holds, read back; anything unknown falls back to the default, part by part.
export function parseSettings(raw: string | null): ListSettings {
  let saved: unknown = null;
  try {
    saved = raw === null ? null : JSON.parse(raw);
  } catch {
    // not JSON: the default
  }
  const s = typeof saved === "object" && saved !== null ? (saved as Record<string, unknown>) : {};
  return { view: oneOf(VIEWS, s.view, DEFAULT_SETTINGS.view), sort: oneOf(SORTS, s.sort, DEFAULT_SETTINGS.sort) };
}

const byTitle = (a: ListEntry, b: ListEntry) => a.title.localeCompare(b.title, "en", { sensitivity: "base" });
const byAdded = (a: ListEntry, b: ListEntry) => a.addedAt.localeCompare(b.addedAt) || a.id.localeCompare(b.id);
const compare: Record<Sort, (a: ListEntry, b: ListEntry) => number> = {
  added: byAdded, // oldest first: the order they were saved
  title: (a, b) => byTitle(a, b) || byAdded(a, b), // A to Z
  year: (a, b) => (b.year ?? -Infinity) - (a.year ?? -Infinity) || byTitle(a, b) || byAdded(a, b), // newest first
  runtime: (a, b) => (a.runtime ?? Infinity) - (b.runtime ?? Infinity) || byTitle(a, b) || byAdded(a, b), // shortest first
};

export const sortEntries = (list: ListEntry[], sort: Sort) => [...list].sort(compare[sort]);
