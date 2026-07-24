# Mini Instagram — Frontend Implementation Tasks

Design source: `pen/mini-instagram.pen` (Pen file, app name **"Lumen"**). Backend API spec: `tasks.md`.

---

## 0. Project Context (read first)

### 0.1 Stack & structure

React 18 + TypeScript + Vite. Web-only (desktop). Target viewport 1440×900; no mobile/tablet layout required.

```
mini-instagram-web/
├── index.html
├── vite.config.ts                      # dev proxy: /api and /media → backend (localhost:8080)
├── tailwind.config.ts                  # design tokens from the .pen file (see 0.4)
├── src/
│   ├── main.tsx                        # providers: Router, QueryClient, Theme
│   ├── app/
│   │   ├── router.tsx                  # route table + auth guard
│   │   └── layout/AppLayout.tsx        # sidebar + content shell (WebSidebar frame)
│   ├── api/
│   │   ├── client.ts                   # fetch wrapper: base URL, token header, envelope parsing
│   │   ├── types.ts                    # DTOs mirrored from backend responses
│   │   └── <domain>.ts                 # auth.ts, users.ts, posts.ts, comments.ts, notifications.ts, search.ts
│   ├── features/                       # one folder per screen/domain
│   │   ├── auth/          (SignUpPage, LoginPage)
│   │   ├── feed/          (HomePage, PostCard)
│   │   ├── post/          (PostDetailPage, CreatePostPage, CommentList)
│   │   ├── profile/       (ProfilePage, EditProfilePage, PostsGrid)
│   │   ├── search/        (SearchPage, TagResultsPage)
│   │   └── notifications/ (NotificationsPage)
│   ├── components/ui/                  # shadcn/ui primitives (button, input, dialog, avatar, ...)
│   ├── lib/                            # utils: cn, formatDate (relative time), media URL helper
│   └── stores/auth.ts                  # token + current user (see 0.3)
└── package.json
```

**Layer rules:**

- Pages/components never call `fetch` directly — always through `src/api/*` functions.
- Server state via **TanStack Query** (`@tanstack/react-query`): one query key per endpoint, mutations invalidate related queries. No global client-side cache duplication.
- Routing via **react-router-dom** v6. Forms via **react-hook-form** + **zod** (client-side mirror of backend validation).
- Styling: **TailwindCSS** + **shadcn/ui** components, **lucide-react** icons (design uses Material Symbols — map to closest lucide equivalents).

### 0.2 API conventions (must match backend `tasks.md` 0.3)

- Base path `/api/v1`; Vite dev proxy forwards `/api` and `/media` to the Go server so no CORS setup is needed.
- Every response is the envelope `{ status, description, data }` / `{ status, description, errors: [{field, message}] }`. `client.ts` unwraps `data` on success and throws a typed `ApiError { status: number, description, fieldErrors }` on failure.
- Pagination: `page` / `per_page` query params; list responses are `{ count, items }`. Default `per_page=10`.
- Timestamps are RFC3339 UTC — render as relative time ("2h", "3d") via a small helper in `lib/` (no dayjs/moment; `Intl.RelativeTimeFormat` is enough).
- Image URLs: DB stores relative paths (`posts/ab12.jpg`) — prefix with `/media/` via `lib/media.ts` helper. Never hardcode host.

### 0.3 Auth handling (global decisions — follow, do not ask)

- Access token stored in `localStorage` (`lumen_token`). `stores/auth.ts` (zustand or React context — **decision: zustand**) holds token + decoded `user_id` + the `/profile` response for the current user.
- `client.ts` attaches `Authorization: Bearer <token>` to every request except `/auth/sign-up` and `/auth/login`.
- Any **401** response → clear token, redirect to `/login` (single interceptor in `client.ts`).
- Route guard: all routes except `/login` and `/signup` require a token; unauthenticated visitors are redirected to `/login`. Logged-in users visiting `/login`/`/signup` are redirected to `/`.
- Logout: call `POST /auth/logout` (best-effort, ignore failure), clear store, redirect to `/login`.
- **429** on sign-up/login → show inline banner "Too many attempts, try again later" (do not map to field errors).

