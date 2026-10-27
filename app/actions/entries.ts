"use server";
// Changes to the signed-in user's list. The browser sends only a TMDB id or an Entry id; the Film's details come from
// TMDB here, the month from the tz cookie, and user_id from the session token (AGENTS.md → Data model). Each action
// ends with refresh(), so the same response carries the page re-rendered: the card's Already saved and the tab count.
import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { deleteEntry, insertEntry } from "@/lib/entries";
import { getSnapshot } from "@/lib/films";
import { thisMonth } from "@/lib/this-month";
import type { UndoWrite } from "@/lib/undo";

export type SaveResult = { status: "saved"; entryId: string } | { status: "already-saved" };

const MAX_INT = 2 ** 31 - 1; // tmdb_id is a Postgres integer
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function signedIn() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to change your list");
}

// Save = add to this month's list, Not watched yet. A Film already there answers already-saved, not an error.
export async function saveFilm(tmdbId: unknown): Promise<SaveResult> {
  await signedIn();
  if (typeof tmdbId !== "number" || !Number.isInteger(tmdbId) || tmdbId < 1 || tmdbId > MAX_INT) throw new Error("No such film");
  const [month, film] = await Promise.all([thisMonth(), getSnapshot(tmdbId)]);
  const entry = await insertEntry(month, film);
  refresh();
  return entry ? { status: "saved", entryId: entry.id } : { status: "already-saved" };
}

// Writes a change's previous state back (lib/undo.ts).
export async function undoChange(undo: UndoWrite): Promise<void> {
  await signedIn();
  if (undo?.kind !== "delete-entry" || typeof undo.entryId !== "string" || !UUID.test(undo.entryId)) throw new Error("Nothing to undo");
  await deleteEntry(undo.entryId);
  refresh();
}

// My List's Remove.
export async function removeEntry(formData: FormData): Promise<void> {
  await signedIn();
  const id = formData.get("id");
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("No such Entry");
  await deleteEntry(id);
  refresh();
}
