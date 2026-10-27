// Browse below the hero: search, feed tabs, genre chips and the results, all kept in the URL. A search covers all of
// TMDB, so the tabs and chips step aside while it is on; the feed and genre stay in the URL for Clear search.
import { auth } from "@clerk/nextjs/server";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { browseHref, FEEDS, parseBrowseParams, type BrowseState, type Feed, type SearchParams } from "@/lib/browse";
import { categoryByGenre } from "@/lib/categories";
import { savedFilmIds } from "@/lib/entries";
import { getFeedPage, getGenres, getSearchPage, type Genre } from "@/lib/films";
import { thisMonth } from "@/lib/this-month";
import { buttonClass } from "@/components/system/controls";
import { PulpGenreIcon } from "@/components/system/pulp/genre";
import { BrowseResults, CardSkeletons, ProjectorJammed } from "./browse-results";

export async function Browse({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const genres = await getGenres().catch((error) => {
    console.error(error);
    return null;
  });
  const state = parseBrowseParams(sp, genres?.map((g) => g.id) ?? []);
  const { feed, genre, q } = state;

  return (
    <>
      <SearchForm state={state} />
      {!q && (
        <>
          <nav aria-label="Feeds" className="ds-tabs mb-5">
            {FEEDS.map((f) => (
              <Link key={f.id} href={browseHref({ feed: f.id, genre })} aria-current={f.id === feed ? "page" : undefined} className="ds-tab">
                {f.label}
              </Link>
            ))}
          </nav>
          {genres && <GenreChips genres={genres} feed={feed} selected={genre} />}
        </>
      )}
      {/* Keyed, so each feed, genre and search shows the placeholders while its films arrive. */}
      <Suspense key={`${feed}-${genre}-${q}`} fallback={<CardSkeletons />}>
        {genres ? <FeedResults state={state} genres={genres} /> : <ProjectorJammed />}
      </Suspense>
    </>
  );
}

function SearchForm({ state: { feed, genre, q } }: { state: BrowseState }) {
  return (
    <Form action="/" role="search" className="mb-6 flex max-w-2xl flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1 basis-64">
        <label htmlFor="film-search" className="ds-label mb-2 block">Search films</label>
        {/* Keyed by the search, so Clear search and Back empty or refill the box. */}
        <input key={q ?? ""} id="film-search" name="q" type="search" defaultValue={q ?? ""} autoComplete="off" placeholder="Any title on TMDB" className="ds-input w-full" />
      </div>
      {feed !== "now-playing" && <input type="hidden" name="feed" value={feed} />}
      {genre !== null && <input type="hidden" name="genre" value={genre} />}
      <button type="submit" className={buttonClass("primary")}>Search</button>
      {q && <Link href={browseHref({ feed, genre })} className={buttonClass("secondary")}>Clear search</Link>}
    </Form>
  );
}

function GenreChips({ genres, feed, selected }: { genres: Genre[]; feed: Feed; selected: number | null }) {
  const chip = (id: number | null, name: string) => {
    const art = id === null ? "all" : categoryByGenre[id];
    return (
      <Link key={id ?? "all"} href={browseHref({ feed, genre: id })} aria-current={id === selected ? "true" : undefined} className="ds-chip" scroll={false}>
        {art && <PulpGenreIcon id={art} className="ds-genre-icon" />}
        {name}
      </Link>
    );
  };
  return (
    <div role="group" aria-label="Filter by genre" className="ds-chip-row">
      {chip(null, "All")}
      {genres.map((g) => chip(g.id, g.name))}
    </div>
  );
}

async function FeedResults({ state, genres }: { state: BrowseState; genres: Genre[] }) {
  const { feed, genre, q } = state;
  const [first, saved] = await Promise.all([
    (q ? getSearchPage(q, 1) : getFeedPage(feed, genre, 1)).catch((error) => {
      console.error(error);
      return null;
    }),
    savedThisMonth(),
  ]);
  if (!first) return <ProjectorJammed />;
  return <BrowseResults state={state} first={first} saved={saved} genreNames={Object.fromEntries(genres.map((g) => [g.id, g.name]))} />;
}

// The Films already in this month's list, for Already saved; null when signed out, so Save stays as it is.
async function savedThisMonth(): Promise<number[] | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return savedFilmIds(await thisMonth());
}
