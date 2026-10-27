# Security Review: `security-review` branch (uncommitted onboarding UX changes)

Reviewed 2026-10-27, against `ecc47ae` (main) plus the uncommitted `onboarding-ux` working-tree changes.

No high-confidence vulnerabilities found. The diff is small and only touches the UI, so it was reviewed directly,
along with the server code, rather than through sub-agents.

## Scope

The automatic diff came back empty because the changes weren't committed yet, so `git diff` against `HEAD` was
reviewed instead. Test-only files were skipped, as the review rules say.

- `components/bijou/preference-form.tsx`: the form now checks the name and genre rules in the browser, using the same
  `parsePreferences` function the server uses. It adds `noValidate` and blocks sending when a rule is broken.
- `components/bijou/site-tabs.tsx` and `app/layout.tsx`: during `/onboarding`, the tabs and logo are shown but can't
  be clicked.
- `lib/preference-input.ts`: only the wording of the genre error changed. The checks themselves are the same.
- `app/onboarding/page.tsx`, `lib/pulp.ts`, `app/bijou.css`: text, colour and styling changes only.

## Why there's nothing to report

- **The server still enforces the rules.** `app/actions/preferences.ts:11` still runs `parsePreferences(form)` on
  every submission. The new browser-side check only shows messages and can't be used to get around the server's rules.
- **Locking the tabs is not a security control.** The tabs and logo become a plain `<span>` during onboarding, but
  what actually keeps users on onboarding is the existing server-side redirect (AGENTS.md product rule 9). Getting
  around a client-side lock doesn't count as a vulnerability.
- **No XSS risk.** The error messages are fixed strings rendered by React. Nothing uses `dangerouslySetInnerHTML`.
- **Nothing else that matters for security changed.** No new data access, Supabase queries, secrets, redirects or
  HMAC/Undo handling.

## Non-security note

The form no longer shows `state.errors` from the server; it only shows the errors it works out in the browser. The
two use the same rules, so this is fine for now. But if the server rejects a submission for a reason the browser
check doesn't catch, the user won't see why. The general `state.message` alert is still shown.
