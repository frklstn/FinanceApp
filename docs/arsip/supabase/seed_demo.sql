-- FinanceNode OS: Database Initialization for Demo Entity
-- Use this script in Supabase SQL Editor to bypass RLS and initialize Demo data

DO $$ 
DECLARE
    v_user_id UUID := 'f863cf77-cf39-4e11-bf1d-1429826a3d11';
    v_workspace_id UUID;
    v_wallet_id UUID;
    v_category_id UUID;
BEGIN
    -- 1. Create Profile if missing (ignoring RLS)
    INSERT INTO public.profiles (id, email, full_name, plan)
    VALUES (v_user_id, 'demo@frklstn.com', 'Demo Entity', 'pro')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Demo Entity', plan = 'pro';

    -- 2. Initialize Workspace
    INSERT INTO public.workspaces (owner_id, name)
    VALUES (v_user_id, 'Demo OS Workspace')
    RETURNING id INTO v_workspace_id;

    -- 3. Link Workspace Membership
    INSERT INTO public.workspace_members (workspace_id, profile_id, role)
    VALUES (v_workspace_id, v_user_id, 'owner');

    -- 4. Create Demo Wallet
    INSERT INTO public.wallets (workspace_id, name, balance, color)
    VALUES (v_workspace_id, 'Nexus Reserve', 12500000, '#10B981')
    RETURNING id INTO v_wallet_id;

    -- 5. Create Pinjol Category
    INSERT INTO public.categories (workspace_id, name, type, color, icon)
    VALUES (v_workspace_id, 'Pinjol Payment', 'expense', '#ef4444', 'Loan')
    RETURNING id INTO v_category_id;

    -- 6. Generate 60 Days of Transactions
    FOR i IN 0..60 LOOP
        -- Salary every 30 days
        IF (i % 30 = 0) THEN
            INSERT INTO public.transactions (workspace_id, wallet_id, amount, type, note, date)
            VALUES (v_workspace_id, v_wallet_id, 7500000, 'income', 'Gaji Bulanan [DEMO]', (now() - (i || ' days')::interval));
        END IF;

        -- Debt payment every 10 days
        IF (i % 10 = 0) THEN
            INSERT INTO public.transactions (workspace_id, wallet_id, category_id, amount, type, note, date)
            VALUES (v_workspace_id, v_wallet_id, v_category_id, 450000, 'expense', 'Cicilan Pinjol #A', (now() - (i || ' days')::interval));
        END IF;
        
        -- Random small expenses
        IF (random() < 0.4) THEN
            INSERT INTO public.transactions (workspace_id, wallet_id, amount, type, note, date)
            VALUES (v_workspace_id, v_wallet_id, floor(random() * 50000 + 20000), 'expense', 'Opreasional Terminal', (now() - (i || ' days')::interval));
        END IF;
    END loop;

    RAISE NOTICE 'Demo OS Initialized with Workspace ID: %', v_workspace_id;
END $$;
