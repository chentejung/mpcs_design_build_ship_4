-- DEMO ONLY: deliberately breaks isolation, to prove the cross-user isolation test catches it (AGENTS.md → Testing,
-- docs/rls-isolation-test.md). With the select policy loosened to `using (true)`, every signed-in user can read every
-- user's Entries, and since the app never filters by user_id, My List and Browse would show other users' films.
-- Writes stay guarded by the insert, update and delete policies. 0004_restore_rls.sql puts the real policy back.
drop policy "own entries: select" on public.movie_list_entries;

create policy "own entries: select" on public.movie_list_entries for select to authenticated
  using (true);
