'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { insightsService, type FinancialInsight } from '@/lib/services/insights.service';
import { transactionService, PopulatedTransaction } from '@/lib/services/transaction.service';
import { loanTrackerService } from '@/lib/services/loan-tracker.service';
import { APP_TEXTS } from '@/config/branding';
import { walletService } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { SpendingChart } from '@/components/charts/spending-chart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Bell,
  Zap,
  ShieldCheck,
  Target,
  Wallet,
  PiggyBank,
  Receipt,
  PieChart,
} from 'lucide-react';
import { QuickAddModal } from '@/components/transaction/quick-add-modal';
import NumberTicker from '@/components/ui/number-ticker';
import { BentoGridItem } from '@/components/ui/bento-grid';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { accountId, appSettings } = useApp();
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
  const [dateFilter, setDateFilter] = useState('Bulan Ini');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: 'income' | 'expense' | 'transfer' }>({
    open: false,
    type: 'expense',
  });

  const loadDashboardData = useCallback(async () => {
    if (!accountId) return;
    try {
      const now = new Date();
      const startDate = new Date();
      
      switch(dateFilter) {
        case 'Hari Ini':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Minggu Ini':
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
          startDate.setDate(diff);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'Bulan Ini':
        default:
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      const { data: monthTxs } = await transactionService.getTransactions(accountId, {
        startDate: startDate.toISOString(),
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
        totalTarget: 50000000, 
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
  }, [accountId, dateFilter, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboardData();
  }, [loadDashboardData, dateFilter]);

  const HeroWidgets = [
    { label: APP_TEXTS.dashboard.hero.liquidity, value: financialStats.totalBalance, icon: Wallet, color: 'text-emerald-400', path: '/wallets' },
    { label: APP_TEXTS.dashboard.hero.income, value: financialStats.income, icon: TrendingUp, color: 'text-emerald-400', action: () => setQuickAdd({ open: true, type: 'income' }) },
    { label: APP_TEXTS.dashboard.hero.expense, value: financialStats.expense, icon: TrendingDown, color: 'text-rose-400', action: () => setQuickAdd({ open: true, type: 'expense' }) },
    { label: APP_TEXTS.dashboard.hero.savings, value: financialStats.savings, icon: PiggyBank, color: 'text-amber-400', path: '/savings' },
  ];

  const ActionWidgets = [
    { label: APP_TEXTS.dashboard.actions.analysis, desc: APP_TEXTS.dashboard.actions.analysis_desc, icon: PieChart, path: '/insights' },
    { label: APP_TEXTS.dashboard.actions.history, desc: APP_TEXTS.dashboard.actions.history_desc, icon: Receipt, path: '/transactions' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase font-outfit"
          >
            {APP_TEXTS.branding.name} <span className="text-emerald-500">{APP_TEXTS.branding.tagline}</span>
          </motion.h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] font-outfit">
            {APP_TEXTS.dashboard.subtitle} • {APP_TEXTS.branding.version}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <Select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'Hari Ini', label: 'Hari Ini' },
                { value: 'Minggu Ini', label: 'Minggu Ini' },
                { value: 'Bulan Ini', label: 'Bulan Ini' }
              ]}
              className="rounded-[24px] bg-white/[0.03] backdrop-blur-3xl border-white/5 py-3 h-auto min-w-[140px]"
            />
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-3.5 rounded-[24px] bg-white/[0.03] backdrop-blur-3xl border border-white/5 text-white hover:bg-white/[0.08] transition-all relative shadow-xl shadow-emerald-500/5 cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-3 right-3 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 p-6 rounded-[32px] bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-[100]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Notifikasi</h4>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">Baru</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-[20px] bg-white/[0.03] border border-white/5 space-y-2">
                      <p className="text-[11px] font-bold text-white uppercase tracking-tight">Sistem Optimal</p>
                      <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase">Seluruh node protokol berjalan normal. Tidak ada anomali terdeteksi.</p>
                    </div>
                    <button onClick={() => setIsNotificationsOpen(false)} className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">Tutup</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Hero 4 Widgets */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {HeroWidgets.map((w, i) => (
          <motion.button
            key={w.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20, 
              delay: i * 0.05 
            }}
            onClick={() => w.action ? w.action() : router.push(w.path!)}
            className="relative group p-6 md:p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all text-left overflow-hidden shadow-2xl shadow-black/30 hover:shadow-emerald-500/10 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity" />
            <w.icon className={`w-6 h-6 md:w-8 md:h-8 ${w.color} mb-4 md:mb-6 transition-transform group-hover:scale-110`} />
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">{w.label}</p>
              <div className="text-lg md:text-2xl font-black text-white tracking-tighter truncate">
                <NumberTicker value={w.value} formatter={formatRupiah} />
              </div>
            </div>
          </motion.button>
        ))}
      </section>

      {/* Main Analysis Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <Card glass className="xl:col-span-2 p-8 md:p-10 border-emerald-500/10 rounded-[32px]">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Zap className="w-5 h-5 text-emerald-400" /> Kecepatan Belanja
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Audit Konsumsi 7 Hari</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <SpendingChart data={chartData} />
          </div>
        </Card>

        <Card glass className="p-8 md:p-10 border-white/5 rounded-[32px] flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="w-14 h-14 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-inner">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="text-5xl font-black text-white italic tracking-tighter shadow-emerald-500/20 drop-shadow-2xl">{financialStats.score}</div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-white/40">{appSettings.app_name || 'FinanceApp'} Indeks Kesehatan</span>
                <span className="text-white">Kalkulasi AI</span>
              </div>
              <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${financialStats.score}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.6)]" 
                />
              </div>
            </div>
            <p className="text-[11px] font-bold text-white/50 leading-relaxed uppercase tracking-tight">
              Kapasitas operasional pada <span className="text-white">Level Optimal</span>. Pola terdeteksi dalam batas aman.
            </p>
          </div>
          <Button variant="nexus-emerald" className="w-full mt-8 py-6 h-auto" onClick={() => router.push('/insights')}>
            Lihat Detail Audit
          </Button>
        </Card>
      </section>

      {/* Action Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {ActionWidgets.map((w, i) => (
          <motion.button
            key={w.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30, 
              delay: 0.2 + (i * 0.05) 
            }}
            className="group flex items-center gap-6 p-6 md:p-8 rounded-[32px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all text-left shadow-2xl shadow-black/30 hover:shadow-emerald-500/10"
          >
            <div className="w-14 h-14 rounded-[24px] bg-white/[0.05] border border-white/10 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
              <w.icon className="w-6 h-6 text-white/60 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="text-sm font-black text-white uppercase tracking-widest">{w.label}</h4>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight">{w.desc}</p>
            </div>
          </motion.button>
        ))}
      </section>

      {/* Recent Ledger & Terminal */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <BentoGridItem
          title="Riwayat Sesi"
          description="Entri terdeteksi dalam siklus ini"
          header={
            <div className="space-y-4 h-full">
              {recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 rounded-[24px] bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-colors group shadow-md shadow-black/20">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black text-white uppercase tracking-tight truncate max-w-[120px] md:max-w-[180px] block">{tx.note || 'Transaksi Tanpa Label'}</span>
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
          icon={<ArrowRightLeft className="w-4 h-4 text-emerald-400" />}
          className="p-8 md:p-10 rounded-[32px] border border-white/5 bg-white/[0.02] shadow-2xl shadow-black/30"
        />

        <BentoGridItem
          title="Analisis Margin"
          description="Estimasi kapasitas sisa belanja"
          header={
            <div className="flex flex-col items-center justify-center h-full p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 space-y-4">
              <div className="text-4xl font-black text-emerald-400 tracking-tighter italic">74%</div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </div>
              <p className="text-[9px] font-black text-emerald-400/40 uppercase tracking-[0.2em] text-center">Dalam Ambang Batas Aman</p>
            </div>
          }
          icon={<Target className="w-4 h-4 text-emerald-400" />}
          className="p-8 md:p-10 rounded-[32px] border border-white/5 bg-white/[0.02] shadow-2xl shadow-black/30"
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
