-- ============================================================
-- Coordinates for airports and flight schools
--
-- airports.latitude/longitude      — airport reference point; drives
--                                     "near me" search and the map.
-- flight_schools.latitude/longitude — optional per-school override
--                                     (hangar/office). Owners may edit
--                                     it; it is NOT a protected column.
-- Effective school position = school override, else its airport.
--
-- Idempotent — safe to run on an existing database. New installs get
-- this from schema.sql. Run in: Supabase Dashboard > SQL Editor
-- ============================================================

alter table public.airports
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

alter table public.flight_schools
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- A partial pair (only one of latitude / longitude set) would violate the
-- *_coords_pair constraints below; treat it as "no position".
update public.airports       set latitude = null, longitude = null where (latitude is null) <> (longitude is null);
update public.flight_schools set latitude = null, longitude = null where (latitude is null) <> (longitude is null);

alter table public.airports
  drop constraint if exists airports_latitude_range,
  drop constraint if exists airports_longitude_range,
  drop constraint if exists airports_coords_pair;
alter table public.airports
  add constraint airports_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  add constraint airports_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint airports_coords_pair     check ((latitude is null) = (longitude is null));

alter table public.flight_schools
  drop constraint if exists flight_schools_latitude_range,
  drop constraint if exists flight_schools_longitude_range,
  drop constraint if exists flight_schools_coords_pair;
alter table public.flight_schools
  add constraint flight_schools_latitude_range  check (latitude  is null or latitude  between -90  and 90),
  add constraint flight_schools_longitude_range check (longitude is null or longitude between -180 and 180),
  add constraint flight_schools_coords_pair     check ((latitude is null) = (longitude is null));

-- Backfill the seeded airports (airport reference points, FAA data).
-- Only fills rows that have no coordinates yet.
update public.airports as a
set latitude = v.lat, longitude = v.lng
from (values
  ('KFFZ', 33.4608, -111.7283),
  ('KDVT', 33.6883, -112.0826),
  ('KPHX', 33.4373, -112.0078),
  ('KCHD', 33.2691, -111.8110),
  ('KTUS', 32.1161, -110.9410),
  ('KCPS', 38.5707,  -90.1562),
  ('KSTL', 38.7487,  -90.3700),
  ('KMKC', 39.1232,  -94.5928),
  ('KOJC', 38.8476,  -94.7376),
  ('KIXD', 38.8309,  -94.8903),
  ('KFXE', 26.1973,  -80.1707),
  ('KOPF', 25.9070,  -80.2784),
  ('KPMP', 26.2471,  -80.1111),
  ('KMYF', 32.8157, -117.1396),
  ('KCRQ', 33.1283, -117.2802),
  ('KLAX', 33.9425, -118.4081),
  ('KBNA', 36.1245,  -86.6782),
  ('KCHA', 35.0353,  -85.2038)
) as v(icao, lat, lng)
where a.icao = v.icao and a.latitude is null;
