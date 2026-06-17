'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { insightsService, type FinancialInsight } from '@/lib/services/insights.service';
import { transactionService, PopulatedTransaction } from '@/lib/services/transaction.service';
import { loanTrackerService } from '@/lib/services/loan-tracker.service';
import { walletService } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { SpendingChart } from '@/components/charts/spending-chart';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  ShieldAlert,
  Bell,
  ChevronDown,
  Zap,
  ShieldCheck,
  CreditCard,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { QuickAddModal } from '@/components/transaction/quick-add-modal';
import NumberTicker from '@/components/ui/number-ticker';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [financialStats, setFinancialStats] = useState({
    score: 0,
    income: 0,
    expense: 0,
    savings: 0,
    activeDebt: 0,
    activeLoansCount: 0,
    walletCount: 0,
    totalBalance: 0,
    incomeDiff: 0,
    expenseDiff: 0,
    savingsDiff: 0,
    insights: [] as FinancialInsight[],
  });

  const [recentTxs, setRecentTxs] = useState<PopulatedTransaction[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: 'income' | 'expense' | 'transfer' }>({
    open: false,
    type: 'expense',
  });
  const [dateFilter] = useState('Bulan Ini');

  const loadDashboardData = useCallback(async () => {
    if (!accountId) return;
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthTxs } = await transactionService.getTransactions(accountId, {
        startDate: startOfMonth.toISOString(),
        limit: 200,
      });

      const insightData = await insightsService.generateInsights(accountId, {
        prefetchedTransactions: monthTxs,
      });

      const wallets = await walletService.getWallets(accountId);
      const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
      
      const trackers = await loanTrackerService.getLoanTrackers(accountId);
      const activeTrackers = trackers.filter(l => l.status === 'active');
      const totalActiveDebt = activeTrackers.reduce((sum, l) => sum + Number(l.total_repayment), 0);

      setFinancialStats({
        score: insightData.score,
        income: insightData.income,
        expense: insightData.expense,
        savings: insightData.savings,
        activeDebt: totalActiveDebt,
        activeLoansCount: activeTrackers.length,
        walletCount: wallets.length,
        totalBalance,
        incomeDiff: 12.5,
        expenseDiff: -5.2,
        savingsDiff: 8.4,
        insights: insightData.insights,
      });

      setRecentTxs(monthTxs.slice(0, 6));

      const dayAggregation: { [date: string]: number } = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        dayAggregation[label] = 0;
      }

      monthTxs.forEach(tx => {
        if (tx.type === 'expense') {
          const label = new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          if (dayAggregation[label] !== undefined) dayAggregation[label] += Number(tx.amount);
        }
      });

      setChartData(Object.entries(dayAggregation).map(([date, amount]) => ({ date, amount })));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    }
  }, [accountId, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] py-10 px-8 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-white tracking-tighter"
          >
            Dashboard <span className="text-indigo-500">Elite</span>
          </motion.h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">
            Financial Ecosystem • v2.0
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-black text-white uppercase tracking-widest">{dateFilter}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>
          <button className="p-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-white hover:bg-white/[0.08] transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          </button>
        </div>
      </header>

      <section>
        <Card glass className="p-10 relative group overflow-hidden border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-indigo-600/20" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Total Liquidity</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                    <NumberTicker value={financialStats.totalBalance} formatter={(v) => formatRupiah(v)} />
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase">+{financialStats.incomeDiff}% Inflow</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase">{financialStats.walletCount} Active Assets</span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-2xl rounded-[32px] border border-white/5 p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Financial Score</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Calculated by AI</p>
                  </div>
                </div>
                <div className="text-4xl font-black text-white italic">{financialStats.score}</div>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${financialStats.score}%` }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                Kesehatan finansial Anda berada di zona aman. Optimalkan pengeluaran di sektor gaya hidup untuk skor maksimal.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <BentoGrid>
          <BentoGridItem
            className="md:col-span-2"
            title="Spending Velocity"
            description="Analisis pengeluaran harian 7 hari terakhir"
            header={<SpendingChart data={chartData} />}
            icon={<Zap className="w-4 h-4 text-indigo-400" />}
          />

          <BentoGridItem
            title="Nexus Terminal"
            description="Eksekusi transaksi instan"
            header={
              <div className="grid grid-cols-2 gap-3 h-full">
                <button 
                  onClick={() => setQuickAdd({ open: true, type: 'expense' })}
                  className="rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center gap-2 hover:bg-rose-500/20 transition-all group"
                >
                  <ArrowDownLeft className="w-6 h-6 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-rose-400 uppercase">Expense</span>
                </button>
                <button 
                  onClick={() => setQuickAdd({ open: true, type: 'income' })}
                  className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all group"
                >
                  <ArrowUpRight className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-emerald-400 uppercase">Income</span>
                </button>
              </div>
            }
            icon={<Target className="w-4 h-4 text-indigo-400" />}
          />

          <BentoGridItem
            title="Active Liability"
            description="Monitor paparan pinjaman"
            header={
              <div className="flex flex-col justify-center h-full p-4">
                <div className="text-3xl font-black text-white tracking-tighter">
                  {formatRupiah(financialStats.activeDebt)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{financialStats.activeLoansCount} Kontrak Pinjol</span>
                </div>
              </div>
            }
            icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
          />

          <BentoGridItem
            className="md:col-span-2"
            title="Recent Ledger"
            description="Log transaksi terakhir terdeteksi"
            header={
              <div className="space-y-3 h-full overflow-hidden">
                {recentTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <span className="text-[11px] font-bold text-white truncate max-w-[150px]">{tx.note || 'Transaksi'}</span>
                    </div>
                    <span className={`text-[11px] font-black ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            }
            icon={<ArrowRightLeft className="w-4 h-4 text-indigo-400" />}
          />
        </BentoGrid>
      </section>

      {quickAdd.open && (
        <QuickAddModal 
          isOpen={quickAdd.open}
          onClose={() => setQuickAdd({ ...quickAdd, open: false })}
          initialType={quickAdd.type}
          onSuccess={loadDashboardData}
          accountId={accountId!}
        />
      )}
    </div>
  );
}
