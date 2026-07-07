-- ============================================================
-- Admin role enforcement + owner-policy hardening
--
-- Adds RLS policies that give profiles.role = 'admin' users real
-- moderation/curation power, and hardens existing owner UPDATE
-- policies with WITH CHECK clauses (incl. blocking users from
-- changing their own role).
--
-- Idempotent — safe to run on an existing database. New installs
-- get all of this from schema.sql.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Admin predicate ───────────────────────────────────────────
-- SECURITY INVOKER: runs as the caller; works because profiles
-- has a public-read policy. Never SECURITY DEFINER here.
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

-- ── Profiles: owner update hardening ─────────────────────────
-- WITH CHECK pins the row to the owner; column-level grants stop
-- users from updating their own `role` (promotion happens via the
-- dashboard / service role only).
drop policy if exists "Own profile update" on public.profiles;
create policy "Own profile update" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, bio, pilot_certificates)
  on public.profiles to authenticated;

-- ── Reviews: owner WITH CHECK + admin moderation ─────────────
drop policy if exists "Owner update" on public.reviews;
create policy "Owner update" on public.reviews
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admin update" on public.reviews;
create policy "Admin update" on public.reviews
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admin delete" on public.reviews;
create policy "Admin delete" on public.reviews
  for delete to authenticated
  using ((select public.is_admin()));

-- ── Comments: owner WITH CHECK + admin moderation ────────────
drop policy if exists "Owner update" on public.comments;
create policy "Owner update" on public.comments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admin update" on public.comments;
create policy "Admin update" on public.comments
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admin delete" on public.comments;
create policy "Admin delete" on public.comments
  for delete to authenticated
  using ((select public.is_admin()));

-- ── Flight schools: owner WITH CHECK + admin curation ────────
drop policy if exists "Owner update" on public.flight_schools;
create policy "Owner update" on public.flight_schools
  for update to authenticated
  using ((select auth.uid()) = managed_by)
  with check ((select auth.uid()) = managed_by);

drop policy if exists "Admin insert" on public.flight_schools;
create policy "Admin insert" on public.flight_schools
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admin update" on public.flight_schools;
create policy "Admin update" on public.flight_schools
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── Airports & cities: admin curation ────────────────────────
drop policy if exists "Admin insert" on public.airports;
create policy "Admin insert" on public.airports
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admin update" on public.airports;
create policy "Admin update" on public.airports
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Admin insert" on public.cities;
create policy "Admin insert" on public.cities
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Admin update" on public.cities;
create policy "Admin update" on public.cities
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ── School join tables: owner + admin write ──────────────────
-- Needed to sync a school's programs/aircraft when editing a
-- listing or approving a submission.
drop policy if exists "Owner write" on public.school_programs;
create policy "Owner write" on public.school_programs
  for insert to authenticated
  with check (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));

drop policy if exists "Owner delete" on public.school_programs;
create policy "Owner delete" on public.school_programs
  for delete to authenticated
  using (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));

drop policy if exists "Admin write" on public.school_programs;
create policy "Admin write" on public.school_programs
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admin delete" on public.school_programs;
create policy "Admin delete" on public.school_programs
  for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Owner write" on public.school_aircraft;
create policy "Owner write" on public.school_aircraft
  for insert to authenticated
  with check (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));

drop policy if exists "Owner delete" on public.school_aircraft;
create policy "Owner delete" on public.school_aircraft
  for delete to authenticated
  using (exists (
    select 1 from public.flight_schools fs
    where fs.id = school_id and fs.managed_by = (select auth.uid())
  ));

drop policy if exists "Admin write" on public.school_aircraft;
create policy "Admin write" on public.school_aircraft
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "Admin delete" on public.school_aircraft;
create policy "Admin delete" on public.school_aircraft
  for delete to authenticated using ((select public.is_admin()));

-- ── School submissions: admin review workflow ────────────────
drop policy if exists "Admin read" on public.school_submissions;
create policy "Admin read" on public.school_submissions
  for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admin update" on public.school_submissions;
create policy "Admin update" on public.school_submissions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
