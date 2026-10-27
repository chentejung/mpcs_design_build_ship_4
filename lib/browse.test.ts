import { describe, expect, test } from "vitest";
import { discoverParams, parseBrowseParams } from "./browse";

const window = { minimum: "2026-09-12", maximum: "2026-10-24" };

describe("discoverParams", () => {
  test("Now Playing is US theatrical releases inside the now-playing window, most popular first", () => {
    expect(discoverParams({ feed: "now-playing", genre: null, page: 1, window })).toEqual({
      with_release_type: "2|3",
      "release_date.gte": "2026-09-12",
      "release_date.lte": "2026-10-24",
      sort_by: "popularity.desc",
      include_adult: "false",
      page: 1,
    });
  });

  test("Top Rated is the best-voted films with at least 200 votes, without documentaries or TV movies", () => {
    expect(discoverParams({ feed: "top-rated", genre: null, page: 3 })).toEqual({
      sort_by: "vote_average.desc",
      "vote_count.gte": 200,
      without_genres: "99,10770",
      include_adult: "false",
      page: 3,
    });
  });

  test("a genre narrows either feed", () => {
    expect(discoverParams({ feed: "now-playing", genre: 28, page: 1, window })).toMatchObject({ with_genres: 28 });
    expect(discoverParams({ feed: "top-rated", genre: 878, page: 2 })).toMatchObject({ with_genres: 878, page: 2 });
  });
});

describe("parseBrowseParams", () => {
  const genres = [28, 35, 878];

  test("with nothing in the URL, Browse shows Now Playing across every genre", () => {
    expect(parseBrowseParams({}, genres)).toEqual({ feed: "now-playing", genre: null });
  });

  test("reads the feed and a known genre", () => {
    expect(parseBrowseParams({ feed: "top-rated", genre: "878" }, genres)).toEqual({ feed: "top-rated", genre: 878 });
  });

  test("ignores a feed it doesn't know", () => {
    expect(parseBrowseParams({ feed: "upcoming" }, genres).feed).toBe("now-playing");
  });

  test.each(["action", "-28", "28.5", "", "99999"])("ignores the genre %j", (genre) => {
    expect(parseBrowseParams({ genre }, genres).genre).toBeNull();
  });

  test("takes the first value when a parameter is repeated", () => {
    expect(parseBrowseParams({ feed: ["top-rated", "now-playing"], genre: ["35", "28"] }, genres)).toEqual({ feed: "top-rated", genre: 35 });
  });
});
