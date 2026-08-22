# Favorites + Compare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Signed-in users can save schools (heart) and see them at `/saved`; anyone can pick up to four schools and compare them side by side at `/compare?ids=…`.

**Architecture:** Favorites are a `favorites(user_id, school_id)` table behind own-rows RLS, toggled by one server action, and exposed to every card through a `FavoritesProvider` seeded once in the root layout. Compare is browser-local (`CompareProvider` + `localStorage`), surfaced by a sticky tray, and rendered server-side from the URL on `/compare`.

**Tech Stack:** Next.js 16 App Router (Server Components + Server Functions), React 19 (`useOptimistic`, `useTransition`), Supabase Postgres + RLS, Tailwind v4 tokens, `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-21-favorites-compare-design.md`

## Global Constraints

- Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` before writing server functions; client components need `"use client"`.
- Tokens only (`bg-paper`, `bg-surface`, `bg-surface-2`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, `text-accent`, `text-accent-ink`, `bg-accent-soft`, `text-sky`); primitives from `src/components/ui/*`; never `dark:` variants or raw palette classes.
- Tests: zero-dependency `node --test` files in `scripts/tests/*.test.ts` with **relative** imports; pure helpers must not import anything that needs the `@/` alias at runtime.
- SQL patches are idempotent `supabase/add-*.sql`, folded into `schema.sql`; RLS policies use `to authenticated` + `(select auth.uid())`. Explicit grants only (defaults are revoked).
- Never nest a `<button>`/`<a>` inside a card `<a>`: interactive controls are siblings, absolutely positioned.
- Compare max: `4`. localStorage key: `compare:v1`.
- Commit messages end with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/compare.ts` (new) + `scripts/tests/compare.test.ts` (new) | Pure compare helpers: id parsing/formatting, max. |
| `supabase/add-favorites.sql` (new), `supabase/schema.sql`, `supabase/README.md`, `src/lib/supabase/database.types.ts` | Favorites table, RLS, grants, docs, types. |
| `src/lib/data.ts` | `getFavoriteSchoolIds`, `getFavoriteSchools`. |
| `src/app/actions/favorites.ts` (new) | `toggleFavorite` server function. |
| `src/components/FavoritesProvider.tsx` (new) | Context: saved ids + optimistic toggle. |
| `src/components/FavoriteButton.tsx` (new) | Heart button / login link. |
| `src/components/CompareProvider.tsx` (new) | Context: picks (id, name, href) persisted to localStorage. |
| `src/components/CompareButton.tsx` (new), `src/components/CompareTray.tsx` (new), `src/components/CompareSync.tsx` (new) | Toggle chip, sticky tray, URL → tray seeding. |
| `src/components/SchoolCard.tsx`, `src/components/AdvancedSearchExplorer.tsx`, school page, `src/app/layout.tsx`, `src/components/AuthButton.tsx` | Mount providers; place heart + compare controls; nav link. |
| `src/app/saved/page.tsx` (new), `src/app/compare/page.tsx` (new) | Pages. |

---

### Task 1: Compare helpers

**Files:**
- Create: `src/lib/compare.ts`
- Create: `scripts/tests/compare.test.ts`

**Interfaces:**
- Produces: `COMPARE_MAX = 4`, `COMPARE_STORAGE_KEY = "compare:v1"`, `parseCompareIds(param: string | null | undefined): string[]`, `formatCompareHref(ids: string[]): string`, `type ComparePick = { id: string; name: string; href: string }`.

- [ ] **Step 1: Write the failing tests** — `scripts/tests/compare.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCompareIds, formatCompareHref, COMPARE_MAX } from "../../src/lib/compare.ts";

test("parseCompareIds: splits, trims, dedupes, keeps order", () => {
  assert.deepEqual(parseCompareIds("a, b,a,c"), ["a", "b", "c"]);
});

test("parseCompareIds: drops unsafe or empty ids", () => {
  assert.deepEqual(parseCompareIds("ok-1,,Bad Id,<script>,x".repeat(1)), ["ok-1", "x"]);
  assert.deepEqual(parseCompareIds(null), []);
  assert.deepEqual(parseCompareIds(undefined), []);
  assert.deepEqual(parseCompareIds(""), []);
});

test("parseCompareIds: caps at COMPARE_MAX", () => {
  const ids = parseCompareIds("a,b,c,d,e,f");
  assert.equal(ids.length, COMPARE_MAX);
  assert.deepEqual(ids, ["a", "b", "c", "d"]);
});

test("parseCompareIds: rejects ids longer than 64 chars", () => {
  assert.deepEqual(parseCompareIds("a".repeat(65) + ",b"), ["b"]);
});

test("formatCompareHref", () => {
  assert.equal(formatCompareHref(["a", "b"]), "/compare?ids=a%2Cb");
  assert.equal(formatCompareHref([]), "/compare");
});
```

- [ ] **Step 2: Run to verify failure** — `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test scripts/tests/compare.test.ts` → `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement** — `src/lib/compare.ts`:

```ts
/** Pure helpers for the compare feature. No imports (node --test runs this file directly). */
export const COMPARE_MAX = 4;
export const COMPARE_STORAGE_KEY = "compare:v1";

