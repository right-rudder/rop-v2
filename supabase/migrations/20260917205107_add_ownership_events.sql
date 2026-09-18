-- ── ownership_events — audit trail of who managed which listing, and who decided ──
--
-- Written by a trigger on flight_schools.managed_by, not by the app: the row
-- lands in the same transaction as the ownership change itself, whichever path
-- made it (claim approval, submission approval, direct assignment, invite,
-- revocation, or a hand edit in the SQL editor), and cannot be skipped or
-- forged through the Data API — nobody is granted insert/update/delete.
create table if not exists public.ownership_events (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('granted', 'revoked')),
  school_id   text references public.flight_schools (id) on delete set null,
  -- Snapshot: the entry stays readable after the listing is removed or renamed.
  school_name text not null,
  -- Who gained or lost the listing, and the admin who made the change (null
  -- when it was made outside a user session: SQL editor, service role).
  -- Deliberately NOT foreign keys. Deleting an account nulls its managed_by,
  -- which fires the trigger below mid-delete — a reference to the row being
  -- deleted would fail and block the deletion. An audit row should outlive the
  -- accounts it names in any case.
  user_id     uuid not null,
  actor_id    uuid,
  created_at  timestamptz not null default now()
);

create index if not exists ownership_events_created_idx
  on public.ownership_events (created_at desc);
-- The FK's ON DELETE SET NULL scans by school_id.
create index if not exists ownership_events_school_id_idx
  on public.ownership_events (school_id) where school_id is not null;

alter table public.ownership_events enable row level security;

drop policy if exists "Admin read" on public.ownership_events;
create policy "Admin read" on public.ownership_events
  for select to authenticated using ((select public.is_admin()));

-- Append-only from the API's point of view: select alone, and only for admins.
revoke all on public.ownership_events from anon, authenticated;
grant select on public.ownership_events to authenticated;

-- SECURITY DEFINER because the admin's own role may not insert here. It trusts
-- nothing from the caller: every value comes from the row and the session.
create or replace function public.log_ownership_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  previous uuid;
begin
  if tg_op = 'UPDATE' then
    previous := old.managed_by;
  end if;

  if previous is not null then
    insert into public.ownership_events (kind, school_id, school_name, user_id, actor_id)
    values ('revoked', new.id, new.name, previous, (select auth.uid()));
  end if;
  if new.managed_by is not null then
    insert into public.ownership_events (kind, school_id, school_name, user_id, actor_id)
    values ('granted', new.id, new.name, new.managed_by, (select auth.uid()));
  end if;
  return null;
end;
$$;

revoke execute on function public.log_ownership_change() from public, anon, authenticated;

-- Two triggers so each can carry a WHEN clause: the catalog import upserts
-- every listing, and none of those rows should even enter the function.
drop trigger if exists log_ownership_on_insert on public.flight_schools;
create trigger log_ownership_on_insert
  after insert on public.flight_schools
  for each row
  when (new.managed_by is not null)
  execute function public.log_ownership_change();

drop trigger if exists log_ownership_on_update on public.flight_schools;
create trigger log_ownership_on_update
  after update of managed_by on public.flight_schools
  for each row
  when (old.managed_by is distinct from new.managed_by)
  execute function public.log_ownership_change();

-- ── Backfill ────────────────────────────────────────────────────────────────
-- Until now the only record of an ownership change was the notification it
-- sent. Carry those over so the admin timeline keeps its history. The deciding
-- admin is known only for claim approvals (school_claims.decided_by).
insert into public.ownership_events (kind, school_id, school_name, user_id, actor_id, created_at)
select
  case when n.type = 'listing_revoked' then 'revoked' else 'granted' end,
  n.school_id,
  coalesce(fs.name, 'A removed listing'),
  n.user_id,
  (
    select c.decided_by
    from public.school_claims c
    where n.type = 'claim_approved'
      and c.status = 'approved'
      and c.school_id = n.school_id
      and c.user_id = n.user_id
    order by c.decided_at desc
    limit 1
  ),
  n.created_at
from public.notifications n
left join public.flight_schools fs on fs.id = n.school_id
where n.type in ('claim_approved', 'listing_assigned', 'listing_revoked')
  and not exists (select 1 from public.ownership_events);
