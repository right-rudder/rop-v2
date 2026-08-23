-- ============================================================
-- Catalog import: real flight schools, cities and airports
--
-- Two changes, both driven by the imported dataset:
--
-- 1. Airport identifiers are not all 4-character ICAO codes. Most US general
--    aviation fields have only an FAA local identifier ("01J", "1S8", "43CO"),
--    and a handful of closed fields have no published code at all. The `icao`
--    column keeps its name (it is the URL slug and the FK target everywhere)
--    but widens to text so those identifiers fit.
--
-- 2. flight_schools gains the facts the source carries that the schema had
--    nowhere to put: school type, VA approval, student-visa eligibility,
--    housing, on-site examiner, in-house maintenance, hours, street address,
--    and the training tokens with no catalog program of their own.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- ── 1. Airport identifiers ──────────────────────────────────────────────────
-- The FK must come off before the referenced column changes type, and go back
-- on afterwards. bpchar -> text drops the blank padding char(4) added.
alter table public.flight_schools
  drop constraint if exists flight_schools_primary_airport_code_fkey;

alter table public.airports
  alter column icao type text using trim(trailing from icao),
  alter column iata type text using nullif(trim(trailing from iata), '');

alter table public.flight_schools
  add constraint flight_schools_primary_airport_code_fkey
  foreign key (primary_airport_code) references public.airports (icao);

-- ICAO codes, FAA local identifiers, and the "US-1234" placeholders
-- OurAirports assigns to fields with no published code.
alter table public.airports drop constraint if exists airports_icao_format;
alter table public.airports
  add constraint airports_icao_format
  check (icao ~ '^[A-Z0-9-]{3,8}$');

alter table public.airports drop constraint if exists airports_iata_format;
alter table public.airports
  add constraint airports_iata_format
  check (iata is null or iata ~ '^[A-Z0-9]{3}$');

-- ── 2. Imported school facts ────────────────────────────────────────────────
-- Deliberately NOT added to protect_flight_school_columns(): these describe the
-- business, so a listing owner is the right person to correct them.
alter table public.flight_schools
  add column if not exists school_types         text[] not null default '{}',
  add column if not exists va_approved          boolean,
  add column if not exists visa_types           text[] not null default '{}',
  add column if not exists dormitory            boolean,
  add column if not exists dpe_on_site          boolean,
  add column if not exists in_house_maintenance boolean,
  add column if not exists hours                text,
  add column if not exists address              text,
  -- Training tokens from the source that have no program/aircraft catalog row
  -- yet (rotary wing, glider, simulator classes, Part 107 ...). Kept so the
  -- facts survive until those get first-class catalog entries.
  add column if not exists training_tags        text[] not null default '{}';

alter table public.flight_schools drop constraint if exists flight_schools_hours_length;
alter table public.flight_schools
  add constraint flight_schools_hours_length
  check (hours is null or char_length(hours) <= 300);

alter table public.flight_schools drop constraint if exists flight_schools_address_length;
alter table public.flight_schools
  add constraint flight_schools_address_length
  check (address is null or char_length(address) <= 300);

-- ── 3. Indexes ──────────────────────────────────────────────────────────────
-- Near-me still filters client-side, but the catalog is now large enough that
-- the bounding-box query behind a future radius RPC needs these.
create index if not exists airports_coords_idx
  on public.airports (latitude, longitude)
  where latitude is not null;

create index if not exists flight_schools_coords_idx
  on public.flight_schools (latitude, longitude)
  where latitude is not null;

-- Filtering by the imported array facts (e.g. "aviation college", "M-1 visa").
create index if not exists flight_schools_school_types_idx
  on public.flight_schools using gin (school_types);

create index if not exists flight_schools_training_tags_idx
  on public.flight_schools using gin (training_tags);
