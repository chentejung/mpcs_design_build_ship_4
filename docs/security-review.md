# Security review: onboarding UX changes

Reviewed 2026-10-27, against `ecc47ae` (main) plus the uncommitted `onboarding-ux` working-tree changes.

**Result: no high-confidence vulnerabilities found.** The diff is small and only touches the UI, so it was reviewed
directly instead of through sub-agents.

## Scope

Test-only files were skipped.

- `components/bijou/preference-form.tsx`: the form checks the name and genre rules in the browser, using the same
  `parsePreferences` the server uses. It adds `noValidate` and blocks sending while a rule is broken.
- `components/bijou/site-tabs.tsx`, `app/layout.tsx`: during `/onboarding`, the tabs and logo show but can't be clicked.
- `lib/preference-input.ts`: only the wording of the genre error changed; the checks are the same.
- `app/onboarding/page.tsx`, `lib/pulp.ts`, `app/bijou.css`: text, colour and styling only.

## Why there's nothing to report

- **The server still enforces the rules.** `app/actions/preferences.ts` runs `parsePreferences(form)` on every
  submission. The browser-side check only shows messages and can't be used to get around the server.
- **Locking the tabs isn't a security control.** What keeps users on onboarding is the existing server-side redirect
  (AGENTS.md, product rule 9). Getting around a client-side lock isn't a vulnerability.
- **No XSS risk.** Error messages are fixed strings rendered by React; nothing uses `dangerouslySetInnerHTML`.
- **Nothing else security-relevant changed:** no new data access, Supabase queries, secrets, redirects or Undo signing.

## Non-security note

The form no longer shows `state.errors` from the server, only the errors it works out in the browser. They use the
same rules, so this is fine now, but if the server ever rejects a submission for a reason the browser doesn't check,
the user won't see why. The general `state.message` alert is still shown.
