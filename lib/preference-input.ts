import { categoryByGenre } from "./categories";

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
