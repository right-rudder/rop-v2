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
  icao        char(4) not null unique,    -- used as URL slug (lowercased)
  iata        char(3),
  faa_lid     text,
  city_slug   text not null references public.cities (slug),
  state_slug  text not null references public.states (slug),
  description text,
  latitude    double precision,
  longitude   double precision,
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
  constraint flight_schools_name_length        check (char_length(name) between 1 and 120),
  constraint flight_schools_description_length check (char_length(description) <= 5000),
  constraint flight_schools_website_format     check (website = '' or (char_length(website) <= 300 and website ~* '^https?://')),
  constraint flight_schools_phone_length       check (char_length(phone) <= 40),
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
-- Inserted only through public.submit_lead() below; admins read / update.
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  school_id    text not null references public.flight_schools (id) on delete cascade,
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
  constraint leads_source_length  check (char_length(source_path) <= 300)
);
create index leads_school_created_idx on public.leads (school_id, created_at desc);
create index leads_ip_created_idx     on public.leads (ip_hash, created_at desc);
create index leads_email_school_idx   on public.leads (lower(email), school_id, created_at desc);

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
-- Callers must insert a row they can never read, hence SECURITY
-- DEFINER. No caller-controlled identifiers; fixed search_path;
-- user-safe errors use errcode P0001 and are shown verbatim.
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
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.flight_schools where id = p_school_id) then
    raise exception 'Unknown school' using errcode = 'P0001';
  end if;
  if coalesce(p_ip_hash, '') = '' then
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
revoke execute on function public.submit_lead(text, text, text, text, text, text, text, text) from public;

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
grant execute on function public.submit_lead(text, text, text, text, text, text, text, text) to anon, authenticated;
-- Trigger functions are not an API: keep them out of /rest/v1/rpc.
-- (Triggers still fire — EXECUTE is not checked for the calling role.)
revoke execute on function public.handle_new_user()               from public, anon, authenticated;
revoke execute on function public.refresh_school_rating()         from public, anon, authenticated;
revoke execute on function public.protect_flight_school_columns() from public, anon, authenticated;
-- Supabase's own "enforce RLS on new tables" event trigger, when enabled.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
