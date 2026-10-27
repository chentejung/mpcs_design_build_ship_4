// Browse's data from TMDB, cached on the server: feeds for an hour, genre names for a day (AGENTS.md → TMDB).
import "server-only";
import { cacheLife } from "next/cache";
import { discoverParams, type Feed, type NowPlayingWindow } from "./browse";
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
