'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { useToast } from '@/components/ui/toast';
import { insightsService, type FinancialInsight } from '@/lib/services/finance/insights.service';
import { transactionService, type PopulatedTransaction } from '@/lib/services/workspace/transaction.service';
import { debtService } from '@/lib/services/finance/debt.service';
import { type LoanTracker } from '@/lib/debt-planner/types';
import { walletService } from '@/lib/services/workspace/wallet.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Bell, ArrowRight, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { BentoGridItem } from '@/components/ui/bento-grid';
import NumberTicker from '@/components/ui/number-ticker';
import { QuickAddModal } from '@/components/finance/transaction/QuickAdd';
import { budgetOptimizerService, type OptimizationSuggestion } from '@/lib/services/finance/budget-optimizer.service';
import { budgetService } from '@/lib/services/finance/budget.service';
import { BudgetOptimizerWidget } from '@/components/finance/dashboard/BudgetOptimizerWidget';
import { SpendingChart } from '@/components/charts/spending-chart';
export default function DashboardPage() {
  const { accountId, profile, language, t } = useApp();
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
    activeLoans: [] as LoanTracker[],
    totalRemainingDebt: 0,
    nextDueDate: null as Date | null,
  });

  const [recentTxs, setRecentTxs] = useState<PopulatedTransaction[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [financialStatusText, setFinancialStatusText] = useState(t('dashboard.status.loading', 'Memuat analisis finansial...'));
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: 'income' | 'expense' | 'transfer' }>({
    open: false,
    type: 'expense',
  });
  const [optimizerSuggestions, setOptimizerSuggestions] = useState<OptimizationSuggestion[]>([]);


  const loadDashboardData = useCallback(async () => {
    if (!accountId) return;
    try {
      const now = new Date();
      const startDate = new Date();
      const widerStartDate = new Date();

      type BucketMode = 'hour' | 'day' | 'weekday' | 'month';
      let bucketMode: BucketMode = 'day';

      switch (dateFilter) {
        case 'today': {
          startDate.setTime(startOfDay(now).getTime());
          bucketMode = 'hour';
          widerStartDate.setTime(subDays(startDate, 1).getTime());
          break;
        }
        case 'thisWeek': {
          startDate.setTime(startOfWeek(now, { weekStartsOn: 1 }).getTime());
          bucketMode = 'weekday';
          widerStartDate.setTime(subDays(startDate, 7).getTime());
          break;
        }
        case 'last3Months': {
          startDate.setTime(startOfMonth(subMonths(now, 3)).getTime());
          bucketMode = 'month';
          widerStartDate.setTime(subMonths(startDate, 3).getTime());
          break;
        }
        case 'thisMonth':
        default: {
          startDate.setTime(startOfMonth(now).getTime());
          bucketMode = 'day';
          widerStartDate.setTime(startOfMonth(subMonths(now, 1)).getTime());
          break;
        }
      }

      const { data: allTxs } = await transactionService.getTransactions(accountId, {
        startDate: widerStartDate.toISOString(),
        limit: 2000,
      });

      const txs = allTxs.filter(tx => new Date(tx.date) >= startDate);
      const prevTxs = allTxs.filter(tx => new Date(tx.date) >= widerStartDate && new Date(tx.date) < startDate);

      const [insightData, wallets, trackers, suggestions] = await Promise.all([
        insightsService.generateInsights(accountId, { prefetchedTransactions: txs }),
        walletService.getWallets(accountId),
        debtService.getLoanTrackers(accountId),
        budgetOptimizerService.getOptimizationSuggestions(accountId),
      ]);
      setOptimizerSuggestions(suggestions);


      let prevIncome = 0;
      let prevExpense = 0;
      prevTxs.forEach((t) => {
        const amt = Number(t.amount);
        if (t.type === 'income') {
          prevIncome += amt;
        } else if (t.type === 'expense') {
          prevExpense += amt;
        }
      });
      const currentSavings = insightData.income - insightData.expense;

      let diffPercent = 0;
      if (prevIncome !== 0) {
        diffPercent = ((currentSavings - (prevIncome - prevExpense)) / Math.abs(prevIncome - prevExpense || 1)) * 100;
      }

      const diffStr = diffPercent >= 0 ? `+${diffPercent.toFixed(0)}%` : `${diffPercent.toFixed(0)}%`;

      const activeLoans = trackers.filter(l => l.status === 'active');
      const totalMonthlyDebtPayment = activeLoans.reduce((sum, l) => sum + Number(l.monthly_payment), 0);
      const totalRemainingDebt = activeLoans.reduce((sum, l) => sum + Number(l.total_remaining_balance || 0), 0);
      const nextDue = activeLoans.length > 0 ? new Date(Math.min(...activeLoans.map(l => new Date(l.start_date).getTime()))) : null;

      let statusMsg = '';
      if (activeLoans.length > 0) {
        const debtRatio = (totalMonthlyDebtPayment / (insightData.income || 1)) * 100;

        if (currentSavings < 0) {
          statusMsg = t('dashboard.status.loanNegativeSavings', "Waspada, gaji kamu sudah 'kemakan' pinjol sebesar {savings}. Bulan ini ada tagihan {debt} yang harus dibayar. Tetap tenang, fokus lunasi yang terkecil dulu ya!")
            .replace('{savings}', formatCurrency(Math.abs(currentSavings)))
            .replace('{debt}', formatCurrency(totalMonthlyDebtPayment));
        } else if (debtRatio > 50) {
          statusMsg = t('dashboard.status.loanHighDebtRatio', 'Hati-hati, lebih dari 50% pendapatan kamu habis buat bayar hutang. Sisa uang kamu tinggal {savings}. Jangan impulsif belanja dulu ya!')
            .replace('{savings}', formatCurrency(currentSavings));
        } else {
          statusMsg = t('dashboard.status.loanNormal', 'Ada tagihan aktif {debt} bulan ini. Tabungan kamu masih surplus {savings}, yuk jaga disiplin biar cepat bebas hutang!')
            .replace('{debt}', formatCurrency(totalMonthlyDebtPayment))
            .replace('{savings}', formatCurrency(currentSavings));
        }
      } else {
        if (currentSavings >= 0) {
          if (diffPercent >= 0) {
            statusMsg = t('dashboard.status.noLoanHealthy', 'Keren! Keuangan kamu lagi sehat banget dan ada kenaikan tabungan {diff}. Pertahaman pola hidup hematnya ya!')
              .replace('{diff}', diffStr);
          } else {
            statusMsg = t('dashboard.status.noLoanDecreased', 'Tabungan kamu bulan ini aman, tapi sedikit turun {diff} dibanding periode lalu. Cek lagi pengeluaran kecil yang nggak perlu ya.')
              .replace('{diff}', diffStr);
          }
        } else {
          statusMsg = t('dashboard.status.noLoanNegative', 'Duh, bulan ini kamu minus {savings}. Coba cek riwayat transaksi buat cari tahu bocor halusnya di mana.')
            .replace('{savings}', formatCurrency(Math.abs(currentSavings)));
        }
      }
      setFinancialStatusText(statusMsg);

      const convertedBalances = await Promise.all(
        wallets.map(w => currencyService.convert(Number(w.balance), w.currency || 'IDR', 'IDR'))
      );
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
        totalRemainingDebt,
        nextDueDate: nextDue,
      });

      setRecentTxs(txs.slice(0, 6));

      const HARI = language === 'en'
        ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        : ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      const BULAN_ID = language === 'en'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

      const aggregation: { [key: string]: number } = {};

      if (bucketMode === 'hour') {
        for (let h = 0; h < 24; h++) {
          aggregation[`${String(h).padStart(2, '0')}:00`] = 0;
        }
        txs.forEach(tx => {
          if (tx.type === 'expense') {
            const key = `${String(new Date(tx.date).getHours()).padStart(2, '0')}:00`;
            if (key in aggregation) aggregation[key] += Number(tx.amount);
          }
        });

      } else if (bucketMode === 'weekday') {
        const monday = new Date(startDate);
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const key = `${HARI[d.getDay()]} ${d.getDate()}`;
          aggregation[key] = 0;
        }
        txs.forEach(tx => {
          if (tx.type === 'expense') {
            const d = new Date(tx.date);
            const key = `${HARI[d.getDay()]} ${d.getDate()}`;
            if (key in aggregation) aggregation[key] += Number(tx.amount);
          }
        });

      } else if (bucketMode === 'month') {
        for (let m = 2; m >= 0; m--) {
          const d = new Date();
          d.setMonth(d.getMonth() - m);
          aggregation[BULAN_ID[d.getMonth()]] = 0;
        }
        txs.forEach(tx => {
          if (tx.type === 'expense') {
            const key = BULAN_ID[new Date(tx.date).getMonth()];
            if (key in aggregation) aggregation[key] += Number(tx.amount);
          }
        });

      } else {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          const key = `${i} ${BULAN_ID[now.getMonth()]}`;
          aggregation[key] = 0;
        }
        txs.forEach(tx => {
          if (tx.type === 'expense') {
            const d = new Date(tx.date);
            const key = `${d.getDate()} ${BULAN_ID[d.getMonth()]}`;
            if (key in aggregation) aggregation[key] += Number(tx.amount);
          }
        });
      }

      setChartData(Object.entries(aggregation).map(([date, amount]) => ({ date, amount })));

    } catch {
      toast(t('dashboard.error.loadFailed', 'Terjadi kesalahan saat memuat data dashboard.'), 'danger');
    }
  }, [accountId, dateFilter, toast, language, t]);

  const handleApplyOptimization = async (suggestion: OptimizationSuggestion) => {
    if (!accountId) return;
    try {
      await budgetService.createBudget(
        accountId,
        suggestion.categoryId,
        suggestion.suggestedBudget
      );
      toast(
        t('dashboard.success.optimizeSuccess', 'Anggaran {category} berhasil dioptimalkan!').replace('{category}', suggestion.categoryName),
        'success'
      );
      loadDashboardData();
    } catch {
      toast(t('dashboard.error.optimizeFailed', 'Gagal mengoptimalkan anggaran.'), 'danger');
    }
  };


  useEffect(() => {
    const init = async () => {
      await loadDashboardData();
    };
    init();
  }, [loadDashboardData]);


  const HeroWidgets = [
    { label: t('dashboard.hero.netWorth', 'Total Aset Bersih (Gabungan Dompet)'), value: financialStats.totalBalance, icon: Wallet, color: 'text-emerald-400', colorCode: 'var(--nexus-success)', path: '/finance/wallets' },
    { label: t('dashboard.widget.income', 'Pemasukan'), value: financialStats.income, icon: TrendingUp, color: 'text-emerald-400', colorCode: 'var(--nexus-success)', action: () => setQuickAdd({ open: true, type: 'income' }) },
    { label: t('dashboard.widget.expense', 'Pengeluaran'), value: financialStats.expense, icon: TrendingDown, color: 'text-rose-400', colorCode: 'var(--nexus-danger)', action: () => setQuickAdd({ open: true, type: 'expense' }) },
    { label: t('dashboard.widget.savings', 'Sisa Tabungan'), value: financialStats.savings, icon: PiggyBank, color: 'text-amber-400', colorCode: 'var(--nexus-warning)', path: '/finance/savings' },
  ];


  return (
    <div className="space-y-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-0.5">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase font-outfit"
          >
            {t('dashboard.greeting', 'Halo, ')}<span className="text-emerald-500">{profile?.full_name || 'User'}!</span>
          </motion.h1>
          <p className="text-[10px] font-semibold text-white/50 font-outfit animate-pulse">
            {financialStatusText}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'today', label: t('common.today', 'Hari Ini') },
                { value: 'thisWeek', label: t('common.thisWeek', 'Minggu Ini') },
                { value: 'thisMonth', label: t('common.thisMonth', 'Bulan Ini') },
                { value: 'last3Months', label: t('common.last3Months', '3 Bulan Terakhir') },
              ]}
              className="rounded-[24px] bg-white/[0.03] backdrop-blur-3xl border-white/5 py-3 h-auto min-w-[180px]"
            />
          </div>

          <div className="flex items-center gap-2.5">
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
                  <>
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setIsNotificationsOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 p-6 rounded-[32px] bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-[100]"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
                          {t('dashboard.notifications', 'Notifikasi')}
                        </h4>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-md">
                          {t('dashboard.notifications.new', 'Baru')}
                        </span>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-[20px] bg-white/[0.03] border border-white/5 space-y-2">
                          <p className="text-[11px] font-bold text-white uppercase tracking-tight">
                            {t('dashboard.notifications.statusInsight', 'Status Insight')}
                          </p>
                          <p className="text-[9px] font-medium text-white/40 leading-relaxed uppercase">
                            {financialStats.score >= 80 ? t('dashboard.notifications.scoreOptimal', 'Kesehatan finansial optimal. Pertahankan rasio tabungan.') : 
                             financialStats.score >= 50 ? t('dashboard.notifications.scoreStable', 'Kondisi stabil namun perlu waspada pengeluaran impulsif.') :
                             t('dashboard.notifications.scoreCritical', 'Peringatan: Arus kas kritis. Segera audit pengeluaran.')}
                          </p>
                        </div>

                        {financialStats.activeLoansCount > 0 && (
                          <button 
                            onClick={() => { setIsNotificationsOpen(false); router.push('/pinjol'); }}
                            className="w-full p-4 rounded-[20px] bg-rose-500/5 border border-rose-500/20 text-left hover:bg-rose-500/10 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-[11px] font-bold text-rose-500 uppercase tracking-tight">
                                {t('dashboard.notifications.debtWarning', 'Peringatan Utang')}
                              </p>
                              <ArrowRight className="w-3 h-3 text-rose-500 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <p className="text-[9px] font-medium text-rose-500/60 leading-relaxed uppercase">
                              {t('dashboard.notifications.debtWarningDesc', 'Ada {count} tagihan aktif. Klik untuk manajemen pelunasan.').replace('{count}', String(financialStats.activeLoansCount))}
                            </p>
                          </button>
                        )}
                        
                        <button onClick={() => setIsNotificationsOpen(false)} className="w-full py-3 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors">
                          {t('common.close', 'Tutup')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Hero 4 Widgets */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {HeroWidgets.map((w, i) => (
          <motion.button
            key={w.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => w.action ? w.action() : router.push(w.path!)}
            className={`relative group p-8 rounded-[32px] bg-[#0A0A0C] border border-white/5 transition-all text-left overflow-hidden cursor-pointer shadow-2xl min-h-[140px] flex flex-col justify-between`}
            style={{
              background: `radial-gradient(circle at top right, color-mix(in srgb, ${w.colorCode} 25%, transparent), transparent 70%)`
            }}
          >
            <w.icon className={`w-6 h-6 ${w.color} mb-4 transition-transform group-hover:scale-110 relative z-10`} />
            <div className="space-y-1 relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{w.label}</p>
              <div className="text-lg md:text-2xl font-black text-white tracking-tighter truncate">
                <NumberTicker value={w.value} formatter={formatCurrency} />
              </div>
            </div>
          </motion.button>
        ))}
      </section>

      {/* Main Analysis Section */}
      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <Card glass className="xl:col-span-3 p-6 border-emerald-500/10 rounded-[32px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-400" /> {t('dashboard.chart.expenseTrendsTitle', 'GRAFIK PENGELUARAN')}
            </h3>
          </div>
          <div className="h-[280px] w-full -ml-4 min-w-0">
            <SpendingChart data={chartData} />
          </div>
        </Card>

        <Card glass className="p-6 border-white/5 rounded-[32px] flex flex-col justify-between min-h-[320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-black text-white italic tracking-tighter">{financialStats.score}</div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/40">
                <span>{t('dashboard.hero.scoreLabel', 'Skor Kesehatan')} AI</span>
                <span className={financialStats.score > 70 ? "text-emerald-400" : "text-amber-400"}>
                  {financialStats.score > 70 ? t('dashboard.health.optimal', 'Optimal') : t('dashboard.health.needAudit', 'Perlu Audit')}
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${financialStats.score}%` }}
                  transition={{ delay: 0.5 }}
                  className={`h-full ${financialStats.score > 70 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"}`}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-[10px] font-bold text-white/70 leading-relaxed uppercase tracking-tight border-l-4 border-emerald-500/30 pl-3 py-0.5 line-clamp-3">
                {financialStatusText}
              </p>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">
                    {t('dashboard.metrics.trend', 'Trend')}
                  </p>
                  <p className={`text-[10px] font-black ${financialStats.savingsDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {financialStats.savingsDiff >= 0 ? '▲' : '▼'} {Math.abs(financialStats.savingsDiff).toFixed(1)}%
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest">
                    {t('dashboard.metrics.debt', 'Utang')}
                  </p>
                  <p className={`text-[10px] font-black ${financialStats.activeLoansCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {financialStats.activeLoansCount > 0 ? `${financialStats.activeLoansCount} ${t('dashboard.metrics.active', 'Aktif')}` : t('dashboard.metrics.clean', 'Bersih')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Button variant="nexus-emerald" className="w-full mt-4 py-3 h-auto text-[10px] font-black uppercase tracking-widest" onClick={() => router.push('/insights')}>
            {t('dashboard.actions.viewRecommendations', 'Lihat Rekomendasi')}
          </Button>
        </Card>

        {/* AI Budget Optimizer Widget */}
        <div className="xl:col-span-1">
          <BudgetOptimizerWidget 
            suggestions={optimizerSuggestions} 
            onApply={handleApplyOptimization}
          />
        </div>
      </section>



      <div className="py-4" /> {/* Compact spacer between above-the-fold and below-the-fold content */}

      {/* Bottom Grid: Analysis + Activity + Debt */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Widget 1: Tren Kategori */}
        <BentoGridItem
          title={t('dashboard.chart.categoriesTitle', 'TREN KATEGORI')}
          description={t('dashboard.chart.categoriesDesc', 'Alokasi Pengeluaran')}
          header={
            <div className="flex flex-col h-full gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">
                    {t('dashboard.metrics.fundAllocation', 'Alokasi Dana')}
                  </span>
                  <span className="text-xl font-black text-emerald-400 italic">65% <span className="text-[8px] not-italic text-white/20">{t('dashboard.metrics.efficient', 'Efisien')}</span></span>
                </div>
                <div className="h-5 w-full bg-white/[0.03] rounded-2xl overflow-hidden flex p-1 border border-white/5">
                  <div className="h-full bg-emerald-500 rounded-[8px] flex items-center justify-center relative" style={{ width: '65%' }}>
                    <div className="absolute inset-0 bg-white/10" />
                  </div>
                  <div className="h-full bg-rose-500/80 rounded-[8px] mx-0.5" style={{ width: '25%' }} />
                  <div className="h-full bg-amber-500/80 rounded-[8px]" style={{ width: '10%' }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {[
                  { label: t('dashboard.categories.needs', 'Kebutuhan'), value: 'Rp4.8M', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                  { label: t('dashboard.categories.installments', 'Cicilan'), value: 'Rp1.2M', color: 'text-rose-400', bg: 'bg-rose-500/5' },
                  { label: t('dashboard.categories.savings', 'Tabungan'), value: 'Rp800K', color: 'text-amber-400', bg: 'bg-amber-500/5' },
                  { label: t('dashboard.categories.others', 'Lainnya'), value: 'Rp450K', color: 'text-blue-400', bg: 'bg-blue-500/5' },
                ].map((cat) => (
                  <div key={cat.label} className={`p-4 rounded-[20px] ${cat.bg} border border-white/5 flex flex-col justify-center`}>
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">{cat.label}</p>
                    <p className={`text-sm font-black ${cat.color}`}>{cat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          }
          className="p-6 rounded-[28px] border border-white/5 bg-white/[0.02] shadow-xl flex flex-col h-full"
        />

        <BentoGridItem
          title={t('dashboard.insights.recentActivity', 'LOG AKTIVITAS')}
          description={t('dashboard.insights.recentActivityDesc', '3 Transaksi Terakhir')}
          header={
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="space-y-3">
                {recentTxs.slice(0, 3).map((tx) => (
                  <button 
                    key={tx.id} 
                    onClick={() => router.push(`/transactions?id=${tx.id}`)}
                    className="w-full flex items-center justify-between p-3.5 rounded-[18px] bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <span className="text-[11px] font-bold text-white truncate">{tx.note || '-'}</span>
                    </div>
                    <span className={`text-[11px] font-black shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                    </span>
                  </button>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white"
                onClick={() => router.push('/transactions')}
              >
                {t('dashboard.actions.viewAll', 'Lihat Semua Sesi')}
              </Button>
            </div>
          }
          className="p-6 rounded-[28px] border border-white/5 bg-white/[0.02] shadow-xl flex flex-col h-full"
        />

        <BentoGridItem
          title={<span className="text-rose-500 font-black">{t('dashboard.widget.pinjolEmergency', 'DARURAT PINJOL')}</span>}
          description={t('dashboard.widget.pinjolStatus', 'Status Cicilan & Tagihan')}
          icon={<AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />}
          header={
            <div className="flex flex-col h-full justify-between gap-4">
              <div className="p-5 rounded-[24px] bg-white/[0.03] border border-rose-500/20 space-y-3">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">
                    {t('dashboard.metrics.totalLiability', 'Total Kewajiban')}
                  </p>
                  <p className="text-xl font-black text-rose-500 leading-none">
                    <NumberTicker value={financialStats.totalRemainingDebt} formatter={formatCurrency} />
                  </p>
                </div>
                <div className="h-1 w-full bg-rose-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {financialStats.activeLoans.length > 0 ? (
                  financialStats.activeLoans.slice(0, 2).map((loan) => (
                    <div key={loan.id} className="p-3.5 rounded-[18px] bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black text-white uppercase">{loan.app_name || 'Pinjol'}</p>
                        <p className="text-[9px] font-bold text-rose-400/60 uppercase">
                          {t('dashboard.metrics.activeNode', 'Node Aktif')} • {loan.category.toUpperCase()}
                        </p>
                      </div>
                      <p className="text-[11px] font-black text-white">{formatCurrency(Number(loan.monthly_payment))}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center rounded-[18px] bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-widest">
                      {t('dashboard.metrics.noActiveBills', 'Tidak Ada Tagihan Aktif')}
                    </p>
                  </div>
                )}
              </div>

              <Button 
                variant="outline" 
                className="w-full py-3.5 h-auto text-[10px] font-black uppercase tracking-widest border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white transition-all rounded-2xl bg-white/[0.03]"
                onClick={() => router.push('/pinjol')}
              >
                {t('dashboard.actions.manageDebt', 'MANAJEMEN UTANG')}
              </Button>
            </div>
          }
          className="p-6 rounded-[28px] border border-white/5 bg-[#0A0A0C] shadow-2xl relative overflow-hidden flex flex-col h-full"
          style={{
            background: `radial-gradient(circle at top right, color-mix(in srgb, var(--nexus-danger) 20%, transparent), transparent 70%)`
          }}
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
