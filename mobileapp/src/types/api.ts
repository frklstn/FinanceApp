export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  language: string;
  timezone: string;
  workspace_id: string;
  plan: string;
  whatsapp_contact?: string | null;
}

export interface AuthResponseData {
  token: string;
  user: UserProfile;
  workspace_id: string;
}

export interface Wallet {
  id: string;
  workspace_id: string;
  name: string;
  wallet_type: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  color?: string;
  icon?: string;
}

export interface Transaction {
  id: string;
  workspace_id: string;
  wallet_id: string;
  wallet_name?: string;
  category_id?: string;
  category_name?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  transaction_date: string;
  destination_wallet_id?: string;
}

export interface DashboardSummary {
  net_worth: number;
  total_income_this_month: number;
  total_expense_this_month: number;
  currency: string;
  active_wallets_count: number;
  recent_transactions: Transaction[];
}

export interface Debt {
  id: string;
  workspace_id: string;
  title: string;
  debt_type: 'debt' | 'loan' | 'pinjol';
  total_amount: number;
  remaining_amount: number;
  due_date: string;
  interest_rate?: number;
  monthly_payment?: number;
  status: 'active' | 'paid' | 'overdue';
}

export interface PinjolLoan {
  id: string;
  provider_name: string;
  principal_amount: number;
  total_repayment: number;
  monthly_installment: number;
  due_date: number; // day of month
  tenor_months: number;
  remaining_installments: number;
  status: string;
}
