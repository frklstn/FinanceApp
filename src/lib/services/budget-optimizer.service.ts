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

export const budgetOptimizerService = {
  /**
   * Generates budget optimization suggestions based on the last 3 months of spending.
   */
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
    historicalTxs.forEach(tx => {
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

      // Rule 1: Overbudgeting (Budget >> Actual Spent)
      if (currentBudget > avgMonthlySpent * 1.2) {
        const diff = currentBudget - avgMonthlySpent;
        suggestions.push({
          categoryId: budget.category_id,
          categoryName: budget.categories?.name || 'Unknown',
          currentBudget,
          averageSpent: avgMonthlySpent,
          suggestedBudget: Math.round(avgMonthlySpent * 1.05), // Give 5% buffer
          potentialSavings: diff,
          reason: `Anggaran terlalu longgar. Rata-rata pengeluaran 3 bulan terakhir hanya ${Math.round(avgMonthlySpent)}.`,
          priority: 'medium',
        });
      }

      // Rule 2: Overspending (Actual Spent >> Budget)
      if (avgMonthlySpent > currentBudget * 1.1) {
        const diff = avgMonthlySpent - currentBudget;
        suggestions.push({
          categoryId: budget.category_id,
          categoryName: budget.categories?.name || 'Unknown',
          currentBudget,
          averageSpent: avgMonthlySpent,
          suggestedBudget: currentBudget, // Keep current budget, but alert
          potentialSavings: 0,
          reason: `Bocor halus terdeteksi. Pengeluaran rata-rata melebihi budget sebesar ${Math.round(diff)}.`,
          priority: 'high',
        });
      }
    });

    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
};
