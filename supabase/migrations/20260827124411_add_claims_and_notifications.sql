-- Listing ownership: claims queue + in-app notifications.

-- ── school_claims ───────────────────────────────────────────────────────────
create table if not exists public.school_claims (
  id         uuid primary key default gen_random_uuid(),
  school_id  text not null references public.flight_schools (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  role_title text not null,
  message    text not null default '',
  work_email text not null,
  decided_by uuid references auth.users (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  constraint school_claims_role_length    check (char_length(role_title) between 1 and 120),
  constraint school_claims_message_length check (char_length(message) <= 2000),
  constraint school_claims_email_format   check (char_length(work_email) <= 254 and work_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

-- One live claim per user per school; decided claims stay as history.
create unique index if not exists school_claims_one_pending_idx
  on public.school_claims (school_id, user_id) where status = 'pending';
create index if not exists school_claims_status_created_idx
  on public.school_claims (status, created_at desc);
create index if not exists school_claims_user_id_idx   on public.school_claims (user_id);
create index if not exists school_claims_school_id_idx on public.school_claims (school_id);

alter table public.school_claims enable row level security;

-- Claims always start pending, for yourself, on a listing nobody owns yet.
-- The claim column inside the subquery is qualified (school_claims.school_id):
-- a bare school_id would bind to flight_schools — see
-- 20260822054639_fix_school_logo_policy_name_binding.sql.
drop policy if exists "Own claim insert" on public.school_claims;
create policy "Own claim insert" on public.school_claims
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = school_claims.school_id and fs.managed_by is null
    )
  );
drop policy if exists "Own claims read" on public.school_claims;
create policy "Own claims read" on public.school_claims
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Admin read" on public.school_claims;
create policy "Admin read" on public.school_claims
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin update" on public.school_claims;
create policy "Admin update" on public.school_claims
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.school_claims from anon, authenticated;
-- Admins only ever flip the decision columns; claim content stays immutable.
grant select, insert, update (status, decided_by, decided_at)
  on public.school_claims to authenticated;

-- ── notifications ───────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('claim_approved', 'claim_rejected', 'listing_assigned', 'listing_revoked')),
  school_id  text references public.flight_schools (id) on delete set null,
  title      text not null,
  body       text not null default '',
  href       text not null default '',
  read_at    timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) between 1 and 200),
  constraint notifications_body_length  check (char_length(body) <= 1000),
  constraint notifications_href_length  check (char_length(href) <= 300)
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
-- Partial: the navbar badge only ever counts unread rows.
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id) where read_at is null;
create index if not exists notifications_school_id_idx
  on public.notifications (school_id) where school_id is not null;

alter table public.notifications enable row level security;

drop policy if exists "Own notifications read" on public.notifications;
create policy "Own notifications read" on public.notifications
  for select to authenticated using ((select auth.uid()) = user_id);
-- Every ownership event is admin-initiated, so the session client can write
-- these; no service role and no SECURITY DEFINER insert path is needed.
drop policy if exists "Admin insert" on public.notifications;
create policy "Admin insert" on public.notifications
  for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "Own notifications update" on public.notifications;
create policy "Own notifications update" on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.notifications from anon, authenticated;
-- Recipients may only flip read state — the column grant excludes the rest.
grant select, insert, update (read_at) on public.notifications to authenticated;

-- ── user_id_by_email — service-role-only lookup behind assignOwner ──────────
create or replace function public.user_id_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where lower(email) = lower(trim(p_email)) limit 1;
$$;
revoke execute on function public.user_id_by_email(text) from public, anon, authenticated;
grant  execute on function public.user_id_by_email(text) to service_role;