### 0.4 Design tokens (from `mini-instagram.pen` variables)

Wire these as CSS variables + Tailwind theme; support **Light and Dark** mode (design has both, toggle via `class="dark"` on `<html>`, persisted in `localStorage`, default = system preference).

| Token                    | Light       | Dark          |
| ------------------------ | ----------- | ------------- |
| `--background`         | `#F2F3F0` | `#111111`   |
| `--foreground`         | `#111111` | `#FFFFFF`   |
| `--card`               | `#FFFFFF` | `#1A1A1A`   |
| `--primary`            | `#FF8400` | `#FF8400`   |
| `--primary-foreground` | `#111111` | `#111111`   |
| `--secondary`          | `#E7E8E5` | `#2E2E2E`   |
| `--sidebar`            | `#E7E8E5` | `#18181b`   |
| `--sidebar-border`     | `#CBCCC9` | `#ffffff1a` |

Fonts: `--font-primary` = **JetBrains Mono** (body/UI), `--font-secondary` = **Geist** (logo/headings). Load via Google Fonts / fontsource. Radii: use the `$--radius-m` style rounded corners consistently (Tailwind `rounded-lg`).

### 0.5 Design screens → routes

| Pen frame                              | Route                                | Task    |
| -------------------------------------- | ------------------------------------ | ------- |
| Screen / Desktop Sign Up               | `/signup`                          | F4      |
| Screen / Desktop Log In                | `/login`                           | F5      |
| Desktop / Home                         | `/`                                | F7      |
| Desktop / Create Post                  | `/create`                          | F8      |
| Desktop / Post Detail, Other User Post | `/post/:postId`                    | F9–F11 |
| Desktop / Delete Comment (dialog)      | dialog on`/post/:postId`           | F11     |
| Screen / Desktop Own Profile           | `/profile`                         | F12     |
| Screen / Desktop Other User Profile    | `/users/:userId`                   | F13     |
| Desktop / Edit Profile                 | `/profile/edit`                    | F14     |
| Desktop / Search                       | `/search`                          | F15     |
| Desktop / Search Tags, Tag Results     | `/search?tab=tags`, `/tags/:tag` | F16     |
| Desktop / Notifications                | `/notifications`                   | F17     |
| WebSidebar (reusable frame)            | shared layout                        | F3      |

**Out of scope (design exists, backend does not):**

- **Desktop / Edit Comment** — backend has no edit-comment endpoint. SKIP; do not build.
- **Desktop / Create Profile** — sign-up already collects full_name/bio, avatar comes later via Edit Profile. SKIP as a separate step; its avatar-upload UI is reused in F14.
- **Mobile / Tag Results** — web-only scope; no mobile implementation. SKIP.

**Known API gaps (pre-answered — follow, do not ask):**

- Feed items (T11) do NOT include `is_liked`. Decision: feed's like button starts unfilled; on click send `POST .../like` (idempotent — safe even if already liked) and optimistically fill + increment. Accurate `is_liked` is only shown on Post Detail (T14 provides it).
- Feed items include `image_path` (full image), profile grid/tag results include `thumbnail_path` — use exactly what each endpoint returns.
- Create post (T9) returns `data: null` (no post id) — after success navigate to `/` (feed), not to the new post.

---

## Epic 1 — Foundation

### F1. Project scaffold

Create the Vite + React + TS app (`mini-instagram-web/`), add TailwindCSS, shadcn/ui init, lucide-react, react-router-dom, @tanstack/react-query, react-hook-form + zod, zustand. Configure the dev proxy (`/api`, `/media` → `http://localhost:8080`). Add `.env.example` (`VITE_API_URL` optional override), README with run instructions, ESLint + Prettier defaults.

