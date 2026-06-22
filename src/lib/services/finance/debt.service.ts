import { createClient } from '@/lib/supabase/client';
import { currencyService } from './currency.service';

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
  async getDebts(workspaceId: string): Promise<Debt[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDebtStats(workspaceId: string) {
    const debts = await this.getDebts(workspaceId);
    
    let totalOwe = 0;
    let totalLend = 0;

    for (const debt of debts) {
      if (debt.status === 'active') {
        const amt = await currencyService.convert(debt.remaining_amount, debt.currency || 'IDR', 'IDR');
        if (debt.type === 'owe') {
          totalOwe += amt;
        } else {
          totalLend += amt;
        }
      }
    }

    return { totalOwe, totalLend };
  },

  async createDebt(
    workspaceId: string,
    payload: Omit<Debt, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>
  ): Promise<Debt> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debts')
      .insert({
        workspace_id: workspaceId,
        ...payload
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateDebt(id: string, updates: Partial<Debt>): Promise<Debt> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDebt(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markAsSettled(id: string): Promise<Debt> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('debts')
      .update({ status: 'settled', remaining_amount: 0 })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};