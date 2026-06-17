import { createClient } from '@/lib/supabase/client';

export interface Wallet {
  id: string;
  workspace_id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'crypto' | 'savings' | 'other';
  balance: number;
  color: string;
  icon: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const walletService = {
  /**
   * Fetches all active wallets for a workspace.
   */
  async getWallets(workspaceId: string): Promise<Wallet[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new Error(error.message);
    }
    return (data as unknown as Wallet[]) || [];
  },

  /**
   * Creates a new wallet in the workspace.
   */
  async createWallet(
    workspaceId: string,
    name: string,
    type: string,
    balance: number,
    color: string,
    icon: string,
    currency: string = 'IDR'
  ): Promise<Wallet> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wallets')
      .insert({
        workspace_id: workspaceId,
        name,
        type,
        balance,
        color,
        icon,
        currency,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet:', error);
      throw new Error(error.message);
    }
    
    // If starting balance is positive, record an initial balance transaction
    if (balance > 0) {
      const { error: tError } = await supabase.from('transactions').insert({
        workspace_id: workspaceId,
        wallet_id: data.id,
        amount: balance,
        type: 'income',
        note: 'Starting Balance Adjustment',
        date: new Date().toISOString(),
      });
      if (tError) console.error('Error recording initial balance transaction:', tError);
    }

    return data as unknown as Wallet;
  },

  /**
   * Updates an existing wallet's details.
   */
  async updateWallet(
    id: string,
    name: string,
    type: string,
    color: string,
    icon: string,
    currency: string,
    isActive: boolean = true
  ): Promise<Wallet> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wallets')
      .update({
        name,
        type,
        color,
        icon,
        currency,
        is_active: isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating wallet:', error);
      throw new Error(error.message);
    }
    return data as unknown as Wallet;
  },

  /**
   * Deletes a wallet. (Cascading delete removes all linked transactions)
   */
  async deleteWallet(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('wallets').delete().eq('id', id);
    if (error) {
      console.error('Error deleting wallet:', error);
      throw new Error(error.message);
    }
  },

  /**
   * Executes a fund transfer between two wallets and records the transfer transaction.
   */
  async transferFunds(
    workspaceId: string,
    sourceId: string,
    destinationId: string,
    amount: number,
    note?: string
  ): Promise<void> {
    const supabase = createClient();

    // 1. Fetch current balances
    const { data: sourceWallet, error: sErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', sourceId)
      .single();

    const { data: destWallet, error: dErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', destinationId)
      .single();

    if (sErr || dErr) throw new Error('Source or destination wallet not found.');

    const newSourceBalance = Number(sourceWallet.balance) - amount;
    const newDestBalance = Number(destWallet.balance) + amount;

    // 2. Perform updates
    const { error: sUpdErr } = await supabase
      .from('wallets')
      .update({ balance: newSourceBalance })
      .eq('id', sourceId);

    const { error: dUpdErr } = await supabase
      .from('wallets')
      .update({ balance: newDestBalance })
      .eq('id', destinationId);

    if (sUpdErr || dUpdErr) throw new Error('Failed to update wallet balances during transfer.');

    // 3. Record transfer transaction
    const { error: tErr } = await supabase.from('transactions').insert({
      workspace_id: workspaceId,
      wallet_id: sourceId,
      destination_wallet_id: destinationId,
      amount,
      type: 'transfer',
      note: note || 'Transfer',
      date: new Date().toISOString(),
      currency: sourceWallet.currency || 'IDR',
      exchange_rate: 1.0,
    });

    if (tErr) {
      console.error('Error logging transfer transaction:', tErr);
      throw new Error(tErr.message);
    }
  },
};
