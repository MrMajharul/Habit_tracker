-- ────────────────────────────────────────────────────────────────────────────────
-- Post-Beta: User Reminders / Alarms System with RLS
-- Migration 009
-- ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_reminders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  reminder_type       TEXT NOT NULL DEFAULT 'custom' CHECK (reminder_type IN ('salah', 'quran', 'dhikr', 'habit', 'study', 'custom')),
  time                TEXT NOT NULL, -- Format "HH:mm" in 24h
  repeat_type         TEXT NOT NULL DEFAULT 'daily' CHECK (repeat_type IN ('once', 'daily', 'weekdays', 'custom_days')),
  days_of_week        INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0 = Sunday, 6 = Saturday
  is_enabled          BOOLEAN NOT NULL DEFAULT true,
  sound_enabled       BOOLEAN NOT NULL DEFAULT true,
  vibration_enabled   BOOLEAN NOT NULL DEFAULT true,
  target_url          TEXT NOT NULL DEFAULT '/dashboard',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_reminders_user ON user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_enabled ON user_reminders(user_id, is_enabled);

ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_reminders_select_own" ON user_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_reminders_insert_own" ON user_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_reminders_update_own" ON user_reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_reminders_delete_own" ON user_reminders
  FOR DELETE USING (auth.uid() = user_id);
