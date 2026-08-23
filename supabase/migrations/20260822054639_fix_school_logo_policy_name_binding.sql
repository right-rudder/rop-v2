-- The bare `name` inside the subquery bound to flight_schools.name (that table
-- has a `name` column too), so the check read `s.id = foldername(s.name)[1]`
-- and denied every write. Qualify the outer column as `objects.name` and give
-- the inner table a non-colliding alias.
drop policy if exists "School logo insert" on storage.objects;
create policy "School logo insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );

drop policy if exists "School logo update" on storage.objects;
create policy "School logo update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  )
  with check (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );

drop policy if exists "School logo delete" on storage.objects;
create policy "School logo delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'school-logos'
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = (storage.foldername(objects.name))[1]
        and (fs.managed_by = (select auth.uid()) or (select public.is_admin()))
    )
  );
