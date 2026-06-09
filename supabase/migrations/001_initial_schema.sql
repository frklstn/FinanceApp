-- SUPABASE MIGRATIONS
-- File: 001_initial_schema.sql
-- Squashed version containing all primary tables, loan tracker (pinjol) settings, and app settings.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency TEXT DEFAULT 'USD',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. WORKSPACES Table
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 3. WORKSPACE MEMBERS Table
CREATE TABLE public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (workspace_id, profile_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- 4. WALLETS Table (Kantong)
CREATE TABLE public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('cash', 'bank', 'e-wallet', 'crypto', 'savings', 'other')) DEFAULT 'cash' NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    color TEXT DEFAULT '#4F46E5' NOT NULL,
    icon TEXT DEFAULT 'wallet' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 5. CATEGORIES Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'tag' NOT NULL,
    color TEXT DEFAULT '#9CA3AF' NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')) DEFAULT 'expense' NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 6. TRANSACTIONS Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
    destination_wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    note TEXT,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    attachment_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE NOT NULL,
    recurring_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_transfer_dest CHECK (type != 'transfer' OR destination_wallet_id IS NOT NULL)
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 7. BUDGETS Table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'monthly' NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 8. SAVINGS GOALS Table
CREATE TABLE public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

-- 9. DEBTS Table (Lending/Borrowing)
CREATE TABLE public.debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('owed_to_me', 'owed_by_me')) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) DEFAULT 0.00 NOT NULL,
    due_date DATE,
    status TEXT CHECK (status IN ('active', 'paid', 'overdue')) DEFAULT 'active' NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

-- 10. DEBT PAYMENTS Table
CREATE TABLE public.debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- 11. RECURRING TRANSACTIONS Table
CREATE TABLE public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
    interval_value INTEGER DEFAULT 1 NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    note TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- 12. FINANCIAL INSIGHTS Table
CREATE TABLE public.financial_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'danger')) DEFAULT 'info' NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.financial_insights ENABLE ROW LEVEL SECURITY;

-- 13. TAX REPORTS Table
CREATE TABLE public.tax_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    year INTEGER NOT NULL,
    income_summary NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    expense_summary NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    deductible_expenses NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (workspace_id, year)
);

ALTER TABLE public.tax_reports ENABLE ROW LEVEL SECURITY;

