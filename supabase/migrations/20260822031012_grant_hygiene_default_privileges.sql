-- Default privileges (delta to supabase/add-grant-hygiene.sql, PR #4 review):
-- tables / functions created later by the postgres role start with no
-- Data API access; grants are always explicit.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated;
