import "server-only";
import { budgetService } from './budget.service';
import { transactionService } from './transaction.service';
import { subMonths } from 'date-fns';

export interface OptimizationSuggestion {
  categoryId: string;
  categoryName: string;
  currentBudget: number;
  averageSpent: number;
  suggestedBudget: number;
  potentialSavings: number;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

// Hanya field yang dipakai optimizer ini. getTransactions mengembalikan row
// mentah dari query, jadi tipe lokal lebih aman daripada memaksakan shape.
interface TxForOptimizer {
  category_id: string | null;
  amount: number | string;
}

export const budgetOptimizerService = {
  async getOptimizationSuggestions(workspaceId: string): Promise<OptimizationSuggestion[]> {
    const activeBudgets = await budgetService.getBudgets(workspaceId);
    if (activeBudgets.length === 0) return [];

    const threeMonthsAgo = subMonths(new Date(), 3).toISOString();
    const { data: historicalTxs } = await transactionService.getTransactions(workspaceId, {
      startDate: threeMonthsAgo,
      type: 'expense',
      limit: 5000,
    });

    const categoryStats: Record<string, { total: number; count: number }> = {};
    historicalTxs.forEach((tx: TxForOptimizer) => {
      if (!tx.category_id) return;
      if (!categoryStats[tx.category_id]) categoryStats[tx.category_id] = { total: 0, count: 0 };
      categoryStats[tx.category_id].total += Number(tx.amount);
      categoryStats[tx.category_id].count++;
    });

    const suggestions: OptimizationSuggestion[] = [];

    activeBudgets.forEach(budget => {
      const stats = categoryStats[budget.category_id];
      if (!stats) return;

      const avgMonthlySpent = stats.total / 3;
      const currentBudget = Number(budget.amount);

      if (currentBudget > avgMonthlySpent * 1.2) {
        const diff = currentBudget - avgMonthlySpent;
        suggestions.push({
          categoryId: budget.category_id,
          categoryName: budget.categories?.name || 'Unknown',
          currentBudget,
          averageSpent: avgMonthlySpent,
          suggestedBudget: Math.round(avgMonthlySpent * 1.05),
          potentialSavings: diff,
          reason: `Anggaran terlalu longgar.`,
          priority: 'medium',
        });
      }
    });

    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
};
