"use client";
// My List's cards/rows view and sort, kept in localStorage so they survive a reload on the same device (AGENTS.md →
// Routes and URL state). The server, and the first render after it, use the default; the saved choice follows.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { parseSettings, SETTINGS_KEY, type ListSettings } from "@/lib/my-list";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange); // another tab changed it
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function read() {
  try {
    return localStorage.getItem(SETTINGS_KEY);
  } catch {
    return null; // storage blocked: the default
  }
}

export function useListSettings(): [ListSettings, (next: ListSettings) => void] {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  const settings = useMemo(() => parseSettings(raw), [raw]);
  const save = useCallback((next: ListSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // storage blocked or full: nothing to remember it in
    }
    listeners.forEach((l) => l());
  }, []);
  return [settings, save];
}
