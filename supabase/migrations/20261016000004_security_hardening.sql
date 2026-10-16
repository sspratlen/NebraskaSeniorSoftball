-- Address Supabase security advisor findings.
-- The auth trigger function should never be called directly over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- Keep extensions out of the exposed public schema.
create schema if not exists extensions;
alter extension citext set schema extensions; -- no-op on fresh installs where 0001 already placed it there
-- Note: public.is_admin() stays executable (RLS policies call it as the requesting role)
-- and public.team_roster() is intentionally public (names only, no contact info).
