import { createClient } from '@/lib/supabase/client';
import type { LoanTracker, DebtPlannerSettings, IncomeTimelineEntry } from '@/lib/debt-planner/types';

export interface CreateIncomeEntryInput {
  effective_date: string;
  monthly_income: number;
  currency: string;
}

export const loanService = {
  // --- LOAN TRACKER (PINJOL/BANK) ---

  async getLoanTrackers(workspaceId: string): Promise<LoanTracker[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loan_trackers')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createLoanTracker(
    workspaceId: string, 
    payload: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<LoanTracker> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loan_trackers')
      .insert({
        workspace_id: workspaceId,
        ...payload
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLoanTracker(id: string, updates: Partial<LoanTracker>): Promise<LoanTracker> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('loan_trackers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteLoanTracker(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('loan_trackers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // --- PLANNER SETTINGS ---

  async getPlannerSettings(workspaceId: string): Promise<DebtPlannerSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debt_planner_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from('debt_planner_settings')
        .insert({
          workspace_id: workspaceId,
          target_debt_free_date: null,
          preferred_strategy: 'snowball',
        })
        .select()
        .single();
      if (insertError) throw insertError;
      return newData;
    }

    return data;
  },

  async updatePlannerSettings(workspaceId: string, updates: Partial<DebtPlannerSettings>): Promise<DebtPlannerSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debt_planner_settings')
      .update(updates)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- INCOME TIMELINE ---

  async getIncomeTimeline(workspaceId: string): Promise<IncomeTimelineEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('income_timeline')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('effective_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createIncomeTimelineEntry(workspaceId: string, payload: CreateIncomeEntryInput): Promise<IncomeTimelineEntry> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('income_timeline')
      .insert({
        workspace_id: workspaceId,
        ...payload
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteIncomeTimelineEntry(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('income_timeline')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};