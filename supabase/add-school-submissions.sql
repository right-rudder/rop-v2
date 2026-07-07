-- ============================================================
-- Adds the school_submissions table to an existing database.
-- (New installs get this from schema.sql — this file is only for
-- databases that ran schema.sql before it included the table.)
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

create table if not exists public.school_submissions (
  id                    uuid primary key default gen_random_uuid(),
  submitted_by          uuid not null references auth.users (id) on delete cascade,
  status                text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  name                  text not null,
  description           text not null,
  website               text not null default '',
  phone                 text not null default '',
  airport_code          text not null,
  city                  text not null,
  state                 text not null,
  faa_part              text check (faa_part in ('61', '141', 'both')),
  programs              jsonb not null default '[]',
  estimated_planes      text,
  estimated_instructors text,
  contacts              jsonb not null default '[]',
  created_at            timestamptz not null default now()
);

alter table public.school_submissions enable row level security;

drop policy if exists "Authenticated insert" on public.school_submissions;
create policy "Authenticated insert" on public.school_submissions
  for insert to authenticated with check (auth.uid() = submitted_by);

drop policy if exists "Own submissions read" on public.school_submissions;
create policy "Own submissions read" on public.school_submissions
  for select to authenticated using (auth.uid() = submitted_by);
