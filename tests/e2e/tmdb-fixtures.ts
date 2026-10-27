// The saved TMDB answers the server reads with TMDB_FIXTURES=1, so tests can name what a visitor should see.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const FIXTURES = path.join(process.cwd(), "tests/fixtures/tmdb");

type Movie = { title: string; original_title: string; overview: string; genre_ids: number[] };

// The discover answer whose parameters include every given key=value (values as they appear in the file name);
// unless a with_genres part is given, the one across every genre.
export function discoverFixture(...parts: string[]) {
  const anyGenre = !parts.some((p) => p.startsWith("with_genres="));
  const name = readdirSync(FIXTURES).find(
    (f) => f.startsWith("discover-movie.") && parts.every((p) => f.includes(p)) && !(anyGenre && /[.&]with_genres=/.test(f)),
  );
  if (!name) throw new Error(`no discover fixture with ${parts.join(", ")}`);
  return { name, results: (JSON.parse(readFileSync(path.join(FIXTURES, name), "utf8")) as { results: Movie[] }).results };
}

export const nowPlaying = (page = 1, ...more: string[]) => discoverFixture(`page=${page}&`, "with_release_type=2%7C3", ...more);
export const topRated = (page = 1, ...more: string[]) => discoverFixture(`page=${page}&`, "vote_average.desc", ...more);

export function searchFixture(q: string, page = 1) {
  const name = `search-movie.include_adult=false&page=${page}&query=${encodeURIComponent(q)}.json`;
  return (JSON.parse(readFileSync(path.join(FIXTURES, name), "utf8")) as { results: Movie[] }).results;
}
