import "server-only";
import { query } from '@/lib/db/server';
import { currencyService } from './currency.service';

export interface FinancialInsight {
  id?: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export const insightsService = {
  async generateInsights(
    workspaceId: string,
    options?: { prefetchedTransactions?: { amount: number; type: string; categories?: { name?: string } | { name?: string }[] | null }[] }
  ): Promise<{
    score: number;
    insights: FinancialInsight[];
    income: number;
    expense: number;
    savings: number;
    runwayMonths: number;
  }> {
    let txs = options?.prefetchedTransactions;

    if (!txs) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { rows } = await query(
        `SELECT t.amount, t.type, t.category_id, c.name AS category_name, t.currency 
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.workspace_id = $1 AND t.date >= $2`,
        [workspaceId, startOfMonth.toISOString()]
      );

      txs = rows.map(r => ({
        amount: r.amount,
        type: r.type,
        currency: r.currency,
        categories: { name: r.category_name }
      })) as any[];
    }

    const { rows: wallets } = await query(
      'SELECT balance, currency FROM wallets WHERE workspace_id = $1',
      [workspaceId]
    );

    const convertedBalances = await Promise.all(
      (wallets || []).map(w => currencyService.convert(Number(w.balance), w.currency || 'IDR', 'IDR'))
    );
    const totalBalance = convertedBalances.reduce((sum, bal) => sum + bal, 0);

    let income = 0;
    let expense = 0;
    const categorySpending: { [name: string]: number } = {};

    for (const t of txs || []) {
      const amt = await currencyService.convert(Number(t.amount), (t as { currency?: string }).currency || 'IDR', 'IDR');
      if (t.type === 'income') {
        income += amt;
      } else if (t.type === 'expense') {
        expense += amt;
        const cat = t.categories as { name?: string } | { name?: string }[] | null | undefined;
        const catName = (Array.isArray(cat) ? cat[0]?.name : cat?.name) || 'General';
        categorySpending[catName] = (categorySpending[catName] || 0) + amt;
      }
    }

    const savings = income - expense;
    let score = 75;
    const insights: FinancialInsight[] = [];

    if (income > 0) {
      const savingsRate = (savings / income) * 100;
      const expenseRate = (expense / income) * 100;

      if (expenseRate <= 40) {
        score = 92;
        insights.push({ title: 'Pengeluaran terkendali', description: `Pengeluaran cuma ${expenseRate.toFixed(0)}%. Sehat.`, type: 'success' });
      } else if (expenseRate <= 65) {
        score = 82;
        insights.push({ title: 'Tabungan sehat', description: `Nabung ${savingsRate.toFixed(0)}%. Terus dijaga.`, type: 'success' });
      } else if (expenseRate < 90) {
        score = 65;
        insights.push({ title: 'Sisa tipis', description: `Terserap ${expenseRate.toFixed(0)}%. Tekan pengeluaran.`, type: 'warning' });
      } else {
        score = 45;
        insights.push({ title: 'Defisit, perlu perhatian', description: `Terserap ${expenseRate.toFixed(0)}%. Arus kas kritis.`, type: 'danger' });
      }
    } else {
      if (expense > 0) {
        score = 50;
        insights.push({ title: 'Belum ada pemasukan', description: 'Pengeluaran jalan terus tanpa pemasukan.', type: 'warning' });
      } else {
        score = 100;
        insights.push({ title: 'Mulai dari sini', description: 'Catat transaksi pemasukan pertamamu.', type: 'info' });
      }
    }

    let runwayMonths = 0;
    if (expense > 0) {
      runwayMonths = totalBalance / expense;
      if (runwayMonths >= 6) {
        score = Math.min(score + 8, 100);
        insights.push({ title: 'Dana darurat kuat', description: `Saldo cukup untuk ${runwayMonths.toFixed(1)} bln.`, type: 'success' });
      } else if (runwayMonths >= 3) {
        score = Math.min(score + 4, 100);
        insights.push({ title: 'Dana darurat cukup', description: `Saldo cukup untuk ${runwayMonths.toFixed(1)} bln.`, type: 'info' });
      } else {
        score = Math.max(score - 6, 20);
        insights.push({ title: 'Dana darurat menipis', description: `Saldo < 3 bln pengeluaran. Bahaya.`, type: 'danger' });
      }
    }

    let highestSpendingCat = '';
    let highestSpendingAmt = 0;
    Object.entries(categorySpending).forEach(([cat, amt]) => {
      if (amt > highestSpendingAmt) { highestSpendingAmt = amt; highestSpendingCat = cat; }
    });

    if (highestSpendingAmt > 0 && expense > 0) {
      const concentration = (highestSpendingAmt / expense) * 100;
      if (concentration > 40) {
        score = Math.max(score - 4, 10);
        insights.push({ title: `Extreme Spending Cluster`, description: `${concentration.toFixed(0)}% di ${highestSpendingCat}. Split budget.`, type: 'warning' });
      }
    }

    return { score: Math.round(score), insights, income, expense, savings, runwayMonths };
  },
};
