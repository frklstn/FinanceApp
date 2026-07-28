CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  confirmation_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (id references users.id)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'IDR',
    language TEXT DEFAULT 'id',
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

-- Workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Workspace Members
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'cash',
    balance NUMERIC NOT NULL DEFAULT 0.00,
    color TEXT NOT NULL DEFAULT '#4F46E5',
    icon TEXT NOT NULL DEFAULT 'wallet',
    is_active BOOLEAN NOT NULL DEFAULT true,
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Categories
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

-- Transactions
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
    currency TEXT NOT NULL DEFAULT 'IDR',
    exchange_rate NUMERIC DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Budgets
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT budgets_period_check CHECK (period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    CONSTRAINT budgets_workspace_category_period_key UNIQUE (workspace_id, category_id, period)
);

-- Savings
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

-- Debts
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
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Debt Payments
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Recurring
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

-- Insights
CREATE TABLE IF NOT EXISTS public.financial_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tax
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

-- Loans
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
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Debt Planner
CREATE TABLE IF NOT EXISTS public.debt_planner_settings (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    salary_day INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Income
CREATE TABLE IF NOT EXISTS public.income_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    effective_date DATE NOT NULL,
    monthly_income NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'IDR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    app_name TEXT NOT NULL DEFAULT 'FinanceApp',
    app_logo_url TEXT,
    document_title TEXT NOT NULL DEFAULT 'FinanceApp',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency TEXT NOT NULL,
    to_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_currency, to_currency)
);

-- Functions
CREATE OR REPLACE FUNCTION public.is_superadmin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = check_user_id);
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.reset_my_data(p_user_id UUID) RETURNS void AS $$
  DECLARE v_workspace_id UUID;
  BEGIN
    SELECT workspace_id INTO v_workspace_id FROM public.profiles WHERE id = p_user_id;
    IF v_workspace_id IS NOT NULL THEN
        DELETE FROM public.transactions WHERE workspace_id = v_workspace_id;
        DELETE FROM public.wallets WHERE workspace_id = v_workspace_id;
        DELETE FROM public.budgets WHERE workspace_id = v_workspace_id;
        DELETE FROM public.savings_goals WHERE workspace_id = v_workspace_id;
        DELETE FROM public.debts WHERE workspace_id = v_workspace_id;
        DELETE FROM public.recurring_transactions WHERE workspace_id = v_workspace_id;
        DELETE FROM public.loan_trackers WHERE workspace_id = v_workspace_id;
    END IF;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_my_account(p_user_id UUID) RETURNS void AS $$
  BEGIN
    PERFORM public.reset_my_data(p_user_id);
    DELETE FROM public.profiles WHERE id = p_user_id;
    DELETE FROM public.users WHERE id = p_user_id;
  END;
$$ LANGUAGE plpgsql;
