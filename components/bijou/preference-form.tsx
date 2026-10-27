"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, updatePreferences } from "@/app/actions/preferences";
import { categoryByGenre } from "@/lib/categories";
import type { Genre } from "@/lib/films";
import type { PreferenceInput, PreferenceState } from "@/lib/preference-input";
import { buttonClass } from "@/components/system/controls";
import { PulpGenreIcon } from "@/components/system/pulp/genre";

export function PreferenceForm({ genres, initial }: { genres: Genre[]; initial?: PreferenceInput }) {
  const [state, action, pending] = useActionState<PreferenceState, FormData>(initial ? updatePreferences : completeOnboarding, {});
  const [name, setName] = useState(initial?.display_name ?? "");
  const [selected, setSelected] = useState(initial?.favorite_genre_ids ?? []);
  const [changed, setChanged] = useState(false);
  return (
    <form action={action} onChange={() => setChanged(true)}>
      <div className="mt-8 max-w-md">
        <label htmlFor="display-name" className="ds-label mb-2 block">What should we call you?</label>
        <input id="display-name" name="display_name" autoComplete="nickname" required maxLength={100} value={name}
          onChange={(event) => setName(event.target.value)} className="ds-input w-full" disabled={pending}
          aria-invalid={!!state.errors?.name} aria-describedby={state.errors?.name ? "name-error name-help" : "name-help"} />
        <p id="name-help" className="ds-body ds-muted mt-2">Your name or nickname, up to 50 characters.</p>
        {state.errors?.name && <p id="name-error" className="ds-body bijou-preference-error" role="alert">{state.errors.name}</p>}
      </div>
      <fieldset disabled={pending} aria-describedby={state.errors?.genres ? "genre-help genre-error" : "genre-help"}>
        <legend className="ds-kicker">What kinds of films do you like?</legend>
        <p id="genre-help" className="ds-body ds-muted mb-4">Choose at least one. You can change your picks in Preferences anytime.</p>
        <div className="bijou-preference-genres">
          {genres.map((genre) => (
            <label key={genre.id} className="bijou-genre-choice">
              <input type="checkbox" name="favorite_genre_ids" value={genre.id} checked={selected.includes(genre.id)}
                onChange={(event) => setSelected(event.target.checked ? [...selected, genre.id] : selected.filter((id) => id !== genre.id))} />
              <span className="ds-chip" data-selected={selected.includes(genre.id)}>
                {categoryByGenre[genre.id] && <PulpGenreIcon id={categoryByGenre[genre.id]} className="ds-genre-icon" />}
                {genre.name}<span aria-hidden="true" className="bijou-choice-mark">{selected.includes(genre.id) ? "✓" : "+"}</span>
              </span>
            </label>
          ))}
        </div>
        {state.errors?.genres && <p id="genre-error" className="ds-body bijou-preference-error" role="alert">{state.errors.genres}</p>}
      </fieldset>
      {state.message && <p role="alert" className="ds-body mb-4">{state.message}</p>}
      <button type="submit" className={buttonClass("primary")} disabled={pending} onClick={() => setChanged(false)}>
        {pending ? "Saving…" : initial ? "Save preferences" : "Start browsing"}
      </button>
      {state.saved && !changed && <p role="status" className="ds-body mt-4">Preferences saved.</p>}
    </form>
  );
}
