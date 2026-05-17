-- Chalo free-only single-user prototype schema.
-- These policies are intentionally permissive for a private prototype with no login.
-- Before sharing publicly, add Supabase Auth and restrict rows/storage objects to your user.

create extension if not exists "pgcrypto";

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text,
  start_time timestamptz default now(),
  end_time timestamptz,
  start_latitude numeric,
  start_longitude numeric,
  total_distance_meters numeric default 0,
  total_duration_seconds numeric default 0,
  average_speed_kmph numeric default 0,
  diary_note text,
  cover_photo_url text,
  status text default 'active',
  created_at timestamptz default now()
);

create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  stop_number int,
  provider_place_id text,
  provider text default 'openstreetmap',
  place_name text,
  place_address text,
  category text,
  latitude numeric,
  longitude numeric,
  arrival_time timestamptz,
  time_taken_seconds numeric,
  distance_from_previous_meters numeric,
  photo_url text,
  caption text,
  destination_type text default 'random_stop',
  created_at timestamptz default now()
);

create table if not exists public.route_points (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references public.trips(id) on delete cascade,
  latitude numeric not null,
  longitude numeric not null,
  speed_mps numeric,
  accuracy numeric,
  recorded_at timestamptz default now()
);

create table if not exists public.app_settings (
  id int primary key default 1,
  owner_name text default 'Ayushman',
  default_min_radius_meters int default 1000,
  default_max_radius_meters int default 5000,
  arrival_threshold_meters int default 75,
  created_at timestamptz default now(),
  constraint app_settings_single_row check (id = 1)
);

insert into public.app_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.trips enable row level security;
alter table public.destinations enable row level security;
alter table public.route_points enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "prototype anon read trips" on public.trips;
drop policy if exists "prototype anon write trips" on public.trips;
drop policy if exists "prototype anon read destinations" on public.destinations;
drop policy if exists "prototype anon write destinations" on public.destinations;
drop policy if exists "prototype anon read route points" on public.route_points;
drop policy if exists "prototype anon write route points" on public.route_points;
drop policy if exists "prototype anon read settings" on public.app_settings;
drop policy if exists "prototype anon write settings" on public.app_settings;

create policy "prototype anon read trips" on public.trips for select to anon using (true);
create policy "prototype anon write trips" on public.trips for all to anon using (true) with check (true);
create policy "prototype anon read destinations" on public.destinations for select to anon using (true);
create policy "prototype anon write destinations" on public.destinations for all to anon using (true) with check (true);
create policy "prototype anon read route points" on public.route_points for select to anon using (true);
create policy "prototype anon write route points" on public.route_points for all to anon using (true) with check (true);
create policy "prototype anon read settings" on public.app_settings for select to anon using (true);
create policy "prototype anon write settings" on public.app_settings for all to anon using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', true)
on conflict (id) do nothing;

drop policy if exists "prototype anon read trip photos" on storage.objects;
drop policy if exists "prototype anon write trip photos" on storage.objects;

create policy "prototype anon read trip photos"
on storage.objects for select to anon
using (bucket_id = 'trip-photos');

create policy "prototype anon write trip photos"
on storage.objects for all to anon
using (bucket_id = 'trip-photos')
with check (bucket_id = 'trip-photos');
