// The shared toast's wording (AGENTS.md → Product rules 6), one pattern for every change to a list. A change that went
// through says what was done, in the past tense, to which Film and where: "Saved Heat to this month’s list." One that
// failed says the same thing as "Couldn’t …" and adds "Try again.": "Couldn’t save Heat to this month’s list. Try again."

export type Change = "save" | "add" | "remove" | "watch" | "unwatch";

// [verb, past tense, what follows the title]
const WORDS: Record<Change, [string, string, string]> = {
  save: ["save", "Saved", " to this month’s list"],
  add: ["add", "Added", " to this month’s list"],
  remove: ["remove", "Removed", " from this month’s list"],
  watch: ["mark", "Marked", " Watched"],
  unwatch: ["mark", "Marked", " Not watched yet"],
};

export function changeDone(change: Change, title: string): string {
  const [, done, rest] = WORDS[change];
  return `${done} ${title}${rest}.`;
}

export function changeFailed(change: Change, title: string): string {
  const [verb, , rest] = WORDS[change];
  return `Couldn’t ${verb} ${title}${rest}. Try again.`;
}

export const alreadyInThisMonth = (title: string) => `${title} is already in this month’s list.`;

export const UNDO_FAILED = "Couldn’t undo that. Try again.";
