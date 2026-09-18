-- ============================================================
-- Flight School Finder — initial Supabase schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Profiles (extends auth.users) ────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  role            text not null default 'user' check (role in ('user', 'admin')),
  bio             text,
  pilot_certificates jsonb default '[]',
  joined_at       timestamptz not null default now(),
  constraint profiles_name_length check (char_length(first_name) <= 60 and char_length(last_name) <= 60),
  constraint profiles_bio_length  check (bio is null or char_length(bio) <= 1000)
);

-- Auto-create a profile row when a user signs up. Names come from the
-- (user-editable) signup metadata, so trim and cap them here too.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), 60),
    left(trim(coalesce(new.raw_user_meta_data->>'last_name',  '')), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── States ────────────────────────────────────────────────────
create table public.states (
  id           text primary key,          -- e.g. "az"
  name         text not null,
  slug         text not null unique,
  abbreviation char(2) not null
);

-- ── Cities ────────────────────────────────────────────────────
create table public.cities (
  id                   text primary key,
  name                 text not null,
  slug                 text not null unique,
  state_slug           text not null references public.states (slug),
  state_abbreviation   char(2) not null,
  nearby_city_slugs    jsonb not null default '[]'
);

-- ── Airports ──────────────────────────────────────────────────
create table public.airports (
  id          text primary key,
  name        text not null,
  -- Used as the URL slug (lowercased). Not always a 4-letter ICAO code: most
  -- US general aviation fields publish only an FAA local identifier ("01J",
  -- "43CO"), and fields with no published code get OurAirports' "US-1234".
  icao        text not null unique,
  iata        text,
  faa_lid     text,
  city_slug   text not null references public.cities (slug),
  state_slug  text not null references public.states (slug),
  description text,
  latitude    double precision,
  longitude   double precision,
  constraint airports_icao_format      check (icao ~ '^[A-Z0-9-]{3,8}$'),
  constraint airports_iata_format      check (iata is null or iata ~ '^[A-Z0-9]{3}$'),
  constraint airports_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  constraint airports_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint airports_coords_pair     check ((latitude is null) = (longitude is null))
);

-- ── Programs ──────────────────────────────────────────────────
create table public.programs (
  id               text primary key,
  slug             text not null unique,
  name             text not null,
  short_name       text not null,
  description      text not null default '',
  faa_part         text check (faa_part in ('61', '141', 'both')),
  minimum_hours    int,
  certificate      text,
  prerequisites    jsonb not null default '[]',
  typical_duration text,
  sort_order       int not null default 0
);

-- ── Trainer Aircraft ──────────────────────────────────────────
create table public.trainer_aircraft (
  id             text primary key,
  slug           text not null unique,
  make           text not null,
  model          text not null,
  display_name   text not null,
  category       text not null check (category in ('single-engine','multi-engine','helicopter','glider','sport')),
  description    text not null default '',
  common_use     jsonb not null default '[]',
  engine_count   int not null default 1,
  typical_cruise text,
  sort_order     int not null default 0
);

-- ── Flight Schools ────────────────────────────────────────────
-- rating / review_count are maintained by the refresh_school_rating
-- trigger below — never written by the app or the seed.
create table public.flight_schools (
  id                    text primary key,
  name                  text not null,
  slug                  text not null unique,
  description           text not null default '',
  primary_airport_code  text not null references public.airports (icao),
  city_slug             text not null references public.cities (slug),
  state_slug            text not null references public.states (slug),
  organization_id       text,
  rating                numeric(3,2) not null default 0,
  review_count          int not null default 0,
  website               text not null default '',
  phone                 text not null default '',
  featured              boolean not null default false,
  faa_part              text check (faa_part in ('61', '141', 'both')),
  contacts              jsonb not null default '[]',
  estimated_planes      text,
  estimated_instructors text,
  managed_by            uuid references auth.users (id) on delete set null,
  latitude              double precision,
  longitude             double precision,
  logo_path             text,
  -- Imported facts (scripts/seed). Booleans are tri-state: null means the
  -- source did not say, which is not the same as false. Deliberately absent
  -- from protect_flight_school_columns() — these describe the business, so a
  -- listing owner is the right person to correct them.
  school_types          text[] not null default '{}',
  va_approved           boolean,
  visa_types            text[] not null default '{}',
  dormitory             boolean,
  dpe_on_site           boolean,
  in_house_maintenance  boolean,
  hours                 text,
  address               text,
  -- Training the school offers that has no programs / trainer_aircraft
  -- catalog row yet (rotary wing, glider, simulator classes, Part 107 ...).
  training_tags         text[] not null default '{}',
  constraint flight_schools_name_length        check (char_length(name) between 1 and 120),
  constraint flight_schools_description_length check (char_length(description) <= 5000),
  constraint flight_schools_website_format     check (website = '' or (char_length(website) <= 300 and website ~* '^https?://')),
  constraint flight_schools_phone_length       check (char_length(phone) <= 40),
  constraint flight_schools_logo_path_length   check (logo_path is null or char_length(logo_path) <= 200),
  constraint flight_schools_hours_length       check (hours   is null or char_length(hours)   <= 300),
  constraint flight_schools_address_length     check (address is null or char_length(address) <= 300),
  constraint flight_schools_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  constraint flight_schools_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint flight_schools_coords_pair     check ((latitude is null) = (longitude is null))
);

-- ── School ↔ Programs (many-to-many) ─────────────────────────
create table public.school_programs (
  school_id    text not null references public.flight_schools (id) on delete cascade,
  program_slug text not null references public.programs (slug) on delete cascade,
  primary key (school_id, program_slug)
);

-- ── School ↔ Aircraft (many-to-many) ─────────────────────────
create table public.school_aircraft (
  school_id    text not null references public.flight_schools (id) on delete cascade,
  aircraft_slug text not null references public.trainer_aircraft (slug) on delete cascade,
  primary key (school_id, aircraft_slug)
);

-- ── Reviews ───────────────────────────────────────────────────
create table public.reviews (
  id               uuid primary key default gen_random_uuid(),
  school_id        text not null references public.flight_schools (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  overall          int not null check (overall between 1 and 5),
  customer_service int not null check (customer_service between 1 and 5),
  instructors      int not null check (instructors between 1 and 5),
  aircraft         int not null check (aircraft between 1 and 5),
  availability     int not null check (availability between 1 and 5),
  facilities       int not null check (facilities between 1 and 5),
  body             text not null,
  created_at       timestamptz not null default now(),
  constraint reviews_body_length check (char_length(body) between 1 and 5000)
);

-- One review per user per school (delete + re-post to change)
create unique index reviews_school_user_unique
  on public.reviews (school_id, user_id);

-- ── School Submissions ────────────────────────────────────────
-- Raw "Add Your Flight School" form payloads. Reviewed by the team
-- in the dashboard, then curated into flight_schools by hand.
create table public.school_submissions (
  id                    uuid primary key default gen_random_uuid(),
  submitted_by          uuid not null references auth.users (id) on delete cascade,
  status                text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  name                  text not null,
  description           text not null,
  website               text not null default '',
  phone                 text not null default '',
  airport_code          text not null,
  city                  text not null,
  state                 text not null,
  faa_part              text check (faa_part in ('61', '141', 'both')),
  programs              jsonb not null default '[]',
  estimated_planes      text,
  estimated_instructors text,
  contacts              jsonb not null default '[]',
  created_at            timestamptz not null default now(),
  constraint school_submissions_name_length        check (char_length(name) between 1 and 120),
  constraint school_submissions_description_length check (char_length(description) between 1 and 5000),
  constraint school_submissions_website_format     check (website = '' or (char_length(website) <= 300 and website ~* '^https?://')),
  constraint school_submissions_phone_length       check (char_length(phone) <= 40),
  constraint school_submissions_location_length    check (
    char_length(city)  between 1 and 80 and
    char_length(state) between 1 and 80 and
    char_length(airport_code) between 3 and 4
  )
);

-- ── Comments ──────────────────────────────────────────────────
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  constraint comments_body_length check (char_length(body) between 1 and 2000)
);

-- ── Favorites (saved schools) ─────────────────────────────────
create table public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  school_id  text not null references public.flight_schools (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, school_id)
);
create index favorites_school_id_idx on public.favorites (school_id);

