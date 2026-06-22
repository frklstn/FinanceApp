-- FinanceApp Unified Database Schema (Public)
-- Generated on 2026-06-17, consolidated on 2026-06-20

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    is_suspended BOOLEAN DEFAULT false,
    app_name TEXT DEFAULT 'FinanceApp',
    app_logo_url TEXT,
    app_document_title TEXT DEFAULT 'FinanceApp - Premium Personal Finance Platform',
    workspace_id UUID,
    plan VARCHAR NOT NULL DEFAULT 'free',
    app_icon_url TEXT,
    app_title VARCHAR,
    whatsapp_contact TEXT,
    tax_rate NUMERIC DEFAULT 15.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Workspace Members Table
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 4. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash',
    balance NUMERIC NOT NULL DEFAULT 0.00,
    color TEXT NOT NULL DEFAULT '#4F46E5',
    icon TEXT NOT NULL DEFAULT 'wallet',
    is_active BOOLEAN NOT NULL DEFAULT true,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 5. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'tag',
    color TEXT NOT NULL DEFAULT '#9CA3AF',
    type TEXT NOT NULL DEFAULT 'expense',
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    destination_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    note TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    attachment_url TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurring_id UUID,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 7. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 8. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL,
    current_amount NUMERIC NOT NULL DEFAULT 0.00,
    deadline DATE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 9. Debts Table
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    interest_rate NUMERIC NOT NULL DEFAULT 0.00,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    description TEXT,
    remaining_amount NUMERIC NOT NULL DEFAULT 0.00,
    contact_info TEXT,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 10. Debt Payments Table
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 11. Recurring Transactions Table
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL,
    frequency TEXT NOT NULL,
    interval_value INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 12. Financial Insights Table
CREATE TABLE IF NOT EXISTS public.financial_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 13. Tax Reports Table
CREATE TABLE IF NOT EXISTS public.tax_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    income_summary NUMERIC NOT NULL DEFAULT 0.00,
    expense_summary NUMERIC NOT NULL DEFAULT 0.00,
    deductible_expenses NUMERIC NOT NULL DEFAULT 0.00,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 14. Loan Trackers Table
CREATE TABLE IF NOT EXISTS public.loan_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    app_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pinjol',
    amount_received NUMERIC NOT NULL,
    total_repayment NUMERIC NOT NULL,
    monthly_payment NUMERIC NOT NULL,
    tenure_months INTEGER NOT NULL,
    due_day INTEGER NOT NULL,
    start_date DATE NOT NULL,
    salary_date INTEGER,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    payment_frequency TEXT DEFAULT 'monthly',
    end_date DATE,
    total_remaining_balance NUMERIC,
    penalty_fee NUMERIC,
    can_early_payoff BOOLEAN DEFAULT false,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 15. Debt Planner Settings Table
CREATE TABLE IF NOT EXISTS public.debt_planner_settings (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    salary_day INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 16. Income Timeline Table
CREATE TABLE IF NOT EXISTS public.income_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    monthly_income NUMERIC NOT NULL,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 17. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    app_name TEXT NOT NULL DEFAULT 'FinanceApp',
    app_logo_url TEXT,
    document_title TEXT NOT NULL DEFAULT 'FinanceApp',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 18. Exchange Rates Table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(from_currency, to_currency)
);

-- Enable RLS on exchange_rates
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to exchange_rates
CREATE POLICY "Allow public read access to exchange_rates"
ON public.exchange_rates FOR SELECT
TO authenticated
USING (true);


-- 19. PL/pgSQL Atomic Transaction Functions

CREATE OR REPLACE FUNCTION public.create_transaction(
  p_workspace_id UUID,
  p_wallet_id UUID,
  p_category_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_destination_wallet_id UUID,
  p_note TEXT,
  p_date TIMESTAMPTZ,
  p_tags TEXT[],
  p_currency TEXT,
  p_exchange_rate NUMERIC,
  p_is_recurring BOOLEAN
) RETURNS public.transactions AS $$
DECLARE
  v_transaction public.transactions;
END;
$$ LANGUAGE plpgsql;

