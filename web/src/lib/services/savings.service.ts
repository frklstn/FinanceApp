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
    return data || [];
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
    return data;
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

    // 1. Fetch wallet balance
    const { data: wallet, error: wErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();
    if (wErr) throw new Error('Wallet not found');

    if (Number(wallet.balance) < amount) {
      throw new Error('Insufficient wallet balance for this contribution.');
    }

    // 2. Fetch goal current amount
    const { data: goal, error: gErr } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', goalId)
      .single();
    if (gErr) throw new Error('Savings goal not found');

    const newWalletBalance = Number(wallet.balance) - amount;
    const newGoalAmount = Number(goal.current_amount) + amount;

    // 3. Update wallet balance
    const { error: wUpdErr } = await supabase
      .from('wallets')
      .update({ balance: newWalletBalance })
      .eq('id', walletId);
    if (wUpdErr) throw new Error('Failed to deduct from wallet balance');

    // 4. Update savings goal
    const { error: gUpdErr } = await supabase
      .from('savings_goals')
      .update({
        current_amount: newGoalAmount,
        is_completed: newGoalAmount >= Number(goal.target_amount),
      })
      .eq('id', goalId);
    if (gUpdErr) throw new Error('Failed to update savings goal amount');

    // 5. Insert transaction log (type = expense or special transfer)
    const { error: tErr } = await supabase.from('transactions').insert({
      workspace_id: workspaceId,
      wallet_id: walletId,
      amount,
      type: 'expense',
      note: note || `Contribution to goal: ${goalId}`,
      date: new Date().toISOString(),
    });

    if (tErr) console.error('Error logging savings goal transaction:', tErr);
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
