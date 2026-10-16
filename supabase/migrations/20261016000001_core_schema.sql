-- Nebraska Senior Softball: core schema
-- Public-facing league data is readable by anyone; player PII and
-- registrations are restricted to admins (and the owning user).

create schema if not exists extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------
-- Roles / admin helpers
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'member' check (role in ('member','manager','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- League structure
-- ---------------------------------------------------------------
create table public.fields (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  complex text,
  address text,
  map_url text,
  sort int not null default 0
);

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_name text not null,
  play_days text not null,
  start_time text,
  summary text,
  description text,
  contact_email citext,
  accent text not null default '#c8102e',
  sort int not null default 0,
  active boolean not null default true
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  name text not null,                 -- e.g. "Summer 2026"
  year int not null,
  term text not null check (term in ('spring','summer','fall','full')),
  starts_on date,
  ends_on date,
  reg_opens date,
  reg_closes date,
  late_reg_closes date,
  fee_cents int,
  late_fee_cents int,
  is_current boolean not null default false,
  notes text,
  unique (league_id, name)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  name text not null,
  division text,
  manager_name text,
  sponsor text,
  color text,
  unique (season_id, name)
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  game_date date not null,
  start_time time,
  field_id uuid references public.fields(id) on delete set null,
  home_team_id uuid references public.teams(id) on delete cascade,
  away_team_id uuid references public.teams(id) on delete cascade,
  home_score int,
  away_score int,
  status text not null default 'scheduled'
    check (status in ('scheduled','final','postponed','cancelled','forfeit')),
  game_type text not null default 'regular'
    check (game_type in ('regular','playoff','championship','exhibition')),
  notes text
);
create index games_season_date_idx on public.games (season_id, game_date);

create or replace view public.standings with (security_invoker = true) as
with results as (
  select season_id, home_team_id as team_id, home_score as rf, away_score as ra from public.games
   where status in ('final','forfeit') and game_type = 'regular'
  union all
  select season_id, away_team_id, away_score, home_score from public.games
   where status in ('final','forfeit') and game_type = 'regular'
)
select t.season_id, t.id as team_id, t.name, t.division, t.manager_name,
  count(r.*) filter (where r.rf > r.ra)  as wins,
  count(r.*) filter (where r.rf < r.ra)  as losses,
  count(r.*) filter (where r.rf = r.ra)  as ties,
  coalesce(sum(r.rf),0) as runs_for,
  coalesce(sum(r.ra),0) as runs_against
from public.teams t
left join results r on r.team_id = t.id
group by t.id;

-- ---------------------------------------------------------------
-- People
-- ---------------------------------------------------------------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email citext,
  phone text,
  birth_year int,
  gender text,
  address text,
  city text,
  state text,
  zip text,
  emergency_name text,
  emergency_phone text,
  shirt_size text,
  positions text[],
  created_at timestamptz not null default now()
);
create unique index players_email_key on public.players (email) where email is not null;

create table public.roster (
  team_id uuid references public.teams(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  jersey_number text,
  is_manager boolean not null default false,
  primary key (team_id, player_id)
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  player_id uuid references public.players(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email citext not null,
  phone text,
  birth_year int not null,
  returning_player boolean not null default false,
  prior_team text,
  shirt_size text,
  positions text[],
  emergency_name text,
  emergency_phone text,
  waiver_accepted boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending','paid','pool','assigned','withdrawn')),
  amount_cents int,
  paid_at timestamptz,
  payment_method text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------
create table public.board_members (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  name text,
  email citext,
  term_ends int,
  sort int not null default 0
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'corporate' check (category in ('corporate','medical','apparel','hotel')),
  blurb text,
  url text,
  promo_code text,
  logo_url text,
  sort int not null default 0,
  active boolean not null default true
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references public.leagues(id) on delete cascade,
  title text not null,
  starts_on date not null,
  ends_on date,
  start_time text,
  location text,
  category text not null default 'general'
    check (category in ('general','registration','game','board','social','no-games','weather')),
  description text
);
create index events_date_idx on public.events (starts_on);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  body text not null,
  league_id uuid references public.leagues(id) on delete set null,
  pinned boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  topic text,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  sent_by uuid references auth.users(id),
  audience text,
  subject text not null,
  recipient_count int not null default 0,
  resend_ids text[],
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.fields           enable row level security;
alter table public.leagues          enable row level security;
alter table public.seasons          enable row level security;
alter table public.teams            enable row level security;
alter table public.games            enable row level security;
alter table public.players          enable row level security;
alter table public.roster           enable row level security;
alter table public.registrations    enable row level security;
alter table public.board_members    enable row level security;
alter table public.sponsors         enable row level security;
alter table public.events           enable row level security;
alter table public.posts            enable row level security;
alter table public.contact_messages enable row level security;
alter table public.email_log        enable row level security;

-- Public read for league content
create policy "public read" on public.fields        for select using (true);
create policy "public read" on public.leagues       for select using (true);
create policy "public read" on public.seasons       for select using (true);
create policy "public read" on public.teams         for select using (true);
create policy "public read" on public.games         for select using (true);
create policy "public read" on public.board_members for select using (true);
create policy "public read" on public.sponsors      for select using (active or public.is_admin());
create policy "public read" on public.events        for select using (true);
create policy "public read" on public.posts         for select
  using ((published_at is not null and published_at <= now()) or public.is_admin());

-- Admin write on everything
do $$
declare t text;
begin
  foreach t in array array['fields','leagues','seasons','teams','games','players','roster',
                           'registrations','board_members','sponsors','events','posts',
                           'contact_messages','email_log']
  loop
    execute format('create policy "admin all" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Profiles: self read/update (role changes only by admin)
create policy "self read" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "self update" on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));
create policy "admin all" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- Players: users see their own record
create policy "self read" on public.players for select using (user_id = auth.uid());
-- Roster names are public (no PII beyond name)
create policy "public read" on public.roster for select using (true);

-- Anyone can submit a registration or a contact message; only admins read them
create policy "public insert" on public.registrations for insert
  with check (waiver_accepted and status = 'pending' and paid_at is null and player_id is null);
create policy "self read" on public.registrations for select
  using (email = (auth.jwt() ->> 'email'));
create policy "public insert" on public.contact_messages for insert
  with check (not handled and length(message) between 1 and 5000);

-- Public roster lookup exposes names only (no contact info)
create or replace function public.team_roster(p_team uuid)
returns table (first_name text, last_name text, jersey_number text, is_manager boolean)
language sql stable security definer set search_path = public as $$
  select p.first_name, p.last_name, r.jersey_number, r.is_manager
  from public.roster r join public.players p on p.id = r.player_id
  where r.team_id = p_team
  order by r.is_manager desc, p.last_name;
$$;
grant execute on function public.team_roster(uuid) to anon, authenticated;
