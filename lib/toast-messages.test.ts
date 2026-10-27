// The shared toast's wording: one pattern for every change. A change that went through says what was done, in the past
// tense, to which Film and where; one that failed says the same thing as "Couldn’t …", then "Try again."
import { describe, expect, it } from "vitest";
import { alreadyInThisMonth, changeFailed, changeDone, UNDO_FAILED } from "./toast-messages";

describe("toast wording", () => {
  it.each([
    ["save", "Saved Heat to this month’s list."],
    ["add", "Added Heat to this month’s list."],
    ["remove", "Removed Heat from this month’s list."],
    ["watch", "Marked Heat Watched."],
    ["unwatch", "Marked Heat Not watched yet."],
  ] as const)("a %s that went through says what was done", (change, message) => {
    expect(changeDone(change, "Heat")).toBe(message);
  });

  it.each([
    ["save", "Couldn’t save Heat to this month’s list. Try again."],
    ["add", "Couldn’t add Heat to this month’s list. Try again."],
    ["remove", "Couldn’t remove Heat from this month’s list. Try again."],
    ["watch", "Couldn’t mark Heat Watched. Try again."],
    ["unwatch", "Couldn’t mark Heat Not watched yet. Try again."],
  ] as const)("a %s that failed says what couldn’t be done", (change, message) => {
    expect(changeFailed(change, "Heat")).toBe(message);
  });

  it("a Film already in this month’s list says so", () => {
    expect(alreadyInThisMonth("Heat")).toBe("Heat is already in this month’s list.");
  });

  it("a failed Undo says so in the same pattern", () => {
    expect(UNDO_FAILED).toBe("Couldn’t undo that. Try again.");
  });
});
