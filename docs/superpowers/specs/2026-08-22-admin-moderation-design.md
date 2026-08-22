# Shared admin layout + review/comment moderation — design

**Date:** 2026-08-22 · **Branch:** `feature/admin-layout-moderation` · **DB changes:** none

## Why

The admin area was two one-off pages (`/admin/submissions`, `/admin/leads`) that each repeated
the same guard and page shell, reachable only through two navbar pills. Upcoming admin features
(claims queue, promote-to-admin) need a shared frame. Separately, the August 2026 audit deferred
an "admin moderation UI": the database already lets admins delete any review or comment
(`Admin delete` RLS policies via `public.is_admin()`, and the `on_review_change` trigger keeps
`flight_schools.rating / review_count` correct), but the app blocked admins — `deleteReview`
filtered on `user_id`, and there was no `deleteComment` action or comment-delete UI at all.

## Decisions

| Area | Choice |
|---|---|
| Surfaces | `/admin/moderation` (newest reviews + comments across all schools, with delete) **and** inline delete controls for admins on every school page's review list |
| Navigation | One "Admin" navbar pill → `/admin` overview (pending counts). `src/app/admin/layout.tsx` renders a tab bar: Overview · Submissions · Leads · Moderation |
| Delete semantics | Hard delete. Reviews are already immutable-by-design (delete + re-post); comments cascade; rating recompute is a DB trigger |
| Page shell | `src/app/admin/AdminShell.tsx` → `AdminPage` / `AdminSection` / `AdminEmpty` (server components) |
| Tab state | `src/app/admin/AdminNav.tsx` ("use client", `usePathname`) over pure `ADMIN_TABS` + `isAdminTabActive()` in `src/lib/admin-nav.ts` |
| Authz helper | `canDeleteContent(viewer, ownerId)` + strict `isUuid()` in `src/lib/permissions.ts` — decides what UI to show; RLS decides what happens |
| Actions | `deleteReview` drops its `user_id` filter (RLS `Owner delete` ∨ `Admin delete`; zero rows → friendly error); new `deleteComment` with the same contract. Both revalidate the submitting page's `path` plus `/admin/moderation` and `/admin` |
| Delete control | `src/components/ConfirmDeleteButton.tsx` — two-step confirm, parameterised by action/fields/copy; used by `ReviewsSection` and `ModerationCard` |
| Overview counts | `getAdminCounts()` — five `count: "exact", head: true` queries in parallel |
| Recent lists | `getRecentReviews(limit = 50)` / `getRecentComments(limit = 50)`, clamped to 200 |

## The layout is not the security boundary

Next.js layouts don't re-render on child navigation and don't decide whether a child route
renders. `admin/layout.tsx` 404s signed-in non-admins as a convenience, but **every `/admin` page
keeps its own `getCurrentUser` / `isAdmin` guard** (including the anonymous → `/login?next=…`
redirect, which the layout can't do precisely because it never sees the pathname) and every admin
Server Action checks again. For deletes, the real gate is RLS: a non-permitted delete returns zero rows,
which the action reports as "you don't have permission".

## Revalidation

No route in `src/` opts into caching (`"use cache"`, `revalidate`, `generateStaticParams`), and
the root layout reads cookies, so every page is dynamic and re-queries `rating` on each request.
Actions therefore revalidate only the form's `path` and the two admin pages. If list pages are
ever cached, the delete actions must look up the school and `revalidatePath(schoolHref(school))`.

## Tests

`scripts/tests/admin-nav.test.ts` and `scripts/tests/permissions.test.ts` (node:test) cover the
pure helpers. Layout redirects, server actions and the confirm flow are verified manually as
anonymous / non-admin / admin.
