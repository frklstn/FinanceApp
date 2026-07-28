-- Migration: Multi-Currency Support
-- Description: Adds currency support to wallets and transactions, and creates exchange_rates table.

-- 1. Update wallets table
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;

-- 2. Update transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR' NOT NULL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0 NOT NULL;

-- 3. Create exchange_rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
);

-- 4. Enable RLS on exchange_rates
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- 5. Create policy for everyone to read exchange_rates
CREATE POLICY "Allow public read access to exchange_rates"
ON exchange_rates FOR SELECT
TO authenticated
USING (true);
