"use client";
// This month's list on My List (#8): the comic-issue header with its totals, then Not watched yet and Watched. The Pulp
// Watched toggle moves a film between them and Remove takes it off the list. Every change shows at once, comes back if
// the write fails, and the shared toast offers a 3-second Undo that writes the previous state back: the previous
// watched date, or the very same Entry from the copy the server signed (lib/my-list.ts has the rules).
import Link from "next/link";
import { Fragment, startTransition, useId, useOptimistic } from "react";
import { markWatched, removeEntry } from "@/app/actions/entries";
import { Button, buttonClass, Check, Select, Toggle } from "@/components/system/controls";
import { FilmCard, formatRuntime } from "@/components/system/film-card";
import { EmptyState } from "@/components/system/motifs";
import { Poster } from "@/components/system/poster";
import { posterUrl } from "@/lib/browse";
import { categoryFor } from "@/lib/categories";
import {
  applyChange, monthHeader, SORTS, sortEntries, undoOf, VIEWS, type ListChange, type ListEntry, type ListSettings, type Sort,
} from "@/lib/my-list";
import { useListSettings } from "./list-settings";
import { useToasts } from "./toasts";
import { changeDone, changeFailed } from "@/lib/toast-messages";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function ThisMonthList({ month, entries, genreNames, timeZone }: {
  month: string;
  entries: ListEntry[];
  genreNames: Record<number, string>;
  timeZone: string;
}) {
  const toasts = useToasts();
  const [settings, saveSettings] = useListSettings();
  // While a change (or its Undo) is in flight, the list shows the result; the server's list takes over once it answers.
  const [shown, change] = useOptimistic(entries, applyChange);

  const toggleWatched = (e: ListEntry) =>
    startTransition(async () => {
      const mark: ListChange = { kind: "watched", id: e.id, watchedAt: e.watchedAt ? null : new Date().toISOString() };
      const back = undoOf(shown, mark);
      change(mark);
      try {
        await markWatched(e.id, mark.watchedAt !== null);
        toasts.changed(
          changeDone(mark.watchedAt ? "watch" : "unwatch", e.title),
          { kind: "set-watched", entryId: e.id, watchedAt: e.watchedAt },
          () => change(back),
        );
      } catch {
        toasts.failed(changeFailed(mark.watchedAt ? "watch" : "unwatch", e.title));
      }
    });

  const remove = (e: ListEntry) =>
    startTransition(async () => {
      const removal: ListChange = { kind: "removed", id: e.id };
      const back = undoOf(shown, removal);
      change(removal);
      toasts.moveCount(-1);
      try {
        const removed = await removeEntry(e.id);
        if (removed)
          toasts.changed(changeDone("remove", e.title), { kind: "reinsert-entry", token: removed.token }, () => change(back));
      } catch {
        toasts.failed(changeFailed("remove", e.title));
      }
    });

  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone });
  const dates = (e: ListEntry) => (
    <p className="ds-fine ds-muted">
      Added <time dateTime={e.addedAt}>{date.format(new Date(e.addedAt))}</time>
      {e.watchedAt && <> · Watched <time dateTime={e.watchedAt}>{date.format(new Date(e.watchedAt))}</time></>}
    </p>
  );
  const actions = (e: ListEntry) => (
    <>
      <Toggle label="Watched" aria-label={`Watched: ${e.title}`} checked={e.watchedAt !== null} onToggle={() => toggleWatched(e)} />
      <Button variant="secondary" icon="remove" aria-label={`Remove ${e.title}`} onClick={() => remove(e)}>Remove</Button>
    </>
  );
  const genresOf = (e: ListEntry) => e.genreIds.map((id) => genreNames[id]).filter(Boolean);

  const card = (e: ListEntry) => (
    <li key={e.id}>
      <FilmCard
        headingLevel={3}
        film={{
          title: e.title,
          original: e.originalTitle && e.originalTitle !== e.title ? { title: e.originalTitle, lang: e.originalLanguage ?? "" } : undefined,
          year: e.year ?? undefined,
          runtime: e.runtime ?? undefined,
          genres: genresOf(e),
          category: categoryFor(e.genreIds),
          poster: posterUrl(e.posterPath),
        }}
        showSynopsis={false}
        action={<div className="grid gap-2">{dates(e)}{actions(e)}</div>}
      />
    </li>
  );
  const row = (e: ListEntry) => (
    <li key={e.id} className="ds-row grid-cols-[44px_1fr]! sm:grid-cols-[44px_1fr_auto]!">
      <Poster title={e.title} year={e.year ?? undefined} src={posterUrl(e.posterPath)} />
      <div className="min-w-0">
        <h3 className="ds-heading text-xl">{e.title}</h3>
        <p className="ds-meta ds-muted">
          {[e.year, e.runtime && formatRuntime(e.runtime), genresOf(e).join(", ")].filter(Boolean).join(" · ")}
        </p>
        {dates(e)}
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1">{actions(e)}</div>
    </li>
  );

  const sorted = sortEntries(shown, settings.sort);
  const toWatch = sorted.filter((e) => e.watchedAt === null);
  const watched = sorted.filter((e) => e.watchedAt !== null);
  const section = (name: string, list: ListEntry[], none: string) => (
    <section className="mt-10">
      <h2 className="ds-heading mb-5 text-2xl">{name}</h2>
      {list.length === 0 ? (
        <p className="ds-body ds-muted">{none}</p>
      ) : settings.view === "cards" ? (
        <ul aria-label={name} className={GRID}>{list.map(card)}</ul>
      ) : (
        <ul aria-label={name} className="max-w-3xl">{list.map(row)}</ul>
      )}
    </section>
  );

  return (
    <>
      <p className="ds-label ds-rule mt-6 pt-4">
        {/* On a phone the line wraps at its dots, never inside a part ("2h 0m to go" stays whole). */}
        {monthHeader(month, shown).split(" · ").map((part, i) => (
          <Fragment key={i}>{i > 0 && " · "}<span className="whitespace-nowrap">{part}</span></Fragment>
        ))}
      </p>
      {shown.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Nothing saved yet!" action={<Link href="/" className={buttonClass("primary")}>Browse films</Link>}>
            Save a film on Browse and it joins this month&rsquo;s list.
          </EmptyState>
        </div>
      ) : (
        <>
          <ListControls settings={settings} onChange={saveSettings} />
          {section("Not watched yet", toWatch, "Everything’s watched. Time to pick more!")}
          {section("Watched", watched, "Nothing watched yet this month.")}
        </>
      )}
    </>
  );
}

function ListControls({ settings, onChange }: { settings: ListSettings; onChange: (next: ListSettings) => void }) {
  const sortId = useId();
  return (
    <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
      <fieldset>
        <legend className="ds-label mb-2">View</legend>
        <div className="flex flex-wrap gap-x-5">
          {VIEWS.map((v) => (
            <Check key={v.id} type="radio" name="my-list-view" label={v.label} checked={settings.view === v.id}
              onChange={() => onChange({ ...settings, view: v.id })} />
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={sortId} className="ds-label mb-2 block">Sort by</label>
        <Select id={sortId} value={settings.sort} onChange={(e) => onChange({ ...settings, sort: e.target.value as Sort })}>
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </Select>
      </div>
    </div>
  );
}
