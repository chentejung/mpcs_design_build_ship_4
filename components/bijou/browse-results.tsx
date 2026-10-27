"use client";
// The film grid for a feed or a search: Load more adds the next 20 through a Server Action, synopses can be hidden, and Pulp's
// placeholders stand in while films arrive.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { loadBrowsePage } from "@/app/actions/browse";
import { browseHref, posterUrl, type BrowseState } from "@/lib/browse";
import { categoryFor } from "@/lib/categories";
import type { FeedPage, Film } from "@/lib/films";
import { Button, buttonClass, Toggle } from "@/components/system/controls";
import { FilmCard } from "@/components/system/film-card";
import { EmptyState } from "@/components/system/motifs";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function BrowseResults({ state, first, genreNames }: {
  state: BrowseState;
  first: FeedPage;
  genreNames: Record<number, string>;
}) {
  const [films, setFilms] = useState(first.films);
  const [page, setPage] = useState(first.page);
  const [failed, setFailed] = useState(false);
  const [showSynopses, setShowSynopses] = useState(true);
  const [loading, startLoading] = useTransition();

  const { feed, genre, q } = state;

  if (films.length === 0)
    return q ? (
      <EmptyState title="No films here!" action={<Link href={browseHref({ feed, genre })} className={buttonClass("primary")}>Clear search</Link>}>
        Nothing on TMDB matches &ldquo;{q}&rdquo;.
      </EmptyState>
    ) : (
      <EmptyState
        title="No films here!"
        action={<Link href={browseHref({ feed, genre: null })} className={buttonClass("primary")}>Show every genre</Link>}
      >
        Nothing in this feed matches that genre. Try another one.
      </EmptyState>
    );

  const loadMore = () =>
    startLoading(async () => {
      try {
        const browse = { feed, ...(genre !== null && { genre: String(genre) }), ...(q && { q }) };
        const next = await loadBrowsePage(browse, page + 1);
        // Popularity can shift between pages, so a film may turn up twice.
        setFilms((shown) => [...shown, ...next.films.filter((f) => !shown.some((s) => s.id === f.id))]);
        setPage(next.page);
        setFailed(false);
      } catch {
        setFailed(true);
      }
    });

  return (
    <>
      <div className="mt-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <p aria-live="polite" className="ds-meta ds-muted">Showing {films.length} films</p>
        <Toggle label="Show synopses" checked={showSynopses} onToggle={() => setShowSynopses(!showSynopses)} />
      </div>
      <ul aria-label="Films" className={GRID}>
        {films.map((f) => (
          <li key={f.id}>
            <FilmCard film={toCard(f, genreNames)} showSynopsis={showSynopses} action={<SaveButton title={f.title} />} />
          </li>
        ))}
      </ul>
      {loading && <CardSkeletons className="mt-9" />}
      <div className="mt-10 flex flex-col items-center gap-3">
        {failed && <p role="alert" className="ds-body">The projector jammed. Try again.</p>}
        {page < first.totalPages && (
          <Button variant="secondary" onClick={loadMore} disabled={loading}>Load more</Button>
        )}
      </div>
    </>
  );
}

function toCard(f: Film, genreNames: Record<number, string>) {
  return {
    title: f.title,
    original: f.originalTitle !== f.title ? { title: f.originalTitle, lang: f.originalLanguage } : undefined,
    year: f.year ?? undefined,
    genres: f.genreIds.map((id) => genreNames[id]).filter(Boolean),
    category: categoryFor(f.genreIds),
    synopsis: f.overview,
    poster: posterUrl(f.posterPath),
  };
}

// Saving arrives with #7.
function SaveButton({ title }: { title: string }) {
  return <Button block icon="save" aria-label={`Save ${title}`}>Save</Button>;
}

export function CardSkeletons({ className = "" }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading films" className={`${GRID} ${className}`}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} aria-hidden className="ds-card">
          <div className="ds-frame">
            <div className="ds-poster" data-poster="loading"><div className="ds-poster-fallback" /></div>
          </div>
          <div className="ds-skeleton-line mt-3 w-4/5" />
          <div className="ds-skeleton-line mt-2 w-2/5" />
        </div>
      ))}
    </div>
  );
}

export function ProjectorJammed() {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  return (
    <EmptyState
      title="The projector jammed!"
      action={<Button variant="primary" disabled={retrying} onClick={() => startRetry(() => router.refresh())}>Retry</Button>}
    >
      TMDB isn&rsquo;t answering right now. It isn&rsquo;t you; give it another go.
    </EmptyState>
  );
}
