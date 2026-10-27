import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PreferenceForm } from "@/components/bijou/preference-form";
import { getGenres } from "@/lib/films";
import type { SearchParams } from "@/lib/browse";
import { pendingSaveId, withPendingSave } from "@/lib/preference-input";
import { readPreferences } from "@/lib/preferences";

export const metadata = { title: "Welcome to The Bijou" };
export default function OnboardingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <Suspense><Onboarding searchParams={searchParams} /></Suspense>;
}
async function Onboarding({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await auth.protect();
  const save = pendingSaveId((await searchParams).save);
  if (await readPreferences()) redirect(withPendingSave("/", save));
  const genres = await getGenres();
  return <section className="bijou-preferences">
    <p className="ds-label">Your first visit · Two quick questions</p>
    <h1 className="ds-display mt-3">Make yourself at home.</h1>
    <p className="ds-body mt-4">Tell us your name and favorite genres to finish setting up your account.</p>
    <PreferenceForm genres={genres} save={save} />
  </section>;
}
