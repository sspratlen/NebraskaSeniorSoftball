-- Pre-authorize admins by email: an account whose email is listed here becomes
-- an admin automatically on first sign-in (case-insensitive match).
create table public.admin_invites (
  email extensions.citext primary key,
  note text,
  created_at timestamptz not null default now()
);
alter table public.admin_invites enable row level security;
create policy "admin all" on public.admin_invites for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when exists (select 1 from public.admin_invites where lower(email::text) = lower(new.email)) then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

insert into public.admin_invites (email, note) values
  ('scottspratlen@heritagehill.church', 'Site owner'),
  ('scottspratlen@gmail.com', 'Site owner (personal)')
on conflict (email) do nothing;
