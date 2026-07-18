export type LoanCategory =
  | 'pinjol'
  | 'paylater'
  | 'kartu_kredit'
  | 'koperasi'
  | 'teman_keluarga'
  | 'cicilan_barang'
  | 'custom'
  | 'hutang_pribadi'
  | 'cicilan'
  | 'lainnya';

export type LoanStatus = 'active' | 'paid_off';

export type PaymentFrequency = 'monthly' | 'weekly' | 'biweekly';

export type HealthStatus = 'SAFE' | 'CAUTION' | 'HEAVY' | 'DANGER';

export interface LoanTracker {
  id: string;
  workspace_id: string;
  app_name: string;
  category: LoanCategory;
  /** Jumlah yang diajukan (pokok); diterima = diajukan - biaya admin. */
  amount_applied?: number | null;
  amount_received: number;
  total_repayment: number;
  monthly_payment: number;
  tenure_months: number;
  due_day: number;
  start_date: string;
  salary_date: number | null;
  payment_frequency?: PaymentFrequency | string | null;
  end_date?: string | null;
  total_remaining_balance?: number | null;
  penalty_fee?: number | null;
  can_early_payoff?: boolean | null;
  status: LoanStatus;
  notes: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeTimelineEntry {
  id: string;
  workspace_id: string;
  effective_date: string;
  monthly_income: number;
  currency: string;
  created_at: string;
}

export interface DebtPlannerSettings {
  workspace_id: string;
  salary_day: number;
  created_at: string;
  updated_at: string;
}

export interface SalaryPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface PeriodForecast {
  period: SalaryPeriod;
  income: number;
  total_debt: number;
  remaining_cash: number;
  debt_ratio: number;
  health_status: HealthStatus;
  warnings: ForecastWarning[];
}

export interface ForecastWarning {
  level: 'danger' | 'warning' | 'info';
  message: string;
}

export interface SurvivalScore {
  score: number;
  label: string;
}

export interface ForecastAnalytics {
  totalDebtAmount: number;
  totalRepaymentObligation: number;
  estimatedDebtFreeDate: Date | null;
  highestDebtMonth: string | null;
  safestMonth: string | null;
  averageDebtRatio: number;
}

export interface LoanComputed {
  loan: LoanTracker;
  remainingMonths: number;
  progressPercent: number;
  endMonthLabel: string;
  remainingObligation: number;
}
