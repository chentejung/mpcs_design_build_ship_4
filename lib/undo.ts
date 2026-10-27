// The shared Undo/error toast's rules (AGENTS.md → Product rules 6), kept pure so they can be tested on their own.
// Every change shows a toast for UNDO_MS; only the latest change can be undone, and only once; a failed write shows
// an error instead. The toast holds what Undo should write back, as data; the provider (components/bijou/toasts.tsx)
// runs it.

export const UNDO_MS = 3000;
export const ERROR_MS = 5000; // an error has no Undo, but needs long enough to be read

// What Undo writes back. Save (and, later, Add it to this month) is undone by deleting the Entry it made; Remove by
// re-inserting the deleted row from the server-signed copy (lib/undo-token.ts); marking or unmarking Watched by
// setting the Entry's previous watched_at again (null = Not watched yet).
export type UndoWrite =
  | { kind: "delete-entry"; entryId: string }
  | { kind: "reinsert-entry"; token: string }
  | { kind: "set-watched"; entryId: string; watchedAt: string | null };

export type Toast = { seq: number; tone: "notice" | "error"; message: string; undo: UndoWrite | null };
export type ToastState = { seq: number; toast: Toast | null };

export type ToastEvent =
  | { type: "changed"; message: string; undo: UndoWrite | null }
  | { type: "failed"; message: string }
  | { type: "expired"; seq: number }
  | { type: "undone"; seq: number };

export const EMPTY: ToastState = { seq: 0, toast: null };

export function toastReducer(state: ToastState, event: ToastEvent): ToastState {
  switch (event.type) {
    case "changed":
    case "failed": {
      // A new toast replaces the one on screen, and with it the older change's Undo.
      const seq = state.seq + 1;
      const toast: Toast =
        event.type === "changed"
          ? { seq, tone: "notice", message: event.message, undo: event.undo }
          : { seq, tone: "error", message: event.message, undo: null };
      return { seq, toast };
    }
    case "expired":
    case "undone":
      // A timer or button belonging to an older toast leaves the newer one alone.
      return state.toast?.seq === event.seq ? { ...state, toast: null } : state;
  }
}

// The Undo for toast `seq`, if that toast is still the one on screen.
export const undoFor = (state: ToastState, seq: number): UndoWrite | null =>
  state.toast?.seq === seq ? state.toast.undo : null;

// How Undo changes the My List tab count.
export const countChange = (undo: UndoWrite): number =>
  undo.kind === "delete-entry" ? -1 : undo.kind === "reinsert-entry" ? 1 : 0;
