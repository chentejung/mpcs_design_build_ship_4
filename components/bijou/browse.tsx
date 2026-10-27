// Browse below the hero: feed tabs, genre chips and the results. Feed and genre live in the URL.
import Link from "next/link";
import { Suspense } from "react";
import { browseHref, FEEDS, parseBrowseParams, type Feed, type SearchParams } from "@/lib/browse";
import { categoryByGenre } from "@/lib/categories";
import { getFeedPage, getGenres, type Genre } from "@/lib/films";
import { PulpGenreIcon } from "@/components/system/pulp/genre";
import { BrowseResults, CardSkeletons, ProjectorJammed } from "./browse-results";

export async function Browse({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const genres = await getGenres().catch((error) => {
    console.error(error);
    return null;
  });
  const { feed, genre } = parseBrowseParams(sp, genres?.map((g) => g.id) ?? []);

  return (
    <>
      <nav aria-label="Feeds" className="ds-tabs mb-5">
        {FEEDS.map((f) => (
          <Link key={f.id} href={browseHref({ feed: f.id, genre })} aria-current={f.id === feed ? "page" : undefined} className="ds-tab">
            {f.label}
          </Link>
        ))}
      </nav>
      {genres && <GenreChips genres={genres} feed={feed} selected={genre} />}
      {/* Keyed, so each feed and genre shows the placeholders while its films arrive. */}
      <Suspense key={`${feed}-${genre}`} fallback={<CardSkeletons />}>
        {genres ? <FeedResults feed={feed} genre={genre} genres={genres} /> : <ProjectorJammed />}
      </Suspense>
    </>
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

async function FeedResults({ feed, genre, genres }: { feed: Feed; genre: number | null; genres: Genre[] }) {
  const first = await getFeedPage(feed, genre, 1).catch((error) => {
    console.error(error);
    return null;
  });
  if (!first) return <ProjectorJammed />;
  return <BrowseResults feed={feed} genre={genre} first={first} genreNames={Object.fromEntries(genres.map((g) => [g.id, g.name]))} />;
}
