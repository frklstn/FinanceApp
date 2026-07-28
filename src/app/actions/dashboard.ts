'use server'

import { transactionService } from '@/lib/services/server/transaction.service';
import { walletService } from '@/lib/services/server/wallet.service';
import { debtService } from '@/lib/services/server/debt.service';
import { insightsService } from '@/lib/services/server/insights.service';
import { currencyService } from '@/lib/services/server/currency.service';
import { budgetOptimizerService } from '@/lib/services/server/budget-optimizer.service';
import { budgetService } from '@/lib/services/server/budget.service';
import { requireAccount } from '@/lib/auth/account';

interface DashboardRange {
  startDate: string;
  endDate: string;
  widerStartDate: string;
}

export async function getDashboardData(range: DashboardRange) {
  const auth = await requireAccount();
  if (!auth) return null;
  const { accountId } = auth;

  const [{ data: allTxs }, wallets, loanTrackers, manualDebts, suggestions] = await Promise.all([
    transactionService.getTransactions(accountId, {
      startDate: range.widerStartDate,
      endDate: range.endDate,
      limit: 2000,
    }),
    walletService.getWallets(accountId),
    debtService.getLoanTrackers(accountId),
    debtService.getDebts(accountId),
    budgetOptimizerService.getOptimizationSuggestions(accountId),
  ]);

  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const txs = allTxs.filter((tx) => {
    const d = new Date(tx.date);
    return d >= start && d <= end;
  });

  const [insightData, convertedBalances] = await Promise.all([
    insightsService.generateInsights(accountId, { prefetchedTransactions: txs }),
    Promise.all(wallets.map((w) => currencyService.convert(Number(w.balance), w.currency || 'IDR', 'IDR'))),
  ]);

  const totalBalance = convertedBalances.reduce((sum, bal) => sum + bal, 0);

  return { allTxs, insightData, wallets, loanTrackers, manualDebts, suggestions, totalBalance };
}

export async function applyBudgetOptimization(categoryId: string, suggestedBudget: number) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');
  await budgetService.createBudget(auth.accountId, categoryId, suggestedBudget);
}
