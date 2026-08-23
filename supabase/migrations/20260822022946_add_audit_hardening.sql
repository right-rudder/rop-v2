-- Audit hardening (mirrors supabase/add-audit-hardening.sql)

-- ── 1. Protected columns on flight_schools ───────────────────
create or replace function public.protect_flight_school_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Only the Data API roles are restricted. The dashboard, the service
  -- role and SECURITY DEFINER triggers (refresh_school_rating) run as
  -- other roles and must keep working.
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if (select public.is_admin()) then
    return new;
  end if;
  if new.id                   is distinct from old.id
  or new.slug                 is distinct from old.slug
  or new.featured             is distinct from old.featured
  or new.rating               is distinct from old.rating
  or new.review_count         is distinct from old.review_count
  or new.primary_airport_code is distinct from old.primary_airport_code
  or new.city_slug            is distinct from old.city_slug
  or new.state_slug           is distinct from old.state_slug
  or new.organization_id      is distinct from old.organization_id
  or new.managed_by           is distinct from old.managed_by
  then
    raise exception 'Only admins can change this field'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_flight_school_columns on public.flight_schools;
create trigger protect_flight_school_columns
  before update on public.flight_schools
  for each row execute function public.protect_flight_school_columns();

-- ── 2. Submissions always start pending ──────────────────────
drop policy if exists "Authenticated insert" on public.school_submissions;
create policy "Authenticated insert" on public.school_submissions
  for insert to authenticated
  with check ((select auth.uid()) = submitted_by and status = 'pending');

-- ── 3. Length / format constraints ───────────────────────────
alter table public.reviews drop constraint if exists reviews_body_length;
alter table public.reviews add constraint reviews_body_length
  check (char_length(body) between 1 and 5000);

alter table public.comments drop constraint if exists comments_body_length;
alter table public.comments add constraint comments_body_length
  check (char_length(body) between 1 and 2000);

alter table public.flight_schools drop constraint if exists flight_schools_name_length;
alter table public.flight_schools add constraint flight_schools_name_length
  check (char_length(name) between 1 and 120);
alter table public.flight_schools drop constraint if exists flight_schools_description_length;
alter table public.flight_schools add constraint flight_schools_description_length
  check (char_length(description) <= 5000);
alter table public.flight_schools drop constraint if exists flight_schools_website_format;
alter table public.flight_schools add constraint flight_schools_website_format
  check (website = '' or (char_length(website) <= 300 and website ~* '^https?://'));
alter table public.flight_schools drop constraint if exists flight_schools_phone_length;
alter table public.flight_schools add constraint flight_schools_phone_length
  check (char_length(phone) <= 40);

alter table public.school_submissions drop constraint if exists school_submissions_name_length;
alter table public.school_submissions add constraint school_submissions_name_length
  check (char_length(name) between 1 and 120);
alter table public.school_submissions drop constraint if exists school_submissions_description_length;
alter table public.school_submissions add constraint school_submissions_description_length
  check (char_length(description) between 1 and 5000);
alter table public.school_submissions drop constraint if exists school_submissions_website_format;
alter table public.school_submissions add constraint school_submissions_website_format
  check (website = '' or (char_length(website) <= 300 and website ~* '^https?://'));
alter table public.school_submissions drop constraint if exists school_submissions_phone_length;
alter table public.school_submissions add constraint school_submissions_phone_length
  check (char_length(phone) <= 40);
alter table public.school_submissions drop constraint if exists school_submissions_location_length;
alter table public.school_submissions add constraint school_submissions_location_length
  check (
    char_length(city)  between 1 and 80 and
    char_length(state) between 1 and 80 and
    char_length(airport_code) between 3 and 4
  );

alter table public.profiles drop constraint if exists profiles_name_length;
alter table public.profiles add constraint profiles_name_length
  check (char_length(first_name) <= 60 and char_length(last_name) <= 60);
alter table public.profiles drop constraint if exists profiles_bio_length;
alter table public.profiles add constraint profiles_bio_length
  check (bio is null or char_length(bio) <= 1000);

-- ── 4. Profile trigger: trim + cap names from signup metadata ─
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), 60),
    left(trim(coalesce(new.raw_user_meta_data->>'last_name',  '')), 60)
  );
  return new;
end;
$$;

-- ── 5. Rating trigger handles a review moving between schools ─
create or replace function public.recompute_school_rating(target_school text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.flight_schools fs
  set rating       = coalesce((select round(avg(r.overall)::numeric, 2) from public.reviews r where r.school_id = target_school), 0),
      review_count = (select count(*) from public.reviews r where r.school_id = target_school)
  where fs.id = target_school;
$$;
revoke execute on function public.recompute_school_rating(text) from public, anon, authenticated;

create or replace function public.refresh_school_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op <> 'INSERT' then
    perform public.recompute_school_rating(old.school_id);
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.school_id is distinct from old.school_id) then
    perform public.recompute_school_rating(new.school_id);
  end if;
  return null;
end;
$$;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_school_rating();

-- ── 6. RLS policy hygiene ────────────────────────────────────
drop policy if exists "Authenticated insert" on public.reviews;
create policy "Authenticated insert" on public.reviews
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Owner delete" on public.reviews;
create policy "Owner delete" on public.reviews
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Authenticated insert" on public.comments;
create policy "Authenticated insert" on public.comments
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Owner delete" on public.comments;
create policy "Owner delete" on public.comments
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Own submissions read" on public.school_submissions;
create policy "Own submissions read" on public.school_submissions
  for select to authenticated using ((select auth.uid()) = submitted_by);

-- ── 7. Data API grants ───────────────────────────────────────
grant usage on schema public to anon, authenticated;

grant select on
  public.states, public.cities, public.airports, public.programs,
  public.trainer_aircraft, public.flight_schools, public.school_programs,
  public.school_aircraft, public.reviews, public.comments, public.profiles
  to anon, authenticated;
grant select on public.school_submissions to authenticated;

-- anon is read-only everywhere
revoke insert, update, delete on all tables in schema public from anon;

-- authenticated: writes only where a policy exists
revoke insert, update, delete on
  public.states, public.programs, public.trainer_aircraft
  from authenticated;
revoke delete on
  public.flight_schools, public.airports, public.cities,
  public.school_submissions, public.profiles
  from authenticated;
revoke insert on public.profiles from authenticated;
grant insert, update, delete on public.reviews  to authenticated;
grant insert, update, delete on public.comments to authenticated;
grant insert, update on public.flight_schools, public.airports, public.cities to authenticated;
grant insert, delete on public.school_programs, public.school_aircraft to authenticated;
grant insert, update on public.school_submissions to authenticated;
-- profiles: column-level update only (role is never user-editable)
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, bio, pilot_certificates)
  on public.profiles to authenticated;

grant execute on function public.is_admin() to anon, authenticated;

-- ── 8. Repair rating / review_count from real reviews ────────
update public.flight_schools fs
set rating       = coalesce((select round(avg(r.overall)::numeric, 2) from public.reviews r where r.school_id = fs.id), 0),
    review_count = (select count(*) from public.reviews r where r.school_id = fs.id)
where fs.rating       is distinct from coalesce((select round(avg(r.overall)::numeric, 2) from public.reviews r where r.school_id = fs.id), 0)
   or fs.review_count is distinct from (select count(*) from public.reviews r where r.school_id = fs.id);
