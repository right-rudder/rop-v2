-- ============================================================
-- Flight School Finder — clear the catalog before a re-import
--
-- ⚠ Deletes every school, airport and city, and everything that hangs off a
-- school (reviews, comments, favorites, program/aircraft links, logo objects).
--
-- Deliberately KEPT: auth.users, profiles, school_submissions, leads, and the
-- states / programs / trainer_aircraft reference tables. Leads survive with
-- school_id set to null (on delete set null) — they are a business record, not
-- catalog data.
--
-- DELETE, not TRUNCATE ... CASCADE: truncate-cascade would follow the FK into
-- public.leads and empty it too.
--
-- Run this, then: npx supabase db push --include-seed --linked
-- ============================================================

begin;

-- Logos belong to schools that are about to disappear; the storage policies
-- key ownership off the school id in the object path.
delete from storage.objects where bucket_id = 'school-logos';

-- Cascades to school_programs, school_aircraft, reviews (and their comments),
-- and favorites. Sets leads.school_id to null.
delete from public.flight_schools;

delete from public.airports;
delete from public.cities;

commit;

-- Expect: flight_schools/airports/cities at 0; profiles, auth.users,
-- school_submissions and leads unchanged.
select 'flight_schools' as table_name, count(*) from public.flight_schools
union all select 'airports',           count(*) from public.airports
union all select 'cities',             count(*) from public.cities
union all select 'reviews',            count(*) from public.reviews
union all select 'favorites',          count(*) from public.favorites
union all select 'leads',              count(*) from public.leads
union all select 'school_submissions', count(*) from public.school_submissions
union all select 'profiles',           count(*) from public.profiles;
