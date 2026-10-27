"use client";
// Save after sign-in (AGENTS.md → Product rules 7). A signed-out Save opens Clerk's sign-in modal; once the visitor
// has signed in (or up) there, Clerk sends them back to this page with `?save=<tmdb id>`, and Browse saves that Film.
// Clerk follows that redirect only after a sign-in, so closing the modal leaves nothing to save. The tab also keeps the
// Film in sessionStorage when Save is pressed, and the param counts only when it matches: a link carrying `?save=`
// can't save anything into someone's list. Both are cleared once used. Only the TMDB id ever reaches the server.
import { useClerk } from "@clerk/nextjs";

const KEY = "bijou:save-after-sign-in";
const PARAM = "save";

export type PendingSave = { id: number; title: string };

// Remembers the Film and opens the sign-in modal over the page, returning here with the Film in the URL.
export function useAskToSave() {
  const clerk = useClerk();
  return (film: PendingSave) => {
    sessionStorage.setItem(KEY, JSON.stringify({ id: film.id, title: film.title }));
    const url = new URL(window.location.href);
    url.searchParams.set(PARAM, String(film.id));
    const back = url.pathname + url.search;
    clerk.openSignIn({ forceRedirectUrl: back, signUpForceRedirectUrl: back });
  };
}

// The Film this tab asked to save before signing in, once the page is back from that sign-in, signed in; null if the
// URL carries no Film or one this tab didn't ask for. It comes off the URL and out of storage, so it's saved once.
export function takePendingSave(): PendingSave | null {
  const url = new URL(window.location.href);
  const param = url.searchParams.get(PARAM);
  if (param === null) return null;
  const stored = read();
  sessionStorage.removeItem(KEY);
  url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  return stored && String(stored.id) === param ? stored : null;
}

// On a page that isn't coming back from a sign-in, a Film still kept is from a Save whose modal was closed: drop it.
export function clearAbandonedSave() {
  if (!new URL(window.location.href).searchParams.has(PARAM)) sessionStorage.removeItem(KEY);
}

function read(): PendingSave | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    return Number.isInteger(value?.id) && typeof value?.title === "string" ? { id: value.id, title: value.title } : null;
  } catch {
    return null;
  }
}
