import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { HistoryList } from "@/components/bijou/history-list";
import { buttonClass, Select } from "@/components/system/controls";
import { EmptyState } from "@/components/system/motifs";
import type { SearchParams } from "@/lib/browse";
import { pastEntries, pastMonths, savedFilmIds } from "@/lib/entries";
import { getGenres } from "@/lib/films";
import { parseHistoryParams, type HistoryState, type MonthTotals } from "@/lib/history";
import { toListEntry } from "@/lib/my-list";
import { monthLong } from "@/lib/month";
import { thisMonth, userTimeZone } from "@/lib/this-month";

export const metadata: Metadata = { title: "History" };

// Every earlier month, read-only. proxy.ts already turns signed-out visitors away; auth.protect() checks again here.
export default function HistoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense>
      <History searchParams={searchParams} />
    </Suspense>
  );
}

async function History({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await auth.protect();
  const current = await thisMonth();
  const state = parseHistoryParams(await searchParams, current);
  const [months, entries, saved, genres, timeZone] = await Promise.all([
    pastMonths(current),
    pastEntries(current, state),
    savedFilmIds(current),
    // Genre names come from TMDB; without them the rows just leave the genres out.
    getGenres().catch((error) => {
      console.error(error);
      return [];
    }),
    userTimeZone(),
  ]);
  const shown = months
    .map((m) => ({ ...m, entries: entries.filter((e) => e.month === m.month).map(toListEntry) }))
    .filter((m) => m.entries.length > 0);

  return (
    <section className="pt-8 sm:pt-12">
      <p className="ds-label"><Link href="/my-list" className="ds-link">← This month</Link></p>
      <h1 className="ds-display mt-2">History</h1>
      {months.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No past months yet!">Each month you keep a list ends up here.</EmptyState>
        </div>
      ) : (
        <>
          <Filters months={months} state={state} />
          {shown.length === 0 ? (
            <EmptyState title="No films here!" action={<Link href="/my-list/history" className={buttonClass("primary")}>Clear filters</Link>}>
              {state.q ? <>Nothing in your past lists matches &ldquo;{state.q}&rdquo;.</> : "There was no list that month."}
            </EmptyState>
          ) : (
            <HistoryList months={shown} saved={saved} genreNames={Object.fromEntries(genres.map((g) => [g.id, g.name]))} timeZone={timeZone} />
          )}
        </>
      )}
    </section>
  );
}

// The month (Pulp select) and the title search (Pulp search field), kept in the URL: ?month=YYYY-MM&q=….
function Filters({ months, state }: { months: MonthTotals[]; state: HistoryState }) {
  const key = `${state.month}-${state.q}`; // keyed, so Back and Clear filters refill the fields
  return (
    <Form action="/my-list/history" role="search" className="mt-6 mb-8 flex max-w-2xl flex-wrap items-end gap-3">
      <div>
        <label htmlFor="history-month" className="ds-label mb-2 block">Month</label>
        <Select key={key} id="history-month" name="month" defaultValue={state.month?.slice(0, 7) ?? ""}>
          <option value="">All months</option>
          {months.map((m) => <option key={m.month} value={m.month.slice(0, 7)}>{monthLong(m.month)}</option>)}
        </Select>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <label htmlFor="history-search" className="ds-label mb-2 block">Search titles</label>
        <input key={key} id="history-search" name="q" type="search" defaultValue={state.q ?? ""} autoComplete="off" placeholder="Title or original title" className="ds-input w-full" />
      </div>
      <button type="submit" className={buttonClass("primary")}>Show</button>
      {(state.month || state.q) && <Link href="/my-list/history" className={buttonClass("secondary")}>Clear filters</Link>}
    </Form>
  );
}
