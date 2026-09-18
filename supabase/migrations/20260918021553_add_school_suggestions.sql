-- Listing suggestions: members propose a correction to one contact/location
-- field; admins approve (which applies it) or decline. Approved rows are the
-- contribution record behind the profile's "approved corrections" count.

-- ── school_suggestions ──────────────────────────────────────────────────────
create table if not exists public.school_suggestions (
  id             uuid primary key default gen_random_uuid(),
  school_id      text not null references public.flight_schools (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  field          text not null check (field in ('phone', 'website', 'address', 'hours', 'contacts')),
  -- A JSON string for the text fields; an array of {name,title,phone,email}
  -- for contacts — the same shape flight_schools.contacts stores.
  proposed_value jsonb not null,
  -- What the listing showed when the suggestion was filed: the admin's diff.
  current_value  jsonb not null,
  reason         text not null check (reason in ('outdated', 'incorrect', 'unreachable', 'missing', 'moved', 'typo', 'other')),
  note           text not null default '',
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_by     uuid references auth.users (id) on delete set null,
  decided_at     timestamptz,
  -- What was actually written on approval; the admin may edit before applying.
  applied_value  jsonb,
  created_at     timestamptz not null default now(),
  constraint school_suggestions_note_length      check (char_length(note) <= 500),
  constraint school_suggestions_other_needs_note check (reason <> 'other' or char_length(note) > 0),
  constraint school_suggestions_proposed_shape check (
    (field = 'contacts'
      and jsonb_typeof(proposed_value) = 'array'
      and jsonb_array_length(proposed_value) between 1 and 10)
    or (field <> 'contacts'
      and jsonb_typeof(proposed_value) = 'string'
      and char_length(proposed_value #>> '{}') between 1 and 300)
  ),
  constraint school_suggestions_current_shape check (
    (field = 'contacts' and jsonb_typeof(current_value) = 'array')
    or (field <> 'contacts' and jsonb_typeof(current_value) = 'string')
  ),
  constraint school_suggestions_applied_shape check (
    applied_value is null
    or (field = 'contacts' and jsonb_typeof(applied_value) = 'array')
    or (field <> 'contacts' and jsonb_typeof(applied_value) = 'string')
  ),
  -- Approved means applied: the two are set in the same statement.
  constraint school_suggestions_applied_on_approve check ((status = 'approved') = (applied_value is not null)),
  constraint school_suggestions_size check (pg_column_size(proposed_value) <= 8192)
);

-- One live suggestion per member per listing per field; decided rows stay as history.
create unique index if not exists school_suggestions_one_pending_idx
  on public.school_suggestions (school_id, user_id, field) where status = 'pending';
create index if not exists school_suggestions_status_created_idx
  on public.school_suggestions (status, created_at desc);
-- approved_suggestion_count() scans exactly this.
create index if not exists school_suggestions_user_approved_idx
  on public.school_suggestions (user_id) where status = 'approved';
create index if not exists school_suggestions_school_id_idx
  on public.school_suggestions (school_id);

alter table public.school_suggestions enable row level security;

-- Suggestions always start pending, for yourself, with no decision attached.
drop policy if exists "Own suggestion insert" on public.school_suggestions;
create policy "Own suggestion insert" on public.school_suggestions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and decided_by is null
    and decided_at is null
    and applied_value is null
  );
drop policy if exists "Own suggestions read" on public.school_suggestions;
create policy "Own suggestions read" on public.school_suggestions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Admin read" on public.school_suggestions;
create policy "Admin read" on public.school_suggestions
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin update" on public.school_suggestions;
create policy "Admin update" on public.school_suggestions
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.school_suggestions from anon, authenticated;
-- Admins only ever record the decision; what the member proposed stays immutable.
grant select, insert, update (status, decided_by, decided_at, applied_value)
  on public.school_suggestions to authenticated;

-- ── approved_suggestion_count — the public profile stat ─────────────────────
-- Profiles are public, but suggestion rows are not (own + admin). This definer
-- function exposes one integer per user and nothing else.
create or replace function public.approved_suggestion_count(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.school_suggestions
  where user_id = p_user_id and status = 'approved';
$$;
revoke execute on function public.approved_suggestion_count(uuid) from public;
grant  execute on function public.approved_suggestion_count(uuid) to anon, authenticated;

-- ── notifications: suggestion outcomes ──────────────────────────────────────
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'claim_approved', 'claim_rejected', 'listing_assigned', 'listing_revoked', 'listing_featured',
    'suggestion_approved', 'suggestion_rejected'
  ));
