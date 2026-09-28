-- ============================================================================
-- Phase 7: Production Hardening Migration
-- Migration: 007_phase7_hardening.sql
-- ============================================================================

-- 1. Ensure DELETE policies on all Phase 5 tables
DROP POLICY IF EXISTS "ramadan_settings_delete_own" ON public.ramadan_settings;
CREATE POLICY "ramadan_settings_delete_own" ON public.ramadan_settings
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "ramadan_daily_logs_delete_own" ON public.ramadan_daily_logs;
CREATE POLICY "ramadan_daily_logs_delete_own" ON public.ramadan_daily_logs
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Allow self-deletion on profiles for account deletion compliance
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 3. Additional composite indexes for user isolation and range scans
CREATE INDEX IF NOT EXISTS idx_prayer_logs_user_prayer_date
  ON public.prayer_logs (user_id, prayer, date);

CREATE INDEX IF NOT EXISTS idx_habit_logs_user_completed
  ON public.habit_logs (user_id, completed, date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due
  ON public.tasks (user_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status
  ON public.focus_sessions (user_id, status, started_at);

CREATE INDEX IF NOT EXISTS idx_ramadan_daily_logs_user_day
  ON public.ramadan_daily_logs (user_id, ramadan_day);
