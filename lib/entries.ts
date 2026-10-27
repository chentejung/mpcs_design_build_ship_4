// Entries in movie_list_entries, read and written as the signed-in user (lib/supabase.ts). Queries filter by month,
// tmdb_id or id only, never by user_id: RLS alone separates users (AGENTS.md → Data access), and the column default
// fills user_id from the token on insert.
import "server-only";
import type { Database } from "./database.types";
import type { Snapshot } from "./films";
import { supabase } from "./supabase";

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

// Deletes an Entry; RLS keeps it to the user's own, and the History trigger to a current month.
export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase().from("movie_list_entries").delete().eq("id", id);
  if (error) fail("removing an Entry", error);
}
