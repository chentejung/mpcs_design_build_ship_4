"use server";
// Load more: the next 20 of a feed, fetched on the server so the browser never talks to TMDB.
import { parseBrowseParams } from "@/lib/browse";
import { getFeedPage, getGenres, type FeedPage } from "@/lib/films";

export async function loadFeedPage(feed: string, genre: string | null, page: number): Promise<FeedPage> {
  if (!Number.isInteger(page) || page < 2 || page > 500) throw new Error("No such page");
  const genres = await getGenres();
  const parsed = parseBrowseParams({ feed, genre: genre ?? undefined }, genres.map((g) => g.id));
  return getFeedPage(parsed.feed, parsed.genre, page);
}
