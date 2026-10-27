// The one door to TMDB, server-only so the read token never reaches the browser (AGENTS.md → TMDB).
// With TMDB_FIXTURES=1 it answers from saved JSON in tests/fixtures/tmdb/ instead, so tests are repeatable;
// with TMDB_RECORD=1 it calls TMDB and saves each answer there (run the app with it to refresh the fixtures).
import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type TmdbParams = Record<string, string | number>;

const API = "https://api.themoviedb.org";
const DEFAULTS = { language: "en-US", region: "US" };
const FIXTURES = "tests/fixtures/tmdb";
const MAX_TRIES = 4; // TMDB allows about 40 requests a second; a 429 means wait and try again

// "/3/discover/movie" + { page: 2, with_genres: 28 } → "discover-movie.page=2&with_genres=28.json"
function fixtureName(apiPath: string, params: TmdbParams) {
  const base = apiPath.replace(/^\/3\//, "").replaceAll("/", "-");
  const query = Object.keys(params).sort().map((k) => `${k}=${encodeURIComponent(params[k])}`).join("&");
  return `${base}${query ? `.${query}` : ""}.json`;
}

async function fromFixture<T>(apiPath: string, params: TmdbParams): Promise<T> {
  const file = path.join(FIXTURES, fixtureName(apiPath, params));
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), file), "utf8")) as T;
  } catch (error) {
    throw new Error(`No TMDB fixture for ${apiPath}: save the response as ${file}`, { cause: error });
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fromTmdb<T>(apiPath: string, params: TmdbParams): Promise<T> {
  const url = new URL(apiPath, API);
  for (const [k, v] of Object.entries({ ...DEFAULTS, ...params })) url.searchParams.set(k, String(v));
  for (let tries = 1; ; tries++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}` } });
    if (res.ok) return (await res.json()) as T;
    if (res.status !== 429 || tries === MAX_TRIES) throw new Error(`TMDB ${apiPath} answered ${res.status}`);
    const retryAfter = Number(res.headers.get("Retry-After"));
    await wait(Number.isFinite(retryAfter) && res.headers.has("Retry-After") ? retryAfter * 1000 : 2 ** tries * 250);
  }
}

export async function tmdbGet<T>(apiPath: string, params: TmdbParams = {}): Promise<T> {
  if (process.env.TMDB_FIXTURES === "1") return fromFixture<T>(apiPath, params);
  const body = await fromTmdb<T>(apiPath, params);
  if (process.env.TMDB_RECORD === "1") {
    await mkdir(path.join(process.cwd(), FIXTURES), { recursive: true });
    await writeFile(path.join(process.cwd(), FIXTURES, fixtureName(apiPath, params)), `${JSON.stringify(body, null, 2)}\n`);
  }
  return body;
}
