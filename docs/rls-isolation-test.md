# RLS isolation test: the record

The cross-user isolation test (`tests/e2e/isolation.signed-in.spec.ts`, AGENTS.md → Testing) is the proof that row-level
security keeps users apart. The app never filters by `user_id`, so the select policy is the only guard, and this test
measures exactly that guard. To show that it can fail, the select policy was loosened on purpose, the test was watched
failing, the real policy was restored, and the test was watched passing. Run on 2026-10-27 against the hosted Supabase
project, with the app built as `npm test` builds it (`next build && next start -p 3001`, `TMDB_FIXTURES=1`).

## What the test does

Test users A and B (scripts/create-test-users.mjs) sign in in separate browser contexts and clear their current-month
Entries through My List's Remove. Then:

1. A saves film X (Street Fighter) on Browse; B saves film Y (Resident Evil). Each tab then reads `My List · Oct (1)`.
2. A's My List lists X only; B's lists Y only.
3. On Browse, A sees X as **Already saved** and Y as **Save**; B sees the reverse.
4. Neither user's History shows the other's seeded History titles, not even when searched for; each sees their own
   month with its own counts. On Browse, "In your Sep 2026 list" appears only on the user's own past film. (Added by
   #9, which built History; the loosened-policy runs below predate it.)
5. Both users remove their film again, so the next run starts from an empty month.

Command (desktop, signed-in project; `npx playwright test` starts the built app itself):

```sh
npx playwright test isolation --project "signed in"
```

## Seeded test History

One past month, **September 2026** (`month = '2026-09-01'`), inserted as the database owner through the Supabase MCP's
`execute_sql`, which the read-only History trigger doesn't check. The SQL is `scripts/seed-history.sql` (idempotent;
#9 added the last two films for each user). The user ids come from Clerk's Backend API by the test users' emails.
Tests treat these rows as read-only.

| User | Clerk user id | Films (TMDB id) | Watched |
|---|---|---|---|
| A | `user_3LGBtBfGJq5kYprWw2maZZcPbC7` | The Matrix (603), Pulp Fiction (680), The Godfather (238), Spirited Away (129), Clayface (1400940) | The Matrix, Spirited Away |
| B | `user_3LGBtDWY1uKgLkKO1hnuPporg9P` | Fight Club (550), Forrest Gump (13), The Dark Knight (155), Buddy (1514026) | Fight Club, Buddy |

Each row carries its TMDB snapshot (title, original title and language, year, runtime, poster path, genre ids,
overview), as `GET /3/movie/{id}` answered on 2026-10-27.

## 1. Loosened: `0003_demo_break_rls.sql`

```sql
drop policy "own entries: select" on public.movie_list_entries;

create policy "own entries: select" on public.movie_list_entries for select to authenticated
  using (true);
```

Applied through the MCP `apply_migration`. Every signed-in user can now read every user's Entries; writes are still
limited to their own by the insert, update and delete policies.

**First run: failed.** An earlier green run had left X (A's) and Y (B's) in October, so when A opened My List to clear
it, A saw B's Entry as well, and A's Remove of B's Entry deleted nothing (the delete policy still held):

```
  ✘  2 [signed in] › tests/e2e/isolation.signed-in.spec.ts:47:5 › each user sees only their own Entries (10.9s)
    Error: expect(locator).toHaveCount(expected) failed
    Locator:  getByRole('button', { name: /^Remove / })
    Expected: 1
    Received: 2
        at clearThisMonth (tests/e2e/signed-in.ts:49:26)
        at userPage (tests/e2e/isolation.signed-in.spec.ts:21:3)
  1 failed
```

That is the leak, but in the clean-up step. To see the test's own assertions fail, each user removed their own
Entries through My List's Remove (B, then A), and the test was given step 5 so that it leaves the month empty.

**Second run, from an empty month: failed.** As soon as B saved Y, B's tab counted A's X as well:

```
Running 2 tests using 1 worker
  ✓  1 [clerk setup] › tests/e2e/global.setup.ts:7:6 › Clerk testing token (188ms)
  ✘  2 [signed in] › tests/e2e/isolation.signed-in.spec.ts:47:5 › each user sees only their own Entries (15.6s)

  1) [signed in] › tests/e2e/isolation.signed-in.spec.ts:47:5 › each user sees only their own Entries

    Error: expect(locator).toHaveText(expected) failed

    Locator: getByRole('navigation', { name: 'Site' }).getByRole('link', { name: /^My List/ })
    Expected pattern: /^My List · [A-Z][a-z]{2} \(1\)$/
    Received string:  "My List · Oct (2)"
    Timeout: 5000ms

        at expectListCount (tests/e2e/signed-in.ts:24:33)
        at save (tests/e2e/isolation.signed-in.spec.ts:29:24)
        at tests/e2e/isolation.signed-in.spec.ts:53:3

  1 failed
  1 passed (23.8s)
```

## 2. Restored: `0004_restore_rls.sql`

```sql
drop policy "own entries: select" on public.movie_list_entries;

create policy "own entries: select" on public.movie_list_entries for select to authenticated
  using (user_id = (auth.jwt() ->> 'sub'));
```

The first `apply_migration` call for 0004 returned an MCP error ("Invalid or expired requestState") and did **not**
apply: `list_migrations` still ended at 0003, and `pg_policies` still showed `qual = true` for the select policy. A test
run made in that window failed again, as it should have. The call was repeated with the same SQL, and succeeded;
`pg_policies` then showed the select policy as `(user_id = (auth.jwt() ->> 'sub'::text))`, and `list_migrations` listed
0001–0004.

**Run: passed.**

```
Running 2 tests using 1 worker
  ✓  1 [clerk setup] › tests/e2e/global.setup.ts:7:6 › Clerk testing token (165ms)
  ✓  2 [signed in] › tests/e2e/isolation.signed-in.spec.ts:47:5 › each user sees only their own Entries (19.1s)

  2 passed (25.6s)
```

## 3. Afterwards

- **Security advisors** (MCP `get_advisors`, security): no table without RLS. Two warnings, both about
  `public.rls_auto_enable()`, a `SECURITY DEFINER` function that none of this repo's migrations created, which `anon`
  and `authenticated` can execute through `/rest/v1/rpc/rls_auto_enable`
  ([lint 0028](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable),
  [lint 0029](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)).
  Left for the owner to decide; revoking it would be a new migration.
- **Types** regenerated with the MCP `generate_typescript_types`: identical to `lib/database.types.ts`, since policies
  don't change the types.
- The test stays in the suite and must stay green.
