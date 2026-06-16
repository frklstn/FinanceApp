import { createClient } from '@/lib/supabase/client';

export interface Budget {
  id: string;
  workspace_id: string;
  category_id: string;
  amount: number;
  spent: number; // dynamically added from transactions query
  period: string; // YYYY-MM
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
    color: string;
  };
}

export const budgetService = {
  /**
   * Fetches active budgets for a workspace and aggregates real-time spending for each category budget.
   */
  async getBudgets(workspaceId: string, periodString?: string): Promise<Budget[]> {
    const supabase = createClient();
    
    // Default to current year-month (YYYY-MM)
    const currentPeriod = periodString || new Date().toISOString().substring(0, 7);

    // 1. Fetch budgets for the period
    const { data: budgets, error: bError } = await supabase
      .from('budgets')
      .select('*, categories(name, color)')
      .eq('workspace_id', workspaceId)
      .eq('period', currentPeriod);

    if (bError) {
      console.error('Error fetching budgets:', bError);
      throw new Error(bError.message);
    }

    if (!budgets || budgets.length === 0) return [];

    // 2. Fetch all expenses logged in this workspace for the current month
    const startOfMonth = new Date(`${currentPeriod}-01T00:00:00`);
    const nextMonth = new Date(startOfMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { data: txs, error: tError } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('workspace_id', workspaceId)
      .eq('type', 'expense')
      .gte('date', startOfMonth.toISOString())
      .lt('date', nextMonth.toISOString());

    if (tError) {
      console.error('Error calculating budget expenses:', tError);
    }

    // 3. Compile category expenses map
    const spendingMap: { [catId: string]: number } = {};
    txs?.forEach((t) => {
      if (t.category_id) {
        spendingMap[t.category_id] = (spendingMap[t.category_id] || 0) + Number(t.amount);
      }
    });

    // 4. Merge calculated spending into budget objects
    const list: Budget[] = budgets.map((b) => ({
      ...b,
      spent: spendingMap[b.category_id] || 0,
    }));

    return list;
  },

  /**
   * Configures a monthly category budget.
   */
  async createBudget(
    workspaceId: string,
    categoryId: string,
    amount: number,
    periodString?: string
  ): Promise<Budget> {
    const supabase = createClient();
    const period = periodString || new Date().toISOString().substring(0, 7);

    // Check if budget already exists for this category/period
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('category_id', categoryId)
      .eq('period', period)
      .maybeSingle();

    if (existing) {
      // Update instead
      const { data, error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        workspace_id: workspaceId,
        category_id: categoryId,
        amount,
        period,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Deletes a configured budget.
   */
  async deleteBudget(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) {
      console.error('Error deleting budget:', error);
      throw new Error(error.message);
    }
  },
};