-- ── Leads ("Request information") ────────────────────────────
-- Inserted only through public.submit_lead() below (server-only);
-- admins read / update. Deleting a school keeps its leads (school_id → null).
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  school_id    text references public.flight_schools (id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text not null default '',
  program_slug text references public.programs (slug),
  message      text not null default '',
  source_path  text not null default '',
  ip_hash      text not null,
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at   timestamptz not null default now(),
  constraint leads_name_length    check (char_length(name) between 1 and 120),
  constraint leads_email_format   check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint leads_phone_length   check (char_length(phone) <= 40),
  constraint leads_message_length check (char_length(message) <= 2000),
  constraint leads_source_length  check (char_length(source_path) <= 300),
  constraint leads_ip_hash_format check (ip_hash ~ '^[0-9a-f]{64}$')
);
create index leads_school_created_idx on public.leads (school_id, created_at desc);
create index leads_ip_created_idx     on public.leads (ip_hash, created_at desc);
create index leads_email_school_idx   on public.leads (lower(email), school_id, created_at desc);

-- ── School Claims (listing ownership requests) ───────────────
-- A user asks to manage a listing; an admin approves, which sets
-- flight_schools.managed_by. Decided rows stay as the ownership record
-- (decided_by / decided_at), so only pending rows are deduplicated.
create table public.school_claims (
  id         uuid primary key default gen_random_uuid(),
  school_id  text not null references public.flight_schools (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role_title text not null,
  message    text not null default '',
  work_email text not null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint school_claims_role_length    check (char_length(role_title) between 1 and 120),
  constraint school_claims_message_length check (char_length(message) <= 2000),
  constraint school_claims_email_format   check (char_length(work_email) <= 254 and work_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
create unique index school_claims_one_pending_idx
  on public.school_claims (school_id, user_id) where status = 'pending';
create index school_claims_status_created_idx
  on public.school_claims (status, created_at desc);
create index school_claims_user_id_idx   on public.school_claims (user_id);
create index school_claims_school_id_idx on public.school_claims (school_id);

-- ── is_contact_list — jsonb shape check for contact lists ────
-- Every element is an object with exactly name/title/phone/email, each a
-- string of at most 120 characters. Used by the school_suggestions CHECKs,
-- so it must exist before that table.
create or replace function public.is_contact_list(v jsonb, min_len int, max_len int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when v is null or jsonb_typeof(v) <> 'array' then false
    when jsonb_array_length(v) < min_len or jsonb_array_length(v) > max_len then false
    else not exists (
      select 1
      from jsonb_array_elements(v) as e
      where case
        when jsonb_typeof(e) <> 'object' then true
        else (select count(*) from jsonb_object_keys(e)) <> 4
          or jsonb_typeof(e->'name')  is distinct from 'string'
          or jsonb_typeof(e->'title') is distinct from 'string'
          or jsonb_typeof(e->'phone') is distinct from 'string'
          or jsonb_typeof(e->'email') is distinct from 'string'
          or char_length(e->>'name')  > 120
          or char_length(e->>'title') > 120
          or char_length(e->>'phone') > 120
          or char_length(e->>'email') > 120
      end
    )
  end;
$$;
revoke execute on function public.is_contact_list(jsonb, int, int) from public, anon, authenticated;

-- ── School Suggestions (member corrections to listing facts) ─
-- A member proposes a new value for one contact/location field; an admin
-- approves (which writes it to flight_schools) or declines. Values are jsonb:
-- a string for the text fields, a {name,title,phone,email} array for contacts.
-- Approved rows are the contribution record behind the profile's
-- "approved corrections" count (approved_suggestion_count below).
create table public.school_suggestions (
  id             uuid primary key default gen_random_uuid(),
  -- Nullable + set null: the record outlives the listing (a catalog re-import
  -- deletes every flight_schools row). school_name is the snapshot that keeps
  -- the history readable, as on ownership_events.
  school_id      text references public.flight_schools (id) on delete set null,
  school_name    text not null,
  user_id        uuid not null references auth.users (id) on delete cascade,
  field          text not null check (field in ('phone', 'website', 'address', 'hours', 'contacts')),
  proposed_value jsonb not null,
  current_value  jsonb not null,
  reason         text not null check (reason in ('outdated', 'incorrect', 'unreachable', 'missing', 'moved', 'typo', 'other')),
  note           text not null default '',
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by     uuid references auth.users (id) on delete set null,
  decided_at     timestamptz,
  applied_value  jsonb,
  created_at     timestamptz not null default now(),
  constraint school_suggestions_school_name_length check (char_length(school_name) between 1 and 120),
  constraint school_suggestions_note_length      check (char_length(note) <= 500),
  constraint school_suggestions_other_needs_note check (reason <> 'other' or char_length(note) > 0),
  -- Contact lists are checked element by element (is_contact_list below), so a
  -- direct Data API insert cannot store a shape the app cannot read back.
  constraint school_suggestions_proposed_shape check (
    (field = 'contacts' and public.is_contact_list(proposed_value, 1, 10))
    or (field <> 'contacts'
      and jsonb_typeof(proposed_value) = 'string'
      and char_length(proposed_value #>> '{}') between 1 and 300)
  ),
  constraint school_suggestions_current_shape check (
    (field = 'contacts' and public.is_contact_list(current_value, 0, 100))
    or (field <> 'contacts' and jsonb_typeof(current_value) = 'string')
  ),
  constraint school_suggestions_applied_shape check (
    applied_value is null
    or (field = 'contacts' and public.is_contact_list(applied_value, 1, 10))
    or (field <> 'contacts' and jsonb_typeof(applied_value) = 'string')
  ),
  constraint school_suggestions_applied_on_approve check ((status = 'approved') = (applied_value is not null)),
  constraint school_suggestions_size check (pg_column_size(proposed_value) <= 8192)
);
create unique index school_suggestions_one_pending_idx
  on public.school_suggestions (school_id, user_id, field) where status = 'pending';
create index school_suggestions_status_created_idx
  on public.school_suggestions (status, created_at desc);
create index school_suggestions_user_approved_idx
  on public.school_suggestions (user_id) where status = 'approved';
create index school_suggestions_school_id_idx
  on public.school_suggestions (school_id);

-- ── Notifications (in-app, ownership events) ─────────────────
-- Written by admin server actions when ownership changes; the recipient
-- may only flip read_at (column grant below). Email delivery is a
-- separate fire-and-forget hop in src/lib/notify.ts.
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('claim_approved', 'claim_rejected', 'listing_assigned', 'listing_revoked', 'listing_featured', 'suggestion_approved', 'suggestion_rejected')),
  school_id  text references public.flight_schools (id) on delete set null,
  title      text not null,
  body       text not null default '',
  href       text not null default '',
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) between 1 and 200),
  constraint notifications_body_length  check (char_length(body) <= 1000),
  constraint notifications_href_length  check (char_length(href) <= 300)
);
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
-- Partial: the navbar badge only ever counts unread rows.
create index notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;
create index notifications_school_id_idx
  on public.notifications (school_id) where school_id is not null;

-- ── Ownership events (audit trail) ───────────────────────────
-- Written by the log_ownership_change trigger on flight_schools.managed_by,
-- not by the app: the row lands in the same transaction as the ownership
-- change, whichever path made it, and nobody is granted insert/update/delete.
create table public.ownership_events (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('granted', 'revoked')),
  school_id   text references public.flight_schools (id) on delete set null,
  -- Snapshot: the entry stays readable after the listing is removed or renamed.
  school_name text not null,
  -- Who gained or lost the listing, and the admin who made the change (null
  -- outside a user session). Deliberately NOT foreign keys: deleting an account
  -- nulls its managed_by, which fires the trigger mid-delete — a reference to
  -- the row being deleted would fail and block the deletion.
  user_id     uuid not null,
  actor_id    uuid,
  created_at  timestamptz not null default now()
);
create index ownership_events_created_idx
  on public.ownership_events (created_at desc);
create index ownership_events_school_id_idx
  on public.ownership_events (school_id) where school_id is not null;

-- ── Indexes ──────────────────────────────────────────────────
-- Postgres does not index foreign-key columns on its own; these cover
-- every filter / join / count embed the app issues. Kept in sync with
-- supabase/migrations/20260823021737_add_indexes.sql.

-- Catalog hierarchy (states → cities → airports → schools)
create index cities_state_slug_idx
  on public.cities (state_slug);
create index airports_city_slug_idx
  on public.airports (city_slug);
create index airports_state_slug_idx
  on public.airports (state_slug);

-- flight_schools: every list page filters on exactly one of these
create index flight_schools_state_slug_idx
  on public.flight_schools (state_slug);
create index flight_schools_city_slug_idx
  on public.flight_schools (city_slug);
create index flight_schools_primary_airport_code_idx
  on public.flight_schools (primary_airport_code);
-- Partial: most rows have no owner / brand / feature flag, so the index
-- only carries the rows the query can return.
create index flight_schools_managed_by_idx
  on public.flight_schools (managed_by) where managed_by is not null;
create index flight_schools_organization_id_idx
  on public.flight_schools (organization_id) where organization_id is not null;
create index flight_schools_featured_idx
  on public.flight_schools (name) where featured;

-- Coordinates: near-me still filters client-side, but the catalog is large
-- enough that the bounding-box query behind a future radius RPC needs these.
create index airports_coords_idx
  on public.airports (latitude, longitude) where latitude is not null;
create index flight_schools_coords_idx
  on public.flight_schools (latitude, longitude) where latitude is not null;

-- Filtering by the imported array facts (e.g. "aviation college", "M-1 visa").
create index flight_schools_school_types_idx
  on public.flight_schools using gin (school_types);
create index flight_schools_training_tags_idx
  on public.flight_schools using gin (training_tags);

-- Join tables: the primary key covers (school_id, …); the reverse lookup
-- (schools offering a program / flying an aircraft) needs its own.
create index school_programs_program_slug_idx
  on public.school_programs (program_slug);
create index school_aircraft_aircraft_slug_idx
  on public.school_aircraft (aircraft_slug);

-- Reviews & comments: (school_id, user_id) already covers the per-school
-- read; profile pages and the moderation queue need these.
create index reviews_user_id_idx
  on public.reviews (user_id);
create index reviews_created_at_idx
  on public.reviews (created_at desc);
create index comments_review_id_idx
  on public.comments (review_id);
create index comments_user_id_idx
  on public.comments (user_id);
create index comments_created_at_idx
  on public.comments (created_at desc);

-- Admin queues
create index school_submissions_submitted_by_idx
  on public.school_submissions (submitted_by);
create index school_submissions_status_created_idx
  on public.school_submissions (status, created_at desc);
create index leads_program_slug_idx
  on public.leads (program_slug) where program_slug is not null;
create index leads_new_idx
  on public.leads (created_at desc) where status = 'new';

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.states         enable row level security;
alter table public.cities         enable row level security;
alter table public.airports       enable row level security;
alter table public.programs       enable row level security;
alter table public.trainer_aircraft enable row level security;
alter table public.flight_schools enable row level security;
alter table public.school_programs enable row level security;
alter table public.school_aircraft enable row level security;
alter table public.reviews        enable row level security;
alter table public.comments       enable row level security;
alter table public.school_submissions enable row level security;
alter table public.favorites     enable row level security;
alter table public.leads         enable row level security;
alter table public.school_claims enable row level security;
alter table public.school_suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.ownership_events enable row level security;

-- Public read for catalog / browse tables
create policy "Public read" on public.states          for select using (true);
create policy "Public read" on public.cities          for select using (true);
create policy "Public read" on public.airports        for select using (true);
create policy "Public read" on public.programs        for select using (true);
create policy "Public read" on public.trainer_aircraft for select using (true);
create policy "Public read" on public.flight_schools  for select using (true);
create policy "Public read" on public.school_programs for select using (true);
create policy "Public read" on public.school_aircraft for select using (true);
create policy "Public read" on public.reviews         for select using (true);
create policy "Public read" on public.comments        for select using (true);

-- Profiles: public read (profile pages + reviewer names on reviews); owner can update
create policy "Public read"        on public.profiles for select using (true);
create policy "Own profile update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Users may not change their own role — column-level grant excludes `role`.
-- Promotion to admin happens via the dashboard / service role only.
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, bio, pilot_certificates)
  on public.profiles to authenticated;

