// Entries in movie_list_entries, read and written as the signed-in user (lib/supabase.ts). Queries filter by month,
// tmdb_id or id only, never by user_id: RLS alone separates users (AGENTS.md → Data access), and the column default
// fills user_id from the token on insert.
import "server-only";
import type { Database } from "./database.types";
import type { Snapshot } from "./films";
import { monthTotals, titlePattern, type HistoryState, type MonthTotals } from "./history";
import { supabase } from "./supabase";
import type { RemovedEntry } from "./undo-token";

export type Entry = Database["public"]["Tables"]["movie_list_entries"]["Row"];

const UNIQUE_VIOLATION = "23505";

function fail(what: string, error: { message: string; code?: string }): never {
  throw new Error(`Supabase ${what}: ${error.message}${error.code ? ` (${error.code})` : ""}`);
}

// Browse's Already saved: the TMDB ids in this month's list.
export async function savedFilmIds(month: string): Promise<number[]> {
  const { data, error } = await supabase().from("movie_list_entries").select("tmdb_id").eq("month", month);
  if (error) fail("reading this month's films", error);
  return data.map((e) => e.tmdb_id);
}

// The My List tab's (n).
export async function countEntries(month: string): Promise<number> {
  const { count, error } = await supabase()
    .from("movie_list_entries")
    .select("id", { count: "exact", head: true })
    .eq("month", month);
  if (error) fail("counting this month's list", error);
  return count ?? 0;
}

// This month's Entries, oldest first (the order they were added).
export async function monthEntries(month: string): Promise<Entry[]> {
  const { data, error } = await supabase()
    .from("movie_list_entries")
    .select("*")
    .eq("month", month)
    .order("added_at", { ascending: true });
  if (error) fail("reading this month's list", error);
  return data;
}

// A new Not-watched-yet Entry; null when this month's list already has the Film (one Entry per Film per month).
export async function insertEntry(month: string, film: Snapshot): Promise<{ id: string } | null> {
  const { data, error } = await supabase()
    .from("movie_list_entries")
    .insert({ month, ...film })
    .select("id")
    .single();
  if (error?.code === UNIQUE_VIOLATION) return null;
  if (error) fail("saving an Entry", error);
  return data;
}

// Deletes an Entry and returns the deleted row (null if there was none to delete). RLS keeps it to the user's own,
// and the History trigger to a current month.
export async function deleteEntry(id: string): Promise<Entry | null> {
  const { data, error } = await supabase().from("movie_list_entries").delete().eq("id", id).select("*").maybeSingle();
  if (error) fail("removing an Entry", error);
  return data;
}

// Marks an Entry in this month's list Watched (a date) or Not watched yet (null), and returns it (null if there is no
// such Entry this month). watched_at is the only column that changes; the History trigger allows nothing else.
export async function setWatchedAt(month: string, id: string, watchedAt: string | null): Promise<Entry | null> {
  const { data, error } = await supabase()
    .from("movie_list_entries")
    .update({ watched_at: watchedAt })
    .eq("month", month)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) fail("marking an Entry watched", error);
  return data;
}

// Undo of Remove: the exact deleted row back (same id, added_at and watched_at), from the copy the server signed
// (lib/undo-token.ts). user_id is not in the copy; the column default fills it from the token, and RLS checks it.
export async function reinsertEntry(entry: RemovedEntry): Promise<void> {
  const { error } = await supabase().from("movie_list_entries").insert(entry);
  if (error) fail("putting an Entry back", error);
}

// History's months: every month before this one with an Entry, newest first, with its planned and watched counts.
export async function pastMonths(current: string): Promise<MonthTotals[]> {
  const { data, error } = await supabase().from("movie_list_entries").select("month, watched_at").lt("month", current);
  if (error) fail("reading History's months", error);
  return monthTotals(data);
}

// History's Entries before this month, newest month first and in the order added within it; narrowed to one month
// and/or to titles or original titles containing `q`, taken literally (lib/history.ts).
export async function pastEntries(current: string, { month, q }: HistoryState): Promise<Entry[]> {
  let query = supabase().from("movie_list_entries").select("*").lt("month", current);
  if (month) query = query.eq("month", month);
  if (q) {
    // Quoted for PostgREST's or=(…), where a comma or parenthesis would otherwise end the value.
    const value = `"${titlePattern(q).replace(/["\\]/g, "\\$&")}"`;
    query = query.or(`title.ilike.${value},original_title.ilike.${value}`);
  }
  const { data, error } = await query.order("month", { ascending: false }).order("added_at", { ascending: true });
  if (error) fail("reading History", error);
  return data;
}

// One Entry from History, for Add it to this month: its snapshot of the Film (null if there is no such Entry before
// this month, or it isn't the user's).
export async function pastSnapshot(current: string, id: string): Promise<Snapshot | null> {
  const { data, error } = await supabase()
    .from("movie_list_entries")
    .select("tmdb_id, title, original_title, original_language, release_year, runtime, poster_path, genre_ids, overview")
    .lt("month", current)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("reading a past Entry", error);
  return data;
}

// Browse's "In your Sep 2026 list": for each of the given Films that was in a list before this month, the latest
// such month.
export async function lastListedMonths(current: string, tmdbIds: number[]): Promise<Record<number, string>> {
  if (tmdbIds.length === 0) return {};
  const { data, error } = await supabase()
    .from("movie_list_entries")
    .select("tmdb_id, month")
    .lt("month", current)
    .in("tmdb_id", tmdbIds)
    .order("month", { ascending: false });
  if (error) fail("reading past months for Browse", error);
  const latest: Record<number, string> = {};
  for (const e of data) latest[e.tmdb_id] ??= e.month;
  return latest;
}