export type ComparePick = { id: string; name: string; href: string };

const SAFE_ID = /^[a-z0-9-]{1,64}$/;

/** `?ids=a,b,c` → ["a","b","c"]: trimmed, safe, deduped, capped. */
export function parseCompareIds(param: string | null | undefined): string[] {
  if (!param) return [];
  const out: string[] = [];
  for (const raw of param.split(",")) {
    const id = raw.trim();
    if (!SAFE_ID.test(id) || out.includes(id)) continue;
    out.push(id);
    if (out.length === COMPARE_MAX) break;
  }
  return out;
}

export function formatCompareHref(ids: string[]): string {
  return ids.length ? `/compare?ids=${encodeURIComponent(ids.join(","))}` : "/compare";
}
```

- [ ] **Step 4: Run tests** — `npm test` → all pass (existing 22 + 5).
- [ ] **Step 5: Commit** — `git add src/lib/compare.ts scripts/tests/compare.test.ts && git commit -m "feat(compare): id parsing helpers"`

---

### Task 2: Favorites table

**Files:**
- Create: `supabase/add-favorites.sql`
- Modify: `supabase/schema.sql` (after the `comments` table block for the table; in the RLS section for policies; in the grants section)
- Modify: `supabase/README.md` (patch list)
- Modify: `src/lib/supabase/database.types.ts`

- [ ] **Step 1: Patch file** — `supabase/add-favorites.sql`:

```sql
-- ============================================================
-- Favorites (saved schools)
-- One row per (user, school). Users see and toggle only their own
-- rows; nothing is public. Idempotent. Run in: SQL Editor.
-- ============================================================
create table if not exists public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  school_id  text not null references public.flight_schools (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, school_id)
);
create index if not exists favorites_school_id_idx on public.favorites (school_id);

alter table public.favorites enable row level security;

drop policy if exists "Own favorites read" on public.favorites;
create policy "Own favorites read" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Own favorites insert" on public.favorites;
create policy "Own favorites insert" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Own favorites delete" on public.favorites;
create policy "Own favorites delete" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;
```

- [ ] **Step 2: schema.sql** — add the `create table public.favorites (...)` + index right after the `comments` table; `alter table public.favorites enable row level security;` next to the other enables; the three policies in the user-policies section; and in the grants section after the `school_submissions` grant line: `grant select, insert, delete on public.favorites to authenticated;`.

- [ ] **Step 3: database.types.ts** — add under `Tables`:

```ts
      favorites: {
        Row: { user_id: string; school_id: string; created_at: string };
        Insert: { user_id: string; school_id: string; created_at?: string };
        Update: { user_id?: string; school_id?: string; created_at?: string };
        Relationships: [];
      };
```

- [ ] **Step 4: README** — patch list bullet: ``- `supabase/add-favorites.sql` — saved schools (`favorites` table, own-rows RLS)``.
- [ ] **Step 5: Verify** — `npx tsc --noEmit`; apply the patch to the project (SQL editor or MCP `apply_migration` named `add_favorites`) and confirm `select count(*) from public.favorites` works as admin.
- [ ] **Step 6: Commit** — `git add supabase/add-favorites.sql supabase/schema.sql supabase/README.md src/lib/supabase/database.types.ts && git commit -m "feat(db): favorites table with own-rows RLS"`

---

### Task 3: Data getters + toggle action

**Files:**
- Modify: `src/lib/data.ts`
- Create: `src/app/actions/favorites.ts`

**Interfaces:**
- Produces: `getFavoriteSchoolIds(userId): Promise<string[]>`, `getFavoriteSchools(userId): Promise<FlightSchool[]>`, `toggleFavorite(schoolId: string, path: string): Promise<{ saved: boolean } | { error: string }>`.

- [ ] **Step 1: Getters** — append to `src/lib/data.ts` (Favorites section):

```ts
// ── Favorites ──────────────────────────────────────────────────────────────────

