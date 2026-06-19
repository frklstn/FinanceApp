import { createClient } from '@/lib/supabase/client';
import type { DebtPlannerSettings } from '@/lib/debt-planner/types';

export const debtPlannerSettingsService = {
  async getSettings(workspaceId: string): Promise<DebtPlannerSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debt_planner_settings')
      .select('*')
      .eq('workspace_id', workspaceId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async upsertSalaryDay(workspaceId: string, salaryDay: number): Promise<DebtPlannerSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debt_planner_settings')
      .upsert(
        { workspace_id: workspaceId, salary_day: salaryDay },
        { onConflict: 'workspace_id' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
