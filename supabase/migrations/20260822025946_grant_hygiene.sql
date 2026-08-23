-- Grant hygiene (mirrors supabase/add-grant-hygiene.sql on branch chore/db-grant-hygiene)

-- ── 1. Leftover table (empty, no dependents, unreferenced) ───
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
revoke all on all tables in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on
  public.states, public.cities, public.airports, public.programs,
  public.trainer_aircraft, public.flight_schools, public.school_programs,
  public.school_aircraft, public.reviews, public.comments, public.profiles
  to anon, authenticated;
grant select on public.school_submissions to authenticated;

grant insert, update, delete on public.reviews  to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update on public.flight_schools, public.airports, public.cities to authenticated;
grant insert, delete on public.school_programs, public.school_aircraft to authenticated;
grant insert, update on public.school_submissions to authenticated;
grant update (first_name, last_name, bio, pilot_certificates)
  on public.profiles to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
