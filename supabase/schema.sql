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
  joined_at       timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  '')
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
  description text
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
  managed_by            uuid references auth.users (id) on delete set null
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
  created_at       timestamptz not null default now()
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
  created_at            timestamptz not null default now()
);

-- ── Comments ──────────────────────────────────────────────────
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.reviews (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

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
create policy "Authenticated insert" on public.reviews for insert with check (auth.uid() = user_id);
create policy "Owner delete"         on public.reviews for delete using (auth.uid() = user_id);

-- Comments: authenticated insert; owner can update/delete
create policy "Authenticated insert" on public.comments for insert with check (auth.uid() = user_id);
create policy "Owner update"         on public.comments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Owner delete"         on public.comments for delete using (auth.uid() = user_id);

-- Flight schools: managed_by owner can update
create policy "Owner update" on public.flight_schools
  for update to authenticated
  using ((select auth.uid()) = managed_by)
  with check ((select auth.uid()) = managed_by);

-- School submissions: authenticated insert; submitter can read their own.
create policy "Authenticated insert" on public.school_submissions
  for insert to authenticated with check (auth.uid() = submitted_by);
create policy "Own submissions read" on public.school_submissions
  for select to authenticated using (auth.uid() = submitted_by);

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
-- Keep flight_schools.rating / review_count in sync with reviews
-- ============================================================

create or replace function public.refresh_school_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target_school text;
begin
  if tg_op = 'DELETE' then
    target_school := old.school_id;
  else
    target_school := new.school_id;
  end if;

  update public.flight_schools fs
  set rating       = coalesce((select round(avg(r.overall)::numeric, 2) from public.reviews r where r.school_id = target_school), 0),
      review_count = (select count(*) from public.reviews r where r.school_id = target_school)
  where fs.id = target_school;
  return null;
end;
$$;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_school_rating();
