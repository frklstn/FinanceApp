import { createClient } from '@/lib/supabase/client';
import type { LoanTracker } from '@/lib/debt-planner/types';

export interface Debt {
  id: string;
  workspace_id: string;
  name: string;
  type: 'owe' | 'lend'; // owe (debt we pay), lend (money we collect)
  amount: number;
  remaining_amount: number;
  contact_info: string | null;
  due_date: string | null;
  status: 'active' | 'settled';
  currency: string;
  created_at: string;
  updated_at: string;
}

export const debtService = {
  /**
   * Fetches debts for the workspace.
   */
  async getDebts(workspaceId: string): Promise<Debt[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching debts:', error);
      throw new Error(error.message);
    }
    return (data as unknown as Debt[]) || [];
  },

  /**
   * Creates a new debt or lending record.
   */
  async createDebt(
    workspaceId: string,
    name: string,
    type: 'owe' | 'lend',
    amount: number,
    contactInfo: string | null = null,
    dueDate: string | null = null,
    currency: string = 'IDR'
  ): Promise<Debt> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debts')
      .insert({
        workspace_id: workspaceId,
        name,
        type,
        amount,
        remaining_amount: amount,
        contact_info: contactInfo,
        due_date: dueDate,
        currency,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating debt:', error);
      throw new Error(error.message);
    }
    return data as unknown as Debt;
  },

  /**
   * Records a payment installment towards a debt/lending ledger.
   * If type is 'owe': deducts cash from our wallet (we are paying someone back).
   * If type is 'lend': adds cash to our wallet (someone is paying us back).
   */
  async recordPayment(
    workspaceId: string,
    debtId: string,
    amount: number,
    walletId: string,
    note?: string
  ): Promise<void> {
    const supabase = createClient();

    // Fetch debt details first to get name for fallback note
    const { data: debt, error: dErr } = await supabase
      .from('debts')
      .select('name')
      .eq('id', debtId)
      .single();
    if (dErr) throw new Error('Debt record not found');

    const { error } = await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }).rpc('record_debt_payment', {
      p_workspace_id: workspaceId,
      p_debt_id: debtId,
      p_wallet_id: walletId,
      p_amount: amount,
      p_note: note || `Repayment contribution: ${debt.name}`,
    });

    if (error) {
      console.error('Error recording debt payment via RPC:', error);
      throw new Error(error.message);
    }
  },

  /**
   * Deletes a debt record.
   */
  async deleteDebt(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) {
      console.error('Error deleting debt record:', error);
      throw new Error(error.message);
    }
  },

  async getLoanTrackers(workspaceId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loan_trackers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return ((data as unknown as LoanTracker[]) || []).map(l => ({ ...l, currency: l.currency ?? 'IDR' }));
  },

  async createLoanTracker(workspaceId: string, input: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();
    const { calcEndDate } = await import('@/lib/debt-planner/calculations');
    const endDate = calcEndDate(input.start_date, input.tenure_months);
    
    const { data, error } = await supabase
      .from('loan_trackers')
      .insert({ ...input, workspace_id: workspaceId, end_date: endDate.toISOString().split('T')[0] })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as LoanTracker;
  },

  async updateLoanTracker(id: string, input: Partial<Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>>) {
    const supabase = createClient();
    const updates = { ...input };
    
    if (input.start_date && input.tenure_months) {
       const { calcEndDate } = await import('@/lib/debt-planner/calculations');
       updates.end_date = calcEndDate(input.start_date, input.tenure_months).toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('loan_trackers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as LoanTracker;
  },


  async updateLoanStatus(id: string, status: 'active' | 'paid_off') {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loan_trackers')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as LoanTracker;
  },

  async deleteLoanTracker(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('loan_trackers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};


