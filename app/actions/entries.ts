"use server";
// Changes to the signed-in user's list. The browser sends only a TMDB id, an Entry id (for Add it to this month, a
// past one), for Undo of Remove the copy of the deleted row this server signed, or for Undo of a Watched change the
// previous watched date; the Film's details come from TMDB here (or, for Add it to this month, from the past Entry's
// snapshot), the month from the tz cookie, and user_id from the session token (AGENTS.md → Data model). Each action
// ends with refresh(), so the same response carries the page re-rendered: the card's Already saved, My List's rows,
// History's Already saved and the tab count.
import { auth } from "@clerk/nextjs/server";
import { refresh } from "next/cache";
import { deleteEntry, insertEntry, pastSnapshot, reinsertEntry, setWatchedAt } from "@/lib/entries";
import { getSnapshot } from "@/lib/films";
import { thisMonth } from "@/lib/this-month";
import type { UndoWrite } from "@/lib/undo";
import { signRemoved, undoSecret, verifyRemoved } from "@/lib/undo-token";

export type SaveResult = { status: "saved"; entryId: string } | { status: "already-saved" };

const MAX_INT = 2 ** 31 - 1; // tmdb_id is a Postgres integer
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isEntryId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);
// A watched date to write back: null (Not watched yet) or a timestamp Postgres gave us.
const isWatchedAt = (at: unknown): at is string | null => at === null || (typeof at === "string" && at.length <= 40 && !Number.isNaN(Date.parse(at)));

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

// History's Add it to this month (AGENTS.md → Product rules 4): a new Not-watched-yet Entry this month, copying a past
// Entry's snapshot. The browser sends only that Entry's id; the past Entry itself is left as it is.
export async function addToThisMonth(entryId: unknown): Promise<SaveResult> {
  await signedIn();
  if (!isEntryId(entryId)) throw new Error("No such Entry");
  const month = await thisMonth();
  const film = await pastSnapshot(month, entryId);
  if (!film) throw new Error("That Entry isn't in your History");
  const entry = await insertEntry(month, film);
  refresh();
  return entry ? { status: "saved", entryId: entry.id } : { status: "already-saved" };
}

// Writes a change's previous state back (lib/undo.ts). A copy that is forged, altered, expired or another user's is
// refused before anything is written.
export async function undoChange(undo: UndoWrite): Promise<void> {
  const userId = await signedIn();
  if (undo?.kind === "delete-entry" && isEntryId(undo.entryId)) {
    await deleteEntry(undo.entryId);
  } else if (undo?.kind === "set-watched" && isEntryId(undo.entryId) && isWatchedAt(undo.watchedAt)) {
    if (!(await setWatchedAt(await thisMonth(), undo.entryId, undo.watchedAt))) throw new Error("That Entry is gone");
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
  if (!isEntryId(id)) throw new Error("No such Entry");
  const secret = undoSecret(); // before deleting, so a missing secret can't leave a Remove without its Undo
  const removed = await deleteEntry(id);
  refresh();
  if (!removed) return null;
  const { user_id: _owner, ...entry } = removed; // eslint-disable-line @typescript-eslint/no-unused-vars -- bound by the signature instead
  return { token: signRemoved(entry, { userId, secret, now: Date.now() }) };
}

// My List's Watched toggle: marks the Entry Watched now (the server's clock) or Not watched yet. The browser keeps the
// previous watched date for the 3-second Undo, which writes it back through undoChange.
export async function markWatched(id: unknown, watched: unknown): Promise<{ watchedAt: string | null }> {
  await signedIn();
  if (!isEntryId(id) || typeof watched !== "boolean") throw new Error("No such Entry");
  const entry = await setWatchedAt(await thisMonth(), id, watched ? new Date().toISOString() : null);
  refresh();
  if (!entry) throw new Error("That Entry isn't in this month's list");
  return { watchedAt: entry.watched_at };
}
