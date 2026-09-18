export interface Profile {
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
  user: Profile;
  workspace_id: string;
}

export interface Wallet {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  balance: number | string;
  color?: string;
  icon?: string;
  is_active: boolean;
  currency: string;
}

export interface Transaction {
  id: string;
  workspace_id: string;
  wallet_id: string;
  category_id?: string | null;
  amount: number | string;
  type: 'income' | 'expense' | 'transfer';
  destination_wallet_id?: string | null;
  note?: string | null;
  date: string;
  currency: string;
}

export interface DashboardSummary {
  total_balance: number | string;
  total_income: number | string;
  total_expense: number | string;
  net_savings: number | string;
  savings_rate_percentage: number | string;
  transaction_count: number;
}

export interface Debt {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  amount: number | string;
  interest_rate: number | string;
  due_date?: string | null;
  status: string;
  description?: string | null;
  remaining_amount: number | string;
  currency: string;
}

export interface LoanTracker {
  id: string;
  workspace_id: string;
  category: string;
  amount_applied?: number | string | null;
  amount_received: number | string;
  total_repayment: number | string;
  monthly_payment: number | string;
  tenure_months: number;
  due_day: number;
  start_date: string;
  salary_date?: number | null;
  status: string;
  notes?: string | null;
  total_remaining_balance?: number | string | null;
  currency: string;
}
