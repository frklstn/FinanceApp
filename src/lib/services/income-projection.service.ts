import { createClient } from '@/lib/supabase/client';
import type { IncomeTimelineEntry } from '@/lib/debt-planner/types';

export interface CreateIncomeEntryInput {
  effective_date: string;
  monthly_income: number;
  currency: string;
}

export const incomeProjectionService = {
  async getTimeline(workspaceId: string): Promise<IncomeTimelineEntry[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('income_timeline')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('effective_date', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(entry => ({ ...entry, currency: entry.currency ?? 'IDR' }));
  },

  async createEntry(
    workspaceId: string,
    input: CreateIncomeEntryInput
  ): Promise<IncomeTimelineEntry> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('income_timeline')
      .insert({
        workspace_id: workspaceId,
        effective_date: input.effective_date,
        monthly_income: input.monthly_income,
        currency: input.currency || 'IDR',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteEntry(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('income_timeline').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};
