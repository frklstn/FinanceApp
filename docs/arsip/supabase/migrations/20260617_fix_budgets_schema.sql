-- Fix budgets table constraint and prepare for bulk budget settings
-- Remove old period check if it's too restrictive
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_period_check;

-- Add a more flexible period check (YYYY-MM format)
ALTER TABLE budgets ADD CONSTRAINT budgets_period_check CHECK (period ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- Ensure unique constraint on workspace_id, category_id, and period to prevent duplicates
-- Use ON CONFLICT in code will depend on this
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_workspace_category_period_key;
ALTER TABLE budgets ADD CONSTRAINT budgets_workspace_category_period_key UNIQUE (workspace_id, category_id, period);
