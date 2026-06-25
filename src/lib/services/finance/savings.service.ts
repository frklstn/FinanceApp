import { createClient } from '@/lib/supabase/client';

export interface SavingsGoal {
  id: string;
  workspace_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const savingsService = {
  /**
   * Fetches savings goals for a workspace.
   */
  async getSavingsGoals(workspaceId: string): Promise<SavingsGoal[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching savings goals:', error);
      throw new Error(error.message);
    }
    return (data as unknown as SavingsGoal[]) || [];
  },

  /**
   * Configures a new wealth savings goal.
   */
  async createSavingsGoal(
    workspaceId: string,
    name: string,
    targetAmount: number,
    currentAmount: number = 0,
    deadline: string | null = null
  ): Promise<SavingsGoal> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        workspace_id: workspaceId,
        name,
        target_amount: targetAmount,
        current_amount: currentAmount,
        deadline,
        is_completed: currentAmount >= targetAmount,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating savings goal:', error);
      throw new Error(error.message);
    }
    return data as unknown as SavingsGoal;
  },

  /**
   * Contributes money from an active wallet into the savings goal.
   * Deducts from the wallet and adds to the savings goal current_amount.
   */
  async addContribution(
    workspaceId: string,
    goalId: string,
    amount: number,
    walletId: string,
    note?: string
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await (supabase as any).rpc('add_savings_contribution', {
      p_workspace_id: workspaceId,
      p_goal_id: goalId,
      p_wallet_id: walletId,
      p_amount: amount,
      p_note: note || `Contribution to goal: ${goalId}`,
    });

    if (error) {
      console.error('Error adding savings contribution via RPC:', error);
      throw new Error(error.message);
    }
  },

  /**
   * Deletes a savings goal.
   */
  async deleteSavingsGoal(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) {
      console.error('Error deleting savings goal:', error);
      throw new Error(error.message);
    }
  },
};
