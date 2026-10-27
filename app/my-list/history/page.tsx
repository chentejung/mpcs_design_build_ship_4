import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/system/motifs";

export const metadata: Metadata = { title: "History" };

// Every earlier month, read-only. proxy.ts already turns signed-out visitors away; auth.protect() checks again here.
export default function HistoryPage() {
  return (
    <Suspense>
      <History />
    </Suspense>
  );
}

async function History() {
  await auth.protect();
  return (
    <section className="pt-8 sm:pt-12">
      <p className="ds-label"><Link href="/my-list" className="ds-link">← This month</Link></p>
      <h1 className="ds-display mt-2">History</h1>
      <div className="mt-8">
        <EmptyState title="No past months yet!">Each month you keep a list ends up here.</EmptyState>
      </div>
    </section>
  );
}