-- Reviews: authenticated insert; owner can delete (reviews are
-- immutable — delete and re-post to change)
create policy "Authenticated insert" on public.reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner delete" on public.reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Comments: authenticated insert; owner can update/delete
create policy "Authenticated insert" on public.comments
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owner update" on public.comments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owner delete" on public.comments
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Favorites: own rows only, toggled by insert/delete (no update)
create policy "Own favorites read" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own favorites insert" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own favorites delete" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Flight schools: managed_by owner can update (content columns only —
-- see protect_flight_school_columns below)
create policy "Owner update" on public.flight_schools
  for update to authenticated
  using ((select auth.uid()) = managed_by)
  with check ((select auth.uid()) = managed_by);

-- School submissions: authenticated insert (always pending); submitter can read their own.
create policy "Authenticated insert" on public.school_submissions
  for insert to authenticated
  with check ((select auth.uid()) = submitted_by and status = 'pending');
create policy "Own submissions read" on public.school_submissions
  for select to authenticated using ((select auth.uid()) = submitted_by);

-- ============================================================
-- Admin role (profiles.role = 'admin')
-- ============================================================

-- SECURITY INVOKER on purpose: runs as the caller and works because
-- profiles has a public-read policy. Never SECURITY DEFINER here.
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Moderation: admins can edit/remove any review or comment
create policy "Admin update" on public.reviews
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.reviews
  for delete to authenticated using ((select public.is_admin()));
