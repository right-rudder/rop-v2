-- ============================================================
-- School logos (Supabase Storage)
--
-- A public `school-logos` bucket plus the owner-scoped policies that
-- gate writes to it, and the `flight_schools.logo_path` column that
-- points at the object. Objects are named `<schoolId>/<uuid>.<ext>`,
-- so the first path segment IS the ownership key.
--
-- Reads need no policy: the bucket is public and /object/public/**
-- bypasses RLS. Only insert/update/delete are gated.
--
-- Idempotent — safe to run on an existing database. New installs get
-- this from schema.sql.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- The stored value is the object PATH, never a full URL, so the bucket
-- or the storage host can move without a data migration.
alter table public.flight_schools add column if not exists logo_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'flight_schools_logo_path_length'
  ) then
    alter table public.flight_schools
      add constraint flight_schools_logo_path_length
      check (logo_path is null or char_length(logo_path) <= 200);
  end if;
end $$;

-- logo_path is deliberately NOT in protect_flight_school_columns() —
-- owners are meant to change their own logo. The table-level grants from
-- add-grant-hygiene.sql already cover new columns; this is belt-and-braces
-- in case those are ever tightened to column level.
grant update (logo_path) on public.flight_schools to authenticated;

-- ============================================================
-- Bucket
-- ============================================================
-- SVG is excluded on purpose: it can carry script, and next/image
-- refuses it unless dangerouslyAllowSVG is set. Limits here are the
-- real enforcement — src/lib/images.ts mirrors them for a good error.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-logos', 'school-logos', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public            = excluded.public,
  file_size_limit   = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- Policies on storage.objects
-- ============================================================
-- Same shape as the public.* policies: (select auth.uid()) subselect,
-- `to authenticated`, admins via public.is_admin() (security invoker,
-- and profiles has a Public read policy, so authenticated can run it).
drop policy if exists "School logo insert" on storage.objects;
create policy "School logo insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools s
      where s.id = (storage.foldername(name))[1]
        and (s.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );

drop policy if exists "School logo update" on storage.objects;
create policy "School logo update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools s
      where s.id = (storage.foldername(name))[1]
        and (s.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  )
  with check (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools s
      where s.id = (storage.foldername(name))[1]
        and (s.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );

drop policy if exists "School logo delete" on storage.objects;
create policy "School logo delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools s
      where s.id = (storage.foldername(name))[1]
        and (s.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );
