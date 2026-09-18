-- 005_composite_indexes.sql
-- Menambahkan composite index esensial untuk query workspace dan tanggal

CREATE INDEX IF NOT EXISTS idx_transactions_ws_date ON transactions(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ws_cat ON transactions(workspace_id, category_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ws_wallet ON transactions(workspace_id, wallet_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_wallets_ws ON wallets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_budgets_ws ON budgets(workspace_id, period);
CREATE INDEX IF NOT EXISTS idx_debts_ws ON debts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_loan_trackers_ws ON loan_trackers(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_savings_goals_ws ON savings_goals(workspace_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON workspace_members(workspace_id, profile_id);
