import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PreferenceForm } from "@/components/bijou/preference-form";
import { getGenres } from "@/lib/films";
import { readPreferences } from "@/lib/preferences";

export const metadata = { title: "Welcome to The Bijou" };
export default function OnboardingPage() {
  return <Suspense><Onboarding /></Suspense>;
}
async function Onboarding() {
  await auth.protect();
  if (await readPreferences()) redirect("/");
  const genres = await getGenres();
  return <section className="bijou-preferences">
    <p className="ds-label">Your first visit · Two quick questions</p>
    <h1 className="ds-display mt-3">Make yourself at home.</h1>
    <p className="ds-body mt-4">Tell us your name and favorite genres to finish setting up your account.</p>
    <PreferenceForm genres={genres} />
  </section>;
}
