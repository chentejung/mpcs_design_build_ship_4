"use server";
// Changes to the signed-in user's list. The browser sends only a TMDB id, an Entry id, or for Undo of Remove the copy
// of the deleted row this server signed; the Film's details come from TMDB here, the month from the tz cookie, and
// user_id from the session token (AGENTS.md → Data model). Each action ends with refresh(), so the same response
// carries the page re-rendered: the card's Already saved, My List's rows and the tab count.
import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { deleteEntry, insertEntry, reinsertEntry } from "@/lib/entries";
import { getSnapshot } from "@/lib/films";
import { thisMonth } from "@/lib/this-month";
import type { UndoWrite } from "@/lib/undo";
import { signRemoved, undoSecret, verifyRemoved } from "@/lib/undo-token";

export type SaveResult = { status: "saved"; entryId: string } | { status: "already-saved" };

const MAX_INT = 2 ** 31 - 1; // tmdb_id is a Postgres integer
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function signedIn() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in to change your list");
  return userId;
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

// Writes a change's previous state back (lib/undo.ts). A copy that is forged, altered, expired or another user's is
// refused before anything is written.
export async function undoChange(undo: UndoWrite): Promise<void> {
  const userId = await signedIn();
  if (undo?.kind === "delete-entry" && typeof undo.entryId === "string" && UUID.test(undo.entryId)) {
    await deleteEntry(undo.entryId);
  } else if (undo?.kind === "reinsert-entry") {
    const entry = verifyRemoved(undo.token, { userId, secret: undoSecret(), now: Date.now() });
    if (!entry) throw new Error("That Undo is no longer valid");
    await reinsertEntry(entry);
  } else {
    throw new Error("Nothing to undo");
  }
  refresh();
}

// My List's Remove. Answers with the deleted row's signed copy, which the browser keeps for the 3-second Undo; null
// when there was nothing to remove.
export async function removeEntry(id: unknown): Promise<{ token: string } | null> {
  const userId = await signedIn();
  if (typeof id !== "string" || !UUID.test(id)) throw new Error("No such Entry");
  const secret = undoSecret(); // before deleting, so a missing secret can't leave a Remove without its Undo
  const removed = await deleteEntry(id);
  refresh();
  if (!removed) return null;
  const { user_id: _owner, ...entry } = removed; // eslint-disable-line @typescript-eslint/no-unused-vars -- bound by the signature instead
  return { token: signRemoved(entry, { userId, secret, now: Date.now() }) };
}