create policy "Admin update" on public.comments
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin delete" on public.comments
  for delete to authenticated using ((select public.is_admin()));

-- Curation: admins can create/update listings and locations
create policy "Admin insert" on public.flight_schools
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update" on public.flight_schools
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin insert" on public.airports
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update" on public.airports
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin insert" on public.cities
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin update" on public.cities
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Submission review: admins can read and approve/reject all submissions
create policy "Admin read" on public.school_submissions
  for select to authenticated using ((select public.is_admin()));
create policy "Admin update" on public.school_submissions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admin read" on public.leads
  for select to authenticated using ((select public.is_admin()));
create policy "Admin update" on public.leads
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Claim review: a user files a claim for themselves, on a listing nobody
-- owns yet, always as pending; admins read every claim and decide it.
-- The claim column inside the subquery is qualified (school_claims.school_id):
-- a bare school_id would bind to flight_schools instead — the same shadowing
-- bug fixed for the storage policies below.
create policy "Own claim insert" on public.school_claims
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = school_claims.school_id and fs.managed_by is null
    )
  );
create policy "Own claims read" on public.school_claims
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admin read" on public.school_claims
  for select to authenticated using ((select public.is_admin()));
create policy "Admin update" on public.school_claims
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Suggestion review: a member files a suggestion for themselves, always as
-- pending with no decision attached, on a listing that exists and that they
-- do not manage; admins edit directly, so they cannot file one. Admins read
-- every suggestion and decide it. The suggestion column inside the subquery
-- is qualified for the same name-binding reason as the claims policy.
create policy "Own suggestion insert" on public.school_suggestions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and decided_by is null
    and decided_at is null
    and applied_value is null
    and not (select public.is_admin())
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = school_suggestions.school_id
        and fs.managed_by is distinct from (select auth.uid())
    )
  );
