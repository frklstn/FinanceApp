import { createClient } from '@/lib/supabase/client';

export interface Transaction {
  id: string;
  workspace_id: string;
  wallet_id: string;
  category_id: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  destination_wallet_id: string | null;
  note: string | null;
  date: string;
  tags: string[];
  currency: string;
  exchange_rate: number;
  attachment_url: string | null;
  is_recurring: boolean;
  recurring_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PopulatedTransaction extends Transaction {
  wallets: {
    name: string;
    color: string;
  } | null;
  categories: {
    name: string;
    icon: string | null;
    color: string;
  } | null;
}

export interface TransactionFilters {
  walletId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export const transactionService = {
  /**
   * Fetches transactions for a workspace matching advanced filters.
   */
  async getTransactions(
    workspaceId: string,
    filters: TransactionFilters = {}
  ): Promise<{ data: PopulatedTransaction[]; count: number }> {
    const supabase = createClient();
    
    let query = supabase
      .from('transactions')
      .select('*, wallets!transactions_wallet_id_fkey(name, color), categories(name, icon, color)', { count: 'exact' });
    query = query.eq('workspace_id', workspaceId);

    // Apply filters
    if (filters.walletId) {
      query = query.eq('wallet_id', filters.walletId);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.search) {
      query = query.ilike('note', `%${filters.search}%`);
    }
    if (filters.tag) {
      query = query.contains('tags', [filters.tag]);
    }

    // Sorting
    query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

    // Pagination
    const limit = filters.limit ?? 20;
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw new Error(error.message);
    }

    return {
      data: (data as unknown as PopulatedTransaction[]) || [],
      count: count || 0,
    };
  },

  /**
   * Records a new transaction (income, expense, or transfer) and automatically updates wallet balances.
   */
  async createTransaction(
    workspaceId: string,
    tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Transaction> {
    const supabase = createClient();

    // 1. Fetch current wallet balance
    const { data: wallet, error: wErr } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', tx.wallet_id)
      .single();
    if (wErr) throw new Error('Wallet not found');

    const amountNum = Number(tx.amount);
    let newBalance = Number(wallet.balance);

    if (tx.type === 'income') {
      newBalance += amountNum;
    } else if (tx.type === 'expense') {
      newBalance -= amountNum;
    }

    // 2. Perform updates for standard Income/Expense
    if (tx.type !== 'transfer') {
      const { error: wUpdErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', tx.wallet_id);
      if (wUpdErr) throw new Error('Failed to update wallet balance');
    } else {
      // It's a Transfer, update destination wallet as well
      if (!tx.destination_wallet_id) throw new Error('Destination wallet required for transfers');
      
      const { data: destWallet, error: dErr } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', tx.destination_wallet_id)
        .single();
      if (dErr) throw new Error('Destination wallet not found');

      const sourceNewBalance = Number(wallet.balance) - amountNum;
      const destNewBalance = Number(destWallet.balance) + amountNum;

      const { error: sUpdErr } = await supabase
        .from('wallets')
        .update({ balance: sourceNewBalance })
        .eq('id', tx.wallet_id);

      const { error: dUpdErr } = await supabase
        .from('wallets')
        .update({ balance: destNewBalance })
        .eq('id', tx.destination_wallet_id);

      if (sUpdErr || dUpdErr) throw new Error('Failed to update transfer balances');
    }

    // 3. Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        workspace_id: workspaceId,
        wallet_id: tx.wallet_id,
        category_id: tx.category_id,
        amount: tx.amount,
        type: tx.type,
        destination_wallet_id: tx.destination_wallet_id,
        note: tx.note,
        date: tx.date || new Date().toISOString(),
        tags: tx.tags || [],
        currency: tx.currency || 'IDR',
        exchange_rate: tx.exchange_rate || 1.0,
        attachment_url: tx.attachment_url,
        is_recurring: tx.is_recurring || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting transaction:', error);
      throw new Error(error.message);
    }

    return data as unknown as Transaction;
  },

  /**
   * Deletes a transaction. DB triggers should handle wallet balance rollbacks.
   */
  async deleteTransaction(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Updates an existing transaction and adjusts wallet balances accordingly.
   */
  async updateTransaction(
    id: string,
    tx: Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Transaction> {
    const supabase = createClient();

    // 1. Fetch current transaction record
    const { data: oldTx, error: tErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (tErr || !oldTx) throw new Error('Transaction not found');

    // 2. Rollback old balance impact
    if (oldTx.type === 'income') {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', oldTx.wallet_id).single();
      if (wallet) {
        await supabase.from('wallets').update({ balance: Number(wallet.balance) - Number(oldTx.amount) }).eq('id', oldTx.wallet_id);
      }
    } else if (oldTx.type === 'expense') {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', oldTx.wallet_id).single();
      if (wallet) {
        await supabase.from('wallets').update({ balance: Number(wallet.balance) + Number(oldTx.amount) }).eq('id', oldTx.wallet_id);
      }
    } else if (oldTx.type === 'transfer' && oldTx.destination_wallet_id) {
      const { data: source } = await supabase.from('wallets').select('balance').eq('id', oldTx.wallet_id).single();
      const { data: dest } = await supabase.from('wallets').select('balance').eq('id', oldTx.destination_wallet_id).single();
      if (source) await supabase.from('wallets').update({ balance: Number(source.balance) + Number(oldTx.amount) }).eq('id', oldTx.wallet_id);
      if (dest) await supabase.from('wallets').update({ balance: Number(dest.balance) - Number(oldTx.amount) }).eq('id', oldTx.destination_wallet_id);
    }

    // 3. Apply new transaction data and calculate new impact
    const updatedTx = { ...oldTx, ...tx };
    const amountNum = Number(updatedTx.amount);

    if (updatedTx.type === 'income') {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', updatedTx.wallet_id).single();
      if (wallet) {
        await supabase.from('wallets').update({ balance: Number(wallet.balance) + amountNum }).eq('id', updatedTx.wallet_id);
      }
    } else if (updatedTx.type === 'expense') {
      const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', updatedTx.wallet_id).single();
      if (wallet) {
        await supabase.from('wallets').update({ balance: Number(wallet.balance) - amountNum }).eq('id', updatedTx.wallet_id);
      }
    } else if (updatedTx.type === 'transfer' && updatedTx.destination_wallet_id) {
      const { data: source } = await supabase.from('wallets').select('balance').eq('id', updatedTx.wallet_id).single();
      const { data: dest } = await supabase.from('wallets').select('balance').eq('id', updatedTx.destination_wallet_id).single();
      if (source) await supabase.from('wallets').update({ balance: Number(source.balance) - amountNum }).eq('id', updatedTx.wallet_id);
      if (dest) await supabase.from('wallets').update({ balance: Number(dest.balance) + amountNum }).eq('id', updatedTx.destination_wallet_id);
    }

    // 4. Update transaction record
    const { data, error } = await supabase
      .from('transactions')
      .update({
        wallet_id: updatedTx.wallet_id,
        category_id: updatedTx.category_id,
        amount: updatedTx.amount,
        type: updatedTx.type,
        destination_wallet_id: updatedTx.destination_wallet_id,
        note: updatedTx.note,
        date: updatedTx.date,
        tags: updatedTx.tags,
        attachment_url: updatedTx.attachment_url,
        is_recurring: updatedTx.is_recurring,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw new Error(error.message);
    }

    return data as unknown as Transaction;
  },
};
