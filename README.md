# The Bijou — Week 4

A movie picker with personal monthly watchlists. Read `AGENTS.md` first: it records the agreed design.

- `npm run dev` — dev server on port 3000 (copy `.env.example` to `.env.local` first)
- `npm test` — Playwright (Firefox, desktop + phone) against `next build && next start` on port 3001, TMDB from fixtures
- `npm run test:unit` — Vitest for pure logic
