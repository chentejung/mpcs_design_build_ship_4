-- The one table (AGENTS.md → Data model): each row is an Entry, one Film in one user's list for one month, with a
-- snapshot of the Film taken from TMDB on the server at save time. Created together with its row-level security,
-- so the table never exists unprotected.

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

-- Row-level security: each signed-in user sees and changes only their own Entries. RLS is the only thing separating
-- users; the app never filters or sets user_id itself.
alter table public.movie_list_entries enable row level security;

-- Supabase grants new public tables to anon and authenticated by default. Start from nothing, then grant the four
-- operations to signed-in users only; signed-out visitors (anon) get no access at all.
revoke all on table public.movie_list_entries from anon, authenticated;
grant select, insert, update, delete on table public.movie_list_entries to authenticated;

create policy "own entries: select" on public.movie_list_entries for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));
create policy "own entries: insert" on public.movie_list_entries for insert to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'));
create policy "own entries: update" on public.movie_list_entries for update to authenticated
  using (user_id = (auth.jwt() ->> 'sub')) with check (user_id = (auth.jwt() ->> 'sub'));
create policy "own entries: delete" on public.movie_list_entries for delete to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));
