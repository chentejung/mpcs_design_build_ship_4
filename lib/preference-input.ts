import { categoryByGenre } from "./categories";

// The Film a visitor pressed Save on before signing up (components/bijou/save-after-sign-in.ts), carried through
// onboarding as `?save=<tmdb id>` so it isn't lost on the way. Browse still saves it only if the tab asked for it.
export const pendingSaveId = (value: unknown): string | null =>
  typeof value === "string" && /^[1-9]\d{0,9}$/.test(value) ? value : null;
export const withPendingSave = (path: string, save: string | null) => (save ? `${path}?save=${save}` : path);

export type PreferenceInput = { display_name: string; favorite_genre_ids: number[] };
export type PreferenceState = { errors?: { name?: string; genres?: string }; message?: string; saved?: boolean };

export function parsePreferences(form: FormData): { value: PreferenceInput; errors?: never } | { value?: never; errors: NonNullable<PreferenceState["errors"]> } {
  const name = form.get("display_name");
  const display_name = typeof name === "string" ? name.trim() : "";
  const raw = form.getAll("favorite_genre_ids");
  const ids = raw.map((id) => typeof id === "string" && /^\d+$/.test(id) ? Number(id) : NaN);
  const errors: NonNullable<PreferenceState["errors"]> = {};
  if (!display_name || [...display_name].length > 50 || /[\p{Cc}\p{Cf}]/u.test(display_name)) errors.name = "Enter a name between 1 and 50 characters.";
  if (!ids.length || ids.length > 19 || ids.some((id) => !Object.hasOwn(categoryByGenre, id))) errors.genres = "Choose at least one of the genres below.";
  return Object.keys(errors).length ? { errors } : { value: { display_name, favorite_genre_ids: [...new Set(ids)] } };
}
