// History is read-only in the database itself, not just in the UI (AGENTS.md → Product rules 3, Read-only History
// trigger). No browser here: test user A's own Clerk session token goes straight to Supabase with the publishable key,
// as the app's server would send it, so every write is made as the `authenticated` role under RLS. Each kind of change
// to A's seeded September 2026 (scripts/seed-history.sql) must be refused, and the rows must stay as they were.
// Test code only: the app itself talks to Supabase from the server alone.
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import type { Database } from "@/lib/database.types";
import { skipWithoutTestUsers, USER_A } from "./signed-in";

const PAST = "2026-09-01";

async function clerk<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`https://api.clerk.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Clerk ${init.method ?? "GET"} ${path} answered ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

let sessionId: string;
let db: ReturnType<typeof createClient<Database>>;

test.beforeAll(async () => {
  if (!USER_A) return;
  const [user] = await clerk<{ id: string }[]>(`/users?email_address=${encodeURIComponent(USER_A)}`);
  ({ id: sessionId } = await clerk<{ id: string }>("/sessions", { method: "POST", body: JSON.stringify({ user_id: user.id }) }));
  const { jwt } = await clerk<{ jwt: string }>(`/sessions/${sessionId}/tokens`, { method: "POST" });
  db = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { accessToken: async () => jwt });
});

test.afterAll(async () => {
  if (sessionId) await clerk(`/sessions/${sessionId}/revoke`, { method: "POST" });
});

const pastMonth = async () => {
  const { data, error } = await db.from("movie_list_entries").select("*").eq("month", PAST).order("added_at");
  expect(error).toBeNull();
  return data!;
};

test("the database refuses every change to a past month's Entry made as an app user", async () => {
  skipWithoutTestUsers();
  // A reads their own History through RLS, so the token is accepted and these are A's rows.
  const before = await pastMonth();
  expect(before.map((e) => e.title)).toEqual(["The Matrix", "Pulp Fiction", "The Godfather", "Spirited Away", "Clayface"]);
  const unwatched = before.find((e) => e.watched_at === null)!;
  const watched = before.find((e) => e.watched_at !== null)!;

  const refused = (r: { error: { message: string } | null }) => expect(r.error?.message).toMatch(/History is read-only/);

  // Mark Watched, unmark Watched, change the snapshot or move it into this month.
  refused(await db.from("movie_list_entries").update({ watched_at: new Date().toISOString() }).eq("id", unwatched.id));
  refused(await db.from("movie_list_entries").update({ watched_at: null }).eq("id", watched.id));
  refused(await db.from("movie_list_entries").update({ title: "Edited" }).eq("id", unwatched.id));
  refused(await db.from("movie_list_entries").update({ month: "2026-10-01" }).eq("id", unwatched.id));
  // Remove it.
  refused(await db.from("movie_list_entries").delete().eq("id", unwatched.id));
  // Add a film to that month after the fact.
  refused(await db.from("movie_list_entries").insert({ month: PAST, tmdb_id: 1153576, title: "Street Fighter" }));

  expect(await pastMonth()).toEqual(before);
});
