-- ============================================================
-- Flight School Finder — drop every app object
--
-- ⚠ Full teardown of the public schema's app tables, functions and the
-- school-logos bucket. Does NOT touch auth.users.
--
-- Only run this when realigning a database with schema.sql from scratch;
-- afterwards run schema.sql, then seed.sql.
--
-- To keep accounts and just re-import the catalog, use reset-catalog.sql
-- instead — that is the normal path.
-- ============================================================

drop table if exists public.leads              cascade;
drop table if exists public.favorites          cascade;
drop table if exists public.school_submissions cascade;
drop table if exists public.comments           cascade;
drop table if exists public.reviews            cascade;
drop table if exists public.school_aircraft    cascade;
drop table if exists public.school_programs    cascade;
drop table if exists public.flight_schools     cascade;
drop table if exists public.trainer_aircraft   cascade;
drop table if exists public.programs           cascade;
drop table if exists public.airports           cascade;
drop table if exists public.cities             cascade;
drop table if exists public.states             cascade;
drop table if exists public.profiles           cascade;

drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user()               cascade;
drop function if exists public.refresh_school_rating()         cascade;
drop function if exists public.recompute_school_rating(text)   cascade;
drop function if exists public.protect_flight_school_columns() cascade;
drop function if exists public.is_admin()                      cascade;
drop function if exists public.submit_lead(text, text, text, text, text, text, text, text) cascade;

-- Storage: only the policies can be dropped from SQL. Supabase guards
-- storage.objects and storage.buckets with a BEFORE DELETE trigger
-- (storage.protect_delete), so the files and the bucket itself have to go
-- through the Storage API — delete them in Storage → school-logos in the
-- dashboard, or with `npx supabase storage rm -r ss:///school-logos --linked`.
drop policy if exists "School logo insert" on storage.objects;
drop policy if exists "School logo update" on storage.objects;
drop policy if exists "School logo delete" on storage.objects;