-- Body implementation for create_transaction
CREATE OR REPLACE FUNCTION public.create_transaction(
  p_workspace_id UUID,
  p_wallet_id UUID,
  p_category_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_destination_wallet_id UUID,
  p_note TEXT,
  p_date TIMESTAMPTZ,
  p_tags TEXT[],
  p_currency TEXT,
  p_exchange_rate NUMERIC,
  p_is_recurring BOOLEAN
) RETURNS public.transactions AS $$
DECLARE
  v_transaction public.transactions;
BEGIN
  -- Update source wallet
  IF p_type = 'income' THEN
    UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_wallet_id;
  ELIF p_type = 'expense' THEN
    UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_wallet_id;
  ELIF p_type = 'transfer' THEN
    UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_wallet_id;
    UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_destination_wallet_id;
  END IF;

  -- Insert transaction
  INSERT INTO public.transactions (
    workspace_id, wallet_id, category_id, amount, type, 
    destination_wallet_id, note, date, tags, currency, 
    exchange_rate, is_recurring
  ) VALUES (
    p_workspace_id, p_wallet_id, p_category_id, p_amount, p_type,
    p_destination_wallet_id, p_note, p_date, p_tags, p_currency,
    p_exchange_rate, p_is_recurring
  ) RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_transaction(p_id UUID) RETURNS VOID AS $$
DECLARE
  v_tx public.transactions;
BEGIN
  -- Fetch the transaction first to get details
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- Rollback wallet balance
  IF v_tx.type = 'income' THEN
    UPDATE public.wallets SET balance = balance - v_tx.amount WHERE id = v_tx.wallet_id;
  ELIF v_tx.type = 'expense' THEN
    UPDATE public.wallets SET balance = balance + v_tx.amount WHERE id = v_tx.wallet_id;
  ELIF v_tx.type = 'transfer' THEN
    UPDATE public.wallets SET balance = balance + v_tx.amount WHERE id = v_tx.wallet_id;
    IF v_tx.destination_wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - v_tx.amount WHERE id = v_tx.destination_wallet_id;
    END IF;
  END IF;

  -- Delete the transaction
  DELETE FROM public.transactions WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_transaction(
  p_id UUID,
  p_wallet_id UUID,
  p_category_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_destination_wallet_id UUID,
  p_note TEXT,
  p_date TIMESTAMPTZ,
  p_tags TEXT[],
  p_attachment_url TEXT,
  p_is_recurring BOOLEAN
) RETURNS public.transactions AS $$
DECLARE
  v_old_tx public.transactions;
  v_new_tx public.transactions;
BEGIN
  -- Fetch the old transaction first
  SELECT * INTO v_old_tx FROM public.transactions WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- 1. Rollback old wallet balance
  IF v_old_tx.type = 'income' THEN
    UPDATE public.wallets SET balance = balance - v_old_tx.amount WHERE id = v_old_tx.wallet_id;
  ELIF v_old_tx.type = 'expense' THEN
    UPDATE public.wallets SET balance = balance + v_old_tx.amount WHERE id = v_old_tx.wallet_id;
  ELIF v_old_tx.type = 'transfer' THEN
    UPDATE public.wallets SET balance = balance + v_old_tx.amount WHERE id = v_old_tx.wallet_id;
    IF v_old_tx.destination_wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance - v_old_tx.amount WHERE id = v_old_tx.destination_wallet_id;
    END IF;
  END IF;

  -- 2. Apply new wallet balance
  IF p_type = 'income' THEN
    UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_wallet_id;
  ELIF p_type = 'expense' THEN
    UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_wallet_id;
  ELIF p_type = 'transfer' THEN
    UPDATE public.wallets SET balance = balance - p_amount WHERE id = p_wallet_id;
    IF p_destination_wallet_id IS NOT NULL THEN
      UPDATE public.wallets SET balance = balance + p_amount WHERE id = p_destination_wallet_id;
    END IF;
  END IF;

  -- 3. Update the transaction
  UPDATE public.transactions SET
    wallet_id = p_wallet_id,
    category_id = p_category_id,
    amount = p_amount,
    type = p_type,
    destination_wallet_id = p_destination_wallet_id,
    note = p_note,
    date = p_date,
    tags = p_tags,
    attachment_url = p_attachment_url,
    is_recurring = p_is_recurring,
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_new_tx;

  RETURN v_new_tx;
END;
$$ LANGUAGE plpgsql;
