# The Bijou: revised scope

## Changes

The original hero, spacing, paper texture, masthead and footer have been restored. The retained Browse change is the **More genres** disclosure, with the selected genre always visible.

- All 19 film genres now have an engraved illustration. The original seven plates are retained; twelve new plates use the original Action and Thriller art as style references. Local 384px WebP assets keep the fine hatching without shipping full-size generation files.
- Now Playing and Top Rated use the same marquee chip shape, bulb trim, illustration panel and selected colors as the genre filters.
- Required onboarding collects a customized name and at least one genre. Both save together before redirecting to Browse. The landing page greets the user by name. Preferences allows changes later.
- Existing accounts without preferences also complete onboarding on their next signed-in visit.

## Database activation

`supabase/migrations/0005_user_preferences.sql` was applied unchanged through Supabase MCP on October 27, 2026 to project `sbihlrxmlvzgjahhipmz`, matching `.env.local`. The recorded migration version is `20261027170259`. `lib/database.types.ts` has been replaced with the MCP-generated types.

The row has a Clerk JWT ownership default and owner-only RLS for select/insert/update, with no anonymous access or app deletion. Both answers are required by database constraints. Server page guards and list mutations require a complete row. A failed save leaves the form open, and a failed database read cannot bypass onboarding.

The migration creates only `user_preferences`, its policies and its trigger. It does not alter `movie_list_entries`, its data, permissions or policies. The security advisor found no new warnings; the two existing `rls_auto_enable()` warnings remain documented in [the isolation record](rls-isolation-test.md#3-afterwards).

The supplied Vercel preview (`mpcsdesignbuildship4-bnaue7m3t-ellie-s-projects621.vercel.app`) was opened through the owner's Share link. Browse responds successfully, but `/onboarding` returns the application's 404 page: that deployment predates this feature. A new deployment of this branch is required for preview acceptance. Do not record the local tests as a successful preview check.

Implementation references: [Clerk onboarding](https://clerk.com/docs/guides/development/add-onboarding-flow), [Clerk provider redirect configuration](https://clerk.com/docs/reference/components/clerk-provider), [Supabase Clerk integration](https://supabase.com/docs/guides/auth/third-party/clerk), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Possible later retention work

These are proposals, not additional layout changes:

- Offer an optional “Your favorite genres” filter using the stored answers while keeping all films accessible.
- Preserve the film a visitor was saving through sign-in and onboarding (the existing save-after-sign-in follow-up).
- Measure signup completion and first-film saves before changing the page layout again.

## Verification

- 48 desktop/phone browser tests pass; 12 desktop copies of phone-only layout tests are intentionally skipped.
- 81 unit tests pass, including required answers, forged genre IDs, failed saves, onboarding redirects and preference updates.
- ESLint and the production Turbopack build pass.
- Desktop/mobile screenshots and the illustration contact sheet are refreshed in `docs/design/`.
- Use the configured Turbopack build. Webpack bypasses this repo’s Tailwind loader; if a prior sandbox failure remains cached, move the regenerable `.next` directory aside before rebuilding outside the sandbox.
- Database activation and live-service browser verification are recorded below; unit mocks alone do not establish persistence or isolation.

## Working state

Working folder: `/home/ellie/2026fall/designBuild/mpcs_design_build_ship_4`.
Branch: `design/texture-motifs-ux`. Migration 0005 and its MCP-generated types are committed together in `748e677`; the design, onboarding and test changes remain local and uncommitted. Keep the restored original page design and More genres, the twelve detailed replacement plates, matching feed chips, and required onboarding/preferences.

Supabase MCP is connected and migration 0005 is active. The existing A/B development accounts were provisioned using `scripts/create-test-users.mjs`; their credentials are in gitignored `.env.test.local`. Their existing September History is retained.

The local live-TMDB preview uses port 3003. The activation tests use a separate production-build server on port 3004 with `TMDB_FIXTURES=1` via `/tmp/bijou-onboarding.config.ts`. The checked-in Playwright configuration also runs these tests through its `signed in` project, serially in Firefox, with a 90-second budget for multi-account flows against live Clerk/Supabase.

The signup test creates a unique `bijou-onboarding-…+clerk_test@example.com` development account and records its email in the test report. No verification mail is sent. It checks the actual Clerk signup, onboarding redirects, both required answers, the persisted greeting, and revisiting onboarding after completion. Preferences tests cover edits and reloads. The direct Data API test uses real Clerk session tokens and the publishable key to attempt cross-account reads/upserts/updates, ownership changes, deletion and invalid data. The History page remains the separate #9 placeholder; its old absence-only assertions could not establish isolation. The movie isolation test now also queries the seeded September History through each user's real session and requires exactly that user's three titles, without filtering by user ID.
