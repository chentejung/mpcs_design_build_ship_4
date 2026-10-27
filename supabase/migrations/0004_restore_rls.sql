-- Restores the real select policy after the 0003 demo: each signed-in user reads only their own Entries
-- (AGENTS.md → Row-level security), exactly as 0001 created it.
drop policy "own entries: select" on public.movie_list_entries;

create policy "own entries: select" on public.movie_list_entries for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));
