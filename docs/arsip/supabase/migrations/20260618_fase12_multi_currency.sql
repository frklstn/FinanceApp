-- Migration: Multi-Currency Support for Income, Loans, and Budgets
-- Description: Adds currency support to income_timeline, loan_trackers, and budgets tables.

-- 1. Update income_timeline table
ALTER TABLE income_timeline ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;

-- 2. Update loan_trackers table
ALTER TABLE loan_trackers ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;

-- 3. Update budgets table
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;
