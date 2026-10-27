import { describe, expect, it } from "vitest";
import { parseHistoryParams, titlePattern } from "./history";

const NOW = "2026-10-01"; // this month

describe("History's URL state", () => {
  it("narrows to a past month given as YYYY-MM", () => {
    expect(parseHistoryParams({ month: "2026-09" }, NOW)).toEqual({ month: "2026-09-01", q: null });
  });

  it("ignores a month that isn't a real YYYY-MM, or isn't in the past", () => {
    for (const month of ["2026-9", "2026-13", "2026-00", "Sep 2026", "2026-09-01", "", "2026-10", "2027-01"])
      expect(parseHistoryParams({ month }, NOW).month, month).toBeNull();
  });

  it("searches titles with ?q, trimmed; a blank one is no search", () => {
    expect(parseHistoryParams({ q: "  godfather " }, NOW)).toEqual({ month: null, q: "godfather" });
    expect(parseHistoryParams({ q: "   " }, NOW).q).toBeNull();
    expect(parseHistoryParams({ q: ["matrix", "x"], month: ["2026-08", "2026-07"] }, NOW)).toEqual({ month: "2026-08-01", q: "matrix" });
  });
});

describe("the title search pattern", () => {
  it("finds the words anywhere in a title", () => {
    expect(titlePattern("godfather")).toBe("%godfather%");
  });

  it("takes % and _ (and the escape character itself) literally", () => {
    expect(titlePattern("100% pure_gold")).toBe("%100\\% pure\\_gold%");
    expect(titlePattern("a\\b")).toBe("%a\\\\b%");
  });

  // PostgREST reads * in a like pattern as %, and has no escape for it: the nearest literal match is "any one character".
  it("narrows * to a single character, since PostgREST would widen it to anything", () => {
    expect(titlePattern("M*A*S*H")).toBe("%M_A_S_H%");
  });
});