**Acceptance:** `npm run dev` serves a blank app; `npm run build` and `npm run lint` pass.

### F2. Design system & theme

Implement 0.4: CSS variables for both themes, Tailwind mapped to the variables, font loading, dark-mode toggle hook (`useTheme`: system default, persisted). Generate the needed shadcn/ui components: `button`, `input`, `textarea`, `label`, `dialog`, `avatar`, `skeleton`, `toast/sonner`, `dropdown-menu`, `tabs`.

**Acceptance:** toggling dark mode swaps every token; primary buttons render `#FF8400`; logo renders in Geist.

### F3. API client + auth store + layout shell

1. `api/client.ts` per 0.2/0.3 (envelope unwrap, `ApiError`, bearer header, 401 interceptor).
2. `stores/auth.ts`: token persistence, `login(token)`, `logout()`, current-user query (`GET /profile`) exposed as `useCurrentUser()`.
3. `AppLayout` matching the **WebSidebar** frame: fixed 240px left sidebar (`--sidebar` bg, right border), logo "Lumen" top, nav items Home / Search / Notifications / Create / Profile with icons + labels, active item gets `--secondary` pill background; Logout pinned to the bottom. Content area scrolls independently.
4. `router.tsx` with the route table from 0.5 + auth guard.

**Acceptance:** navigating between stub pages highlights the correct nav item; hitting a protected route without a token lands on `/login`; a fake 401 from any query clears the session.

---

## Epic 2 — Auth screens

### F4. Sign up page

Route `/signup`, frame **Screen / Desktop Sign Up**: split layout — left 720px brand panel (logo/tagline on `--primary`-accented background per design), right form card with fields `email`, `full_name`, `username`, `bio` (textarea), `password`, submit button, link to `/login`.

- zod schema mirroring T2: email valid + max 128; password 8–72; username 3–32 lowercase `^[a-z0-9_.]+$` (lowercase input on blur); full_name required max 64; bio optional max 512. Inline field errors under inputs.
- Submit → `POST /auth/sign-up`; on 200 store `access_token`, redirect to `/`. On 400/409 map backend `errors[].field` onto the matching form fields (409 → "email is already taken" under the email/username input). 429 → banner (0.3).

**Acceptance:** invalid fields error inline before any request; duplicate email shows the server message under the right field; success lands on the feed logged in.

### F5. Log in page

Route `/login`, frame **Screen / Desktop Log In** (same split layout): `email`, `password`, submit, link to `/signup`.

