// Browse's pure rules: which feeds exist, and the TMDB discover parameters for each (AGENTS.md → TMDB).
import type { TmdbParams } from "./tmdb";

export const FEEDS = [
  { id: "now-playing", label: "Now Playing" },
  { id: "top-rated", label: "Top Rated" },
] as const;

export type Feed = (typeof FEEDS)[number]["id"];

// The dates TMDB's /3/movie/now_playing counts as "in cinemas now".
export type NowPlayingWindow = { minimum: string; maximum: string };

const DOCUMENTARY = 99;
const TV_MOVIE = 10770;

export function discoverParams({ feed, genre, page, window }: {
  feed: Feed;
  genre: number | null;
  page: number;
  window?: NowPlayingWindow;
}): TmdbParams {
  const params: TmdbParams =
    feed === "now-playing"
      ? {
          with_release_type: "2|3", // theatrical (limited) or theatrical
          "release_date.gte": window!.minimum,
          "release_date.lte": window!.maximum,
          sort_by: "popularity.desc",
        }
      : { sort_by: "vote_average.desc", "vote_count.gte": 200, without_genres: `${DOCUMENTARY},${TV_MOVIE}` };
  return { ...params, include_adult: "false", ...(genre !== null && { with_genres: genre }), page };
}

// A page's search params, as Next.js passes them.
export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Browse's URL state. Anything unknown falls back to the default rather than erroring, so a mistyped link still works.
export function parseBrowseParams(sp: SearchParams, genreIds: number[]): { feed: Feed; genre: number | null } {
  const feedParam = first(sp.feed);
  const feed = FEEDS.find((f) => f.id === feedParam)?.id ?? "now-playing";
  const genreParam = first(sp.genre) ?? "";
  const genre = /^\d+$/.test(genreParam) && genreIds.includes(Number(genreParam)) ? Number(genreParam) : null;
  return { feed, genre };
}

// The Browse URL for a feed and genre; the default feed stays out of the URL.
export function browseHref({ feed, genre }: { feed: Feed; genre: number | null }) {
  const q = new URLSearchParams();
  if (feed !== "now-playing") q.set("feed", feed);
  if (genre !== null) q.set("genre", String(genre));
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

export const posterUrl = (posterPath: string | null) => (posterPath ? `https://image.tmdb.org/t/p/w342${posterPath}` : undefined);
