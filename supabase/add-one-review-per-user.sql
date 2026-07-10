-- ============================================================
-- One review per user per school
--
-- 1. De-duplicates existing reviews, keeping each user's MOST
--    RECENT review per school (older ones are deleted; their
--    comments cascade, and the rating trigger re-syncs
--    flight_schools.rating / review_count automatically).
-- 2. Adds a unique index on (school_id, user_id).
-- 3. Drops the "Owner update" policy — reviews are immutable for
--    authors (delete and re-post to change). "Admin update" stays
--    for moderation.
--
-- Idempotent — safe to run on an existing database. New installs
-- get all of this from schema.sql. If applying old patches in
-- order, run this AFTER add-admin-policies.sql (which recreates
-- "Owner update").
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── De-dupe: keep the most recent review per (school, user) ──
delete from public.reviews r
using (
  select id,
         row_number() over (
           partition by school_id, user_id
           order by created_at desc, id desc
         ) as rn
  from public.reviews
) d
where r.id = d.id
  and d.rn > 1;

-- ── Enforce one review per user per school ────────────────────
create unique index if not exists reviews_school_user_unique
  on public.reviews (school_id, user_id);

-- ── Reviews are immutable for their authors ───────────────────
drop policy if exists "Owner update" on public.reviews;