-- 14. LOAN TRACKERS Table (Pinjol Tracker / installment tracker)
CREATE TABLE public.loan_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    app_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pinjol',
    amount_received NUMERIC(15, 2) NOT NULL,
    total_repayment NUMERIC(15, 2) NOT NULL,
    monthly_payment NUMERIC(15, 2) NOT NULL,
    tenure_months INTEGER NOT NULL CHECK (tenure_months > 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    start_date DATE NOT NULL,
    salary_date INTEGER CHECK (salary_date BETWEEN 1 AND 31),
    status TEXT CHECK (status IN ('active', 'paid_off')) NOT NULL DEFAULT 'active',
    notes TEXT,
    payment_frequency TEXT DEFAULT 'monthly',
    end_date DATE,
    total_remaining_balance NUMERIC(15, 2),
    penalty_fee NUMERIC(15, 2),
    can_early_payoff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.loan_trackers ENABLE ROW LEVEL SECURITY;

-- 15. DEBT PLANNER SETTINGS Table (Salary day settings)
CREATE TABLE public.debt_planner_settings (
    workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
    salary_day INTEGER NOT NULL DEFAULT 1 CHECK (salary_day BETWEEN 1 AND 31),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.debt_planner_settings ENABLE ROW LEVEL SECURITY;

-- 16. INCOME TIMELINE Table (salary projection timelines)
CREATE TABLE public.income_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    effective_date DATE NOT NULL,
    monthly_income NUMERIC(15, 2) NOT NULL CHECK (monthly_income >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.income_timeline ENABLE ROW LEVEL SECURITY;

-- 17. APP SETTINGS Table (Global Branding Settings)
CREATE TABLE public.app_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    app_name TEXT NOT NULL DEFAULT 'FinanceApp',
    app_logo_url TEXT,
    document_title TEXT NOT NULL DEFAULT 'FinanceApp',
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

INSERT INTO public.app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- DATABASE FUNCTIONS & TRIGGERS
-- =========================================================================

-- Function to check if a user is workspace member
CREATE OR REPLACE FUNCTION public.is_workspace_member(workspace_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.workspace_members 
        WHERE workspace_members.workspace_id = is_workspace_member.workspace_id 
          AND workspace_members.profile_id = is_workspace_member.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to identify SuperAdmin (AppSettings write check)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM auth.users u
        WHERE u.id = auth.uid()
          AND (
            u.email ILIKE '%admin%'
            OR u.email = 'ifalfahlevi@gmail.com'
            OR COALESCE((u.raw_user_meta_data->>'is_admin')::boolean, false) = true
          )
    );
$$;

-- Trigger to create user profile & defaults automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_workspace_id UUID;
BEGIN
    -- 1. Create the user profile
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    );

    -- 2. Create a default "Personal" workspace
    INSERT INTO public.workspaces (name, owner_id)
    VALUES ('Personal Workspace', new.id)
    RETURNING id INTO new_workspace_id;

    -- 3. Add user as owner in workspace_members
    INSERT INTO public.workspace_members (workspace_id, profile_id, role)
    VALUES (new_workspace_id, new.id, 'owner');

    -- 4. Create default wallets for the workspace
    INSERT INTO public.wallets (workspace_id, name, type, balance, color, icon)
    VALUES 
        (new_workspace_id, 'Cash', 'cash', 0.00, '#10B981', 'banknote'),
        (new_workspace_id, 'Bank Account', 'bank', 0.00, '#3B82F6', 'landmark'),
        (new_workspace_id, 'E-Wallet', 'e-wallet', 0.00, '#8B5CF6', 'smartphone');

    -- 5. Create default salary day settings (salary_day = 1)
    INSERT INTO public.debt_planner_settings (workspace_id, salary_day)
    VALUES (new_workspace_id, 1);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger binding for auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger column modification tracker helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspaces_modtime BEFORE UPDATE ON public.workspaces FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_modtime BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_modtime BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_modtime BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budgets_modtime BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_goals_modtime BEFORE UPDATE ON public.savings_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_debts_modtime BEFORE UPDATE ON public.debts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_modtime BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loan_trackers_modtime BEFORE UPDATE ON public.loan_trackers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_debt_planner_settings_modtime BEFORE UPDATE ON public.debt_planner_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_app_settings_modtime BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Workspaces Policies
CREATE POLICY "Members can view workspaces" ON public.workspaces FOR SELECT USING (public.is_workspace_member(id, auth.uid()));
CREATE POLICY "Owners can update workspaces" ON public.workspaces FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = workspaces.id 
          AND workspace_members.profile_id = auth.uid() 
          AND workspace_members.role = 'owner'
    )
);
CREATE POLICY "Users can create workspaces" ON public.workspaces FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can delete workspaces" ON public.workspaces FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = workspaces.id 
          AND workspace_members.profile_id = auth.uid() 
          AND workspace_members.role = 'owner'
    )
);

-- Workspace Members Policies
CREATE POLICY "Members can view membership" ON public.workspace_members FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Owners can manage membership" ON public.workspace_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspaces 
        WHERE workspaces.id = workspace_members.workspace_id 
          AND workspaces.owner_id = auth.uid()
    )
);

-- Wallets Policies
CREATE POLICY "Members can view wallets" ON public.wallets FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Admins/Owners can manage wallets" ON public.wallets FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = wallets.workspace_id 
          AND workspace_members.profile_id = auth.uid() 
          AND workspace_members.role IN ('owner', 'admin')
    )
);

-- Categories Policies
CREATE POLICY "Anyone authenticated can view global or workspace categories" ON public.categories FOR SELECT USING (
    workspace_id IS NULL OR public.is_workspace_member(workspace_id, auth.uid())
);
CREATE POLICY "Members can manage workspace categories" ON public.categories FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Transactions Policies
CREATE POLICY "Members can view transactions" ON public.transactions FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage transactions" ON public.transactions FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Budgets Policies
CREATE POLICY "Members can view budgets" ON public.budgets FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage budgets" ON public.budgets FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Savings Goals Policies
CREATE POLICY "Members can view savings goals" ON public.savings_goals FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage savings goals" ON public.savings_goals FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Debts Policies
CREATE POLICY "Members can view debts" ON public.debts FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage debts" ON public.debts FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Debt Payments Policies
CREATE POLICY "Members can view debt payments" ON public.debt_payments FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.debts 
        WHERE debts.id = debt_payments.debt_id 
          AND public.is_workspace_member(debts.workspace_id, auth.uid())
    )
);
CREATE POLICY "Members can manage debt payments" ON public.debt_payments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.debts 
        WHERE debts.id = debt_payments.debt_id 
          AND public.is_workspace_member(debts.workspace_id, auth.uid())
    )
);

-- Recurring Transactions Policies
CREATE POLICY "Members can view recurring" ON public.recurring_transactions FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage recurring" ON public.recurring_transactions FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Financial Insights Policies
CREATE POLICY "Members can view insights" ON public.financial_insights FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Tax Reports Policies
CREATE POLICY "Members can view tax reports" ON public.tax_reports FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage tax reports" ON public.tax_reports FOR ALL USING (
    public.is_workspace_member(workspace_id, auth.uid())
);

