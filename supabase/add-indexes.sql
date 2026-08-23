-- ============================================================
-- Indexes for the columns the app filters and joins on
--
-- Postgres does not index foreign-key columns on its own; every lookup
-- by state / city / airport / program and every PostgREST count embed
-- (`flight_schools(count)`) was a sequential scan. Harmless at today's
-- row counts, so this is cheap insurance rather than a fix for a slow
-- query. Idempotent — safe to run on an existing database. New installs
-- get the same indexes from schema.sql.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Catalog hierarchy (states → cities → airports → schools)
create index if not exists cities_state_slug_idx
  on public.cities (state_slug);
create index if not exists airports_city_slug_idx
  on public.airports (city_slug);
create index if not exists airports_state_slug_idx
  on public.airports (state_slug);

-- flight_schools: every list page filters on exactly one of these
create index if not exists flight_schools_state_slug_idx
  on public.flight_schools (state_slug);
create index if not exists flight_schools_city_slug_idx
  on public.flight_schools (city_slug);
create index if not exists flight_schools_primary_airport_code_idx
  on public.flight_schools (primary_airport_code);
-- Partial: most rows have no owner / brand / feature flag, so the index
-- only carries the rows the query can return.
create index if not exists flight_schools_managed_by_idx
  on public.flight_schools (managed_by) where managed_by is not null;
create index if not exists flight_schools_organization_id_idx
  on public.flight_schools (organization_id) where organization_id is not null;
create index if not exists flight_schools_featured_idx
  on public.flight_schools (name) where featured;

-- Join tables: the primary key covers (school_id, …); the reverse lookup
-- (schools offering a program / flying an aircraft) needs its own.
create index if not exists school_programs_program_slug_idx
  on public.school_programs (program_slug);
create index if not exists school_aircraft_aircraft_slug_idx
  on public.school_aircraft (aircraft_slug);

-- Reviews & comments: (school_id, user_id) already covers the per-school
-- read; profile pages and the moderation queue need these.
create index if not exists reviews_user_id_idx
  on public.reviews (user_id);
create index if not exists reviews_created_at_idx
  on public.reviews (created_at desc);
create index if not exists comments_review_id_idx
  on public.comments (review_id);
create index if not exists comments_user_id_idx
  on public.comments (user_id);
create index if not exists comments_created_at_idx
  on public.comments (created_at desc);

-- Admin queues
create index if not exists school_submissions_submitted_by_idx
  on public.school_submissions (submitted_by);
create index if not exists school_submissions_status_created_idx
  on public.school_submissions (status, created_at desc);
create index if not exists leads_program_slug_idx
  on public.leads (program_slug) where program_slug is not null;
create index if not exists leads_new_idx
  on public.leads (created_at desc) where status = 'new';
