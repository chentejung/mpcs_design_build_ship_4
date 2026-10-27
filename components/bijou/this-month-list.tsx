"use client";
// This month's titles on the minimal My List (the full page is #8). Remove is a change like Save: the row goes at once,
// comes back if the write fails, and the shared toast offers a 3-second Undo that re-inserts the very same Entry from
// the copy the server signed.
import { startTransition, useOptimistic } from "react";
import { removeEntry } from "@/app/actions/entries";
import { Button } from "@/components/system/controls";
import { useToasts } from "./toasts";

export type ListRow = { id: string; title: string; year: number | null; addedAt: string };

export function ThisMonthList({ rows }: { rows: ListRow[] }) {
  const toasts = useToasts();
  // While a Remove (or its Undo) is in flight, the list shows the result; the server's list takes over once it answers.
  const [shown, change] = useOptimistic(rows, (list, c: { remove: string } | { restore: ListRow }) =>
    "remove" in c
      ? list.filter((r) => r.id !== c.remove)
      : [...list.filter((r) => r.id !== c.restore.id), c.restore].sort((a, b) => a.addedAt.localeCompare(b.addedAt)),
  );

  const remove = (row: ListRow) =>
    startTransition(async () => {
      change({ remove: row.id });
      toasts.moveCount(-1);
      try {
        const removed = await removeEntry(row.id);
        if (removed)
          toasts.changed(`Removed ${row.title} from this month’s list.`, { kind: "reinsert-entry", token: removed.token }, () => {
            change({ restore: row });
          });
      } catch {
        toasts.failed(`Couldn’t remove ${row.title}. Try again.`);
      }
    });

  return (
    <ul aria-label="This month" className="max-w-2xl">
      {shown.map((row) => (
        <li key={row.id} className="ds-row grid-cols-[1fr_auto]!">
          <span>
            <span className="ds-heading text-xl">{row.title}</span>
            {row.year && <span className="ds-meta ds-muted"> · {row.year}</span>}
          </span>
          <Button variant="secondary" icon="remove" aria-label={`Remove ${row.title}`} onClick={() => remove(row)}>Remove</Button>
        </li>
      ))}
    </ul>
  );
}
