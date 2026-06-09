import { createClient } from '@/lib/supabase/client';

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
    return data || [];
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
    dueDate: string | null = null
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
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating debt:', error);
      throw new Error(error.message);
    }
    return data;
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

    // 1. Fetch debt details
    const { data: debt, error: dErr } = await supabase
      .from('debts')
      .select('*')
      .eq('id', debtId)
      .single();
    if (dErr) throw new Error('Debt record not found');

    if (Number(debt.remaining_amount) < amount) {
      throw new Error('Payment exceeds remaining debt balance.');
    }

    // 2. Fetch wallet details
    const { data: wallet, error: wErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();
    if (wErr) throw new Error('Wallet not found');

    const amountNum = Number(amount);
    let newWalletBalance = Number(wallet.balance);

    if (debt.type === 'owe') {
      // Paying debt we owe: Wallet drops
      if (newWalletBalance < amountNum) {
        throw new Error('Insufficient wallet balance to perform this repayment.');
      }
      newWalletBalance -= amountNum;
    } else {
      // Collecting money lent: Wallet increases
      newWalletBalance += amountNum;
    }

    const newRemaining = Number(debt.remaining_amount) - amountNum;
    const isSettled = newRemaining <= 0;

    // 3. Update wallet balance
    const { error: wUpdErr } = await supabase
      .from('wallets')
      .update({ balance: newWalletBalance })
      .eq('id', walletId);
    if (wUpdErr) throw new Error('Failed to update wallet balance');

    // 4. Update debt remaining amount
    const { error: dUpdErr } = await supabase
      .from('debts')
      .update({
        remaining_amount: newRemaining,
        status: isSettled ? 'settled' : 'active',
      })
      .eq('id', debtId);
    if (dUpdErr) throw new Error('Failed to update debt remaining balance');

    // 5. Insert payment sub-record
    const { error: pErr } = await supabase.from('debt_payments').insert({
      debt_id: debtId,
      amount,
      wallet_id: walletId,
      note: note || `Installment payment for ${debt.name}`,
    });
    if (pErr) console.error('Error logging debt payment sub-record:', pErr);

    // 6. Log transaction record
    const { error: tErr } = await supabase.from('transactions').insert({
      workspace_id: workspaceId,
      wallet_id: walletId,
      amount,
      type: debt.type === 'owe' ? 'expense' : 'income',
      note: note || `Repayment contribution: ${debt.name}`,
      date: new Date().toISOString(),
    });

    if (tErr) console.error('Error logging transaction ledger for debt:', tErr);
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
};
