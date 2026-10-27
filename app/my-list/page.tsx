import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { removeEntry } from "@/app/actions/entries";
import { Button, buttonClass } from "@/components/system/controls";
import { EmptyState } from "@/components/system/motifs";
import { monthEntries } from "@/lib/entries";
import { monthLong } from "@/lib/month";
import { thisMonth } from "@/lib/this-month";

export const metadata: Metadata = { title: "My List" };

// This month's list, for now just its titles with a plain Remove each (the full page is #8). proxy.ts already turns
// signed-out visitors away; auth.protect() checks again here.
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
  const entries = await monthEntries(month);
  return (
    <section className="pt-8 sm:pt-12">
      <p className="ds-label">{monthLong(month)}</p>
      <h1 className="ds-display mt-2">My List</h1>
      <nav aria-label="My List" className="mt-4 mb-8">
        <Link href="/my-list/history" className="ds-link ds-body">History</Link>
      </nav>
      {entries.length === 0 ? (
        <EmptyState title="Nothing saved yet!" action={<Link href="/" className={buttonClass("primary")}>Browse films</Link>}>
          Save a film on Browse and it joins this month&rsquo;s list.
        </EmptyState>
      ) : (
        <ul aria-label="This month" className="max-w-2xl">
          {entries.map((e) => (
            <li key={e.id} className="ds-row grid-cols-[1fr_auto]!">
              <span>
                <span className="ds-heading text-xl">{e.title}</span>
                {e.release_year && <span className="ds-meta ds-muted"> · {e.release_year}</span>}
              </span>
              <form action={removeEntry}>
                <input type="hidden" name="id" value={e.id} />
                <Button type="submit" variant="secondary" icon="remove" aria-label={`Remove ${e.title}`}>Remove</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
