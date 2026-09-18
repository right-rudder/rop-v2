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

Listing ownership talks to two more GoHighLevel workflows, both optional and
both best-effort — a missing URL or a failed POST is logged and never fails
the admin's action:

```ini
GHL_NOTIFY_WEBHOOK_URL=<Inbound Webhook URL>   # server-only; emails ownership notifications
GHL_OWNER_WEBHOOK_URL=<Inbound Webhook URL>    # server-only; receives each approved owner as a contact
```

- `GHL_NOTIFY_WEBHOOK_URL` gets `{ source, event, email, subject, title, body, url }`
  whenever an in-app notification is written (claim approved/declined, listing
  assigned/revoked/featured). Without it notifications are in-app only.
- `GHL_OWNER_WEBHOOK_URL` gets one flat contact payload every time an admin
  makes someone a listing's owner — approving a claim, approving a submission,
  assigning a listing, or inviting an owner from `/admin/users`. Fields:
  `event` (`owner_approved`), `owner_source` (`claim_approved` |
  `submission_approved` | `admin_assigned` | `admin_invited`), `account_status`
  (`active` | `invited`), `approved_at`, `approved_by`, `user_id`, `first_name`,
  `last_name`, `name`, `email`, `phone`, `role_title`, `work_email`,
  `company_name`, `school_id`, `school_name`, `school_slug`, `school_url`,
  `school_edit_url`, `school_website`, `school_phone`, `airport_code`, `city`,
  `state`. Unknown values are empty strings. The builder is
  `src/lib/owner-webhook.ts`.

Every user-facing write goes through the user's session and RLS. The
**service-role key** is reserved for what the Data API roles deliberately
cannot do: `submit_lead()` (so the rate-limit fingerprint can't be forged by a
direct Data API caller), `user_id_by_email()` and reading account emails
(`auth.users` is not on the Data API), and the admin Users page, which lists
accounts and sends invites through `auth.admin`. Each of those callers checks
for an admin first; ownership itself is still written with the admin's own
session, so RLS and the column-guard trigger stay the boundary.

```ini
SUPABASE_SERVICE_ROLE_KEY=<service_role / secret key>   # server-only; never NEXT_PUBLIC_
```

It is read only inside `src/lib/supabase/service.ts` on the server. Keep it
out of client code and rotate it in the dashboard if it is ever exposed.

## 2. Apply the schema, then the seed data

### Where the catalog comes from

States, cities, airports and flight schools are **imported**, not hand-written.
The source is the Google Sheet **"FSF - Seed Data"** (tabs `COMPILED SCHOOLS`,
`COMPILED AIRPORTS`, `States`), which must be shared as *Anyone with the link:
Viewer* for the fetch step to work.

```sh
npm run seed:fetch    # sheet -> data/catalog/*.csv        (only when the sheet changes)
npm run seed:build    # CSVs  -> supabase/seed.sql + data/catalog/reports/
```

Both outputs are committed. `npm run seed:check` rebuilds and fails if
`seed.sql` no longer matches the CSVs — CI runs it so the two cannot drift.

**Read `data/catalog/reports/` after every build.** It is the only record of
what the import decided:

| Report | What it means |
|---|---|
| `unresolved-airports.csv` | Rows skipped because their airport or state could not be resolved. Should be empty; anything here is a row missing from the site. |
| `merged-duplicates.csv` | Rows collapsed into one listing (same name, city, state and airport). |
| `closed-airports.csv` | Airports OurAirports marks as closed that still host a listing. |
| `unmapped-tokens.csv` | Training tokens with no `programs` / `trainer_aircraft` catalog entry. They are stored as `flight_schools.training_tags`, and the high-count ones are candidates for real catalog entries. |
| `cities-without-coords.csv` | Cities with no airport to derive a centroid from — they cannot be a near-me origin. |

Only airports that host at least one school are imported: an airport page with
nothing on it is a thin page, and a near-me origin is only useful where there
is something to find.

### Applying it

For a database that already has accounts you want to keep (the normal case):

1. Run `supabase/reset-catalog.sql` in **SQL Editor**. It deletes schools,
   airports, cities and everything cascading off a school, and keeps
   `auth.users`, `profiles`, `school_submissions` and `leads`.
2. Load the catalog:

   ```sh
   npm run seed:apply              # add --dry-run first to see the plan
   ```

   This writes the same rows `seed.sql` contains, over the Data API, using the
   `SUPABASE_SERVICE_ROLE_KEY` already in `.env.local`. It is idempotent
   (`resolution=ignore-duplicates`), so a partial run can just be repeated, and
   it reads the row counts back from the server when it finishes.

### Why not `supabase db push --include-seed`?

That is the canonical command, and it works if your Supabase account can
provision the CLI's temporary database role. On accounts that cannot, it fails
before touching the schema:

```
unexpected login role status 400: Failed to create login role:
ERROR: 42501: permission denied to alter role
DETAIL: Only roles with the CREATEROLE attribute and the ADMIN option
        on role "cli_login_postgres" may alter this role.
```

Two ways round it, in order of preference:

- `npm run seed:apply` (above) — needs no database role at all.
- `npx supabase db push --include-seed --db-url "$DB_URL"`, where `$DB_URL` is
  the connection string from **Project Settings → Database**. Passing the URL
  directly skips the login-role step. Migrations still need
  `npx supabase login && npx supabase link` for `db push` without `--db-url`.

Do the two together: between them the site has an empty catalog.

`reset-catalog.sql` leaves Storage alone — Supabase guards `storage.objects`
and `storage.buckets` with a `BEFORE DELETE` trigger (`storage.protect_delete`),
so logo files can only be removed through the Storage API. The script's last
query lists the objects left orphaned; clear them in **Storage → school-logos**
or with `npx supabase storage rm -r ss:///school-logos --linked`. Leaving them
costs a few KB and breaks nothing — the app resolves logos through
`flight_schools.logo_path`, which the reset removes.

Afterwards, regenerate the types and re-dump the snapshot:

```sh
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
npx supabase db dump --linked -f supabase/schema.sql
```

For a brand-new project, run in **SQL Editor**: `supabase/schema.sql`, then
`supabase/seed.sql`. (`supabase/reset.sql` is the full teardown — it drops
every app table and the storage bucket, and is only for realigning a database
with `schema.sql` from scratch.)

> Imported listings have **no website and mostly no phone**: the source does not
> carry them. Every school starts at 0 reviews — `rating` / `review_count` are
> owned by the `refresh_school_rating` trigger and only move when real reviews
> are posted. Descriptions are generated from each row's own facts and are meant
> to be replaced by owners when they claim a listing.

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
