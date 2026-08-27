-- Owners are told when an admin features their listing. The type list is a
-- CHECK rather than an enum, so widening it is a drop-and-recreate; the
-- constraint name is the one Postgres generated for the inline check.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('claim_approved', 'claim_rejected', 'listing_assigned', 'listing_revoked', 'listing_featured'));
