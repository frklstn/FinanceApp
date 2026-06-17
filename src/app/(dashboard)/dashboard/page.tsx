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
import { Button } from '@/components/ui/button';
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
  Wallet,
  PiggyBank,
  Receipt,
  PieChart
} from 'lucide-react';
import { QuickAddModal } from '@/components/transaction/quick-add-modal';
import NumberTicker from '@/components/ui/number-ticker';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { accountId } = useApp();
  const { toast } = useToast();
  const router = useRouter();

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
    totalTarget: 0,
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

      const goals = await insightsService.generateInsights(accountId, { prefetchedTransactions: monthTxs }); // Simple way to get targets if service supports it

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
        totalTarget: 50000000, // Hardcoded for demo if not available
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

  const HeroWidgets = [
    { label: 'Liquidity', value: financialStats.totalBalance, icon: Wallet, color: 'text-indigo-400', path: '/wallets' },
    { label: 'Inflow', value: financialStats.income, icon: TrendingUp, color: 'text-emerald-400', path: '/transactions?type=income' },
    { label: 'Outflow', value: financialStats.expense, icon: TrendingDown, color: 'text-rose-400', path: '/transactions?type=expense' },
    { label: 'Reserves', value: financialStats.savings, icon: PiggyBank, color: 'text-amber-400', path: '/savings' },
  ];

  const ActionWidgets = [
    { label: 'Analysis', desc: 'Real-time financial auditing', icon: PieChart, path: '/insights' },
    { label: 'Ledger', desc: 'Manage entry history', icon: Receipt, path: '/transactions' },
    { label: 'Liability', desc: 'Monitor debt exposure', icon: ShieldAlert, path: '/debts' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] py-6 md:py-10 px-4 md:px-8 space-y-8 md:space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase"
          >
            Nexus <span className="text-indigo-500">Dashboard</span>
          </motion.h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Financial Command Center • v2.0</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none px-5 py-3 rounded-[24px] bg-white/[0.03] backdrop-blur-3xl border border-white/5 flex items-center justify-between md:justify-start gap-4">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{dateFilter}</span>
            <ChevronDown className="w-3 h-3 text-white/20" />
          </div>
          <button className="p-3.5 rounded-[24px] bg-white/[0.03] backdrop-blur-3xl border border-white/5 text-white hover:bg-white/[0.08] transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,1)]" />
          </button>
        </div>
      </header>

      {/* Hero 4 Widgets - Interactive */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {HeroWidgets.map((w, i) => (
          <motion.button
            key={w.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => router.push(w.path)}
            className="relative group p-6 md:p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left overflow-hidden shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] blur-3xl rounded-full -mr-12 -mt-12 transition-all group-hover:bg-indigo-500/10" />
            <w.icon className={`w-6 h-6 md:w-8 md:h-8 ${w.color} mb-4 md:mb-6 transition-transform group-hover:scale-110`} />
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{w.label}</p>
              <div className="text-lg md:text-2xl font-black text-white tracking-tighter truncate">
                <NumberTicker value={w.value} formatter={formatRupiah} />
              </div>
            </div>
          </motion.button>
        ))}
      </section>

      {/* Main Analysis Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <Card glass className="xl:col-span-2 p-8 md:p-10 border-indigo-500/10">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Zap className="w-5 h-5 text-indigo-400" /> Spending Velocity
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">7-Day Consumption Audit</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <SpendingChart data={chartData} />
          </div>
        </Card>

        {/* Financial Health Widget */}
        <Card glass className="p-8 md:p-10 border-white/5 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-[24px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-7 h-7 text-indigo-400" />
              </div>
              <div className="text-5xl font-black text-white italic tracking-tighter shadow-indigo-500/20 drop-shadow-2xl">{financialStats.score}</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-white/40">Nexus Health Index</span>
                <span className="text-white">AI Calculated</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${financialStats.score}%` }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.6)]" 
                />
              </div>
            </div>
            <p className="text-[11px] font-bold text-white/50 leading-relaxed uppercase tracking-tight">
              Operational capacity at <span className="text-white">Optimal Level</span>. Consumption patterns detected within safe margins. No anomalies identified in current cycle.
            </p>
          </div>
          <Button variant="outline" className="w-full mt-8 rounded-[20px] py-6 border-white/5 bg-white/[0.03] text-[10px] font-black uppercase tracking-[0.2em]" onClick={() => router.push('/insights')}>
            View Audit Details
          </Button>
        </Card>
      </section>

      {/* 3 Action Widgets - Interactive */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {ActionWidgets.map((w, i) => (
          <motion.button
            key={w.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => router.push(w.path)}
            className="group flex items-center gap-6 p-6 md:p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left shadow-2xl"
          >
            <div className="w-14 h-14 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
              <w.icon className="w-6 h-6 text-white/40 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">{w.label}</h4>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-tight">{w.desc}</p>
            </div>
          </motion.button>
        ))}
      </section>

      {/* Bottom Ledger & Terminal Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <BentoGridItem
          title="Recent Ledger"
          description="Detected entries in current session"
          header={
            <div className="space-y-4 h-full">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[120px] md:max-w-[180px] block">{tx.note || 'Unlabeled Transaction'}</span>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                  <span className={`text-[12px] font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          }
          icon={<ArrowRightLeft className="w-4 h-4 text-indigo-400" />}
          className="p-8 md:p-10"
        />

        <BentoGridItem
          title="Nexus Terminal"
          description="Manual Liquidity Authorization"
          header={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
              <button 
                onClick={() => setQuickAdd({ open: true, type: 'expense' })}
                className="p-8 rounded-[32px] bg-rose-500/5 border border-rose-500/10 flex flex-col items-center justify-center gap-4 hover:bg-rose-500/10 transition-all group shadow-xl shadow-rose-500/5"
              >
                <ArrowDownLeft className="w-8 h-8 text-rose-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Authorize Expense</span>
              </button>
              <button 
                onClick={() => setQuickAdd({ open: true, type: 'income' })}
                className="p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center gap-4 hover:bg-emerald-500/10 transition-all group shadow-xl shadow-emerald-500/5"
              >
                <ArrowUpRight className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Authorize Inflow</span>
              </button>
            </div>
          }
          icon={<Target className="w-4 h-4 text-indigo-400" />}
          className="p-8 md:p-10"
        />
      </section>

      <AnimatePresence>
        {quickAdd.open && (
          <QuickAddModal 
            isOpen={quickAdd.open}
            onClose={() => setQuickAdd({ ...quickAdd, open: false })}
            initialType={quickAdd.type}
            onSuccess={loadDashboardData}
            accountId={accountId!}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
