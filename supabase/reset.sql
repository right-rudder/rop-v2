-- ============================================================
-- Flight School Finder — reset app tables
--
-- ⚠ Drops every app table in the public schema (catalog data,
-- profiles, reviews, comments). Does NOT touch auth.users.
-- Only run this when realigning the database with schema.sql;
-- afterwards run schema.sql, then seed.sql.
-- ============================================================

drop table if exists public.comments        cascade;
drop table if exists public.reviews         cascade;
drop table if exists public.school_aircraft cascade;
drop table if exists public.school_programs cascade;
drop table if exists public.flight_schools  cascade;
drop table if exists public.trainer_aircraft cascade;
drop table if exists public.programs        cascade;
drop table if exists public.airports        cascade;
drop table if exists public.cities          cascade;
drop table if exists public.states          cascade;
drop table if exists public.profiles        cascade;

drop trigger  if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user()       cascade;
drop function if exists public.refresh_school_rating() cascade;
