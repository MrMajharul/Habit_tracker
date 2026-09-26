-- ============================================================================
-- Phase 4: Qur'an Reading Tracking + Spiritual Goals
-- Migration: 004_phase4_quran_goals.sql
-- ============================================================================

-- ─── Qur'an Reading Sessions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quran_reading_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number  INT NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  start_ayah    INT NOT NULL CHECK (start_ayah >= 1),
  end_ayah      INT NOT NULL CHECK (end_ayah >= 1),
  minutes_read  INT NOT NULL DEFAULT 0 CHECK (minutes_read >= 0),
  reading_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_quran_sessions_user_date
  ON quran_reading_sessions (user_id, reading_date DESC);
CREATE INDEX idx_quran_sessions_user_surah
  ON quran_reading_sessions (user_id, surah_number);

-- RLS
ALTER TABLE quran_reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reading sessions"
  ON quran_reading_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading sessions"
  ON quran_reading_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading sessions"
  ON quran_reading_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading sessions"
  ON quran_reading_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Qur'an Bookmarks ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quran_bookmarks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number  INT NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  ayah_number   INT NOT NULL CHECK (ayah_number >= 1),
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate bookmarks for the same ayah
CREATE UNIQUE INDEX idx_quran_bookmarks_unique
  ON quran_bookmarks (user_id, surah_number, ayah_number);
CREATE INDEX idx_quran_bookmarks_user
  ON quran_bookmarks (user_id, created_at DESC);

-- RLS
ALTER TABLE quran_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON quran_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON quran_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
  ON quran_bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON quran_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Qur'an Goal Settings ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quran_goal_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type   TEXT NOT NULL CHECK (target_type IN ('minutes', 'ayahs')),
  target_value  INT NOT NULL CHECK (target_value >= 1),
  is_enabled    BOOLEAN NOT NULL DEFAULT true,
  prayer_anchor TEXT DEFAULT 'none',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS
ALTER TABLE quran_goal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goal settings"
  ON quran_goal_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goal settings"
  ON quran_goal_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goal settings"
  ON quran_goal_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goal settings"
  ON quran_goal_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Spiritual Goals ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS spiritual_goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('quran', 'prayer', 'dhikr', 'fasting', 'charity', 'custom')),
  title         TEXT NOT NULL,
  description   TEXT,
  target_value  NUMERIC NOT NULL CHECK (target_value > 0),
  current_value NUMERIC NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  unit          TEXT NOT NULL DEFAULT 'count',
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date   DATE,
  is_completed  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spiritual_goals_user
  ON spiritual_goals (user_id, is_completed, created_at DESC);
CREATE INDEX idx_spiritual_goals_type
  ON spiritual_goals (user_id, type);

-- RLS
ALTER TABLE spiritual_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spiritual goals"
  ON spiritual_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spiritual goals"
  ON spiritual_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spiritual goals"
  ON spiritual_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spiritual goals"
  ON spiritual_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- End of Phase 4 migration
-- ============================================================================