/** Ids of the schools a user has saved, newest first. RLS limits this to the caller's own rows. */
export const getFavoriteSchoolIds = cache(async (userId: string): Promise<string[]> => {
  const supabase = await createClient();
  const res = await supabase
    .from("favorites")
    .select("school_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return orThrow(res).map((r) => r.school_id);
});

export async function getFavoriteSchools(userId: string): Promise<FlightSchool[]> {
  const ids = await getFavoriteSchoolIds(userId);
  const byId = await getSchoolsByIds(ids);
  return ids.flatMap((id) => (byId[id] ? [byId[id]] : []));
}
```

- [ ] **Step 2: Action** — `src/app/actions/favorites.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { friendlyDbError } from "@/lib/supabase/errors";
import { safeInternalPath } from "@/lib/safe-path";

export type ToggleFavoriteResult = { saved: boolean } | { error: string };

/** Save or un-save a school for the signed-in user. `path` is the page to re-render. */
export async function toggleFavorite(schoolId: string, path: string): Promise<ToggleFavoriteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to save schools." };

  const id = (schoolId ?? "").trim();
  if (!id || id.length > 64) return { error: "Missing school." };

  const existing = await supabase
    .from("favorites")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("school_id", id)
    .maybeSingle();
  if (existing.error) return { error: friendlyDbError(existing.error) };

  let saved: boolean;
  if (existing.data) {
    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("school_id", id);
    if (error) return { error: friendlyDbError(error) };
    saved = false;
  } else {
    const { error } = await supabase.from("favorites").insert({ user_id: user.id, school_id: id });
    if (error && error.code !== "23505") return { error: friendlyDbError(error) };
    saved = true;
  }

  const safePath = safeInternalPath(path, "");
  if (safePath) revalidatePath(safePath);
  revalidatePath("/saved");
  return { saved };
}
```

- [ ] **Step 3: Verify** — `npx tsc --noEmit && npm run lint`.
- [ ] **Step 4: Commit** — `git add src/lib/data.ts src/app/actions/favorites.ts && git commit -m "feat(favorites): getters and toggle action"`

---

### Task 4: FavoritesProvider + FavoriteButton + layout mount

**Files:**
- Create: `src/components/FavoritesProvider.tsx`
- Create: `src/components/FavoriteButton.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces: `useFavorites(): { viewerId: string | null; ids: ReadonlySet<string>; pending: ReadonlySet<string>; toggle(schoolId: string, path: string): void; lastError: string | null }` and `<FavoriteButton schoolId path size? className? showLabel? />`.

- [ ] **Step 1: Provider**:

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toggleFavorite } from "@/app/actions/favorites";

type Ctx = {
  viewerId: string | null;
  ids: ReadonlySet<string>;
  pending: ReadonlySet<string>;
  lastError: string | null;
  toggle: (schoolId: string, path: string) => void;
};

const FavoritesContext = createContext<Ctx | null>(null);

