-- ============================================================
-- Leads ("Request information" on school pages)
--
-- Visitors never insert directly: public.submit_lead() validates,
-- rate-limits and inserts, and only the server (service role) may call
-- it — the app's server action computes the IP fingerprint, so a direct
-- Data API caller cannot choose their own. Admins read / update status
-- via RLS. Forwarding to GoHighLevel happens in the app
-- (GHL_WEBHOOK_URL); the row is the record, so deleting a school keeps
-- its leads (school_id becomes null).
--
-- Idempotent — safe to run on an existing database. New installs get
-- this from schema.sql. Run in: Supabase Dashboard > SQL Editor
-- ============================================================
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  school_id    text references public.flight_schools (id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text not null default '',
  program_slug text references public.programs (slug),
  message      text not null default '',
  source_path  text not null default '',
  ip_hash      text not null,
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at   timestamptz not null default now(),
  constraint leads_name_length    check (char_length(name) between 1 and 120),
  constraint leads_email_format   check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint leads_phone_length   check (char_length(phone) <= 40),
  constraint leads_message_length check (char_length(message) <= 2000),
  constraint leads_source_length  check (char_length(source_path) <= 300),
  constraint leads_ip_hash_format check (ip_hash ~ '^[0-9a-f]{64}$')
);
create index if not exists leads_school_created_idx on public.leads (school_id, created_at desc);
create index if not exists leads_ip_created_idx     on public.leads (ip_hash, created_at desc);
create index if not exists leads_email_school_idx   on public.leads (lower(email), school_id, created_at desc);

-- Existing databases created from the first version of this patch:
-- retain leads when a school is removed, and pin the fingerprint format.
alter table public.leads alter column school_id drop not null;
alter table public.leads drop constraint if exists leads_school_id_fkey;
alter table public.leads add constraint leads_school_id_fkey
  foreign key (school_id) references public.flight_schools (id) on delete set null;
alter table public.leads drop constraint if exists leads_ip_hash_format;
alter table public.leads add constraint leads_ip_hash_format check (ip_hash ~ '^[0-9a-f]{64}$');

alter table public.leads enable row level security;

drop policy if exists "Admin read" on public.leads;
create policy "Admin read" on public.leads
  for select to authenticated using ((select public.is_admin()));
drop policy if exists "Admin update" on public.leads;
create policy "Admin update" on public.leads
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.leads from anon, authenticated;
grant select, update (status) on public.leads to authenticated;

-- ── submit_lead: the only write path ─────────────────────────
-- Server-only: executable by service_role (the app's server action),
-- never by the Data API roles, so the rate-limit fingerprint is always
-- computed server-side. SECURITY INVOKER — service_role already holds
-- the table privileges. User-safe errors use errcode P0001.
create or replace function public.submit_lead(
  p_school_id    text,
  p_name         text,
  p_email        text,
  p_phone        text,
  p_program_slug text,
  p_message      text,
  p_source_path  text,
  p_ip_hash      text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (select 1 from public.flight_schools where id = p_school_id) then
    raise exception 'Unknown school' using errcode = 'P0001';
  end if;
  if p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Missing request fingerprint' using errcode = 'P0001';
  end if;
  if (select count(*) from public.leads
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Too many requests. Please try again in an hour.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.leads
             where lower(email) = lower(p_email) and school_id = p_school_id
               and created_at > now() - interval '24 hours') then
    raise exception 'You already contacted this school today.' using errcode = 'P0001';
  end if;

  insert into public.leads (school_id, name, email, phone, program_slug, message, source_path, ip_hash)
  values (
    p_school_id, p_name, p_email, coalesce(p_phone, ''),
    nullif(p_program_slug, ''), coalesce(p_message, ''), coalesce(p_source_path, ''), p_ip_hash
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.submit_lead(text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant  execute on function public.submit_lead(text, text, text, text, text, text, text, text) to service_role;