- 401 → single generic error banner "Invalid email or password" (never field-level — backend deliberately doesn't reveal which). 429 → rate-limit banner.

**Acceptance:** wrong password and unknown email render identical UI errors; success stores token and redirects.

### F6. Logout

Sidebar Logout button → confirm not required; call `POST /auth/logout`, clear store, redirect `/login` (0.3). Works even if the request fails (token already invalid).

**Acceptance:** after logout, back-button navigation to protected pages redirects to `/login`.

---

## Epic 3 — Feed & Posts

### F7. Home feed

Route `/`, frame **Desktop / Home**: centered single-column feed (~600px) of PostCards.

- `GET /feed` with **infinite scroll** (TanStack `useInfiniteQuery`, `per_page=10`, next page while `items.length` fetched < `count`).
- PostCard: avatar placeholder + `username` (links to `/users/:user_id`), image (`/media/` + `image_path`), like button + `likes_count`, comment icon + `comments_count` (links to `/post/:post_id`), caption (username bolded prefix), relative timestamp.
- Like button per 0.5 gap note: optimistic fill + count bump, rollback on error.
- Empty feed (`count: 0`) → empty state card: "Your feed is empty — find people to follow" with a button to `/search`.
- Loading → skeleton cards; errors → toast + retry button.

**Acceptance:** scroll loads successive pages exactly once each; empty state renders for a fresh account; like updates instantly and survives refetch.

### F8. Create post

Route `/create`, frame **Desktop / Create Post**: centered card with an image drop zone + caption textarea + submit.

- File picker/drag-drop, client-side checks before upload: type ∈ {jpeg, png, webp}, size ≤ 10 MB (mirror T9; server remains the authority). Show a local preview (`URL.createObjectURL`).
- Caption max 2048, live counter. Hashtags need no special UI (server parses them — T21).
- Submit multipart (`image` field name per backend 0.4) with an upload progress/disabled state; success → toast "Post created", navigate `/`. 400 with field `image` → error under drop zone.

**Acceptance:** an 11 MB file is rejected client-side with a clear message; successful post appears in own profile grid; double-submit is prevented while uploading.

### F9. Post detail page

Route `/post/:postId`, frames **Desktop / Post Detail** / **Other User Post**: two-pane card — image left, right pane with author header, caption, actions row, comments (F10).

- `GET /post/:post_id` → render `is_liked` (filled/unfilled heart), `likes_count`, `comments_count`.
- Like/unlike toggle: liked → `DELETE .../like`, else `POST .../like`; optimistic, rollback on error; a 409 from unlike ("post is not liked") just resyncs via refetch.
- Non-numeric or unknown id → full-page 404 state ("Post not found") with a link home.
- If `user_id` == current user: overflow menu (⋯) with **Delete post** → confirm dialog → `DELETE /post/:post_id`, then navigate to `/profile` with toast. Non-owners never see the menu (server still enforces 403).

**Acceptance:** heart state matches `is_liked` on load; deleting own post removes it everywhere after cache invalidation; visiting a deleted post URL shows 404 state.

### F10. Comments

On the post detail page (extends F9):

- `GET /post/:post_id/comments` paginated oldest-first; "Load more" button (not infinite scroll — comments pane is a scrollable sub-area per design).
- Composer at the bottom: input + "Post" button, disabled when trimmed content is empty; max 2048. Success → clear input, invalidate comments + post queries (`comments_count`).

**Acceptance:** new comment appears at the end of the list and bumps the counter; whitespace-only submit is impossible.

### F11. Delete comment (dialog)

Frame **Desktop / Delete Comment**: each comment row shows a delete affordance ONLY when the current user is the comment author **or** the post author (both known client-side). Clicking opens the confirmation dialog (400px, "Delete comment?" + Cancel / Delete buttons per design) → `DELETE /comments/:comment_id` → invalidate comments + post.

**Acceptance:** third-party users see no delete control; a stale delete (already removed, 404) shows a toast and refreshes the list.

---

## Epic 4 — Profiles

### F12. Own profile

Route `/profile`, frame **Screen / Desktop Own Profile**:

- Header: avatar (fallback initial), `username`, `full_name`, `bio`, counters `posts_count` / `followers_count` / `following_count`, **Edit Profile** button → `/profile/edit`.
- Below: 3-column square grid of `GET /users/:user_id/posts` thumbnails (own `user_id` from store), paginated with "Load more"; each tile links to `/post/:post_id`. Empty → "No posts yet" state with a link to `/create`.

**Acceptance:** counters match backend after follow/post actions; grid tiles keep 1:1 aspect ratio; thumbnails use `thumbnail_path`.

### F13. Other user profile + follow/unfollow

Route `/users/:userId`, frame **Screen / Desktop Other User Profile**: same layout, but instead of Edit Profile a **Follow / Following** button driven by `is_following`.

- Follow → `POST /users/:user_id/follow`; Unfollow → `DELETE .../follow`. Optimistic toggle + counter bump; on 409 (already/not following) resync via refetch, no error toast.
- If `:userId` == own id → redirect to `/profile`. 404 user → not-found state. Non-numeric id → 404 state too (backend returns 400).

**Acceptance:** follow updates the button and `followers_count` instantly; the followed user's posts start appearing in the feed; unfollow reverses both.

### F14. Edit profile

Route `/profile/edit`, frame **Desktop / Edit Profile**: form pre-filled from `useCurrentUser()` — avatar upload circle (click to pick, preview; jpeg/png/webp, ≤ 5 MB client check), `username`, `full_name`, `bio` (same zod rules as F4), Save + Cancel.

- Submit multipart to `PUT /profile` (field name `avatar`) always sending all three text fields (T8 full-state semantics). 409 username taken → field error. Success → invalidate current-user + profile queries, toast "Profile updated", navigate `/profile`.

**Acceptance:** text-only save works without touching the avatar; oversize avatar blocked client-side; new avatar shows in sidebar/profile immediately after save.

---

## Epic 5 — Discovery & Notifications

### F15. Search users

Route `/search`, frame **Desktop / Search**: search input at top with **debounced** (300ms) `GET /search/users?q=` (min 1 char, max 32; empty input → idle state, no request).

- Result rows: avatar, `username`, `full_name`, whole row links to `/users/:user_id`. Paginated "Load more". No results → "No users found for “q”".

**Acceptance:** typing fires at most one request per pause; clearing the input clears results; navigation from a result works.

### F16. Tag search & results

Frames **Desktop / Search Tags** / **Desktop / Tag Results**:

- Add a Users / Tags tab switch on `/search` (tabs component; state in `?tab=` query param). Tags tab input → on submit (Enter) navigate to `/tags/:tag` (strip a leading `#`).
- `/tags/:tag` → `GET /search/posts?tag=` — header "#tag · N posts" (N = `count`), 3-column thumbnail grid like the profile grid, tiles link to post detail, paginated. Unknown tag → empty-state grid (backend returns 200 + empty).
- Bonus (cheap): render `#hashtags` inside captions (feed/detail) as links to `/tags/:tag` with a regex matching the backend pattern.

**Acceptance:** searching `#Beach` and `beach` yield the same results page; caption hashtag click lands on the tag page.

### F17. Notifications

Route `/notifications`, frame **Desktop / Notifications**: newest-first list from `GET /notifications`, paginated "Load more".

- Row rendering by `action_type` (message is NULL — client composes text): like → "**{actor_username}** liked your post", comment → "**{actor_username}** commented on your post", follow → "**{actor_username}** started following you". Actor name links to their profile; like/comment rows link to `/post/:post_id`.
- Unread rows get a highlighted background + dot; clicking a row fires `PUT /notifications/:id/read` (optimistic, idempotent) before navigating.
- Sidebar Notifications item shows a dot when the first page contains any `is_read: false` (no dedicated unread-count endpoint — do NOT build one).

**Acceptance:** each action type renders correct text + destination; a clicked row loses its unread styling and stays read after refresh.

---

## Epic 6 — Polish

### F18. UX states & final pass

- Audit every page for the four states: loading (skeletons), error (toast/retry), empty (designed empty states), success. Global toaster mounted once in `AppLayout`.
- Image UX: `loading="lazy"` on grid/feed images, fixed aspect-ratio boxes to prevent layout shift, broken-image fallback block.
- Confirm fixed 1440×900 desktop layout throughout; no responsive breakpoints or mobile variants.

**Acceptance:** every list page has a visible empty state; no layout shift while images load; layout remains consistent at 1440px width.

### F19. Build, tests & smoke check

- Component tests with **Vitest + React Testing Library** for the highest-risk logic: `client.ts` envelope/401 handling, sign-up form validation + server-error mapping, optimistic like toggle rollback.
- `npm run build && npm run test` must pass. Document in README: run backend (`:8080`), `npm run dev`, demo flow (sign up → post → follow via second account → feed → like/comment → notifications).

**Acceptance:** CI-style command chain passes clean; the documented demo flow works end-to-end against the running Go backend.
