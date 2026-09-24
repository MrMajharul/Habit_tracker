-- NoorPath initial schema
-- Run via Supabase SQL editor or CLI

create extension if not exists "pgcrypto";

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  country text,
  city text,
  timezone text default 'UTC',
  preferred_language text default 'en',
  prayer_calculation_method text default 'karachi',
  asr_madhhab text default 'standard',
  avatar_url text,
  onboarding_completed boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Prayer settings
create table if not exists public.prayer_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  calculation_method text default 'karachi',
  asr_madhhab text default 'standard',
  manual_offset_minutes integer default 0,
  notifications_enabled boolean default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id)
);

-- Verified Hadith (public read)
create table if not exists public.hadiths (
  id text primary key,
  arabic_text text not null,
  english_translation text not null,
  bangla_translation text,
  source text not null,
  book text not null,
  hadith_number text not null,
  grade text,
  topic text,
  is_verified boolean default true not null,
  source_url text,
  created_at timestamptz default now() not null
);

create table if not exists public.hadith_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  hadith_id text not null references public.hadiths(id) on delete cascade,
  created_at timestamptz default now() not null,
  unique (user_id, hadith_id)
);

-- Habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  icon text,
  category text not null,
  frequency text default 'daily',
  target text,
  reminder_time time,
  start_date date,
  color text,
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  completed boolean default false,
  quantity numeric,
  notes text,
  created_at timestamptz default now() not null,
  unique (habit_id, log_date)
);

-- Study
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  priority text default 'medium',
  deadline timestamptz,
  estimated_minutes integer,
  status text default 'todo',
  related_habit_id uuid references public.habits(id) on delete set null,
  related_goal_id uuid,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  goal_type text not null,
  target_value numeric,
  unit text,
  deadline date,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.goal_progress (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  progress_date date not null,
  value numeric not null default 0,
  created_at timestamptz default now() not null
);

-- Focus
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  duration_minutes integer not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

-- Qur'an & Dhikr
create table if not exists public.quran_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  progress_date date not null,
  pages_read integer default 0,
  juz_completed integer default 0,
  reading_minutes integer default 0,
  notes text,
  created_at timestamptz default now() not null
);

create table if not exists public.dhikr_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  dhikr_key text not null,
  count integer not null default 0,
  target integer,
  log_date date not null,
  created_at timestamptz default now() not null
);

-- Reflection & notifications
create table if not exists public.daily_reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reflection_date date not null,
  achievements text,
  improvements text,
  tomorrow_priority text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, reflection_date)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  enabled boolean default true,
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, category)
);

-- RLS
alter table public.profiles enable row level security;
alter table public.prayer_settings enable row level security;
alter table public.hadiths enable row level security;
alter table public.hadith_bookmarks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.goal_progress enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.quran_progress enable row level security;
alter table public.dhikr_logs enable row level security;
alter table public.daily_reflections enable row level security;
alter table public.notifications enable row level security;
alter table public.user_notification_preferences enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Hadith public read
create policy "Verified hadith readable by authenticated users"
  on public.hadiths for select to authenticated using (is_verified = true);

-- Generic owner policies helper pattern
create policy "Owner access prayer_settings" on public.prayer_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access hadith_bookmarks" on public.hadith_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access habit_logs" on public.habit_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access subjects" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access goals" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access goal_progress" on public.goal_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access focus_sessions" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access quran_progress" on public.quran_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access dhikr_logs" on public.dhikr_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access daily_reflections" on public.daily_reflections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Owner access notification_prefs" on public.user_notification_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
