"use client";
// The shared Undo/error toast (AGENTS.md → Product rules 6), for every change to a list: Browse's Save now, My List's
// changes and History's Add it to this month later. Its rules live in lib/undo.ts; this runs them. It also carries
// the My List tab count's optimistic change, since the tab sits in the masthead and the change happens on the page.
import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useOptimistic, useReducer, useRef } from "react";
import { undoChange } from "@/app/actions/entries";
import { Toast } from "@/components/system/controls";
import { countChange, EMPTY, ERROR_MS, toastReducer, UNDO_MS, undoFor, type UndoWrite } from "@/lib/undo";

type Toasts = {
  // A change went through. `undo` is what writes it back; `onUndo` puts the page's optimistic state back with it.
  changed: (message: string, undo: UndoWrite | null, onUndo?: () => void) => void;
  // A write failed; its optimistic state has already rolled back.
  failed: (message: string) => void;
  // Inside a transition: move the tab count until the server's count arrives.
  moveCount: (by: number) => void;
  countMoved: number;
};

const ToastsContext = createContext<Toasts | null>(null);

export function useToasts() {
  const toasts = useContext(ToastsContext);
  if (!toasts) throw new Error("useToasts needs <ToastProvider>");
  return toasts;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(toastReducer, EMPTY);
  const [countMoved, moveCount] = useOptimistic(0, (moved, by: number) => moved + by);
  const onUndo = useRef<(() => void) | undefined>(undefined); // the latest change's, the only one Undo can reach
  const { toast } = state;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch({ type: "expired", seq: toast.seq }), toast.tone === "error" ? ERROR_MS : UNDO_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const changed = useCallback((message: string, undo: UndoWrite | null, revert?: () => void) => {
    onUndo.current = revert;
    dispatch({ type: "changed", message, undo });
  }, []);
  const failed = useCallback((message: string) => {
    onUndo.current = undefined;
    dispatch({ type: "failed", message });
  }, []);

  const undo = (seq: number) => {
    const write = undoFor(state, seq);
    if (!write) return;
    const revert = onUndo.current;
    onUndo.current = undefined;
    dispatch({ type: "undone", seq });
    startTransition(async () => {
      revert?.();
      moveCount(countChange(write));
      try {
        await undoChange(write);
      } catch {
        failed("Couldn’t undo that. Try again.");
      }
    });
  };

  const value = useMemo(() => ({ changed, failed, moveCount, countMoved }), [changed, failed, moveCount, countMoved]);

  return (
    <ToastsContext.Provider value={value}>
      {children}
      {/* Both live regions stay on the page, so what appears in them is announced. */}
      <div className="bijou-toasts">
        <div role="status">
          {toast?.tone === "notice" && (
            <Toast
              key={toast.seq}
              action={toast.undo && (
                <button type="button" className="ds-link ds-body" onClick={() => undo(toast.seq)}>Undo</button>
              )}
            >
              {toast.message}
            </Toast>
          )}
        </div>
        <div role="alert">
          {toast?.tone === "error" && <Toast key={toast.seq} tone="error">{toast.message}</Toast>}
        </div>
      </div>
    </ToastsContext.Provider>
  );
}
