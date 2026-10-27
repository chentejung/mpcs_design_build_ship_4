# The Bijou — Week 4

> **Read this whole file before building, changing the schema, or touching data access.** It records decisions the
> owner has agreed to. If a task conflicts with it, stop and ask — don't work around it. Change this file only with the
> owner's agreement, in the same commit as the code that follows it.

The Bijou is a movie picker with personal monthly watchlists. It grows out of the Week 2 site (`/bijou` in
`mpcs_design_build_ship_2`): only The Bijou and its Pulp design system (American Comics mood board) come across; the
mood boards, design-system pages and the Shōwa/Haipai kits stay behind. Films come live from TMDB instead of the
curated 100-film list.

## Stack

- Next.js (App Router, server-rendered — **not** a static export) + Tailwind CSS v4.
- Clerk for sign-in, on **development keys only** (production keys need an owned domain).
- Supabase (one hosted project) for the database, connected to Clerk through Supabase **third-party auth**
  (Authentication → Sign In / Providers → Clerk).
- TMDB as the one external API, called **only from the server**.
- Code on GitHub, deployed on Vercel's free Hobby plan.

## Language

**Film**: a TMDB movie, identified by its TMDB id.
**Entry**: one row in `movie_list_entries` — a Film in one user's list for one month, with a snapshot of its details.
**Month list**: all of a user's Entries for one month. **This month** is the user's current month in their own time
zone; every earlier month is **History**.
**Not watched yet / Watched**: an Entry's state — Watched exactly when `watched_at` is set.
_Avoid_: "saved list" (there is no month-less list), "status" column, "plan".

## Product rules the data model enforces

1. **Save = add to this month's list.** Saving a Film from Browse creates an Entry for the current month, Not watched
   yet. There is no separate saved list.
2. **One Entry per Film per month.** If the Film is already in this month's list, Browse shows a disabled
   **Already saved** button (`aria-disabled`, hint "Remove it from My List"); removal happens only on My List.
   The same Film may appear in a later month again (a rewatch) — a new Entry.
3. **This month is editable; History is read-only.** In this month a user can save, remove, mark Watched and unmark
   it. Past months cannot be changed in any way — enforced by the database, not just hidden in the UI.
4. **No automatic carry-over.** In History, each Not-watched-yet Entry shows **Add it to this month**, which inserts
   a new current-month Entry copying the snapshot (disabled as "Already saved" if this month already has the Film).
   The past Entry is untouched.
5. **Watched belongs to the Entry**, so a past month's record never changes when a later Entry changes.
6. **Undo:** every change (save, remove, mark/unmark Watched, add-to-this-month) shows a **3-second** Undo toast. The
   UI updates optimistically; a failed write rolls back and shows an error toast. Undo writes the previous state back:
   - save / add-to-this-month → delete that Entry;
   - remove → re-insert the exact deleted row (same `id`, `added_at`, `watched_at`), kept in the browser for 3 s as a
     copy signed by the server (HMAC with the server-only `UNDO_SIGNING_SECRET`, bound to the user and a short expiry);
     the server verifies it before re-inserting, so the browser can't forge an Entry;
   - mark / unmark Watched → restore the previous `watched_at`.
7. **Signed-out visitors** can browse and search. Save opens Clerk's sign-in modal and, after sign-in, saves that
   Film automatically. `/my-list` requires sign-in (checked on the server).
