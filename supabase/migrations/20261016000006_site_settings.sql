-- Site-wide settings editable by admins (e.g. the active visual theme).
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.site_settings enable row level security;
create policy "public read" on public.site_settings for select using (true);
create policy "admin all" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
insert into public.site_settings (key, value) values ('theme', '"ballpark"');
