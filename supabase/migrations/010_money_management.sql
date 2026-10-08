-- ────────────────────────────────────────────────────────────────────────────────
-- Money Management System
-- Migration 010
--
-- IMPORTANT: This is a PERSONAL money tracking tool, NOT a bank.
-- No bank credentials, card numbers, CVV, PIN, or OTP are stored.
-- All amounts are stored as BIGINT in minor currency units (e.g. paisa for BDT).
-- ────────────────────────────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. MONEY ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS money_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'cash'
                    CHECK (type IN ('cash', 'bank', 'mobile_wallet', 'savings', 'other')),
  currency          TEXT NOT NULL DEFAULT 'BDT',
  opening_balance   BIGINT NOT NULL DEFAULT 0,
  current_balance   BIGINT NOT NULL DEFAULT 0,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_money_accounts_user ON money_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_money_accounts_active ON money_accounts(user_id, is_active);

ALTER TABLE money_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "money_accounts_select_own" ON money_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "money_accounts_insert_own" ON money_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "money_accounts_update_own" ON money_accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "money_accounts_delete_own" ON money_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. MONEY CATEGORIES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS money_categories (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,  -- NULL = system category
  name              TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'expense'
                    CHECK (type IN ('income', 'expense', 'both')),
  icon              TEXT NOT NULL DEFAULT 'package',
  color             TEXT NOT NULL DEFAULT '#6b7280',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_money_categories_user ON money_categories(user_id);

ALTER TABLE money_categories ENABLE ROW LEVEL SECURITY;

-- System categories (user_id IS NULL) are visible to everyone
CREATE POLICY "money_categories_select" ON money_categories
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "money_categories_insert_own" ON money_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "money_categories_update_own" ON money_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "money_categories_delete_own" ON money_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Seed system categories
INSERT INTO money_categories (id, user_id, name, type, icon, color) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Food', 'expense', 'utensils', '#ef4444'),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Transport', 'expense', 'bus', '#f97316'),
  ('00000000-0000-0000-0000-000000000003', NULL, 'Education', 'expense', 'book-open', '#3b82f6'),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Bills', 'expense', 'receipt', '#8b5cf6'),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Shopping', 'expense', 'shopping-bag', '#ec4899'),
  ('00000000-0000-0000-0000-000000000006', NULL, 'Health', 'expense', 'heart-pulse', '#14b8a6'),
  ('00000000-0000-0000-0000-000000000007', NULL, 'Family', 'expense', 'users', '#6366f1'),
  ('00000000-0000-0000-0000-000000000008', NULL, 'Entertainment', 'expense', 'gamepad-2', '#f59e0b'),
  ('00000000-0000-0000-0000-000000000009', NULL, 'Charity', 'expense', 'hand-heart', '#10b981'),
  ('00000000-0000-0000-0000-00000000000a', NULL, 'Sadaqah', 'expense', 'heart', '#059669'),
  ('00000000-0000-0000-0000-00000000000b', NULL, 'Savings', 'expense', 'piggy-bank', '#0ea5e9'),
  ('00000000-0000-0000-0000-00000000000c', NULL, 'Other', 'both', 'package', '#6b7280'),
  ('00000000-0000-0000-0000-00000000000d', NULL, 'Salary', 'income', 'wallet', '#22c55e'),
  ('00000000-0000-0000-0000-00000000000e', NULL, 'Freelance', 'income', 'laptop', '#06b6d4'),
  ('00000000-0000-0000-0000-00000000000f', NULL, 'Gift', 'income', 'gift', '#a855f7'),
  ('00000000-0000-0000-0000-000000000010', NULL, 'Investment', 'income', 'trending-up', '#eab308')
ON CONFLICT (id) DO UPDATE SET icon = EXCLUDED.icon;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. MONEY TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS money_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id          UUID NOT NULL REFERENCES money_accounts(id) ON DELETE CASCADE,
  transaction_type    TEXT NOT NULL
                      CHECK (transaction_type IN ('income', 'expense', 'transfer_out', 'transfer_in')),
  amount              BIGINT NOT NULL CHECK (amount > 0),
  currency            TEXT NOT NULL DEFAULT 'BDT',
  category_id         UUID REFERENCES money_categories(id) ON DELETE SET NULL,
  date                DATE NOT NULL DEFAULT CURRENT_DATE,
  time                TIME,
  description         TEXT NOT NULL DEFAULT '',
  notes               TEXT,
  transfer_pair_id    UUID,  -- Links transfer_out ↔ transfer_in
  recurring_id        UUID,  -- Links to the recurring_transaction that generated this
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_money_txn_user ON money_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_money_txn_account ON money_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_money_txn_date ON money_transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_money_txn_type ON money_transactions(user_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_money_txn_category ON money_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_money_txn_transfer ON money_transactions(transfer_pair_id);
CREATE INDEX IF NOT EXISTS idx_money_txn_recurring ON money_transactions(recurring_id);

ALTER TABLE money_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "money_transactions_select_own" ON money_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "money_transactions_insert_own" ON money_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "money_transactions_update_own" ON money_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "money_transactions_delete_own" ON money_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. MONEY BUDGETS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS money_budgets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES money_categories(id) ON DELETE CASCADE,
  amount            BIGINT NOT NULL CHECK (amount > 0),
  currency          TEXT NOT NULL DEFAULT 'BDT',
  month             TEXT NOT NULL,  -- "YYYY-MM" format
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_money_budgets_user_month ON money_budgets(user_id, month);

ALTER TABLE money_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "money_budgets_select_own" ON money_budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "money_budgets_insert_own" ON money_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "money_budgets_update_own" ON money_budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "money_budgets_delete_own" ON money_budgets
  FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. SAVINGS GOALS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS money_savings_goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  target_amount     BIGINT NOT NULL CHECK (target_amount > 0),
  current_amount    BIGINT NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'BDT',
  target_date       DATE,
  is_archived       BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_money_savings_user ON money_savings_goals(user_id);

ALTER TABLE money_savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "money_savings_goals_select_own" ON money_savings_goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "money_savings_goals_insert_own" ON money_savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "money_savings_goals_update_own" ON money_savings_goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "money_savings_goals_delete_own" ON money_savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. RECURRING TRANSACTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS money_recurring_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id        UUID NOT NULL REFERENCES money_accounts(id) ON DELETE CASCADE,
  transaction_type  TEXT NOT NULL
                    CHECK (transaction_type IN ('income', 'expense')),
  amount            BIGINT NOT NULL CHECK (amount > 0),
  currency          TEXT NOT NULL DEFAULT 'BDT',
  category_id       UUID REFERENCES money_categories(id) ON DELETE SET NULL,
  description       TEXT NOT NULL DEFAULT '',
  notes             TEXT,
  frequency         TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date          DATE,
  next_due_date     DATE NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_money_recurring_user ON money_recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_money_recurring_due ON money_recurring_transactions(user_id, next_due_date);

ALTER TABLE money_recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "money_recurring_select_own" ON money_recurring_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "money_recurring_insert_own" ON money_recurring_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "money_recurring_update_own" ON money_recurring_transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "money_recurring_delete_own" ON money_recurring_transactions
  FOR DELETE USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- updated_at triggers (reuse pattern from existing migrations)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_money_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_money_accounts_updated_at
  BEFORE UPDATE ON money_accounts
  FOR EACH ROW EXECUTE FUNCTION update_money_updated_at();

CREATE TRIGGER trg_money_transactions_updated_at
  BEFORE UPDATE ON money_transactions
  FOR EACH ROW EXECUTE FUNCTION update_money_updated_at();

CREATE TRIGGER trg_money_budgets_updated_at
  BEFORE UPDATE ON money_budgets
  FOR EACH ROW EXECUTE FUNCTION update_money_updated_at();

CREATE TRIGGER trg_money_savings_goals_updated_at
  BEFORE UPDATE ON money_savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_money_updated_at();

CREATE TRIGGER trg_money_recurring_updated_at
  BEFORE UPDATE ON money_recurring_transactions
  FOR EACH ROW EXECUTE FUNCTION update_money_updated_at();
