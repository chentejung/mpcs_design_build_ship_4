"use server";
// Load more: the next 20 of a feed or a search, fetched on the server so the browser never talks to TMDB. Signed in,
// each page carries its films' "In your Sep 2026 list" months too.
import { auth } from "@clerk/nextjs/server";
import { browsePreferences } from "@/lib/preferences";
import { parseBrowseParams, type SearchParams } from "@/lib/browse";
import { lastListedMonths } from "@/lib/entries";
import { getFeedPage, getGenres, getSearchPage, type FeedPage } from "@/lib/films";
import { thisMonth } from "@/lib/this-month";

// A page of films, and for each that was in one of the user's past lists the latest such month ("2026-09-01").
export type BrowsePage = FeedPage & { lastListed: Record<number, string> };

// `browse` is the page's own URL state (feed, genre, q), parsed again here as untrusted input.
export async function loadBrowsePage(browse: SearchParams, page: number): Promise<BrowsePage> {
  await browsePreferences();
  if (!Number.isInteger(page) || page < 2 || page > 500) throw new Error("No such page");
  const genres = await getGenres();
  const { feed, genre, q } = parseBrowseParams(browse, genres.map((g) => g.id));
  const next = await (q ? getSearchPage(q, page) : getFeedPage(feed, genre, page));
  const { userId } = await auth();
  const lastListed = userId ? await lastListedMonths(await thisMonth(), next.films.map((f) => f.id)) : {};
  return { ...next, lastListed };
}
