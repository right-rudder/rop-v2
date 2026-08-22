-- ============================================================
-- Favorites (saved schools)
--
-- One row per (user, school). Users see and toggle only their own
-- rows; nothing is public. Idempotent — safe to run on an existing
-- database. New installs get this from schema.sql.
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================
create table if not exists public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  school_id  text not null references public.flight_schools (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, school_id)
);
create index if not exists favorites_school_id_idx on public.favorites (school_id);

alter table public.favorites enable row level security;

drop policy if exists "Own favorites read" on public.favorites;
create policy "Own favorites read" on public.favorites
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Own favorites insert" on public.favorites;
create policy "Own favorites insert" on public.favorites
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Own favorites delete" on public.favorites;
create policy "Own favorites delete" on public.favorites
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.favorites from anon, authenticated;
grant select, insert, delete on public.favorites to authenticated;
