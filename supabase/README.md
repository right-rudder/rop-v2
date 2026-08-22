# Supabase setup

The app code is fully wired to Supabase; these are the one-time dashboard
steps to make it live.

## 1. Create the project & fill in env vars

Create a project at [database.new](https://database.new), then replace the
placeholders in `.env.local` with the values from
**Project Settings → API**:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / publishable key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000     # production URL when deployed
```

The app never uses the **service-role key** — every write goes through the
user's session and RLS. Don't put it in `.env.local` (if an older copy of
the file has it, delete the line; rotate the key in the dashboard if the
file was ever shared).

## 2. Apply the schema, then the seed data

In **SQL Editor**, run in order:

1. `supabase/reset.sql` — only if the project already has tables from an
   older schema version (drops all app tables; does not touch auth.users)
2. `supabase/schema.sql` — tables, constraints, RLS policies, grants,
   profile trigger, rating trigger, column-protection trigger
3. `supabase/seed.sql` — catalog data (states, cities, airports, programs,
   aircraft, schools). Regenerate anytime with `node scripts/generate-seed.ts`
   (it reads `src/lib/mock-data.ts`).

> The seed is **demo data**: school websites (`example.com`) and phone
> numbers (`555-…`) are placeholders to replace before launch, and every
> school starts at 0 reviews — `rating` / `review_count` are owned by the
> `refresh_school_rating` trigger and only move when real reviews are posted.

If your database was created from an older `schema.sql`, don't reset — run the
idempotent patch files instead (each one is also folded into `schema.sql` for
fresh installs):

- `supabase/add-school-submissions.sql` — "Add a School" submissions table
- `supabase/add-admin-policies.sql` — admin RLS policies + owner-policy hardening
- `supabase/add-one-review-per-user.sql` — one review per user per school
  (de-dupes keeping the newest, unique index, drops owner review edits)
- `supabase/add-audit-hardening.sql` — run **last**: owners can no longer
  change `featured` / rating / placement / ownership columns on their
  listing (BEFORE UPDATE trigger), submissions always start `pending`,
  length/format constraints, explicit Data API grants, and a one-off
  recompute of `rating` / `review_count` from real reviews
- `supabase/add-grant-hygiene.sql` — run after the above: drops the leftover
  `school_contacts` table, revokes RPC `EXECUTE` on trigger functions, and
  resets `anon` / `authenticated` table privileges — and the default privileges
  for future tables / functions — to exactly what the app needs (the defaults
  granted ALL, incl. TRUNCATE / REFERENCES / TRIGGER)

### Data API exposure

Newer Supabase projects no longer expose new tables to the Data (REST)
API automatically. `schema.sql` and the hardening patch grant the `anon` /
`authenticated` roles explicitly, so no dashboard step is needed — but if
pages ever render empty after a fresh install, check
**Project Settings → Data API** and confirm `public` is an exposed schema.

Users, reviews, and comments are not seeded — they come from real signups.

## 3. Auth configuration

In **Authentication → URL Configuration**:

- **Site URL**: your production URL (or `http://localhost:3000` for dev)
- **Redirect URLs**: add `http://localhost:3000/auth/confirm` and the
  production equivalent

In **Authentication → Email Templates**, point the links at the app's
confirm route so the SSR client can set the session cookie:

- **Confirm signup**:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
- **Reset password**:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password`

(The `/auth/confirm` route also handles the default `?code=` redirect style
as a fallback, but the token_hash templates are the recommended setup. The
`next` parameter only accepts same-site paths — anything else falls back
to `/`.)

Recommended: enable **CAPTCHA** (Turnstile/hCaptcha) under
**Authentication → Attack Protection** for signups and password resets.

## 4. Regenerate DB types (optional, once the project exists)

`src/lib/supabase/database.types.ts` is hand-written to match
`schema.sql`. Once the project is live you can regenerate it:

```sh
npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
```

## Verify

1. `npm run dev`
2. Browse `/states` → a state → a school: pages should render seeded rows.
3. Sign up at `/signup`, confirm via the email link, and check the Navbar
   switches to **My Profile / Log Out**.
4. Leave a review on a school page — the school's rating and review count
   update automatically (database trigger).
5. Password reset: `/forgot-password` → email link → `/update-password`.
6. As a listing owner, the edit form saves content changes, but a direct
   `PATCH …/rest/v1/flight_schools?id=eq.<id>` with `{"featured": true}`
   is rejected with `42501`.
