// Browse's data from TMDB, cached on the server: feeds and searches for an hour, genre names for a day (AGENTS.md → TMDB).
import "server-only";
import { cacheLife } from "next/cache";
import { discoverParams, searchParams, type Feed, type NowPlayingWindow } from "./browse";
import { tmdbGet } from "./tmdb";

export type Genre = { id: number; name: string };

export type Film = {
  id: number;
  title: string;
  originalTitle: string;
  originalLanguage: string;
  year: number | null;
  genreIds: number[];
  overview: string;
  posterPath: string | null;
};

export type FeedPage = { films: Film[]; page: number; totalPages: number };

type TmdbMovie = {
  id: number; title: string; original_title: string; original_language: string; release_date?: string;
  genre_ids: number[]; overview: string; poster_path: string | null;
};
type TmdbList = { page: number; total_pages: number; results: TmdbMovie[] };

const HOUR = 60 * 60;
const MAX_PAGE = 500; // TMDB serves no page past 500

export async function getGenres(): Promise<Genre[]> {
  "use cache";
  cacheLife({ revalidate: 24 * HOUR });
  return (await tmdbGet<{ genres: Genre[] }>("/3/genre/movie/list")).genres;
}

async function getNowPlayingWindow(): Promise<NowPlayingWindow> {
  "use cache";
  cacheLife({ revalidate: HOUR });
  return (await tmdbGet<{ dates: NowPlayingWindow }>("/3/movie/now_playing")).dates;
}

const toFilm = (m: TmdbMovie): Film => ({
  id: m.id,
  title: m.title,
  originalTitle: m.original_title,
  originalLanguage: m.original_language,
  year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
  genreIds: m.genre_ids,
  overview: m.overview,
  posterPath: m.poster_path,
});

export async function getFeedPage(feed: Feed, genre: number | null, page: number): Promise<FeedPage> {
  "use cache";
  cacheLife({ revalidate: HOUR });
  const window = feed === "now-playing" ? await getNowPlayingWindow() : undefined;
  const list = await tmdbGet<TmdbList>("/3/discover/movie", discoverParams({ feed, genre, page, window }));
  return { films: list.results.map(toFilm), page: list.page, totalPages: Math.min(list.total_pages, MAX_PAGE) };
}

export async function getSearchPage(q: string, page: number): Promise<FeedPage> {
  "use cache";
  cacheLife({ revalidate: HOUR });
  const list = await tmdbGet<TmdbList>("/3/search/movie", searchParams({ q, page }));
  return { films: list.results.map(toFilm), page: list.page, totalPages: Math.min(list.total_pages, MAX_PAGE) };
}

// An Entry's copy of a Film (AGENTS.md → Data model), from GET /3/movie/{id}, which adds the runtime.
export type Snapshot = {
  tmdb_id: number;
  title: string;
  original_title: string | null;
  original_language: string | null;
  release_year: number | null;
  runtime: number | null;
  poster_path: string | null;
  genre_ids: number[];
  overview: string | null;
};

type TmdbMovieDetails = {
  id: number; title: string; original_title?: string; original_language?: string; release_date?: string;
  runtime?: number | null; poster_path?: string | null; genres?: Genre[]; overview?: string;
};

export async function getSnapshot(tmdbId: number): Promise<Snapshot> {
  "use cache";
  cacheLife({ revalidate: HOUR });
  const m = await tmdbGet<TmdbMovieDetails>(`/3/movie/${tmdbId}`);
  return {
    tmdb_id: m.id,
    title: m.title,
    original_title: m.original_title || null,
    original_language: m.original_language || null,
    release_year: m.release_date ? Number(m.release_date.slice(0, 4)) : null,
    runtime: m.runtime || null, // TMDB answers 0 when it doesn't know
    poster_path: m.poster_path?.startsWith("/") ? m.poster_path : null,
    genre_ids: m.genres?.map((g) => g.id) ?? [],
    overview: m.overview || null,
  };
}
