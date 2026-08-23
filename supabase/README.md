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

The map view on `/search` additionally needs a Google Maps browser key:

```ini
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key restricted to your HTTP referrers + Maps JavaScript API>
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=                 # optional Cloud map style id; defaults to DEMO_MAP_ID
```

Without the key the rest of the site — including the near-me radius filter —
works; only the map itself shows a notice.

Lead capture ("Request information" on school pages) forwards each lead to a
GoHighLevel workflow:

```ini
GHL_WEBHOOK_URL=<Inbound Webhook trigger URL from the GHL workflow>   # server-only
LEAD_IP_SALT=<any random string>                                       # optional; hashes visitor IPs for rate limiting
```

Leads are always stored in `public.leads` and listed at `/admin/leads`; the
webhook only adds the GHL hand-off. Without the URL nothing is sent.

Every user-facing write goes through the user's session and RLS. The one
exception is lead capture: the `submitLead` server action calls the
server-only `submit_lead()` function with the **service-role key**, so the
rate-limit fingerprint can't be forged by a direct Data API caller.

```ini
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>   # server-only; never NEXT_PUBLIC_
```

It is read only inside `src/lib/supabase/service.ts` on the server. Keep it
out of client code and rotate it in the dashboard if it is ever exposed.

## 2. Apply the schema, then the seed data

In **SQL Editor**, run in order:

1. `supabase/reset.sql` — only if the project already has tables from an
   older schema version (drops all app tables; does not touch auth.users)
2. `supabase/schema.sql` — tables, constraints, RLS policies, grants,
   profile trigger, rating trigger, column-protection trigger (a snapshot of
   `supabase/migrations/`, which is the canonical history — see below)
3. `supabase/seed.sql` — catalog data (states, cities, airports, programs,
   aircraft, schools). Regenerate anytime with `node scripts/generate-seed.ts`
   (it reads `src/lib/mock-data.ts`).

> The seed is **demo data**: school websites (`example.com`) and phone
> numbers (`555-…`) are placeholders to replace before launch, and every
> school starts at 0 reviews — `rating` / `review_count` are owned by the
> `refresh_school_rating` trigger and only move when real reviews are posted.

### Migrations (the source of truth for schema changes)

`supabase/migrations/` holds the database history in Supabase CLI format —
one timestamped file per change, matching the project's applied history
exactly (`supabase migration list` shows local and remote side by side):

- `20260709000000_baseline.sql` — the schema as it stood when history began
  (tables, RLS, grants, triggers, the July patches folded in)
- every later file — one applied change: coordinates, audit hardening, grant
  hygiene, favorites, leads (+ hardening), the `school-logos` bucket (+ policy
  fix), indexes

To change the schema:

```sh
npx supabase login && npx supabase link          # once per machine
npx supabase migration new add_thing             # creates supabase/migrations/<ts>_add_thing.sql
# write the SQL (idempotent where practical), then:
npx supabase db push                             # applies pending migrations to the linked project
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

`schema.sql` stays as a single-file snapshot for people who set up through
the dashboard's SQL editor; regenerate it after a migration with
`npx supabase db dump --linked -f supabase/schema.sql` rather than editing
both by hand. `seed.sql` is picked up automatically by `supabase db reset`.

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

## 4. Regenerate DB types

`src/lib/supabase/database.types.ts` must match the live schema; regenerate
it after every migration:

```sh
npx supabase gen types typescript --project-id ywqvhrslzpocxcbkhlxm > src/lib/supabase/database.types.ts
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
