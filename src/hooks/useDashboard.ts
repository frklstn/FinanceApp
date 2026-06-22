'use client';

import { useState, useCallback, useEffect } from 'react';
import { insightsService, type FinancialInsight } from '@/lib/services/finance/insights.service';
import { transactionService, type PopulatedTransaction } from '@/lib/services/workspace/transaction.service';
import { debtService, type LoanTracker } from '@/lib/services/finance/debt.service';
import { walletService } from '@/lib/services/workspace/wallet.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { budgetOptimizerService, type OptimizationSuggestion } from '@/lib/services/finance/budget-optimizer.service';
import { budgetService } from '@/lib/services/finance/budget.service';
import { startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { formatCurrency } from '@/lib/debt-planner/format';
import { useApp } from '@/contexts/app-context';

export interface FinancialStats {
  score: number;
  income: number;
  expense: number;
  savings: number;
  activeDebt: number;
  activeLoansCount: number;
  walletCount: number;
  totalBalance: number;
  incomeDiff: number;
  expenseDiff: number;
  savingsDiff: number;
  totalTarget: number;
  insights: FinancialInsight[];
  activeLoans: LoanTracker[];
  totalRemainingDebt: number;
  nextDueDate: Date | null;
}

export type DateFilter = 'today' | 'thisWeek' | 'thisMonth' | 'last3Months';

export function useDashboard(accountId: string | undefined, dateFilter: DateFilter) {
  const { language, t } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialStats, setFinancialStats] = useState<FinancialStats>({
    score: 0, income: 0, expense: 0, savings: 0, activeDebt: 0, activeLoansCount: 0,
    walletCount: 0, totalBalance: 0, incomeDiff: 0, expenseDiff: 0, savingsDiff: 0,
    totalTarget: 50000000, insights: [], activeLoans: [], totalRemainingDebt: 0, nextDueDate: null,
  });
  const [recentTxs, setRecentTxs] = useState<PopulatedTransaction[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [statusText, setStatusText] = useState(t('dashboard.status.loading', 'Memuat analisis finansial...'));
  const [optimizerSuggestions, setOptimizerSuggestions] = useState<OptimizationSuggestion[]>([]);

  const loadData = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let startDate = new Date();
      let widerStartDate = new Date();
      let bucketMode: 'hour' | 'day' | 'weekday' | 'month' = 'day';

      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now);
          widerStartDate = subDays(startDate, 1);
          bucketMode = 'hour';
          break;
        case 'thisWeek':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          widerStartDate = subDays(startDate, 7);
          bucketMode = 'weekday';
          break;
        case 'last3Months':
          startDate = startOfMonth(subMonths(now, 3));
          widerStartDate = subMonths(startDate, 3);
          bucketMode = 'month';
          break;
        case 'thisMonth':
        default:
          startDate = startOfMonth(now);
          widerStartDate = startOfMonth(subMonths(now, 1));
          bucketMode = 'day';
          break;
      }
      
      const { data: allTxs } = await transactionService.getTransactions(accountId, {
        startDate: widerStartDate.toISOString(),
        limit: 2000,
      });

      const txs = allTxs.filter(tx => new Date(tx.date) >= startDate);
      const prevTxs = allTxs.filter(tx => new Date(tx.date) < startDate);

      const [insightData, wallets, trackers, suggestions] = await Promise.all([
        insightsService.generateInsights(accountId, { prefetchedTransactions: txs }),
        walletService.getWallets(accountId),
        debtService.getLoanTrackers(accountId),
        budgetOptimizerService.getOptimizationSuggestions(accountId),
      ]);
      setOptimizerSuggestions(suggestions);

      const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
      const prevExpense = prevTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
      const currentSavings = insightData.income - insightData.expense;
      
      let diffPercent = 0;
      if (prevIncome !== 0) {
        diffPercent = ((currentSavings - (prevIncome - prevExpense)) / Math.abs(prevIncome - prevExpense || 1)) * 100;
      }
      
      const activeLoans = trackers.filter(l => l.status === 'active');
      const totalMonthlyDebtPayment = activeLoans.reduce((sum, l) => sum + Number(l.monthly_payment), 0);
      
      // Status Text Logic
      let statusMsg = '';
      if (activeLoans.length > 0) {
        const debtRatio = (totalMonthlyDebtPayment / (insightData.income || 1)) * 100;
        if (currentSavings < 0) {
          statusMsg = t('dashboard.status.loanNegativeSavings').replace('{savings}', formatCurrency(Math.abs(currentSavings))).replace('{debt}', formatCurrency(totalMonthlyDebtPayment));
        } else if (debtRatio > 50) {
          statusMsg = t('dashboard.status.loanHighDebtRatio').replace('{savings}', formatCurrency(currentSavings));
        } else {
          statusMsg = t('dashboard.status.loanNormal').replace('{debt}', formatCurrency(totalMonthlyDebtPayment)).replace('{savings}', formatCurrency(currentSavings));
        }
      } else {
        if (currentSavings >= 0) {
          statusMsg = diffPercent >= 0 ? t('dashboard.status.noLoanHealthy').replace('{diff}', `+${diffPercent.toFixed(0)}%`) : t('dashboard.status.noLoanDecreased').replace('{diff}', `${diffPercent.toFixed(0)}%`);
        } else {
          statusMsg = t('dashboard.status.noLoanNegative').replace('{savings}', formatCurrency(Math.abs(currentSavings)));
        }
      }
      setStatusText(statusMsg);

      const convertedBalances = await Promise.all(wallets.map(w => currencyService.convert(Number(w.balance), w.currency || 'IDR', 'IDR')));
      const totalBalance = convertedBalances.reduce((sum, bal) => sum + bal, 0);

      setFinancialStats({
        score: insightData.score,
        income: insightData.income,
        expense: insightData.expense,
        savings: insightData.savings,
        activeDebt: totalMonthlyDebtPayment,
        activeLoansCount: activeLoans.length,
        walletCount: wallets.length,
        totalBalance,
        incomeDiff: diffPercent,
        expenseDiff: prevExpense !== 0 ? ((insightData.expense - prevExpense) / prevExpense) * 100 : 0,
        savingsDiff: diffPercent,
        totalTarget: 50000000,
        insights: insightData.insights,
        activeLoans,
        totalRemainingDebt: activeLoans.reduce((sum, l) => sum + Number(l.total_remaining_balance || 0), 0),
        nextDueDate: activeLoans.length > 0 ? new Date(Math.min(...activeLoans.map(l => new Date(l.start_date).getTime()))) : null,
      });

      setRecentTxs(txs.slice(0, 6));

      // Chart Aggregation Logic
      const HARI = language === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const BULAN_ID = language === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const aggregation: { [key: string]: number } = {};

      if (bucketMode === 'hour') {
        for (let h = 0; h < 24; h++) aggregation[`${String(h).padStart(2, '0')}:00`] = 0;
        txs.filter(tx => tx.type === 'expense').forEach(tx => {
          const key = `${String(new Date(tx.date).getHours()).padStart(2, '0')}:00`;
          if (key in aggregation) aggregation[key] += Number(tx.amount);
        });
      } else if (bucketMode === 'weekday') {
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate); d.setDate(startDate.getDate() + i);
          aggregation[`${HARI[d.getDay()]} ${d.getDate()}`] = 0;
        }
        txs.filter(tx => tx.type === 'expense').forEach(tx => {
          const d = new Date(tx.date);
          const key = `${HARI[d.getDay()]} ${d.getDate()}`;
          if (key in aggregation) aggregation[key] += Number(tx.amount);
        });
      } else if (bucketMode === 'month') {
        for (let m = 2; m >= 0; m--) {
          const d = new Date(); d.setMonth(d.getMonth() - m);
          aggregation[BULAN_ID[d.getMonth()]] = 0;
        }
        txs.filter(tx => tx.type === 'expense').forEach(tx => {
          const key = BULAN_ID[new Date(tx.date).getMonth()];
          if (key in aggregation) aggregation[key] += Number(tx.amount);
        });
      } else {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) aggregation[`${i} ${BULAN_ID[now.getMonth()]}`] = 0;
        txs.filter(tx => tx.type === 'expense').forEach(tx => {
          const d = new Date(tx.date);
          const key = `${d.getDate()} ${BULAN_ID[d.getMonth()]}`;
          if (key in aggregation) aggregation[key] += Number(tx.amount);
        });
      }

      setChartData(Object.entries(aggregation).map(([date, amount]) => ({ date, amount })));

    } catch (err) {
      setError(err instanceof Error ? err.message : t('dashboard.error.loadFailed', 'Gagal memuat data dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [accountId, dateFilter, language, t]);

  const applyOptimization = async (suggestion: OptimizationSuggestion) => {
    if (!accountId) throw new Error("Account not found");
    await budgetService.createBudget(accountId, suggestion.categoryId, suggestion.suggestedBudget);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { loading, error, financialStats, recentTxs, chartData, statusText, optimizerSuggestions, applyOptimization, refresh: loadData };
}