8. **No account deletion** in this iteration (disable it in Clerk's `<UserProfile />`). No webhook tables. User preferences are the one account-settings table (owner request, October 2026).
9. **Required onboarding:** after signup, require a customized name and at least one favorite genre. A complete
   `user_preferences` row is the completion state; signed-in Browse, My List and their actions enforce it server-side.
   Persist both answers before redirecting to Browse, greet by name, and allow changes at `/preferences`.

## Data model

The schema is defined **only** by migrations. Movie entries:

```sql
create table public.movie_list_entries (
  id                uuid        primary key default gen_random_uuid(),
  user_id           text        not null default (auth.jwt() ->> 'sub'),   -- Clerk user id, e.g. user_2ab…
  month             date        not null check (month = date_trunc('month', month)::date),  -- 2026-10-01
  tmdb_id           integer     not null check (tmdb_id > 0),

  -- snapshot of the Film, taken from TMDB on the server at save time
  title             text        not null,
  original_title    text,
  original_language text,
  release_year      smallint,
  runtime           smallint    check (runtime >= 0),                    -- minutes, from GET /3/movie/{id}
  poster_path       text        check (poster_path like '/%'),            -- TMDB path; URL built in code
  genre_ids         integer[]   not null default '{}',
  overview          text,

  added_at          timestamptz not null default now(),
  watched_at        timestamptz,                                          -- null = Not watched yet

  unique (user_id, month, tmdb_id)
);

create index movie_list_entries_user_month on public.movie_list_entries (user_id, month desc);
```

- **Snapshot per Entry, not a shared movies table.** Each Entry carries its own copy, so My List and History load
  from Supabase alone and each table has one ownership rule. Duplication is accepted.
- **Months are `date` on the first of the month**, compared natively (`month < '2026-11-01'`).
- **Genres** are stored as TMDB ids; names come from TMDB `GET /3/genre/movie/list` (cached), not the database.
- **Snapshot fields come from TMDB on the server**, never from the request body — the client sends only `tmdb_id`
  (or, for Add it to this month, the source Entry's `id`; for Undo of Remove, the server-signed copy of the deleted
  row).

### User preferences

Migration `0005_user_preferences.sql` adds one row per Clerk user: `display_name` (1–50 characters),
`favorite_genre_ids` (at least one valid TMDB genre), and creation/update timestamps. Ownership comes from the JWT
column default. RLS permits only the owner to select, insert and update; the app cannot delete these rows.
New and existing accounts without a row must complete `/onboarding`. A failed read or write cannot mark onboarding complete.

### Row-level security

RLS is enabled on **every** table. Grant entry CRUD to `authenticated` only; preferences allow select/insert/update. Nothing to `anon`.

```sql
alter table public.movie_list_entries enable row level security;

create policy "own entries: select" on public.movie_list_entries for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));
create policy "own entries: insert" on public.movie_list_entries for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));
create policy "own entries: update" on public.movie_list_entries for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub')) with check (user_id = (auth.jwt() ->> 'sub'));
create policy "own entries: delete" on public.movie_list_entries for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));
```

### Read-only History trigger

A `before insert or update or delete` trigger on `movie_list_entries` checks every write made as the
`authenticated` role (every app user; the function is `security invoker` and tests `current_user = 'authenticated'`).
Database-owner SQL — migrations and the MCP's `execute_sql`, used only to seed test History — is not checked. For
`authenticated` writes it raises an error unless:

- the row's month (`new.month` on insert/update, `old.month` on update/delete) is a **current month somewhere on
  Earth**: between `date_trunc('month', now() - interval '14 hours')` and `date_trunc('month', now() + interval '14 hours')`
  (UTC−12…UTC+14 covers every real zone, so a user at 11 pm on the 31st isn't locked out, but nobody writes to an
  older month);
- on update, **only `watched_at` changes** (`id`, `user_id`, `month`, `tmdb_id`, snapshot and `added_at` are fixed);
- `watched_at`, when set, is not later than `now() + interval '1 minute'`.

### Time zone and "this month"

On the first visit, the browser sets a `tz` cookie (`Intl.DateTimeFormat().resolvedOptions().timeZone`). The server
computes the current month from it (default `UTC` if missing or invalid) and passes it to every query and insert. The
trigger above is the backstop.

### Data access

- Every Supabase call uses the **signed-in user's Clerk session token** through Clerk's native Supabase integration
  (`createClient(url, publishableKey, { accessToken: async () => (await auth()).getToken() })`), so RLS applies.
- **No service-role key** in the app, the env, or Vercel. There is no code path that bypasses RLS.
- Queries run in server code (Server Components, Server Actions); the browser never talks to Supabase directly.
- **App code never filters or sets `user_id`** — no `.eq('user_id', …)` on reads, no `user_id` in inserts (the column
  default fills it from the token). RLS is the only thing separating users, so the isolation test below measures
  exactly that guard; a redundant filter would hide a broken policy. Queries filter by month, `tmdb_id`, etc. only.

### Queries the app needs

| Use | Query |
|---|---|
| Browse "Already saved" state | `tmdb_id` where `month = current` |
| Browse "In your Sep 2026 list" note | latest `month` per `tmdb_id` where `month < current`, for the Films on screen |
| This month | all Entries where `month = current`; totals: count, watched count, runtime sum of unwatched |
| History months | distinct `month` where `month < current`, newest first |
| History view | Entries where `month < current`, optional `month = ?`, optional `title`/`original_title ilike ?` (escape `%`, `_`), grouped by month |

## Routes and URL state

| URL | Who | What |
|---|---|---|
| `/` | everyone | Browse: `?feed=now-playing\|top-rated` (default `now-playing`), `?genre=<tmdb id>`, `?q=<search>` |
| `/onboarding` | signed in, incomplete | Required name and favorite genres |
| `/preferences` | onboarding complete | Edit name and favorite genres |
| `/my-list` | onboarding complete | This month: Not watched yet and Watched sections, editable |
| `/my-list/history` | signed in | History, read-only: `?month=YYYY-MM`, `?q=<title>`; none = all past months |

Filters are **query parameters**, so they survive refresh and can be shared; invalid values are ignored, not 404s.
A shared layout holds the masthead and tab bar: **Browse** always, **My List · Oct (n)** and **Preferences** only when signed in, and
Clerk's Sign in / `UserButton`. The full Pulp hero shows on Browse; My List uses a slim masthead.
My List's cards/rows view and sort (date added oldest-first default, title, year, runtime) live in `localStorage`.

## TMDB

All calls run on the server with the TMDB key (never sent to the browser), `language=en-US`, `region=US`. Feeds and
genre names are cached (`revalidate` 1 h / 24 h). Back off on HTTP 429 (limit ≈ 40 requests/s).

| Need | Call |
|---|---|
| Now Playing | `GET /3/discover/movie` with `with_release_type=2\|3`, `release_date.gte/lte` from the `dates` window of a cached `GET /3/movie/now_playing`, `sort_by=popularity.desc`, `include_adult=false`, optional `with_genres` |
| Top Rated | `GET /3/discover/movie` with `sort_by=vote_average.desc`, `vote_count.gte=200`, `without_genres=99,10770`, `include_adult=false`, optional `with_genres` |
| Search | `GET /3/search/movie?query=` — genre chips and feed tabs are hidden while searching |
| Genre names | `GET /3/genre/movie/list` |
| Snapshot on save | `GET /3/movie/{id}` (adds `runtime`) |

Results load 20 per page with **Load more**. No per-genre match counts. Posters come from `image.tmdb.org`, with TMDB
attribution and its required notice in the credits.

## Schema workflow (Supabase MCP)

- The owner creates the Supabase project, connects its MCP server to the agent scoped to that one project (writes
  allowed), and configures Clerk third-party auth in both dashboards.
- Every schema change is a **new migration**: write `supabase/migrations/NNNN_<name>.sql`, show the owner the SQL and
  explain it, then apply that same SQL through the MCP `apply_migration` tool. Never edit the schema in the dashboard
  or with ad-hoc SQL.
- After each migration: run the MCP security advisors (every table must have RLS), regenerate TypeScript types into
  `lib/database.types.ts`, and commit the migration and types together.
- No seed data.

## Repo, env and deploy

- App at the root of this folder = GitHub `chentejung/mpcs_design_build_ship_4` (**public**). `.env*` (except
  `.env.example`) and `*.zip` are gitignored. Fresh `create-next-app` (Next 16, React 19, Tailwind 4, TypeScript), with
  only the Pulp pieces ported from Week 2 (`components/system/` Pulp parts, `pulp/`, `system.css`, fonts, genre art,
  TMDB logo and credits).
- Env: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
  (server-only — no `NEXT_PUBLIC_`), `TMDB_READ_ACCESS_TOKEN` (v4 Bearer), `UNDO_SIGNING_SECRET` (server-only).
  `.env.example` lists them without values.
- Vercel imports the GitHub repo: `main` deploys to production, each PR gets a preview. The owner sets env vars there.
  - **Green local tests don't mean the deploy works.** Tests read `.env.local`; Vercel reads only its dashboard. A
    green Vercel check only means it built: env vars are read at request time.
  - **A new env var** goes into `.env.example` and the Env list above in the same PR. The PR body names it, and the
    owner is asked to set it in Vercel for Production and Preview and redeploy **before** the PR merges.
  - **A preview counts as checked** only when the ticket's flows pass on it **signed in** (test user A, through the
    owner's Vercel Share link — previews are behind Deployment Protection), not just signed out. Report exactly what
    was and wasn't checked there.
- One feature branch + PR per ticket, merged after tests pass and the preview looks right. The tickets are the
  sub-issues of spec #1 on GitHub, with native blocked-by links; work any ticket whose blockers are all closed.
  Each slice carries its own Undo and error handling, using the shared toast built in #7.
  - #2 scaffold, Pulp shell, test harness → #11 Browse feeds from TMDB → #12 search;
  - #5 sign in, tab bar, My List protection (after #2 and owner ticket #4, Clerk app);
  - #7 migrations, Save, Already saved, Undo/error toast, isolation test (after #11, #5 and owner ticket #6,
    Clerk ↔ Supabase);
  - then, in parallel: #13 save after sign-in, #8 My List for this month, #9 read-only History;
  - #10 polish and production check (after #3, owner's Vercel import, and #12, #13, #8, #9).
