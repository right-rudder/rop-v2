-- Hardening from the PR #20 review of listing suggestions:
--   * approved suggestions are a contribution record, so a listing's deletion
--     (the catalog re-import deletes every flight_schools row) must not take
--     them with it — school_id goes nullable with on delete set null and a
--     school_name snapshot, the same shape as ownership_events;
--   * the jsonb shape CHECKs now verify every contact element, not just that
--     the value is an array, so a direct Data API insert cannot store a row the
--     app cannot read back;
--   * the insert policy carries the eligibility rule the action enforces
--     (not an admin, not the listing's manager);
--   * apply_suggestion() makes approve a single transaction: the status
--     compare-and-swap and the listing write succeed or fail together, so two
--     admins approving at once cannot leave the listing and applied_value apart.

-- ── is_contact_list — shape check shared by the three jsonb columns ─────────
-- Every element must be an object with exactly name/title/phone/email, each a
-- string of at most 120 characters (LIMITS.contactField in the app).
create or replace function public.is_contact_list(v jsonb, min_len int, max_len int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when v is null or jsonb_typeof(v) <> 'array' then false
    when jsonb_array_length(v) < min_len or jsonb_array_length(v) > max_len then false
    else not exists (
      select 1
      from jsonb_array_elements(v) as e
      where case
        when jsonb_typeof(e) <> 'object' then true
        else (select count(*) from jsonb_object_keys(e)) <> 4
          or jsonb_typeof(e->'name')  is distinct from 'string'
          or jsonb_typeof(e->'title') is distinct from 'string'
          or jsonb_typeof(e->'phone') is distinct from 'string'
          or jsonb_typeof(e->'email') is distinct from 'string'
          or char_length(e->>'name')  > 120
          or char_length(e->>'title') > 120
          or char_length(e->>'phone') > 120
          or char_length(e->>'email') > 120
      end
    )
  end;
$$;
revoke execute on function public.is_contact_list(jsonb, int, int) from public, anon, authenticated;

alter table public.school_suggestions drop constraint if exists school_suggestions_proposed_shape;
alter table public.school_suggestions add constraint school_suggestions_proposed_shape check (
  (field = 'contacts' and public.is_contact_list(proposed_value, 1, 10))
  or (field <> 'contacts'
    and jsonb_typeof(proposed_value) = 'string'
    and char_length(proposed_value #>> '{}') between 1 and 300)
);
-- A listing may carry any number of contacts (the editor caps new lists at 10).
alter table public.school_suggestions drop constraint if exists school_suggestions_current_shape;
alter table public.school_suggestions add constraint school_suggestions_current_shape check (
  (field = 'contacts' and public.is_contact_list(current_value, 0, 100))
  or (field <> 'contacts' and jsonb_typeof(current_value) = 'string')
);
alter table public.school_suggestions drop constraint if exists school_suggestions_applied_shape;
alter table public.school_suggestions add constraint school_suggestions_applied_shape check (
  applied_value is null
  or (field = 'contacts' and public.is_contact_list(applied_value, 1, 10))
  or (field <> 'contacts' and jsonb_typeof(applied_value) = 'string')
);

-- ── keep the record when the listing goes ───────────────────────────────────
alter table public.school_suggestions add column if not exists school_name text;
update public.school_suggestions s
   set school_name = coalesce(fs.name, 'Removed listing')
  from public.school_suggestions s2
  left join public.flight_schools fs on fs.id = s2.school_id
 where s.id = s2.id and s.school_name is null;
alter table public.school_suggestions alter column school_name set not null;
alter table public.school_suggestions
  add constraint school_suggestions_school_name_length check (char_length(school_name) between 1 and 120);

alter table public.school_suggestions drop constraint if exists school_suggestions_school_id_fkey;
alter table public.school_suggestions alter column school_id drop not null;
alter table public.school_suggestions
  add constraint school_suggestions_school_id_fkey
  foreign key (school_id) references public.flight_schools (id) on delete set null;

-- ── insert policy carries the eligibility rule ──────────────────────────────
-- A suggestion is filed for yourself, as pending with no decision attached, on
-- a listing that exists and that you do not manage; admins edit directly.
-- The suggestion column inside the subquery is qualified (see the claims policy).
drop policy if exists "Own suggestion insert" on public.school_suggestions;
create policy "Own suggestion insert" on public.school_suggestions
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and status = 'pending'
    and decided_by is null
    and decided_at is null
    and applied_value is null
    and not (select public.is_admin())
    and exists (
      select 1 from public.flight_schools fs
      where fs.id = school_suggestions.school_id
        and fs.managed_by is distinct from (select auth.uid())
    )
  );

-- ── apply_suggestion — approve as one transaction ───────────────────────────
-- Runs as the admin (security invoker): the "Admin update" policies on both
-- tables and protect_flight_school_columns still apply. The status flip is a
-- compare-and-swap; a second admin approving the same row finds no pending
-- row and nothing is written. Any failure after the flip rolls it back.
create or replace function public.apply_suggestion(p_id uuid, p_value jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_field     text;
  v_school_id text;
  v_rows      int;
begin
  update public.school_suggestions
     set status = 'approved',
         applied_value = p_value,
         decided_by = auth.uid(),
         decided_at = now()
   where id = p_id and status = 'pending'
  returning field, school_id into v_field, v_school_id;
  if not found then
    raise exception 'SUGGESTION_ALREADY_PROCESSED' using errcode = 'P0001';
  end if;
  if v_school_id is null then
    raise exception 'SUGGESTION_LISTING_GONE' using errcode = 'P0001';
  end if;

  if v_field = 'contacts' then
    update public.flight_schools set contacts = p_value where id = v_school_id;
  else
    -- field is CHECK-constrained to phone/website/address/hours, which are
    -- the column names; %I quotes it regardless.
    execute format('update public.flight_schools set %I = $1 where id = $2', v_field)
      using (p_value #>> '{}'), v_school_id;
  end if;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'SUGGESTION_LISTING_GONE' using errcode = 'P0001';
  end if;
  return v_school_id;
end;
$$;
revoke execute on function public.apply_suggestion(uuid, jsonb) from public, anon;
grant  execute on function public.apply_suggestion(uuid, jsonb) to authenticated;
