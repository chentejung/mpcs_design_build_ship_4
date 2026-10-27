import { describe, expect, it } from "vitest";
import { parsePreferences } from "./preference-input";

function form(name: string, genres: string[]) {
  const data = new FormData();
  data.set("display_name", name);
  genres.forEach((genre) => data.append("favorite_genre_ids", genre));
  return data;
}
describe("preference answers", () => {
  it("requires both answers", () => {
    expect(parsePreferences(form("   ", [])).errors).toHaveProperty("name");
    expect(parsePreferences(form("Ellie", [])).errors).toHaveProperty("genres");
  });
  it("normalizes names and deduplicates valid genre IDs", () => {
    expect(parsePreferences(form("  陳 Ellie  ", ["28", "35", "28"])).value).toEqual({ display_name: "陳 Ellie", favorite_genre_ids: [28, 35] });
  });
  it.each(["999", "28.0", "28x", "-1", "", "NaN"])("rejects forged genre %s", (id) => {
    expect(parsePreferences(form("Ellie", ["28", id])).errors).toHaveProperty("genres");
  });
  it("rejects control characters and names over 50 Unicode characters", () => {
    for (const name of ["A\nB", "A\u0000B", "A\u202eB", "a".repeat(51)]) {
      expect(parsePreferences(form(name, ["28"])).errors).toHaveProperty("name");
    }
    expect(parsePreferences(form("🎬".repeat(50), ["28"])).value?.display_name).toHaveLength(100);
  });
  it("accepts every supported film genre", () => {
    expect(parsePreferences(form("Ellie", ["28","12","16","35","80","99","18","10751","14","36","27","10402","9648","10749","878","10770","53","10752","37"])).value?.favorite_genre_ids).toHaveLength(19);
  });
});
