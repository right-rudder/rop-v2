# Favorites + Compare — design

Date: 2026-08-21 · Branch: `feature/favorites-compare` · Backlog item 2

## Goal

Give prospective students a reason to create an account and a way to shortlist: save schools to a personal list, and compare up to four schools side by side.

## Decisions already made

- Favorites are **per account, database-backed**. Guests who tap the heart are sent to `/login?next=<current page>`; no guest/localStorage favorites.
- Compare selection is **browser-local** (localStorage, max 4) and needs no account; the compare page is driven purely by the URL (`/compare?ids=a,b,c`).
- One favorites query per request, resolved in the root layout and shared through React context — pages and cards never query favorites themselves.

## Data model

Patch `supabase/add-favorites.sql` (idempotent; folded into `schema.sql`, listed in `supabase/README.md`):

```sql
create table if not exists public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  school_id  text not null references public.flight_schools (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, school_id)
);
create index if not exists favorites_school_id_idx on public.favorites (school_id);
alter table public.favorites enable row level security;
-- own rows only
create policy "Own favorites read"   on public.favorites for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own favorites insert" on public.favorites for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own favorites delete" on public.favorites for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, delete on public.favorites to authenticated;
```

No UPDATE policy or grant (rows are toggled by insert/delete). `anon` gets nothing. `src/lib/supabase/database.types.ts` gains the table.

## Data layer

`src/lib/data.ts`
- `getFavoriteSchoolIds(userId): Promise<string[]>` (React `cache`) — ids only, ordered by `created_at desc`.
- `getFavoriteSchools(userId): Promise<FlightSchool[]>` — ids → `getSchoolsByIds`, preserving saved order (newest first).

`src/lib/types.ts` — no new domain type; favorites are a `Set<string>` of school ids on the client.

## Server action — `src/app/actions/favorites.ts`

`toggleFavorite(schoolId: string, path: string): Promise<{ saved: boolean } | { error: string }>`
- Requires a session (else `{ error: "Log in to save schools." }`).
- Validates `schoolId` (non-empty, ≤ 64 chars) and `path` via `safeInternalPath`.
- If a row exists → delete; else insert (PK conflict → treat as already saved).
- `revalidatePath(path)` and `revalidatePath("/saved")`. Errors via `friendlyDbError`.

## Client state — `src/components/FavoritesProvider.tsx`

Context `{ viewerId: string | null; ids: Set<string>; toggle(schoolId, path): void }`.
- Mounted in `src/app/layout.tsx` (which already calls `getCurrentUser()` for the navbar) with `initialIds = viewer ? await getFavoriteSchoolIds(viewer.id) : []`.
- `toggle` updates the set optimistically, calls `toggleFavorite`, and reverts on error (error surfaced via a small inline message on the button's `title`/`aria-live` text — no toast system exists).
- Context is re-seeded from props whenever the layout re-renders (login/logout already call `revalidatePath("/", "layout")`).

## `FavoriteButton` — `src/components/FavoriteButton.tsx` (client)

Props: `schoolId`, `path` (the page to revalidate — pass `usePathname()` from the caller or compute server-side), `size?: "sm" | "md"`, `className?`.
- Logged in: `<button aria-pressed={saved} aria-label="Save school" | "Remove from saved">` with `Heart` (lucide), filled `text-accent` when saved, `text-muted` otherwise, 200 ms transition; disabled while the action is pending.
- Logged out: `<Link href={`/login?next=${encodeURIComponent(path)}`} aria-label="Log in to save this school">` with the outline heart.
- Must never be nested inside another `<a>`: callers render it as a **sibling** of the card link, absolutely positioned top-right inside a `relative` wrapper, `z-10`.

## Where the heart appears

- `SchoolCard` (`src/components/SchoolCard.tsx`) gains `schoolId?: string`. When given, the card wraps itself in `<div className="relative">`, renders the existing link card, then `<FavoriteButton>` top-right. All current call sites (home, state, city, airport, featured, top-rated explorer) pass `schoolId={school.id}`.
- `AdvancedSearchExplorer` result cards: same wrapper pattern around the inline `Card href`.
- School detail page hero `aside`: a `FavoriteButton size="md"` next to "Visit website", with a text label "Save".

## Compare

`src/lib/compare.ts` (pure, tested)
- `COMPARE_MAX = 4`
- `parseCompareIds(param: string | null): string[]` — split on `,`, trim, keep `^[a-z0-9-]{1,64}$`, dedupe, cap at 4.
- `formatCompareHref(ids: string[]): string` → `/compare?ids=a,b`.

`src/components/CompareProvider.tsx` (client) — context `{ ids: string[]; has(id); toggle(id): boolean /* false when full */; clear() }`, persisted to `localStorage["compare:ids"]` (guarded try/catch; hydrates in an effect to avoid SSR mismatch). Mounted in the root layout.

`src/components/CompareButton.tsx` (client) — small chip-style toggle (`Columns3` icon, "Compare" / "Added"), `aria-pressed`; when the tray is full and this school isn't in it, the button is disabled with title "Compare up to 4 schools". Rendered beside the heart in the same wrapper (`SchoolCard`, search cards) and in the school page hero.

`src/components/CompareTray.tsx` (client) — fixed bottom bar (hidden when empty): selected school names as removable chips, "Compare (n)" `Button` linking to `formatCompareHref(ids)` (disabled below 2), "Clear". Needs names: the provider stores `{ id, name, href }` per pick, not just ids (name/href come from the button's props at toggle time). Mounted once in the layout.

`/compare` page (`src/app/compare/page.tsx`, dynamic, `robots: noindex`)
- Reads `?ids=` via `parseCompareIds`; loads `getSchoolsByIds`, `getPrograms`, `getTrainerAircraft`, `getLocationMaps`, `getAirports`.
- Fewer than 2 valid schools → `Notice` "Pick at least two schools to compare" + link to `/search`.
- Table (horizontal scroll wrapper on small screens; first column sticky): School (name link + airport · location), Rating (stars + count / "No reviews"), FAA part, Programs (one row per program in the union, ✓ / —), Aircraft (same), Fleet size, Instructors, Website, Phone. Each column header has a "Remove" link (`/compare?ids=` minus that id).
- The page also renders `<CompareSync ids>` (client) so opening a shared compare URL seeds the local tray with those schools.

`/saved` page (`src/app/saved/page.tsx`, dynamic, `noindex`) — requires login (`redirect("/login?next=/saved")`), `PageHero` "Saved schools", grid of `SchoolCard` with hearts (so un-saving works in place), empty state linking to `/search`.

Navigation: `AuthButton` gains a "Saved" link (`Heart` icon) for signed-in users, before the admin links.

## Error handling

| Situation | Behaviour |
|---|---|
| Toggle while logged out | Button is a login link; action also rejects server-side |
| Action fails (network/RLS) | Optimistic state reverts; `aria-live` message "Couldn't save — try again" |
| Compare full | Button disabled with explanatory title |
| `localStorage` unavailable | Provider works in-memory for the session |
| Compare URL with unknown/too many ids | Unknown ids dropped, list capped at 4, notice if < 2 remain |

## Testing

- `scripts/tests/compare.test.ts`: `parseCompareIds` (dedupe, cap, sanitise, empty/null), `formatCompareHref`.
- `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
- Manual: heart toggles and persists across reload; guest heart → login → returns to the page; `/saved` lists and un-saves; compare tray persists across navigation; `/compare?ids=` renders, remove links work; shared URL seeds the tray.

## Out of scope

Guest favorites, favorites count on listings, notifications on saved-school changes, owner-visible "saved by N" stats.
