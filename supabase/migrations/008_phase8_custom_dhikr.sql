-- ────────────────────────────────────────────────────────────────────────────────
-- Phase 8: Custom Personal Dhikr with RLS
-- Migration 008
-- ────────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_dhikr (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  arabic_text     TEXT,
  transliteration TEXT,
  translation     TEXT,
  target_count    INTEGER NOT NULL DEFAULT 33 CHECK (target_count > 0),
  category        TEXT NOT NULL DEFAULT 'personal',
  notes           TEXT,
  source          TEXT NOT NULL DEFAULT 'Personal',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_dhikr_user ON custom_dhikr(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_dhikr_category ON custom_dhikr(user_id, category);

ALTER TABLE custom_dhikr ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_dhikr_select_own" ON custom_dhikr
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "custom_dhikr_insert_own" ON custom_dhikr
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_dhikr_update_own" ON custom_dhikr
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "custom_dhikr_delete_own" ON custom_dhikr
  FOR DELETE USING (auth.uid() = user_id);
