import { createClient } from '@/lib/supabase/client';

interface SupabaseClientWithRpc {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
}

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
      // DatePicker mengirim YYYY-MM-DD tanpa jam; tanpa akhir-hari, transaksi
      // pada tanggal itu sendiri ikut terpotong (dibandingkan ke 00:00).
      const end = filters.endDate.length === 10 ? `${filters.endDate}T23:59:59.999` : filters.endDate;
      query = query.lte('date', end);
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

    const { data, error } = await (supabase as unknown as SupabaseClientWithRpc).rpc('create_transaction', {
      p_workspace_id: workspaceId,
      p_wallet_id: tx.wallet_id,
      p_category_id: tx.category_id || null,
      p_amount: tx.amount,
      p_type: tx.type,
      p_destination_wallet_id: tx.destination_wallet_id || null,
      p_note: tx.note || null,
      p_date: tx.date || new Date().toISOString(),
      p_tags: tx.tags || [],
      p_currency: tx.currency || 'IDR',
      p_exchange_rate: tx.exchange_rate || 1.0,
      p_is_recurring: tx.is_recurring || false,
    });

    if (error) {
      console.error('Error inserting transaction via RPC:', error);
      throw new Error(error.message);
    }

    return data as unknown as Transaction;
  },

  /**
   * Deletes a transaction using the atomic delete_transaction function.
   */
  async deleteTransaction(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await (supabase as unknown as SupabaseClientWithRpc).rpc('delete_transaction', { p_id: id });
    if (error) throw new Error(error.message);
  },

  /**
   * Updates an existing transaction and adjusts wallet balances atomically.
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

    const updatedTx = { ...oldTx, ...tx };

    // 2. Perform atomic update via RPC
    const { data, error } = await (supabase as unknown as SupabaseClientWithRpc).rpc('update_transaction', {
      p_id: id,
      p_wallet_id: updatedTx.wallet_id,
      p_category_id: updatedTx.category_id || null,
      p_amount: updatedTx.amount,
      p_type: updatedTx.type,
      p_destination_wallet_id: updatedTx.destination_wallet_id || null,
      p_note: updatedTx.note || null,
      p_date: updatedTx.date,
      p_tags: updatedTx.tags || [],
      p_attachment_url: updatedTx.attachment_url || null,
      p_is_recurring: updatedTx.is_recurring || false,
    });

    if (error) {
      console.error('Error updating transaction via RPC:', error);
      throw new Error(error.message);
    }

    return data as unknown as Transaction;
  },
};

