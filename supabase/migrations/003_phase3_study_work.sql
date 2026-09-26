-- Phase 3 Migration: Study & Work Planning + Focus System
-- Run via Supabase SQL editor or Supabase CLI

-- 1. Subjects table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#10b981',
  icon text not null default 'book-open',
  weekly_target_minutes integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ensure all columns exist if subjects was created in 001
alter table public.subjects add column if not exists description text;
alter table public.subjects add column if not exists color text not null default '#10b981';
alter table public.subjects add column if not exists icon text not null default 'book-open';
alter table public.subjects add column if not exists weekly_target_minutes integer not null default 0;
alter table public.subjects add column if not exists is_archived boolean not null default false;
alter table public.subjects add column if not exists created_at timestamptz default now() not null;
alter table public.subjects add column if not exists updated_at timestamptz default now() not null;

-- 2. Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'TODO' check (status in ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'todo', 'in_progress', 'completed', 'cancelled')),
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  estimated_minutes integer,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Ensure all columns exist if tasks was created in 001
alter table public.tasks add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists status text not null default 'TODO';
alter table public.tasks add column if not exists priority text not null default 'MEDIUM';
alter table public.tasks add column if not exists due_date timestamptz;
alter table public.tasks add column if not exists estimated_minutes integer;
alter table public.tasks add column if not exists completed_at timestamptz;
alter table public.tasks add column if not exists created_at timestamptz default now() not null;
alter table public.tasks add column if not exists updated_at timestamptz default now() not null;

-- 3. Focus Sessions table
create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  planned_minutes integer not null default 25,
  actual_minutes integer not null default 0,
  status text not null default 'COMPLETED' check (status in ('COMPLETED', 'INTERRUPTED', 'CANCELLED')),
  created_at timestamptz default now() not null
);

-- Ensure all columns exist if focus_sessions was created in 001
alter table public.focus_sessions add column if not exists task_id uuid references public.tasks(id) on delete set null;
alter table public.focus_sessions add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.focus_sessions add column if not exists started_at timestamptz default now() not null;
alter table public.focus_sessions add column if not exists ended_at timestamptz;
alter table public.focus_sessions add column if not exists planned_minutes integer not null default 25;
alter table public.focus_sessions add column if not exists actual_minutes integer not null default 0;
alter table public.focus_sessions add column if not exists status text not null default 'COMPLETED';
alter table public.focus_sessions add column if not exists created_at timestamptz default now() not null;

-- 4. Row Level Security Policies
alter table public.subjects enable row level security;
alter table public.tasks enable row level security;
alter table public.focus_sessions enable row level security;

-- Subjects RLS
drop policy if exists "Owner access subjects" on public.subjects;
create policy "Owner access subjects" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tasks RLS
drop policy if exists "Owner access tasks" on public.tasks;
create policy "Owner access tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Focus Sessions RLS
drop policy if exists "Owner access focus_sessions" on public.focus_sessions;
create policy "Owner access focus_sessions" on public.focus_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5. Indexes for Query Performance
create index if not exists idx_subjects_user_archived on public.subjects(user_id, is_archived);
create index if not exists idx_tasks_user_status on public.tasks(user_id, status);
create index if not exists idx_tasks_user_due_date on public.tasks(user_id, due_date);
create index if not exists idx_tasks_subject_id on public.tasks(subject_id);
create index if not exists idx_focus_sessions_user_started on public.focus_sessions(user_id, started_at);
create index if not exists idx_focus_sessions_subject_id on public.focus_sessions(subject_id);
create index if not exists idx_focus_sessions_task_id on public.focus_sessions(task_id);