-- Loan Trackers Policies (Pinjol Tracker)
CREATE POLICY "Members can view loan_trackers" ON public.loan_trackers FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage loan_trackers" ON public.loan_trackers FOR ALL USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Debt Planner Settings Policies
CREATE POLICY "Members can view debt_planner_settings" ON public.debt_planner_settings FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage debt_planner_settings" ON public.debt_planner_settings FOR ALL USING (public.is_workspace_member(workspace_id, auth.uid()));

-- Income Timeline Policies
CREATE POLICY "Members can view income_timeline" ON public.income_timeline FOR SELECT USING (public.is_workspace_member(workspace_id, auth.uid()));
CREATE POLICY "Members can manage income_timeline" ON public.income_timeline FOR ALL USING (public.is_workspace_member(workspace_id, auth.uid()));

-- App Settings Policies (Branding)
CREATE POLICY "Authenticated users can read app_settings" ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmin can update app_settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- =========================================================================
-- SEED DEFAULT SYSTEM CATEGORIES
-- =========================================================================
INSERT INTO public.categories (name, icon, color, type, workspace_id)
VALUES
    -- Expense Categories
    ('Food & Beverage', 'utensils', '#EF4444', 'expense', NULL),
    ('Transportation', 'car', '#3B82F6', 'expense', NULL),
    ('Shopping', 'shopping-bag', '#EC4899', 'expense', NULL),
    ('Housing & Rent', 'home', '#10B981', 'expense', NULL),
    ('Utilities & Bills', 'credit-card', '#F59E0B', 'expense', NULL),
    ('Entertainment', 'film', '#8B5CF6', 'expense', NULL),
    ('Health & Medical', 'heart-pulse', '#EF4444', 'expense', NULL),
    ('Education', 'graduation-cap', '#3B82F6', 'expense', NULL),
    ('Travel', 'plane', '#06B6D4', 'expense', NULL),
    ('Gifts & Donations', 'gift', '#F43F5E', 'expense', NULL),
    ('Investments', 'trending-up', '#10B981', 'expense', NULL),
    ('Insurance', 'shield', '#6B7280', 'expense', NULL),
    ('Miscellaneous', 'help-circle', '#9CA3AF', 'expense', NULL),
    
    -- Income Categories
    ('Salary', 'briefcase', '#10B981', 'income', NULL),
    ('Business', 'store', '#3B82F6', 'income', NULL),
    ('Freelance & Side Hustle', 'laptop', '#8B5CF6', 'income', NULL),
    ('Investments / Dividends', 'trending-up', '#06B6D4', 'income', NULL),
    ('Grants & Scholarships', 'award', '#F59E0B', 'income', NULL),
    ('Gifts', 'gift', '#EC4899', 'income', NULL),
    ('Refunds / Others', 'coins', '#10B981', 'income', NULL);

-- =========================================================================
-- PERFORMANCE INDEXES
-- =========================================================================
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX idx_workspace_members_workspace ON public.workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_profile ON public.workspace_members(profile_id);
CREATE INDEX idx_wallets_workspace ON public.wallets(workspace_id);
CREATE INDEX idx_categories_workspace ON public.categories(workspace_id);
CREATE INDEX idx_categories_parent ON public.categories(parent_id);
CREATE INDEX idx_transactions_workspace ON public.transactions(workspace_id);
CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_budgets_workspace ON public.budgets(workspace_id);
CREATE INDEX idx_budgets_category ON public.budgets(category_id);
CREATE INDEX idx_savings_goals_workspace ON public.savings_goals(workspace_id);
CREATE INDEX idx_debts_workspace ON public.debts(workspace_id);
CREATE INDEX idx_debts_status ON public.debts(status);
CREATE INDEX idx_debt_payments_debt ON public.debt_payments(debt_id);
CREATE INDEX idx_recurring_transactions_workspace ON public.recurring_transactions(workspace_id);
CREATE INDEX idx_recurring_transactions_next ON public.recurring_transactions(next_occurrence);
CREATE INDEX idx_financial_insights_workspace ON public.financial_insights(workspace_id);
CREATE INDEX idx_tax_reports_workspace ON public.tax_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_loan_trackers_workspace ON public.loan_trackers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_loan_trackers_status ON public.loan_trackers(status);
CREATE INDEX IF NOT EXISTS idx_loan_trackers_due_day ON public.loan_trackers(due_day);
CREATE INDEX IF NOT EXISTS idx_income_timeline_workspace ON public.income_timeline(workspace_id);
CREATE INDEX IF NOT EXISTS idx_income_timeline_effective ON public.income_timeline(workspace_id, effective_date);
