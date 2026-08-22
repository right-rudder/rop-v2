-- ============================================================
-- Grant hygiene (follow-up to the Aug 2026 audit / Supabase advisors)
--
-- 1. Drops public.school_contacts — a leftover table from an earlier
--    schema that is not in schema.sql, has no rows, no dependents and
--    no references in the app (contacts live in flight_schools.contacts).
-- 2. Trigger / event-trigger functions are not an API: revoke EXECUTE
--    from the Data API roles so they are not callable via /rest/v1/rpc.
--    Triggers still fire — Postgres does not check EXECUTE for the
--    calling role when a trigger runs. rls_auto_enable() is Supabase's
--    own "enforce RLS on new tables" event trigger; it is kept, only
--    its EXECUTE grant is revoked.
-- 3. Resets table privileges for anon / authenticated to exactly the
--    matrix in schema.sql. Projects grant ALL (incl. TRUNCATE,
--    REFERENCES, TRIGGER) on every table by default; the earlier
--    patches only revoked insert/update/delete.
--
-- Idempotent — safe to run on an existing database. Run AFTER
-- add-audit-hardening.sql. Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── 1. Leftover table ────────────────────────────────────────
drop table if exists public.school_contacts;

-- ── 2. Trigger functions are not an API ──────────────────────
revoke execute on function public.handle_new_user()               from public, anon, authenticated;
revoke execute on function public.refresh_school_rating()         from public, anon, authenticated;
revoke execute on function public.protect_flight_school_columns() from public, anon, authenticated;
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- ── 3. Table privileges: reset, then grant exactly what the app needs ─
-- (Revoking a table privilege also revokes the matching column
-- privileges, so the profiles column grant is re-issued below.)
revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on
  public.states, public.cities, public.airports, public.programs,
  public.trainer_aircraft, public.flight_schools, public.school_programs,
  public.school_aircraft, public.reviews, public.comments, public.profiles
  to anon, authenticated;
grant select on public.school_submissions to authenticated;

-- authenticated: writes only where a policy exists
grant insert, update, delete on public.reviews  to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update on public.flight_schools, public.airports, public.cities to authenticated;
grant insert, delete on public.school_programs, public.school_aircraft to authenticated;
grant insert, update on public.school_submissions to authenticated;
-- profiles: column-level update only (role is never user-editable)
grant update (first_name, last_name, bio, pilot_certificates)
  on public.profiles to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