create policy "Own suggestions read" on public.school_suggestions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admin read" on public.school_suggestions
  for select to authenticated using ((select public.is_admin()));
create policy "Admin update" on public.school_suggestions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Notifications: recipients read and mark their own; every ownership event
-- that writes one is admin-initiated, so no service role is involved.
create policy "Own notifications read" on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Admin insert" on public.notifications
  for insert to authenticated with check ((select public.is_admin()));
create policy "Own notifications update" on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Ownership events: admins read; the trigger is the only writer.
create policy "Admin read" on public.ownership_events
  for select to authenticated using ((select public.is_admin()));

-- School join tables: owner + admin write (program/aircraft sync on edit,
-- and creating links when approving a submission)
create policy "Owner write" on public.school_programs
  for insert to authenticated
  with check (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));
create policy "Owner delete" on public.school_programs
  for delete to authenticated
  using (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));
create policy "Admin write" on public.school_programs
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin delete" on public.school_programs
  for delete to authenticated using ((select public.is_admin()));
create policy "Owner write" on public.school_aircraft
  for insert to authenticated
  with check (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));
create policy "Owner delete" on public.school_aircraft
  for delete to authenticated
  using (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));
create policy "Admin write" on public.school_aircraft
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admin delete" on public.school_aircraft
  for delete to authenticated using ((select public.is_admin()));

