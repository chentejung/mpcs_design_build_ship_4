// The one door to TMDB, server-only so the read token never reaches the browser (AGENTS.md → TMDB).
// With TMDB_FIXTURES=1 it answers from saved JSON in tests/fixtures/tmdb/ instead, so tests are repeatable.
import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type TmdbParams = Record<string, string | number>;

const API = "https://api.themoviedb.org";
const DEFAULTS = { language: "en-US", region: "US" };

// "/3/discover/movie" + { page: 2, with_genres: 28 } → "discover-movie.page=2&with_genres=28.json"
function fixtureName(apiPath: string, params: TmdbParams) {
  const base = apiPath.replace(/^\/3\//, "").replaceAll("/", "-");
  const query = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return `${base}${query ? `.${query}` : ""}.json`;
}

async function fromFixture<T>(apiPath: string, params: TmdbParams): Promise<T> {
  const file = path.join("tests/fixtures/tmdb", fixtureName(apiPath, params));
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8")) as T;
  } catch (error) {
    throw new Error(`No TMDB fixture for ${apiPath}: save the response as ${file}`, { cause: error });
  }
}

export async function tmdbGet<T>(apiPath: string, params: TmdbParams = {}): Promise<T> {
  if (process.env.TMDB_FIXTURES === "1") return fromFixture<T>(apiPath, params);

  const url = new URL(apiPath, API);
  for (const [k, v] of Object.entries({ ...DEFAULTS, ...params })) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}` } });
  if (!res.ok) throw new Error(`TMDB ${apiPath} answered ${res.status}`);
  return (await res.json()) as T;
}
