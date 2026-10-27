"use client";

import { startTransition, useActionState, useState } from "react";
import { completeOnboarding, updatePreferences } from "@/app/actions/preferences";
import { categoryByGenre } from "@/lib/categories";
import type { Genre } from "@/lib/films";
import { parsePreferences, type PreferenceInput, type PreferenceState } from "@/lib/preference-input";
import { buttonClass } from "@/components/system/controls";
import { PulpGenreIcon } from "@/components/system/pulp/genre";

// The rules the server checks (lib/preference-input.ts), run on what's in the form now.
function rulesBroken(name: string, genreIds: number[]) {
  const form = new FormData();
  form.set("display_name", name);
  for (const id of genreIds) form.append("favorite_genre_ids", String(id));
  return parsePreferences(form).errors ?? {};
}

// Onboarding (no `initial`) numbers its two questions; Preferences edits the same answers. A question's rule shows
// under it, in bold red, once that question has been left empty or the form was sent with it empty, and goes as soon
// as it's answered. The server checks the same rules again.
export function PreferenceForm({ genres, initial, save }: { genres: Genre[]; initial?: PreferenceInput; save?: string | null }) {
  const [state, action, pending] = useActionState<PreferenceState, FormData>(initial ? updatePreferences : completeOnboarding, {});
  const [name, setName] = useState(initial?.display_name ?? "");
  const [selected, setSelected] = useState(initial?.favorite_genre_ids ?? []);
  const [changed, setChanged] = useState(false);
  const [touched, setTouched] = useState({ name: false, genres: false });
  const [sent, setSent] = useState(false);
  const broken = rulesBroken(name, selected);
  const nameError = (touched.name || sent) && broken.name;
  const genreError = (touched.genres || sent) && broken.genres;
  const step = (n: number) => !initial && (
    <span className="bijou-step"><span className="sr-only">Step </span>{n}<span className="sr-only"> of 2</span></span>
  );
  return (
    <form
      noValidate // the rules below say what's missing, instead of the browser's own bubble
      onChange={() => setChanged(true)}
      onSubmit={(event) => {
        // Sent by hand rather than through <form action>: React resets a form after its action succeeds, which put
        // the boxes back to how the page first drew them while the picks just saved were still in state.
        event.preventDefault();
        setSent(true);
        if (broken.name || broken.genres) return;
        const form = new FormData(event.currentTarget);
        startTransition(() => action(form));
      }}
    >
      {save && <input type="hidden" name="save" value={save} />}
      <div className="mt-8 max-w-md">
        <div className="bijou-step-row mb-3">
          {step(1)}
          <label htmlFor="display-name" className="ds-kicker">What should we call you?</label>
        </div>
        <input id="display-name" name="display_name" autoComplete="nickname" required maxLength={100} value={name}
          onChange={(event) => setName(event.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          className="ds-input w-full" disabled={pending}
          aria-invalid={!!nameError} aria-describedby={nameError ? "name-error name-help" : "name-help"} />
        <p id="name-help" className="ds-body ds-muted mt-2">Your name or nickname, up to 50 characters.</p>
        {nameError && <p id="name-error" className="ds-body bijou-preference-error" role="alert">{broken.name}</p>}
      </div>
      <fieldset disabled={pending} aria-describedby={genreError ? "genre-help genre-error" : "genre-help"}>
        <legend className="bijou-step-row">
          {step(2)}
          <span className="ds-kicker">What kinds of films do you like?</span>
        </legend>
        <p id="genre-help" className="ds-body ds-muted mb-4">Choose at least one. You can change your picks in Preferences anytime.</p>
        <div className="bijou-preference-genres">
          {genres.map((genre) => (
            <label key={genre.id} className="bijou-genre-choice">
              <input type="checkbox" name="favorite_genre_ids" value={genre.id} checked={selected.includes(genre.id)}
                onChange={(event) => {
                  setSelected(event.target.checked ? [...selected, genre.id] : selected.filter((id) => id !== genre.id));
                  setTouched((t) => ({ ...t, genres: true }));
                }} />
              <span className="ds-chip" data-selected={selected.includes(genre.id)}>
                {categoryByGenre[genre.id] && <PulpGenreIcon id={categoryByGenre[genre.id]} className="ds-genre-icon" />}
                {genre.name}<span aria-hidden="true" className="bijou-choice-mark">{selected.includes(genre.id) ? "✓" : "+"}</span>
              </span>
            </label>
          ))}
        </div>
        {genreError && <p id="genre-error" className="ds-body bijou-preference-error" role="alert">{broken.genres}</p>}
      </fieldset>
      {state.message && <p role="alert" className="ds-body mb-4">{state.message}</p>}
      <button type="submit" className={buttonClass("primary")} disabled={pending} onClick={() => setChanged(false)}>
        {pending ? "Saving…" : initial ? "Save preferences" : "Start browsing"}
      </button>
      {state.saved && !changed && <p role="status" className="ds-body mt-4">Preferences saved.</p>}
    </form>
  );
}
