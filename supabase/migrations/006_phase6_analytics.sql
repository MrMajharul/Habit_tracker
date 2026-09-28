-- Phase 6: Analytics query indexes
-- Prefer existing tables. These composite indexes match range scans used by analytics.

CREATE INDEX IF NOT EXISTS idx_daily_reflections_user_date
  ON public.daily_reflections (user_id, reflection_date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_at
  ON public.tasks (user_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_user_started
  ON public.dhikr_sessions (user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_goals_user_id
  ON public.goals (user_id);
