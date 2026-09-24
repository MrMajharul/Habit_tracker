-- Phase 2 Migration: Live Prayer & Habit System
-- Run via Supabase SQL editor or Supabase CLI

-- 1. Ensure prayer_settings has all required fields
create table if not exists public.prayer_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision not null default 23.8103,
  longitude double precision not null default 90.4125,
  city text not null default 'Dhaka',
  country text not null default 'Bangladesh',
  timezone text not null default 'Asia/Dhaka',
  calculation_method text not null default 'karachi',
  madhhab text not null default 'standard',
  fajr_adjustment integer not null default 0,
  sunrise_adjustment integer not null default 0,
  dhuhr_adjustment integer not null default 0,
  asr_adjustment integer not null default 0,
  maghrib_adjustment integer not null default 0,
  isha_adjustment integer not null default 0,
  manual_offset_minutes integer not null default 0,
  notifications_enabled boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id)
);

-- Add any missing columns to existing prayer_settings table if it was created in 001
alter table public.prayer_settings add column if not exists city text not null default 'Dhaka';
alter table public.prayer_settings add column if not exists country text not null default 'Bangladesh';
alter table public.prayer_settings add column if not exists timezone text not null default 'Asia/Dhaka';
alter table public.prayer_settings add column if not exists madhhab text not null default 'standard';
alter table public.prayer_settings add column if not exists fajr_adjustment integer not null default 0;
alter table public.prayer_settings add column if not exists sunrise_adjustment integer not null default 0;
alter table public.prayer_settings add column if not exists dhuhr_adjustment integer not null default 0;
alter table public.prayer_settings add column if not exists asr_adjustment integer not null default 0;
alter table public.prayer_settings add column if not exists maghrib_adjustment integer not null default 0;
alter table public.prayer_settings add column if not exists isha_adjustment integer not null default 0;

-- 2. Prayer completion tracking (prayer_logs)
create table if not exists public.prayer_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prayer text not null check (prayer in ('fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  date date not null,
  status text not null default 'completed' check (status in ('completed', 'missed', 'late')),
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, prayer, date)
);

-- 3. Enhance habits table
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'personal',
  icon text not null default 'book-open',
  frequency text not null default 'daily',
  target_value numeric default 1,
  target_unit text,
  reminder_enabled boolean default false,
  reminder_time time,
  prayer_anchor text default 'none' check (prayer_anchor in ('none', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha')),
  start_date date default current_date,
  is_active boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.habits add column if not exists description text;
alter table public.habits add column if not exists prayer_anchor text default 'none';
alter table public.habits add column if not exists target_value numeric default 1;
alter table public.habits add column if not exists target_unit text;
alter table public.habits add column if not exists reminder_enabled boolean default false;
alter table public.habits add column if not exists is_active boolean default true;

-- 4. Enhance habit_logs table
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  value numeric default 1,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (habit_id, date)
);

alter table public.habit_logs add column if not exists value numeric default 1;
alter table public.habit_logs add column if not exists completed_at timestamptz;
alter table public.habit_logs add column if not exists updated_at timestamptz default now();

-- 5. Row Level Security Policies
alter table public.prayer_settings enable row level security;
alter table public.prayer_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;

-- Prayer settings RLS
drop policy if exists "Owner access prayer_settings" on public.prayer_settings;
create policy "Owner access prayer_settings" on public.prayer_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prayer logs RLS
drop policy if exists "Owner access prayer_logs" on public.prayer_logs;
create policy "Owner access prayer_logs" on public.prayer_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Habits RLS
drop policy if exists "Owner access habits" on public.habits;
create policy "Owner access habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Habit logs RLS
drop policy if exists "Owner access habit_logs" on public.habit_logs;
create policy "Owner access habit_logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indices for performance
create index if not exists idx_prayer_logs_user_date on public.prayer_logs(user_id, date);
create index if not exists idx_habits_user_active on public.habits(user_id, is_active);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
