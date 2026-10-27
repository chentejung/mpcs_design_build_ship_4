import { Suspense } from "react";
import { PreferenceForm } from "@/components/bijou/preference-form";
import { getGenres } from "@/lib/films";
import { requirePreferences } from "@/lib/preferences";

export const metadata = { title: "Preferences" };
export default function PreferencesPage() {
  return <Suspense><Preferences /></Suspense>;
}
async function Preferences() {
  const initial = await requirePreferences();
  const genres = await getGenres();
  return <section className="bijou-preferences">
    <p className="ds-label">Your Bijou</p>
    <h1 className="ds-display mt-3">Preferences</h1>
    <p className="ds-body mt-4">A new name? Different tastes? Make them yours.</p>
    <PreferenceForm genres={genres} initial={initial} />
  </section>;
}