- Dev: `npm run dev` on port 3000; tests run against `next build && next start` on port 3001.

## Testing

- **Vitest** for pure logic: time zone → current month, TMDB parameter builders, URL parameter parsing, Undo state.
- **Playwright** (Firefox) for what a visitor sees through accessible controls. Signed-out pages and layout run on the
  desktop and phone projects; **signed-in tests run on desktop only, serially** (they share test users and rows).
- **TMDB fixtures:** with `TMDB_FIXTURES=1` the server's TMDB module reads JSON from `tests/fixtures/tmdb/`. One live
  smoke test hits real TMDB.
- **Test users:** A and B, created by a script through Clerk's Backend API (`+clerk_test` emails, passwords), with
  credentials in gitignored `.env.test.local`; sign-in through `@clerk/testing`. Each has one past month of History
  seeded through the MCP's `execute_sql`; tests treat it as read-only. Before each signed-in test, the user's
  current-month Entries are cleared through the app's own Remove.
- **Cross-user isolation test (required):** A and B sign in in separate browser contexts; A saves fixture Film X, B saves
  Film Y. Then: A's My List shows X and not Y, B's shows Y and not X; on Browse, B sees X as **Save** (not Already saved)
  and vice versa; neither sees the other's History. It was proven by breaking RLS on purpose with migration
  `0003_demo_break_rls.sql` (select policy `using (true)`), watching it fail, restoring with `0004_restore_rls.sql`, and
  watching it pass; the record is in `docs/rls-isolation-test.md`. It must stay green.

## Known follow-ups (not this iteration)

- Account deletion plus a Clerk `user.deleted` webhook to delete that user's Entries.
- Rewatch log, ratings and notes.
