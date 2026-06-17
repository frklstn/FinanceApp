import { createClient } from '@/lib/supabase/client';
import { transactionService } from './transaction.service';

export const seedDataService = {
  async seedPinjolTransactions(workspaceId: string, walletId: string) {
    const supabase = createClient();

    // Ensure Pinjol category exists
    const { data: fetchedCategory, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('name', 'Pinjol Payment')
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pinjolCategory: any = fetchedCategory;

    if (catError && catError.code === 'PGRST116') { // No rows found
      const { data: newCat, error: newCatError } = await supabase
        .from('categories')
        .insert({
          workspace_id: workspaceId,
          name: 'Pinjol Payment',
          type: 'expense',
          color: '#ef4444', // Rose color for debts
          icon: 'Loan',
        })
        .select()
        .single();
      if (newCatError) throw new Error(`Failed to create Pinjol category: ${newCatError.message}`);
      pinjolCategory = newCat;
    } else if (catError) {
      throw new Error(`Failed to fetch Pinjol category: ${catError.message}`);
    }

    if (!pinjolCategory) throw new Error('Pinjol category not found or created.');

    const dummyTransactions = [];
    const today = new Date();

    for (let i = 0; i < 60; i++) { // Generate 60 days of dummy data
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - i);

      // Simulate a few expense transactions per month
      if (Math.random() < 0.3) { // 30% chance of an expense
        dummyTransactions.push({
          workspace_id: workspaceId,
          wallet_id: walletId,
          category_id: pinjolCategory.id,
          amount: Math.floor(Math.random() * 500000) + 100000, // Rp 100k - 600k
          type: 'expense' as const,
          destination_wallet_id: null,
          note: `Pembayaran cicilan pinjol ${Math.random() > 0.5 ? 'A' : 'B'}`,
          date: transactionDate.toISOString(),
          tags: ['pinjol'],
          attachment_url: null,
          is_recurring: false,
          recurring_id: null,
          currency: 'IDR',
          exchange_rate: 1,
        });
      }
      
      // Simulate some income to balance
      if (i % 30 === 0 && i !== 0) { // Simulate salary every month (adjust condition for more realistic seeding)
        dummyTransactions.push({
          workspace_id: workspaceId,
          wallet_id: walletId,
          category_id: null, // General income
          amount: Math.floor(Math.random() * 5000000) + 3000000, // Rp 3jt - 8jt
          type: 'income' as const,
          destination_wallet_id: null,
          note: `Gaji Bulanan - ${transactionDate.toLocaleString('default', { month: 'long' })}`,
          date: transactionDate.toISOString(),
          tags: ['gaji'],
          attachment_url: null,
          is_recurring: false,
          recurring_id: null,
          currency: 'IDR',
          exchange_rate: 1,
        });
      }
    }

    // Insert all dummy transactions
    for (const tx of dummyTransactions) {
      await transactionService.createTransaction(workspaceId, tx);
    }

    console.log(`Seeded ${dummyTransactions.length} pinjol transactions for workspace ${workspaceId}`);
  },
};
