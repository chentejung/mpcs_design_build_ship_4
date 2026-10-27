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

describe("against live TMDB", () => {
  const tooMany = (retryAfter: string) => new Response("{}", { status: 429, headers: { "Retry-After": retryAfter } });
  const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

  beforeEach(() => vi.stubEnv("TMDB_FIXTURES", ""));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("backs off on 429 for as long as Retry-After asks, then tries again", async () => {
    vi.useFakeTimers();
    const network = vi.fn().mockResolvedValueOnce(tooMany("2")).mockResolvedValueOnce(ok({ page: 1 }));
    vi.stubGlobal("fetch", network);

    const result = tmdbGet("/3/movie/now_playing");
    await vi.advanceTimersByTimeAsync(1999);
    expect(network).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(network).toHaveBeenCalledTimes(2);
    await expect(result).resolves.toEqual({ page: 1 });
  });

  test("gives up after four tries that are all rate-limited", async () => {
    const network = vi.fn(() => Promise.resolve(tooMany("0")));
    vi.stubGlobal("fetch", network);

    await expect(tmdbGet("/3/movie/now_playing")).rejects.toThrow("TMDB /3/movie/now_playing answered 429");
    expect(network).toHaveBeenCalledTimes(4);
  });
});
