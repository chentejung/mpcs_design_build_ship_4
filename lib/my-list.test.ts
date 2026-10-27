import { describe, expect, it } from "vitest";
import { applyChange, DEFAULT_SETTINGS, monthHeader, parseSettings, undoOf, type ListEntry } from "./my-list";

const entry = (id: string, runtime: number | null, watchedAt: string | null = null): ListEntry => ({
  id,
  tmdbId: Number(id.replace(/\D/g, "")) || 1,
  title: `Film ${id}`,
  originalTitle: null,
  originalLanguage: null,
  year: 2026,
  runtime,
  posterPath: null,
  genreIds: [],
  overview: null,
  addedAt: `2026-10-0${id.length}T10:00:00+00:00`,
  watchedAt,
});

describe("the month header", () => {
  it("counts the films, the watched ones, and the runtime still to watch", () => {
    const watched = "2026-10-20T21:00:00+00:00";
    const list = [
      entry("e1", 120), entry("e2", 95), entry("e3", 110, watched), entry("e4", 130),
      entry("e5", 90, watched), entry("e6", 125), entry("e7", 100, watched), entry("e8", 110),
    ];
    // Unwatched: 120 + 95 + 130 + 125 + 110 = 580 min = 9h 40m
    expect(monthHeader("2026-10-01", list)).toBe("OCTOBER 2026 · 8 films · 3 watched · 9h 40m to go");
  });

  it("says film for one, and minutes alone under an hour", () => {
    expect(monthHeader("2026-10-01", [entry("e1", 45)])).toBe("OCTOBER 2026 · 1 film · 0 watched · 45m to go");
  });

  it("counts an unknown runtime as nothing to go, and an empty month as all zeros", () => {
    expect(monthHeader("2026-10-01", [entry("e1", null), entry("e2", 60)])).toBe("OCTOBER 2026 · 2 films · 0 watched · 1h 0m to go");
    expect(monthHeader("2026-11-01", [])).toBe("NOVEMBER 2026 · 0 films · 0 watched · 0m to go");
  });
});

describe("the remembered view and sort", () => {
  it("defaults to cards, by date added oldest first", () => {
    expect(DEFAULT_SETTINGS).toEqual({ view: "cards", sort: "added" });
    expect(parseSettings(null)).toEqual({ view: "cards", sort: "added" });
  });

  it("reads back what was saved", () => {
    expect(parseSettings('{"view":"rows","sort":"runtime"}')).toEqual({ view: "rows", sort: "runtime" });
    expect(parseSettings('{"view":"cards","sort":"title"}')).toEqual({ view: "cards", sort: "title" });
    expect(parseSettings('{"view":"rows","sort":"year"}')).toEqual({ view: "rows", sort: "year" });
  });

  it("ignores what isn't JSON, or isn't a known view or sort, keeping whatever part is valid", () => {
    expect(parseSettings("rows")).toEqual({ view: "cards", sort: "added" });
    expect(parseSettings("null")).toEqual({ view: "cards", sort: "added" });
    expect(parseSettings("[]")).toEqual({ view: "cards", sort: "added" });
    expect(parseSettings('{"view":"grid","sort":"title"}')).toEqual({ view: "cards", sort: "title" });
    expect(parseSettings('{"view":"rows","sort":"rating"}')).toEqual({ view: "rows", sort: "added" });
    expect(parseSettings('{"view":"rows","sort":"toString"}')).toEqual({ view: "rows", sort: "added" });
  });
});

describe("a change on My List and its Undo", () => {
  const earlier = "2026-10-12T20:15:31.123456+00:00";
  const now = "2026-10-27T09:00:00.000Z";
  const list = [entry("e1", 120), entry("e22", 95, earlier), entry("e333", 110)];

  it("marking Watched sets the watched date, and its Undo takes it away again", () => {
    const mark = { kind: "watched", id: "e1", watchedAt: now } as const;
    const marked = applyChange(list, mark);
    expect(marked.find((e) => e.id === "e1")!.watchedAt).toBe(now);
    expect(applyChange(marked, undoOf(list, mark))).toEqual(list);
  });

  it("unmarking Watched clears the date, and its Undo restores the previous one exactly", () => {
    const unmark = { kind: "watched", id: "e22", watchedAt: null } as const;
    const unmarked = applyChange(list, unmark);
    expect(unmarked.find((e) => e.id === "e22")!.watchedAt).toBeNull();
    expect(undoOf(list, unmark)).toEqual({ kind: "watched", id: "e22", watchedAt: earlier });
    expect(applyChange(unmarked, undoOf(list, unmark))).toEqual(list);
  });

  it("Remove takes the Entry off, and its Undo puts the very same Entry back, dates and all", () => {
    const remove = { kind: "removed", id: "e22" } as const;
    const removed = applyChange(list, remove);
    expect(removed.map((e) => e.id)).toEqual(["e1", "e333"]);
    const undo = undoOf(list, remove);
    expect(undo).toEqual({ kind: "restored", entry: list[1] });
    expect(applyChange(removed, undo).find((e) => e.id === "e22")).toEqual(list[1]);
  });

  it("putting back an Entry that is already there doesn't show it twice", () => {
    expect(applyChange(list, { kind: "restored", entry: list[0] })).toHaveLength(3);
  });
});