-- ============================================================
-- Protected columns on flight_schools
-- ============================================================
-- RLS decides WHICH rows an owner may update; this trigger decides WHICH
-- COLUMNS. Owners edit content; only admins change ranking, placement,
-- identity and ownership. Applies to direct Data API calls, not just the
-- app's forms.

create or replace function public.protect_flight_school_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Only the Data API roles are restricted. The dashboard, the service
  -- role and SECURITY DEFINER triggers (refresh_school_rating) run as
  -- other roles and must keep working.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if (select public.is_admin()) then
    return new;
  end if;
  if new.id                   is distinct from old.id
  or new.slug                 is distinct from old.slug
  or new.featured             is distinct from old.featured
  or new.rating               is distinct from old.rating
  or new.review_count         is distinct from old.review_count
  or new.primary_airport_code is distinct from old.primary_airport_code
  or new.city_slug            is distinct from old.city_slug
  or new.state_slug           is distinct from old.state_slug
  or new.organization_id      is distinct from old.organization_id
  or new.managed_by           is distinct from old.managed_by
  then
    raise exception 'Only admins can change this field'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_flight_school_columns
  before update on public.flight_schools
  for each row execute function public.protect_flight_school_columns();

-- ============================================================
-- Ownership audit trail: log every change of flight_schools.managed_by
-- ============================================================
-- SECURITY DEFINER because the admin's own role may not insert into
-- ownership_events. It trusts nothing from the caller: every value comes
-- from the row and the session.
create or replace function public.log_ownership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous uuid;
begin
  if tg_op = 'UPDATE' then
    previous := old.managed_by;
  end if;

  if previous is not null then
    insert into public.ownership_events (kind, school_id, school_name, user_id, actor_id)
    values ('revoked', new.id, new.name, previous, (select auth.uid()));
  end if;
  if new.managed_by is not null then
    insert into public.ownership_events (kind, school_id, school_name, user_id, actor_id)
    values ('granted', new.id, new.name, new.managed_by, (select auth.uid()));
  end if;
  return null;
end;
$$;

