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
      .insert({ workspace_id: workspaceId, name, type, balance, color, icon, currency })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as Wallet;
  },

  /**
   * Updates an existing wallet's details.
   */
  async updateWallet(id: string, payload: Partial<Wallet>): Promise<Wallet> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('wallets')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as Wallet;
  },

  /**
   * Deletes a wallet.
   */
  async deleteWallet(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('wallets').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Simple Transfer (Meta-wrapper). Actual balance adjustment via DB or Transaction Service.
   */
  async transferFunds(sourceId: string, destId: string, amount: number, note?: string): Promise<void> {
    // Recommendation: Use transactionService.createTransaction with type 'transfer'
    throw new Error('Use transactionService.createTransaction for atomic transfers.');
  },
};
