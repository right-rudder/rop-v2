# Supabase setup

The app code is fully wired to Supabase; these are the one-time dashboard
steps to make it live.

## 1. Create the project & fill in env vars

Create a project at [database.new](https://database.new), then replace the
placeholders in `.env.local` with the values from
**Project Settings → API**:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, never expose
NEXT_PUBLIC_SITE_URL=http://localhost:3000     # production URL when deployed
```

## 2. Apply the schema, then the seed data

In **SQL Editor**, run in order:

1. `supabase/reset.sql` — only if the project already has tables from an
   older schema version (drops all app tables; does not touch auth.users)
2. `supabase/schema.sql` — tables, RLS policies, profile trigger, rating trigger
3. `supabase/seed.sql` — catalog data (states, cities, airports, programs,
   aircraft, schools). Regenerate anytime with `node scripts/generate-seed.ts`
   (it reads `src/lib/mock-data.ts`).

If your database was created from an older `schema.sql`, don't reset — run the
idempotent patch files instead (each one is also folded into `schema.sql` for
fresh installs):

- `supabase/add-school-submissions.sql` — "Add a School" submissions table
- `supabase/add-admin-policies.sql` — admin RLS policies + owner-policy hardening

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
as a fallback, but the token_hash templates are the recommended setup.)

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
