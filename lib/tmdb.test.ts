import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { tmdbGet } from "./tmdb";

describe("with TMDB_FIXTURES=1", () => {
  const network = vi.fn(() => Promise.reject(new Error("fixtures must not hit the network")));

  beforeEach(() => {
    vi.stubEnv("TMDB_FIXTURES", "1");
    vi.stubGlobal("fetch", network);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("answers from the saved response in tests/fixtures/tmdb", async () => {
    const list = await tmdbGet<{ genres: { id: number; name: string }[] }>("/3/genre/movie/list");
    expect(list.genres).toContainEqual({ id: 878, name: "Science Fiction" });
    expect(network).not.toHaveBeenCalled();
  });

  test("names the fixture file it expected when none is saved", async () => {
    await expect(tmdbGet("/3/discover/movie", { page: 2, with_genres: 28 })).rejects.toThrow(
      "tests/fixtures/tmdb/discover-movie.page=2&with_genres=28.json",
    );
  });
});
