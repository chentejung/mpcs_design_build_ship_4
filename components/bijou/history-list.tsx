"use client";
// History's months (#9): each past month with its planned and watched counts, then its films in the order added.
// Read-only: no Watched toggle, no Remove. A film not watched yet offers Add it to this month instead, or Already
// saved once this month's list has it. Adding shows at once, rolls back if the write fails, and the shared toast
// offers a 3-second Undo that deletes the new Entry; the past Entry is never touched.
import { startTransition, useOptimistic } from "react";
import { addToThisMonth } from "@/app/actions/entries";
import { Button } from "@/components/system/controls";
import { formatRuntime } from "@/components/system/film-card";
import { Poster } from "@/components/system/poster";
import { posterUrl } from "@/lib/browse";
import type { MonthTotals } from "@/lib/history";
import { monthLong } from "@/lib/month";
import type { ListEntry } from "@/lib/my-list";
import { AlreadySaved } from "./browse-results";
import { useToasts } from "./toasts";
import { alreadyInThisMonth, changeDone, changeFailed } from "@/lib/toast-messages";

export type HistoryMonth = MonthTotals & { entries: ListEntry[] };

// `saved` is the TMDB ids in this month's list.
export function HistoryList({ months, saved, genreNames, timeZone }: {
  months: HistoryMonth[];
  saved: number[];
  genreNames: Record<number, string>;
  timeZone: string;
}) {
  const toasts = useToasts();
  // While an Add (or its Undo) is in flight, the row shows the result; the server's list takes over once it answers.
  const [savedNow, setSaved] = useOptimistic(saved, (ids, { id, on }: { id: number; on: boolean }) =>
    on ? [...ids, id] : ids.filter((i) => i !== id),
  );

  const add = (e: ListEntry) =>
    startTransition(async () => {
      setSaved({ id: e.tmdbId, on: true });
      toasts.moveCount(1);
      try {
        const result = await addToThisMonth(e.id);
        if (result.status === "saved")
          toasts.changed(changeDone("add", e.title), { kind: "delete-entry", entryId: result.entryId }, () => {
            setSaved({ id: e.tmdbId, on: false });
          });
        else toasts.changed(alreadyInThisMonth(e.title), null);
      } catch {
        toasts.failed(changeFailed("add", e.title));
      }
    });

  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone });
  const genresOf = (e: ListEntry) => e.genreIds.map((id) => genreNames[id]).filter(Boolean);

  const row = (e: ListEntry) => (
    <li key={e.id} className="ds-row grid-cols-[44px_1fr]! sm:grid-cols-[44px_1fr_auto]!">
      <Poster title={e.title} year={e.year ?? undefined} src={posterUrl(e.posterPath)} />
      <div className="min-w-0">
        <h3 className="ds-heading text-xl">{e.title}</h3>
        {e.originalTitle && e.originalTitle !== e.title && <p className="ds-meta ds-muted" lang={e.originalLanguage ?? undefined}>{e.originalTitle}</p>}
        <p className="ds-meta ds-muted">
          {[e.year, e.runtime && formatRuntime(e.runtime), genresOf(e).join(", ")].filter(Boolean).join(" · ")}
        </p>
        <p className="ds-fine ds-muted">
          {e.watchedAt ? <>Watched <time dateTime={e.watchedAt}>{date.format(new Date(e.watchedAt))}</time></> : "Not watched yet"}
        </p>
      </div>
      {e.watchedAt === null && (
        <div className="col-span-2 sm:col-span-1">
          {savedNow.includes(e.tmdbId) ? (
            <AlreadySaved />
          ) : (
            <Button variant="secondary" icon="save" aria-label={`Add it to this month: ${e.title}`} onClick={() => add(e)}>Add it to this month</Button>
          )}
        </div>
      )}
    </li>
  );

  return (
    <>
      {months.map((m) => {
        const name = monthLong(m.month);
        const id = `history-${m.month}`;
        return (
          <section key={m.month} aria-labelledby={id} className="mt-10">
            <h2 id={id} className="ds-heading text-2xl">{name}</h2>
            <p className="ds-label ds-rule mt-2 mb-4 pt-2">{m.planned} planned · {m.watched} watched</p>
            <ul aria-label={`${name} films`} className="max-w-3xl">{m.entries.map(row)}</ul>
          </section>
        );
      })}
    </>
  );
}
