import { Suspense } from "react";
import { Browse } from "@/components/bijou/browse";
import { CardSkeletons } from "@/components/bijou/browse-results";
import { HeroMotif, Ornament } from "@/components/system/motifs";
import type { SearchParams } from "@/lib/browse";

export default function BrowsePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <section className="grid items-center gap-x-10 gap-y-6 pt-6 pb-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:pt-12 md:pt-14">
        <div className="sm:hidden">
          <HeroMotif wide />
        </div>
        <div className="min-w-0">
          <p className="ds-label bijou-mobile-hide flex items-center gap-2">
            <Ornament /> Now showing · Every month
          </p>
          <h1 className="ds-display mt-3">Pick this month&rsquo;s films.</h1>
          <p className="ds-kicker bijou-mobile-hide mt-4">Now playing! Top rated! All of TMDB!</p>
          <p className="ds-body ds-muted mt-4 max-w-xl">
            Browse what&rsquo;s in cinemas or the all-time greats. Save a film and it joins this month&rsquo;s list.
          </p>
        </div>
        <div className="hidden sm:block">
          <HeroMotif />
        </div>
      </section>
      <Suspense fallback={<CardSkeletons />}>
        <Browse searchParams={searchParams} />
      </Suspense>
    </>
  );
}