-- Two triggers so each can carry a WHEN clause: the catalog import upserts
-- every listing, and none of those rows should even enter the function.
create trigger log_ownership_on_insert
  after insert on public.flight_schools
  for each row
  when (new.managed_by is not null)
  execute function public.log_ownership_change();

create trigger log_ownership_on_update
  after update of managed_by on public.flight_schools
  for each row
  when (old.managed_by is distinct from new.managed_by)
  execute function public.log_ownership_change();

-- ============================================================
-- Keep flight_schools.rating / review_count in sync with reviews
-- ============================================================

create or replace function public.recompute_school_rating(target_school text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.flight_schools fs
  set rating       = coalesce((select round(avg(r.overall)::numeric, 2) from public.reviews r where r.school_id = target_school), 0),
      review_count = (select count(*) from public.reviews r where r.school_id = target_school)
  where fs.id = target_school;
$$;
-- Internal helper — only the trigger below may call it.
revoke execute on function public.recompute_school_rating(text) from public, anon, authenticated;

create or replace function public.refresh_school_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'INSERT' then
    perform public.recompute_school_rating(old.school_id);
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.school_id is distinct from old.school_id) then
    perform public.recompute_school_rating(new.school_id);
  end if;
  return null;
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_school_rating();

-- ============================================================
-- submit_lead — the only write path into public.leads
-- ============================================================
-- Server-only: executable by service_role (the app's server action),
-- never by the Data API roles, so the rate-limit fingerprint is always
-- computed server-side. SECURITY INVOKER — service_role already holds
-- the table privileges. User-safe errors use errcode P0001.
create or replace function public.submit_lead(
  p_school_id    text,
  p_name         text,
  p_email        text,
  p_phone        text,
  p_program_slug text,
  p_message      text,
  p_source_path  text,
  p_ip_hash      text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.flight_schools where id = p_school_id) then
    raise exception 'Unknown school' using errcode = 'P0001';
  end if;
  if p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Missing request fingerprint' using errcode = 'P0001';
  end if;
  if (select count(*) from public.leads
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many requests. Please try again in an hour.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.leads
             where lower(email) = lower(p_email) and school_id = p_school_id
               and created_at > now() - interval '24 hours') then
    raise exception 'You already contacted this school today.' using errcode = 'P0001';
  end if;

  insert into public.leads (school_id, name, email, phone, program_slug, message, source_path, ip_hash)
  values (
    p_school_id, p_name, p_email, coalesce(p_phone, ''),
    nullif(p_program_slug, ''), coalesce(p_message, ''), coalesce(p_source_path, ''), p_ip_hash
  )
  returning id into v_id;
  return v_id;
end;
$$;
revoke execute on function public.submit_lead(text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant  execute on function public.submit_lead(text, text, text, text, text, text, text, text) to service_role;

-- ============================================================
-- user_id_by_email — account lookup behind "assign owner"
-- ============================================================
-- Admins assign a listing by typing the new owner's email. auth.users is
-- not on the Data API and profiles has no email column, so this definer
-- function does the lookup. Server-only: executable by service_role alone,
-- never by anon/authenticated, so it cannot be used to probe which email
-- addresses have accounts.
create or replace function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;
revoke execute on function public.user_id_by_email(text) from public, anon, authenticated;
grant  execute on function public.user_id_by_email(text) to service_role;

-- ============================================================
-- approved_suggestion_count — the public profile stat
-- ============================================================
-- Profiles are public, but suggestion rows are not (own + admin). This
-- definer function exposes one integer per user and nothing else.
create or replace function public.approved_suggestion_count(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.school_suggestions
  where user_id = p_user_id and status = 'approved';
$$;
revoke execute on function public.approved_suggestion_count(uuid) from public;
grant  execute on function public.approved_suggestion_count(uuid) to anon, authenticated;

-- ============================================================
-- apply_suggestion — approve as one transaction
-- ============================================================
-- Runs as the admin (security invoker): the "Admin update" policies on both
-- tables and protect_flight_school_columns still apply. The status flip is a
-- compare-and-swap; a second admin approving the same row finds no pending
-- row and nothing is written. Any failure after the flip rolls it back.
create or replace function public.apply_suggestion(p_id uuid, p_value jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_field     text;
  v_school_id text;
  v_rows      int;
begin
  update public.school_suggestions
     set status = 'approved',
         applied_value = p_value,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_id and status = 'pending'
  returning field, school_id into v_field, v_school_id;
  if not found then
    raise exception 'SUGGESTION_ALREADY_PROCESSED' using errcode = 'P0001';
  end if;
  if v_school_id is null then
    raise exception 'SUGGESTION_LISTING_GONE' using errcode = 'P0001';
  end if;

  if v_field = 'contacts' then
    update public.flight_schools set contacts = p_value where id = v_school_id;
  else
    -- field is CHECK-constrained to phone/website/address/hours, which are
    -- the column names; %I quotes it regardless.
    execute format('update public.flight_schools set %I = $1 where id = $2', v_field)
      using (p_value #>> '{}'), v_school_id;
  end if;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'SUGGESTION_LISTING_GONE' using errcode = 'P0001';
  end if;
  return v_school_id;
end;
$$;
revoke execute on function public.apply_suggestion(uuid, jsonb) from public, anon;
grant  execute on function public.apply_suggestion(uuid, jsonb) to authenticated;

-- ============================================================
-- Data API grants
-- ============================================================
-- Newer Supabase projects no longer expose tables to the Data API
-- automatically, so state the intended privileges explicitly. RLS
-- policies above still decide which rows each role can touch.

-- Start from nothing for the Data API roles (projects grant ALL on every
-- table by default, incl. TRUNCATE / REFERENCES / TRIGGER), then grant
-- exactly what the app needs. Revoking a table privilege also revokes
-- the matching column privileges, hence the profiles column grant below.
revoke all on all tables in schema public from anon, authenticated;
-- Default privileges: tables / functions created later by the postgres
-- role (SQL editor, migrations) start with no Data API access either —
-- grant explicitly, as above. (Supabase's project defaults grant ALL.)
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select on
  public.states, public.cities, public.airports, public.programs,
  public.trainer_aircraft, public.flight_schools, public.school_programs,
  public.school_aircraft, public.reviews, public.comments, public.profiles
  to anon, authenticated;
grant select on public.school_submissions to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, update (status) on public.leads to authenticated;
-- Claims: admins only ever flip the decision columns, so the claim's own
-- content (role, message, work email) is immutable once filed.
grant select, insert, update (status, decided_by, decided_at)
  on public.school_claims to authenticated;
-- Suggestions: admins record the decision and what was applied; the proposal stays immutable.
grant select, insert, update (status, decided_by, decided_at, applied_value)
  on public.school_suggestions to authenticated;
-- Notifications: recipients may only flip read state.
grant select, insert, update (read_at) on public.notifications to authenticated;
revoke all on public.ownership_events from anon, authenticated;
grant select on public.ownership_events to authenticated;

-- authenticated: writes only where a policy exists
grant insert, update, delete on public.reviews  to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update on public.flight_schools, public.airports, public.cities to authenticated;
grant insert, delete on public.school_programs, public.school_aircraft to authenticated;
grant insert, update on public.school_submissions to authenticated;
-- profiles: column-level update only (see "Own profile update" above)
grant update (first_name, last_name, bio, pilot_certificates)
  on public.profiles to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
-- Trigger functions are not an API: keep them out of /rest/v1/rpc.
-- (Triggers still fire — EXECUTE is not checked for the calling role.)
revoke execute on function public.handle_new_user()               from public, anon, authenticated;
revoke execute on function public.refresh_school_rating()         from public, anon, authenticated;
revoke execute on function public.protect_flight_school_columns() from public, anon, authenticated;
revoke execute on function public.log_ownership_change()          from public, anon, authenticated;
-- Supabase's own "enforce RLS on new tables" event trigger, when enabled.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- ============================================================
-- Storage: school logos
-- ============================================================
-- Public `school-logos` bucket. Objects are named `<schoolId>/<uuid>.<ext>`,
-- so the first path segment IS the ownership key. Reads need no policy —
-- the bucket is public and /object/public/** bypasses RLS.
--
-- SVG is excluded on purpose: it can carry script, and next/image refuses
-- it unless dangerouslyAllowSVG is set. These limits are the real
-- enforcement; src/lib/images.ts mirrors them for a friendlier error.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-logos', 'school-logos', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "School logo insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'school-logos'
    and exists (
      -- `objects.name` MUST stay qualified: flight_schools also has a
      -- `name` column, and a bare `name` binds to the inner table.
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "School logo update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'school-logos'
    and exists (
      -- `objects.name` MUST stay qualified: flight_schools also has a
      -- `name` column, and a bare `name` binds to the inner table.
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  )
  with check (
    bucket_id = 'school-logos'
    and exists (
      -- `objects.name` MUST stay qualified: flight_schools also has a
      -- `name` column, and a bare `name` binds to the inner table.
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );

create policy "School logo delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'school-logos'
    and exists (
      -- `objects.name` MUST stay qualified: flight_schools also has a
      -- `name` column, and a bare `name` binds to the inner table.
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );
