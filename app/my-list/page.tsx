import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ThisMonthList } from "@/components/bijou/this-month-list";
import { monthEntries } from "@/lib/entries";
import { getGenres } from "@/lib/films";
import { toListEntry } from "@/lib/my-list";
import { thisMonth, userTimeZone } from "@/lib/this-month";

export const metadata: Metadata = { title: "My List" };

// This month's list, editable (History is the read-only rest). A slim heading rather than Browse's hero. proxy.ts
// already turns signed-out visitors away; auth.protect() checks again here.
export default function MyListPage() {
  return (
    <Suspense>
      <MyList />
    </Suspense>
  );
}

async function MyList() {
  await auth.protect();
  const month = await thisMonth();
  const [entries, genres, timeZone] = await Promise.all([
    monthEntries(month),
    // Genre names come from TMDB; without them the cards just leave the genres out.
    getGenres().catch((error) => {
      console.error(error);
      return [];
    }),
    userTimeZone(),
  ]);
  return (
    <section className="pt-8 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h1 className="ds-display">My List</h1>
        <nav aria-label="My List">
          <Link href="/my-list/history" className="ds-link ds-body">History</Link>
        </nav>
      </div>
      <ThisMonthList
        month={month}
        entries={entries.map(toListEntry)}
        genreNames={Object.fromEntries(genres.map((g) => [g.id, g.name]))}
        timeZone={timeZone}
      />
    </section>
  );
}
