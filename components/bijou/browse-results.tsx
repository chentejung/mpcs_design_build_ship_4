"use client";
// The film grid for a feed or a search: Load more adds the next 20 through a Server Action, synopses can be hidden, and Pulp's
// placeholders stand in while films arrive. Signed in, each card offers Save, or Already saved once this month's list
// has the Film; Save shows at once, and rolls back if the write fails. Signed out, Save opens the sign-in modal and
// saves the Film once the visitor is back signed in (save-after-sign-in.ts).
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useId, useOptimistic, useState, useTransition } from "react";
import { loadBrowsePage, type BrowsePage } from "@/app/actions/browse";
import { saveFilm } from "@/app/actions/entries";
import { browseHref, posterUrl, type BrowseState } from "@/lib/browse";
import { categoryFor } from "@/lib/categories";
import type { Film } from "@/lib/films";
import { monthShortYear } from "@/lib/month";
import { Button, buttonClass, Toggle } from "@/components/system/controls";
import { FilmCard } from "@/components/system/film-card";
import { EmptyState } from "@/components/system/motifs";
import { clearAbandonedSave, takePendingSave, useAskToSave, type PendingSave } from "./save-after-sign-in";
import { useToasts } from "./toasts";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

// `saved` is this month's TMDB ids, or null when signed out. Each page's `lastListed` is, signed in, the latest past
// month each of its films was in a list, for the card's "In your Sep 2026 list".
export function BrowseResults({ state, first, saved, genreNames }: {
  state: BrowseState;
  first: BrowsePage;
  saved: number[] | null;
  genreNames: Record<number, string>;
}) {
  const [films, setFilms] = useState(first.films);
  const [page, setPage] = useState(first.page);
  const [lastListed, setLastListed] = useState(first.lastListed);
  const [failed, setFailed] = useState(false);
  const [showSynopses, setShowSynopses] = useState(true);
  const [loading, startLoading] = useTransition();
  // While a Save (or its Undo) is in flight, the card shows the result; the server's list takes over once it answers.
  const [savedNow, setSaved] = useOptimistic(saved, (ids, { id, on }: { id: number; on: boolean }) =>
    ids && (on ? [...ids, id] : ids.filter((i) => i !== id)),
  );
  const toasts = useToasts();
  const askToSave = useAskToSave();
  const searchParams = useSearchParams();

  const { feed, genre, q } = state;

  const save = (f: PendingSave) =>
    startTransition(async () => {
      setSaved({ id: f.id, on: true });
      toasts.moveCount(1);
      try {
        const result = await saveFilm(f.id);
        if (result.status === "saved")
          toasts.changed(`Saved ${f.title} to this month’s list.`, { kind: "delete-entry", entryId: result.entryId }, () => {
            setSaved({ id: f.id, on: false });
          });
        else toasts.changed(`${f.title} is already in this month’s list.`, null);
      } catch {
        toasts.failed(`Couldn’t save ${f.title}. Try again.`);
      }
    });

  // Back from the sign-in a signed-out Save opened: save that Film now, no second click. Already saved answers as usual.
  useEffect(clearAbandonedSave, []);
  useEffect(() => {
    if (saved === null) return;
    const pending = takePendingSave();
    if (pending) save(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the session or the URL changes, not per render
  }, [saved, searchParams]);

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
        setLastListed((months) => ({ ...months, ...next.lastListed }));
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
            <FilmCard film={toCard(f, genreNames)} showSynopsis={showSynopses} action={
              <>
                {lastListed[f.id] && <p className="ds-fine ds-muted mb-2">In your {monthShortYear(lastListed[f.id])} list</p>}
                {savedNow?.includes(f.id) ? <AlreadySaved /> : <SaveButton title={f.title} onSave={savedNow ? () => save(f) : () => askToSave(f)} />}
              </>
            } />
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

function SaveButton({ title, onSave }: { title: string; onSave: () => void }) {
  return <Button block icon="save" aria-label={`Save ${title}`} onClick={onSave}>Save</Button>;
}

// One Entry per Film per month: removing it is My List's job, which the hint says. aria-disabled rather than
// disabled, so it stays in the tab order and its hint is read. History's Add it to this month uses it too.
export function AlreadySaved() {
  const hint = useId();
  return (
    <>
      <Button block variant="secondary" icon="saved" aria-disabled="true" aria-describedby={hint} data-saved>Already saved</Button>
      <p id={hint} className="ds-fine ds-muted mt-2 text-center">Remove it from My List</p>
    </>
  );
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
