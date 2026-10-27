"use server";
// Load more: the next 20 of a feed or a search, fetched on the server so the browser never talks to TMDB.
import { browsePreferences } from "@/lib/preferences";
import { parseBrowseParams, type SearchParams } from "@/lib/browse";
import { getFeedPage, getGenres, getSearchPage, type FeedPage } from "@/lib/films";

// `browse` is the page's own URL state (feed, genre, q), parsed again here as untrusted input.
export async function loadBrowsePage(browse: SearchParams, page: number): Promise<FeedPage> {
  await browsePreferences();
  if (!Number.isInteger(page) || page < 2 || page > 500) throw new Error("No such page");
  const genres = await getGenres();
  const { feed, genre, q } = parseBrowseParams(browse, genres.map((g) => g.id));
  return q ? getSearchPage(q, page) : getFeedPage(feed, genre, page);
}
