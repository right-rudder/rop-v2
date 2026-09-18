-- Fix: every member suggestion failed with "permission denied for function
-- is_contact_list" (42501). The function backs the school_suggestions shape
-- CHECKs, and a CHECK runs with the inserting role's privileges — Postgres
-- checks EXECUTE when it initialises the expression, even for a phone
-- suggestion where the contacts branch is never taken. 20260918035003 revoked
-- it from authenticated; the dry runs ran as postgres and so never saw this.
-- It is a pure, immutable shape test with no data access, so granting it is safe.
grant execute on function public.is_contact_list(jsonb, int, int) to authenticated;
