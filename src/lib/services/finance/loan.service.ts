import { createClient } from '@/lib/supabase/client';
import type { LoanTracker } from '@/lib/debt-planner/types';

export const loanService = {
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

  async deleteLoanTracker(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('loan_trackers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
};
