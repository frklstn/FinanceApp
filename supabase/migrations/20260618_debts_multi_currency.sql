-- Migration: Multi-Currency Support for Debts
-- Description: Adds currency support to debts table.

ALTER TABLE debts ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;
