import { describe, expect, it } from "vitest";
import { countChange, EMPTY, toastReducer, UNDO_MS, undoFor, type ToastState } from "./undo";

const save = (s: ToastState, entryId = "e1") =>
  toastReducer(s, { type: "changed", message: "Saved Alien.", undo: { kind: "delete-entry", entryId } });

describe("the Undo toast", () => {
  it("lasts three seconds", () => {
    expect(UNDO_MS).toBe(3000);
  });

  it("a change shows a toast that can undo it", () => {
    const s = save(EMPTY);
    expect(s.toast).toMatchObject({ tone: "notice", message: "Saved Alien." });
    expect(undoFor(s, s.toast!.seq)).toEqual({ kind: "delete-entry", entryId: "e1" });
  });

  it("only the latest change is undoable", () => {
    const first = save(EMPTY, "e1");
    const second = save(first, "e2");
    expect(undoFor(second, first.toast!.seq)).toBeNull();
    expect(undoFor(second, second.toast!.seq)).toEqual({ kind: "delete-entry", entryId: "e2" });
  });

  it("expiring takes the toast and its Undo away", () => {
    const s = save(EMPTY);
    const expired = toastReducer(s, { type: "expired", seq: s.toast!.seq });
    expect(expired.toast).toBeNull();
    expect(undoFor(expired, s.toast!.seq)).toBeNull();
  });

  it("an older toast's timer doesn't take a newer toast away", () => {
    const first = save(EMPTY, "e1");
    const second = save(first, "e2");
    expect(toastReducer(second, { type: "expired", seq: first.toast!.seq })).toBe(second);
  });

  it("an Undo can be taken once", () => {
    const s = save(EMPTY);
    const undone = toastReducer(s, { type: "undone", seq: s.toast!.seq });
    expect(undone.toast).toBeNull();
    expect(undoFor(undone, s.toast!.seq)).toBeNull();
  });

  it("a failed write shows an error, with nothing to undo, and replaces any Undo", () => {
    const s = toastReducer(save(EMPTY), { type: "failed", message: "Couldn't save Alien." });
    expect(s.toast).toMatchObject({ tone: "error", message: "Couldn't save Alien." });
    expect(undoFor(s, s.toast!.seq)).toBeNull();
  });

  it("a notice without an Undo can't be undone", () => {
    const s = toastReducer(EMPTY, { type: "changed", message: "Already saved.", undo: null });
    expect(s.toast).toMatchObject({ tone: "notice", message: "Already saved." });
    expect(undoFor(s, s.toast!.seq)).toBeNull();
  });

  it("undoing a Save takes one off the My List count", () => {
    expect(countChange({ kind: "delete-entry", entryId: "e1" })).toBe(-1);
  });

  it("undoing a Remove puts one back on the My List count", () => {
    expect(countChange({ kind: "reinsert-entry", token: "signed.copy" })).toBe(1);
  });

  it("a Watched change's Undo writes back the previous watched date, and only the latest one can be undone", () => {
    const watched = (s: ToastState, entryId: string, watchedAt: string | null) =>
      toastReducer(s, { type: "changed", message: "Marked watched.", undo: { kind: "set-watched", entryId, watchedAt } });
    const first = watched(EMPTY, "e1", null);
    const second = watched(first, "e2", "2026-10-12T20:15:31.123456+00:00");
    expect(undoFor(second, first.toast!.seq)).toBeNull();
    expect(undoFor(second, second.toast!.seq)).toEqual({
      kind: "set-watched", entryId: "e2", watchedAt: "2026-10-12T20:15:31.123456+00:00",
    });
  });

  it("undoing a Watched change leaves the My List count alone", () => {
    expect(countChange({ kind: "set-watched", entryId: "e1", watchedAt: null })).toBe(0);
  });
});
