import { createClient } from '@/lib/supabase/client';
import type { LoanCategory, LoanStatus, LoanTracker } from '@/lib/debt-planner/types';
import { calcEndDate } from '@/lib/debt-planner/calculations';

export type { LoanCategory, LoanStatus, LoanTracker };

export interface CreateLoanTrackerInput {
  app_name: string;
  category: LoanCategory;
  amount_received: number;
  total_repayment: number;
  monthly_payment: number;
  tenure_months: number;
  due_day: number;
  start_date: string;
  salary_date?: number | null;
  payment_frequency?: string | null;
  end_date?: string | null;
  total_remaining_balance?: number | null;
  penalty_fee?: number | null;
  can_early_payoff?: boolean | null;
  notes?: string | null;
  currency: string;
}

export {
  calcElapsedMonths,
  calcRemainingMonths,
  calcEndDate,
  formatEndMonth,
  calcProgressPercent,
  computeLoanMetrics,
  LOAN_CATEGORY_LABELS,
} from '@/lib/debt-planner/calculations';

export { generateWarnings, generateSurvivalInsight } from '@/lib/debt-planner/warnings';
export type { Warning } from '@/lib/debt-planner/warnings';

export const loanTrackerService = {
  async getLoanTrackers(workspaceId: string): Promise<LoanTracker[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loan_trackers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data as any[]) || []).map(l => ({ ...l, currency: l.currency ?? 'IDR' })) as LoanTracker[];
  },

  async createLoanTracker(
    workspaceId: string,
    input: CreateLoanTrackerInput
  ): Promise<LoanTracker> {
    const supabase = createClient();
    const endDate = calcEndDate(input.start_date, input.tenure_months);
    const { data, error } = await supabase
      .from('loan_trackers')
      .insert({
        workspace_id: workspaceId,
        ...input,
        end_date: input.end_date ?? endDate.toISOString().slice(0, 10),
        payment_frequency: input.payment_frequency ?? 'monthly',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { ...data, currency: data.currency ?? 'IDR' } as any as LoanTracker;
  },

  async updateLoanStatus(id: string, status: LoanStatus): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('loan_trackers').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteLoanTracker(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('loan_trackers').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
