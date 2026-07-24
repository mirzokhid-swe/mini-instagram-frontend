# Lumen — Mini Instagram (frontend)

React 18 + TypeScript + Vite frontend for the Lumen mini-Instagram clone, built from the design/spec in `../task.md` and `../api.md`.

## Status: UI-only, no backend wired

This build renders the full UI against an **in-memory mock data layer** (`src/mocks/db.ts`) instead of a real backend — there is no Go server running yet. Every function in `src/api/*.ts` has the same name/shape it would have if it called `fetch` against the real API in `../api.md`; each currently reads/writes the mock store with a simulated network delay instead. Swapping in the real backend later means only editing `src/api/*.ts` and `src/api/client.ts`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Demo flow

1. Log in with the seeded demo account: **demo@lumen.app** / **password123** (has an existing feed, posts, followers).
2. Or sign up as a brand-new user — the feed starts empty since you follow nobody yet.
3. Search for a user (try "sara", "mike", "priya") and follow them — their posts appear in your feed.
4. Create a post with an image + caption (try a `#hashtag`), like/comment on posts, visit `/tags/<tag>`.
5. Check `/notifications` for likes/comments/follows, and toggle dark mode from the sidebar.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run oxlint