export function FavoritesProvider({
  viewerId,
  initialIds,
  children,
}: {
  viewerId: string | null;
  initialIds: string[];
  children: ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(() => new Set(initialIds));
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [lastError, setLastError] = useState<string | null>(null);
  const seeded = useRef(initialIds.join(","));

  // Re-seed when the server hands down a different list (login/logout re-render the layout).
  useEffect(() => {
    const key = initialIds.join(",");
    if (key !== seeded.current) {
      seeded.current = key;
      setIds(new Set(initialIds));
    }
  }, [initialIds]);

  const toggle = useCallback(
    (schoolId: string, path: string) => {
      if (!viewerId || pending.has(schoolId)) return;
      const wasSaved = ids.has(schoolId);
      setLastError(null);
      setIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(schoolId);
        else next.add(schoolId);
        return next;
      });
      setPending((prev) => new Set(prev).add(schoolId));
      toggleFavorite(schoolId, path)
        .then((result) => {
          if ("error" in result) {
            setLastError(result.error);
            setIds((prev) => {
              const next = new Set(prev);
              if (wasSaved) next.add(schoolId);
              else next.delete(schoolId);
              return next;
            });
          }
        })
        .catch(() => setLastError("Couldn't save — try again."))
        .finally(() =>
          setPending((prev) => {
            const next = new Set(prev);
            next.delete(schoolId);
            return next;
          }),
        );
    },
    [viewerId, ids, pending],
  );

  const value = useMemo(() => ({ viewerId, ids, pending, lastError, toggle }), [viewerId, ids, pending, lastError, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): Ctx {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
```

- [ ] **Step 2: Button**:

```tsx
"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/FavoritesProvider";
import { cn } from "@/lib/cn";

const sizes = { sm: "h-9 w-9", md: "h-11 px-4 gap-2" } as const;

/**
 * Heart toggle. Renders a login link for guests. Never place inside another
 * <a>: callers position it as a sibling of the card link.
 */
export function FavoriteButton({
  schoolId,
  path,
  size = "sm",
  showLabel = false,
  className,
}: {
  schoolId: string;
  /** Page to re-render after toggling (usually the current pathname). */
  path: string;
  size?: keyof typeof sizes;
  showLabel?: boolean;
  className?: string;
}) {
  const { viewerId, ids, pending, toggle, lastError } = useFavorites();
  const saved = ids.has(schoolId);
  const busy = pending.has(schoolId);
  const base = cn(
    "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-[background-color,color,border-color,transform] duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    saved ? "border-accent/40 bg-accent-soft text-accent-ink" : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink",
    sizes[size],
    className,
  );
  const icon = <Heart size={size === "sm" ? 16 : 18} aria-hidden className={cn("transition-transform", saved && "scale-110 fill-current")} />;

  if (!viewerId) {
    return (
      <Link href={`/login?next=${encodeURIComponent(path)}`} aria-label="Log in to save this school" title="Log in to save" className={base}>
        {icon}
        {showLabel && "Save"}
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved schools" : "Save school"}
        title={saved ? "Saved" : "Save"}
        disabled={busy}
        onClick={() => toggle(schoolId, path)}
        className={cn(base, busy && "opacity-60")}
      >
        {icon}
        {showLabel && (saved ? "Saved" : "Save")}
      </button>
      {lastError && <span className="sr-only" aria-live="polite">{lastError}</span>}
    </>
  );
}
```

- [ ] **Step 3: Layout** — in `src/app/layout.tsx` import `FavoritesProvider` and `getFavoriteSchoolIds`; after `const viewer = …` add `const favoriteIds = viewer ? await getFavoriteSchoolIds(viewer.id) : [];` and wrap: `<FavoritesProvider viewerId={viewer?.id ?? null} initialIds={favoriteIds}>` around `<Navbar …/><main …/><Footer />` inside `ThemeProvider`.
- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run lint`; `npm run dev`, any page renders (no hearts yet).
- [ ] **Step 5: Commit** — `git commit -am "feat(favorites): provider, heart button, layout seed"` (add the new files first).

---

### Task 5: Hearts on cards, `/saved`, nav link

**Files:**
- Modify: `src/components/SchoolCard.tsx`; callers in `src/app/page.tsx`, `src/app/states/[stateSlug]/page.tsx`, `src/app/cities/[citySlug]/page.tsx`, `src/app/featured/page.tsx`, `src/app/airports/[airportCode]/page.tsx`, `src/components/TopRatedExplorer.tsx`
- Modify: `src/components/AdvancedSearchExplorer.tsx` (result card)
- Modify: school page (`src/app/[stateSlug]/[citySlug]/[airportCode]/[schoolSlug]/page.tsx`) hero `aside`
- Create: `src/app/saved/page.tsx`
- Modify: `src/components/AuthButton.tsx`

- [ ] **Step 1: SchoolCard** — add props `schoolId?: string; path?: string;` (path defaults to `href`). When `schoolId` is set, return:

```tsx
    <div className="relative h-full">
      <Card href={href} className={cls}>{inner}</Card>
      <div className="absolute right-3 top-3 z-10 flex gap-1.5">
        <CompareButton id={schoolId} name={name} href={href ?? "#"} />
        <FavoriteButton schoolId={schoolId} path={path ?? href ?? "/"} />
      </div>
    </div>
```

(`CompareButton` arrives in Task 6 — until then render only `FavoriteButton`, then add the compare control in Task 6.) Because the heart now overlaps the top-right, move the existing `ArrowUpRight` icon: keep it but add `pr-20` to the header row when `schoolId` is set so text doesn't run under the controls.

- [ ] **Step 2: Callers** — each `<SchoolCard … />` listed above gets `schoolId={school.id}` (TopRatedExplorer/search items carry `id`). `SchoolCard` stays a server-compatible component: it only *renders* the client buttons.
- [ ] **Step 3: Search result cards** — in `AdvancedSearchExplorer` wrap each result `Card` in `<div className="relative h-full">` and add the same absolute control group with `path="/search"`; add `pr-20` to the first row.
- [ ] **Step 4: School page hero** — in the hero `aside` add, before "Visit website": `<FavoriteButton schoolId={school.id} path={schoolHref(school)} size="md" showLabel />`. Since `aside` currently renders only when website/phone exist, change the condition to always render the wrapper `div`.
- [ ] **Step 5: `/saved` page**:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteSchools, getLocationMaps } from "@/lib/data";
import { schoolHref } from "@/lib/utils";
import { PageHero } from "@/components/PageHero";
import { SchoolCard } from "@/components/SchoolCard";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Saved schools", robots: { index: false } };

export default async function SavedPage() {
  const viewer = await getCurrentUser();
  if (!viewer) redirect("/login?next=/saved");
  const [schools, { cityNameBySlug, stateBySlug }] = await Promise.all([
    getFavoriteSchools(viewer.id),
    getLocationMaps(),
  ]);
  return (
    <div className="pb-20">
      <PageHero
        size="narrow"
        eyebrow={`${schools.length} saved ${schools.length === 1 ? "school" : "schools"}`}
        title="Saved schools"
        description="Your shortlist. Tap the heart on any school to add or remove it."
      />
      <Container className="py-12">
        {schools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
            <p className="font-display text-xl font-bold tracking-tight text-ink">Nothing saved yet</p>
            <p className="mt-1 text-sm text-muted">Browse the directory and tap the heart on schools you like.</p>
            <Button href="/search" className="mt-6">Search schools</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <SchoolCard
                key={school.id}
                schoolId={school.id}
                path="/saved"
                name={school.name}
                location={`${cityNameBySlug[school.citySlug] ?? school.citySlug}, ${stateBySlug[school.stateSlug]?.abbreviation ?? ""}`}
                airportCode={school.primaryAirportCode}
                rating={school.rating}
                reviewCount={school.reviewCount}
                href={schoolHref(school)}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
```

(Check `getLocationMaps()`'s actual return shape in `data.ts` — it is used by the school page — and adapt the destructuring.)

- [ ] **Step 6: Nav link** — in `AuthButton`, for signed-in viewers render before the admin links: `<Link href="/saved" onClick={onNavigate} className={…same pill style, neutral tones: "border-line bg-surface text-ink hover:border-ink/40"}><Heart size={14} /> Saved</Link>`.
- [ ] **Step 7: Verify** — `tsc`, lint, test; dev: heart on home/search/state cards, toggles, persists; guest → login → back; `/saved` lists; hero Save works.
- [ ] **Step 8: Commit** — `git add -A src && git commit -m "feat(favorites): hearts on cards, /saved page, nav link"`

---

### Task 6: Compare provider, button, tray

**Files:**
- Create: `src/components/CompareProvider.tsx`, `src/components/CompareButton.tsx`, `src/components/CompareTray.tsx`
- Modify: `src/app/layout.tsx`, `src/components/SchoolCard.tsx`, `src/components/AdvancedSearchExplorer.tsx`, school page hero

- [ ] **Step 1: Provider** (localStorage, hydrate in effect):

```tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { COMPARE_MAX, COMPARE_STORAGE_KEY, type ComparePick } from "@/lib/compare";

type Ctx = {
  picks: ComparePick[];
  has: (id: string) => boolean;
  full: boolean;
  toggle: (pick: ComparePick) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  replace: (picks: ComparePick[]) => void;
};

const CompareContext = createContext<Ctx | null>(null);

function load(): ComparePick[] {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is ComparePick => !!p && typeof p.id === "string" && typeof p.name === "string" && typeof p.href === "string")
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

function save(picks: ComparePick[]) {
  try {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(picks));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [picks, setPicks] = useState<ComparePick[]>([]);
  useEffect(() => {
    setPicks(load());
  }, []);

  const update = useCallback((next: ComparePick[]) => {
    setPicks(next);
    save(next);
  }, []);

  const has = useCallback((id: string) => picks.some((p) => p.id === id), [picks]);
  const toggle = useCallback(
    (pick: ComparePick) => {
      if (picks.some((p) => p.id === pick.id)) {
        update(picks.filter((p) => p.id !== pick.id));
        return true;
      }
      if (picks.length >= COMPARE_MAX) return false;
      update([...picks, pick]);
      return true;
    },
    [picks, update],
  );
  const remove = useCallback((id: string) => update(picks.filter((p) => p.id !== id)), [picks, update]);
  const clear = useCallback(() => update([]), [update]);
  const replace = useCallback((next: ComparePick[]) => update(next.slice(0, COMPARE_MAX)), [update]);

  const value = useMemo(
    () => ({ picks, has, full: picks.length >= COMPARE_MAX, toggle, remove, clear, replace }),
    [picks, has, toggle, remove, clear, replace],
  );
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare(): Ctx {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside <CompareProvider>");
  return ctx;
}
```

(`setPicks(load())` inside an effect is flagged by `react-hooks/set-state-in-effect`; add `// eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount` above it, as `ThemeToggle` does.)

- [ ] **Step 2: Button**:

```tsx
"use client";

import { Columns3, Check } from "lucide-react";
import { useCompare } from "@/components/CompareProvider";
import { cn } from "@/lib/cn";

export function CompareButton({ id, name, href, size = "sm", showLabel = false, className }: { id: string; name: string; href: string; size?: "sm" | "md"; showLabel?: boolean; className?: string }) {
  const { has, full, toggle } = useCompare();
  const active = has(id);
  const disabled = !active && full;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from compare" : "Add to compare"}
      title={disabled ? "Compare up to 4 schools" : active ? "In compare" : "Compare"}
      disabled={disabled}
      onClick={() => toggle({ id, name, href })}
      className={cn(
        "inline-flex items-center justify-center rounded-full border text-sm font-semibold transition-[background-color,color,border-color] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-40",
        active ? "border-sky/40 bg-surface-2 text-sky" : "border-line bg-surface text-muted hover:border-ink/40 hover:text-ink",
        size === "sm" ? "h-9 w-9" : "h-11 gap-2 px-4",
        className,
      )}
    >
      {active ? <Check size={size === "sm" ? 16 : 18} aria-hidden /> : <Columns3 size={size === "sm" ? 16 : 18} aria-hidden />}
      {showLabel && (active ? "Comparing" : "Compare")}
    </button>
  );
}
```

- [ ] **Step 3: Tray** (fixed bottom, hidden when empty):

```tsx
"use client";

import { X } from "lucide-react";
import { useCompare } from "@/components/CompareProvider";
import { formatCompareHref, COMPARE_MAX } from "@/lib/compare";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function CompareTray() {
  const { picks, remove, clear } = useCompare();
  if (picks.length === 0) return null;
  return (
    <div role="region" aria-label="Compare schools" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 shadow-card backdrop-blur">
      <Container className="flex flex-wrap items-center gap-3 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted">
          Compare <span className="text-ink">{picks.length}</span>/{COMPARE_MAX}
        </span>
        <ul className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {picks.map((p) => (
            <li key={p.id} className="inline-flex max-w-[14rem] items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink">
              <span className="truncate">{p.name}</span>
              <button type="button" onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from compare`} className="rounded-full text-muted hover:text-ink"><X size={12} /></button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
          {picks.length >= 2 ? (
            <Button size="sm" href={formatCompareHref(picks.map((p) => p.id))}>Compare ({picks.length})</Button>
          ) : (
            <Button size="sm" disabled title="Pick at least two schools">Compare ({picks.length})</Button>
          )}
        </div>
      </Container>
    </div>
  );
}
```

- [ ] **Step 4: Mount** — layout: wrap with `<CompareProvider>` (inside `FavoritesProvider`), and render `<CompareTray />` after `<Footer />`. Give `<main>` `pb-20` only when needed? Simpler: the tray overlays; add `className="pb-24"` to the tray's sibling? Keep the layout unchanged — the fixed tray is acceptable over the footer.
- [ ] **Step 5: Controls** — `SchoolCard` control group now renders `<CompareButton id={schoolId} name={name} href={href ?? "#"} />` before the heart (as shown in Task 5 Step 1). Search cards: same. School hero: `<CompareButton id={school.id} name={school.name} href={schoolHref(school)} size="md" showLabel />` next to the heart.
- [ ] **Step 6: Verify** — `tsc`, lint; dev: add two schools from `/search`, tray appears, persists across navigation, "Compare (2)" links to `/compare?ids=…` (404 until Task 7).
- [ ] **Step 7: Commit** — `git add -A src && git commit -m "feat(compare): provider, toggle button, sticky tray"`

---

### Task 7: `/compare` page

**Files:**
- Create: `src/app/compare/page.tsx`, `src/components/CompareSync.tsx`

- [ ] **Step 1: CompareSync** — seeds the tray from the URL on mount:

```tsx
"use client";

import { useEffect } from "react";
import { useCompare } from "@/components/CompareProvider";
import type { ComparePick } from "@/lib/compare";

export function CompareSync({ picks }: { picks: ComparePick[] }) {
  const { replace } = useCompare();
  useEffect(() => {
    replace(picks);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per URL
  }, [picks.map((p) => p.id).join(",")]);
  return null;
}
```

- [ ] **Step 2: Page** — `src/app/compare/page.tsx` (server):
  - `searchParams: Promise<{ ids?: string }>` → `parseCompareIds`.
  - Load `getSchoolsByIds(ids)`, `getPrograms()`, `getTrainerAircraft()`, `getLocationMaps()`, `getAirports()`.
  - `schools = ids.flatMap(id => byId[id] ? [byId[id]] : [])`; if `< 2` → `PageHero` "Compare schools" + `Notice tone="info"` "Pick at least two schools to compare." + `Button href="/search"`.
  - Else render `<CompareSync picks={schools.map(s => ({ id: s.id, name: s.name, href: schoolHref(s) }))} />` and the table inside `<div className="overflow-x-auto">`:
    - `<table className="w-full min-w-[48rem] border-separate border-spacing-0 text-sm">`; first column `th` sticky-left `bg-paper`, column headers: school name link + mono `ICAO · City, ST` + a small "Remove" link to `formatCompareHref(ids.filter(x => x !== s.id))`.
    - Rows: Rating (`Stars` + count or "No reviews"), FAA part (`Part 61` / `Part 141` / `61 & 141` / —), one row per program in the union of `programSlugs` (sorted by `sortOrder`; cell `✓` in `text-accent-ink` or `—` in `text-muted`), one row per aircraft in the union (display name), Fleet size (`estimatedPlanes` or —), Instructors (`estimatedInstructors` or —), Website (link or —), Phone (tel link or —).
  - `export const metadata = { title: "Compare schools", robots: { index: false } }`.
- [ ] **Step 3: Verify** — `tsc`, lint, `npm test`, `npm run build`; dev: `/compare?ids=<two real ids>` renders table; remove links work; `/compare?ids=bogus` shows notice; opening the URL in a fresh tab seeds the tray.
- [ ] **Step 4: Commit** — `git add -A src && git commit -m "feat(compare): side-by-side compare page"`

---

### Task 8: Finish

- [ ] `npm test && npm run lint && npx tsc --noEmit && npm run build` all green.
- [ ] Apply `supabase/add-favorites.sql` to the project if not done in Task 2; confirm with `select * from pg_policies where tablename='favorites'` (3 policies).
- [ ] Push `feature/favorites-compare`, open PR against `main` (title "feat: saved schools and side-by-side compare"), body listing: favorites table + RLS, hearts on cards, `/saved`, compare tray + `/compare`, env: none new.

## Self-review

- Spec coverage: data model (T2), getters/action (T3), provider/button/layout (T4), placements + `/saved` + nav (T5), compare helpers (T1), provider/button/tray (T6), `/compare` + sync (T7), tests (T1 + T8 verification). Error table: guest link (T4), revert on error (T4 provider), full tray (T6 button), storage unavailable (T6 `load/save` try/catch), bad URL ids (T1 + T7 notice).
- Type consistency: `ComparePick` defined in T1 and used in T6/T7; `useFavorites()` shape in T4 matches `FavoriteButton`; `toggleFavorite(schoolId, path)` signature identical in T3/T4.
- Placeholders: none; the one "check actual shape" note (`getLocationMaps`) is a verification instruction with the exact function named.
