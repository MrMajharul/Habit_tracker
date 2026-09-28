-- ────────────────────────────────────────────────────────────────────────────────
-- Phase 5: Dhikr Engine + Ramadan Mode
-- Migration 005
-- ────────────────────────────────────────────────────────────────────────────────

-- ─── Dhikr Sessions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dhikr_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dhikr_id      TEXT NOT NULL,
  target_count  INTEGER NOT NULL DEFAULT 33,
  completed_count INTEGER NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'INTERRUPTED'
                  CHECK (status IN ('COMPLETED', 'INTERRUPTED', 'CANCELLED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_user ON dhikr_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_dhikr ON dhikr_sessions(dhikr_id);
CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_started ON dhikr_sessions(started_at);

ALTER TABLE dhikr_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dhikr_sessions_select_own" ON dhikr_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dhikr_sessions_insert_own" ON dhikr_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dhikr_sessions_update_own" ON dhikr_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "dhikr_sessions_delete_own" ON dhikr_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Dhikr Favorites ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dhikr_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dhikr_id    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, dhikr_id)
);

CREATE INDEX IF NOT EXISTS idx_dhikr_favorites_user ON dhikr_favorites(user_id);

ALTER TABLE dhikr_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dhikr_favorites_select_own" ON dhikr_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "dhikr_favorites_insert_own" ON dhikr_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "dhikr_favorites_delete_own" ON dhikr_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Ramadan Settings ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ramadan_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled            BOOLEAN NOT NULL DEFAULT false,
  suhoor_reminder       BOOLEAN NOT NULL DEFAULT true,
  iftar_reminder        BOOLEAN NOT NULL DEFAULT true,
  daily_quran_target    INTEGER NOT NULL DEFAULT 20,
  dhikr_reminder        BOOLEAN NOT NULL DEFAULT true,
  reflection_reminder   BOOLEAN NOT NULL DEFAULT false,
  taraweeh_tracking     BOOLEAN NOT NULL DEFAULT true,
  custom_checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE ramadan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ramadan_settings_select_own" ON ramadan_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ramadan_settings_insert_own" ON ramadan_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ramadan_settings_update_own" ON ramadan_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Ramadan Daily Logs ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ramadan_daily_logs (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hijri_date                TEXT NOT NULL,
  ramadan_day               INTEGER NOT NULL CHECK (ramadan_day BETWEEN 1 AND 30),
  fajr_completed            BOOLEAN NOT NULL DEFAULT false,
  quran_completed           BOOLEAN NOT NULL DEFAULT false,
  morning_adhkar_completed  BOOLEAN NOT NULL DEFAULT false,
  dhikr_completed           BOOLEAN NOT NULL DEFAULT false,
  dhuhr_completed           BOOLEAN NOT NULL DEFAULT false,
  asr_completed             BOOLEAN NOT NULL DEFAULT false,
  iftar_completed           BOOLEAN NOT NULL DEFAULT false,
  maghrib_completed         BOOLEAN NOT NULL DEFAULT false,
  evening_adhkar_completed  BOOLEAN NOT NULL DEFAULT false,
  isha_completed            BOOLEAN NOT NULL DEFAULT false,
  taraweeh_completed        BOOLEAN NOT NULL DEFAULT false,
  reflection_completed      BOOLEAN NOT NULL DEFAULT false,
  custom_items              JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ramadan_day)
);

CREATE INDEX IF NOT EXISTS idx_ramadan_daily_logs_user ON ramadan_daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ramadan_daily_logs_day ON ramadan_daily_logs(ramadan_day);

ALTER TABLE ramadan_daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ramadan_daily_logs_select_own" ON ramadan_daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ramadan_daily_logs_insert_own" ON ramadan_daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ramadan_daily_logs_update_own" ON ramadan_daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

-- ─── Ramadan Goals ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ramadan_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  goal_type       TEXT NOT NULL DEFAULT 'custom'
                    CHECK (goal_type IN (
                      'quran_khatm', 'quran_daily', 'dhikr',
                      'adhkar', 'charity', 'reflection', 'custom'
                    )),
  target_value    INTEGER NOT NULL DEFAULT 1,
  current_value   INTEGER NOT NULL DEFAULT 0,
  unit            TEXT NOT NULL DEFAULT 'times',
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date     DATE,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ramadan_goals_user ON ramadan_goals(user_id);

ALTER TABLE ramadan_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ramadan_goals_select_own" ON ramadan_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ramadan_goals_insert_own" ON ramadan_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ramadan_goals_update_own" ON ramadan_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ramadan_goals_delete_own" ON ramadan_goals
  FOR DELETE USING (auth.uid() = user_id);
