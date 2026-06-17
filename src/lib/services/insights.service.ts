import { createClient } from '@/lib/supabase/client';
import { currencyService } from './currency.service';

export interface FinancialInsight {
  id?: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export const insightsService = {
  /**
   * Dynamically generates financial health insights and calculates a financial health score.
   */
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
    const supabase = createClient();

    let txs = options?.prefetchedTransactions;

    if (!txs) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, category_id, categories(name), currency')
        .eq('workspace_id', workspaceId)
        .gte('date', startOfMonth.toISOString());

      if (error) {
        console.error('Error fetching transactions for insights:', error);
        throw new Error(error.message);
      }
      txs = data ?? [];
    }

    const { data: wallets } = await supabase
      .from('wallets')
      .select('balance, currency')
      .eq('workspace_id', workspaceId);

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
    
    // Calculate Financial Health Score (0 - 100)
    let score = 75; // Default neutral baseline
    const insights: FinancialInsight[] = [];

    if (income > 0) {
      const savingsRate = (savings / income) * 100;
      const expenseRate = (expense / income) * 100;

      // Adjust score based on expense rates
      if (expenseRate <= 40) {
        score = 92;
        insights.push({
          title: 'Superb Budgeting',
          description: `You are living well within your means. Expenses consume only ${expenseRate.toFixed(0)}% of your monthly income.`,
          type: 'success',
        });
      } else if (expenseRate <= 65) {
        score = 82;
        insights.push({
          title: 'Healthy Savings',
          description: `You are saving a healthy ${savingsRate.toFixed(0)}% of your income. Keep building your wealth!`,
          type: 'success',
        });
      } else if (expenseRate < 90) {
        score = 65;
        insights.push({
          title: 'Tight Margins',
          description: `Monthly expenses absorb ${expenseRate.toFixed(0)}% of earnings. Try optimizing discretionary categories.`,
          type: 'warning',
        });
      } else {
        score = 45;
        insights.push({
          title: 'Unhealthy Deficit Warning',
          description: `Critical cash drain: Expenses absorb ${expenseRate.toFixed(0)}% of income. Risk of overspending this cycle.`,
          type: 'danger',
        });
      }
    } else {
      // No income logged this month
      if (expense > 0) {
        score = 50;
        insights.push({
          title: 'No Active Income Recorded',
          description: 'You are currently burning liquid capital with zero logged income for the current billing cycle.',
          type: 'warning',
        });
      } else {
        score = 100; // Fresh workspace/account
        insights.push({
          title: 'Fresh Slate Workspace',
          description: 'Log your first income transaction to initialize your dynamic financial health scoring.',
          type: 'info',
        });
      }
    }

    // Emergency Fund Assessment
    let runwayMonths = 0;
    if (expense > 0) {
      runwayMonths = totalBalance / expense;
      if (runwayMonths >= 6) {
        score = Math.min(score + 8, 100);
        insights.push({
          title: 'Fortress Reserve',
          description: `Excellent liquidity! Aggregate wallets can support current expenses for ${runwayMonths.toFixed(1)} months.`,
          type: 'success',
        });
      } else if (runwayMonths >= 3) {
        score = Math.min(score + 4, 100);
        insights.push({
          title: 'Adequate Emergency Buffer',
          description: `Healthy emergency liquidity covering ${runwayMonths.toFixed(1)} months of average expenses.`,
          type: 'info',
        });
      } else {
        score = Math.max(score - 6, 20);
        insights.push({
          title: 'Low Liquidity Alarm',
          description: `Liquid assets cover less than 3 months of expenses. Avoid locking cash in illiquid pools.`,
          type: 'danger',
        });
      }
    }

    // Category Concentration check
    let highestSpendingCat = '';
    let highestSpendingAmt = 0;
    Object.entries(categorySpending).forEach(([cat, amt]) => {
      if (amt > highestSpendingAmt) {
        highestSpendingAmt = amt;
        highestSpendingCat = cat;
      }
    });

    if (highestSpendingAmt > 0 && expense > 0) {
      const concentration = (highestSpendingAmt / expense) * 100;
      if (concentration > 40) {
        score = Math.max(score - 4, 10);
        insights.push({
          title: `Extreme Spending Cluster: ${highestSpendingCat}`,
          description: `Concentration alert: ${concentration.toFixed(0)}% of all expenses flow into "${highestSpendingCat}". Consider splitting budgets.`,
          type: 'warning',
        });
      }
    }

    return {
      score: Math.round(score),
      insights,
      income,
      expense,
      savings,
      runwayMonths,
    };
  },
};
