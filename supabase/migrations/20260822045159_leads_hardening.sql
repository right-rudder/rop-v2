-- Leads hardening (PR #6 review): retain leads when a school is removed,
-- pin the fingerprint format, make submit_lead server-only (service_role)
-- and SECURITY INVOKER.
alter table public.leads alter column school_id drop not null;
alter table public.leads drop constraint if exists leads_school_id_fkey;
alter table public.leads add constraint leads_school_id_fkey
  foreign key (school_id) references public.flight_schools (id) on delete set null;
alter table public.leads drop constraint if exists leads_ip_hash_format;
alter table public.leads add constraint leads_ip_hash_format check (ip_hash ~ '^[0-9a-f]{64}$');

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
