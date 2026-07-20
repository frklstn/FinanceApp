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
import { Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import NumberTicker from '@/components/ui/number-ticker';
import { PageHeader } from '@/components/shared/layout/page-header';
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
  /** 4 kategori pengeluaran terbesar pada periode terpilih. */
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; amount: number; share: number }[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [financialStatusText, setFinancialStatusText] = useState(t('dashboard.status.loading', 'Memuat analisis finansial...'));
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: 'income' | 'expense' | 'transfer' }>({
    open: false,
    type: 'expense',
  });
  const [optimizerSuggestions, setOptimizerSuggestions] = useState<OptimizationSuggestion[]>([]);


  const loadDashboardData = useCallback(async () => {
    if (!accountId) return;
    // Rentang kustom belum lengkap: tahan dulu, jangan query dengan tanggal kosong.
    if (dateFilter === 'custom' && (!customStart || !customEnd)) return;
    try {
      const now = new Date();
      const startDate = new Date();
      const widerStartDate = new Date();
      // Batas akhir periode. Selain rentang kustom, periode selalu berakhir
      // sekarang.
      let endDate = now;

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
        case 'custom': {
          // DatePicker mengirim YYYY-MM-DD tanpa jam; tanggal akhir dijadikan
          // akhir hari supaya transaksi pada tanggal itu ikut terhitung.
          startDate.setTime(startOfDay(new Date(customStart)).getTime());
          endDate = new Date(`${customEnd}T23:59:59.999`);
          const spanDays = (endDate.getTime() - startDate.getTime()) / 86_400_000;
          bucketMode = spanDays > 92 ? 'month' : 'day';
          // Periode pembanding: rentang sepanjang periode terpilih, tepat sebelumnya.
          widerStartDate.setTime(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
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
        endDate: endDate.toISOString(),
        limit: 2000,
      });

      const txs = allTxs.filter(tx => new Date(tx.date) >= startDate && new Date(tx.date) <= endDate);
      const prevTxs = allTxs.filter(tx => new Date(tx.date) >= widerStartDate && new Date(tx.date) < startDate);

      const [insightData, wallets, trackers, manualDebts, suggestions] = await Promise.all([
        insightsService.generateInsights(accountId, { prefetchedTransactions: txs }),
        walletService.getWallets(accountId),
        debtService.getLoanTrackers(accountId),
        debtService.getDebts(accountId),
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
      // Total utang = sisa pinjol + utang manual yang masih harus dibayar.
      // Sebelumnya hanya pinjol; utang manual di halaman Utang tak terhitung.
      const manualOwed = manualDebts
        .filter(d => d.type === 'owe' && d.status !== 'settled')
        .reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);
      const totalRemainingDebt =
        activeLoans.reduce((sum, l) => sum + Number(l.total_remaining_balance || 0), 0) + manualOwed;
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

      // Rincian kategori dihitung dari transaksi periode ini. Sebelumnya kartu
      // ini menampilkan angka hardcoded (65% / Rp4.8jt / dst) yang tidak ada
      // hubungannya dengan data pengguna.
      const catTotals = new Map<string, number>();
      txs.forEach((tx) => {
        if (tx.type !== 'expense') return;
        const name = tx.categories?.name || t('dashboard.categories.others', 'Lainnya');
        catTotals.set(name, (catTotals.get(name) || 0) + Number(tx.amount));
      });
      const totalExpense = [...catTotals.values()].reduce((sum, v) => sum + v, 0);
      setCategoryBreakdown(
        [...catTotals.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, amount]) => ({
            name,
            amount,
            share: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
          }))
      );

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
  }, [accountId, dateFilter, customStart, customEnd, toast, language, t]);

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
    { label: t('dashboard.hero.netWorth', 'Total aset bersih (gabungan dompet)'), value: financialStats.totalBalance, icon: Wallet, color: 'text-[var(--nexus-text-emerald)]', path: '/finance/wallets' },
    { label: t('dashboard.widget.income', 'Pemasukan'), value: financialStats.income, icon: TrendingUp, color: 'text-[var(--nexus-text-emerald)]', action: () => setQuickAdd({ open: true, type: 'income' }) },
    { label: t('dashboard.widget.expense', 'Pengeluaran'), value: financialStats.expense, icon: TrendingDown, color: 'text-rose-600 dark:text-rose-400', action: () => setQuickAdd({ open: true, type: 'expense' }) },
    { label: t('dashboard.widget.savings', 'Sisa tabungan'), value: financialStats.savings, icon: PiggyBank, color: 'text-amber-600 dark:text-amber-400', path: '/finance/savings' },
  ];


  return (
    <div className="space-y-4">
      <PageHeader
        title={t('dashboard.greeting', 'Halo,')}
        accent={profile?.full_name || 'User'}
        subtitle={financialStatusText}
        actions={
          <>
          <div className="flex-1 md:flex-none">
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              options={[
                { value: 'today', label: t('common.today', 'Hari Ini') },
                { value: 'thisWeek', label: t('common.thisWeek', 'Minggu Ini') },
                { value: 'thisMonth', label: t('common.thisMonth', 'Bulan Ini') },
                { value: 'last3Months', label: t('common.last3Months', '3 Bulan Terakhir') },
                { value: 'custom', label: t('common.customRange', 'Pilih tanggal') },
              ]}
              className="min-w-[180px]"
            />
          </div>

          {dateFilter === 'custom' && (
            <div className="flex flex-1 items-center gap-2">
              <DatePicker value={customStart} onChange={setCustomStart} placeholder={t('common.from', 'Dari')} className="min-w-0 flex-1 md:min-w-[150px] md:flex-none" />
              <DatePicker value={customEnd} onChange={setCustomEnd} placeholder={t('common.to', 'Sampai')} className="min-w-0 flex-1 md:min-w-[150px] md:flex-none" />
            </div>
          )}

          </>
        }
      />

      {/* Hero 4 Widgets */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {HeroWidgets.map((w, i) => (
          <motion.button
            key={w.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => w.action ? w.action() : router.push(w.path!)}
            className="nexus-card relative group p-4 md:p-6 text-left overflow-hidden cursor-pointer min-h-[120px] md:min-h-[140px] flex flex-col justify-between"
          >
            <w.icon className={`w-5 h-5 ${w.color} mb-3 md:mb-4 transition-transform group-hover:scale-110`} />
            <div className="space-y-1">
              <p className="text-xs text-[var(--nexus-text-secondary)]">{w.label}</p>
              <div className="text-lg md:text-2xl font-semibold text-[var(--nexus-text-primary)] tracking-tight truncate">
                <NumberTicker value={w.value} formatter={formatCurrency} />
              </div>
            </div>
          </motion.button>
        ))}
      </section>

      {/* Main Analysis Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading text-base font-semibold text-[var(--nexus-text-primary)] flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-[var(--nexus-text-emerald)]" /> {t('dashboard.chart.expenseTrendsTitle', 'Grafik pengeluaran')}
            </h3>
          </div>
          <div className="h-[280px] w-full -ml-4 min-w-0">
            <SpendingChart data={chartData} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between min-h-[320px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[var(--nexus-text-emerald)]" />
              </div>
              <div className="font-heading text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">{financialStats.score}</div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--nexus-text-secondary)]">
                <span>{t('dashboard.hero.scoreLabel', 'Skor kesehatan')}</span>
                <span className={financialStats.score > 70 ? "text-[var(--nexus-success)]" : "text-amber-600 dark:text-amber-400"}>
                  {financialStats.score > 70 ? t('dashboard.health.optimal', 'Optimal') : t('dashboard.health.needAudit', 'Perlu audit')}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${financialStats.score}%` }}
                  transition={{ delay: 0.5 }}
                  className={`h-full ${financialStats.score > 70 ? "bg-[var(--nexus-success)]" : "bg-amber-500"}`}
                />
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-xs text-[var(--nexus-text-secondary)] leading-relaxed line-clamp-3">
                {financialStatusText}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
                  <p className="text-[10px] text-[var(--nexus-text-muted)]">
                    {t('dashboard.metrics.trend', 'Tren')}
                  </p>
                  <p className={`text-xs font-semibold ${financialStats.savingsDiff >= 0 ? 'text-[var(--nexus-success)]' : 'text-rose-600 dark:text-rose-400'}`}>
                    {financialStats.savingsDiff >= 0 ? '▲' : '▼'} {Math.abs(financialStats.savingsDiff).toFixed(1)}%
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
                  <p className="text-[10px] text-[var(--nexus-text-muted)]">
                    {t('dashboard.metrics.debt', 'Utang')}
                  </p>
                  <p className={`text-xs font-semibold ${financialStats.activeLoansCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--nexus-success)]'}`}>
                    {financialStats.activeLoansCount > 0 ? `${financialStats.activeLoansCount} ${t('dashboard.metrics.active', 'aktif')}` : t('dashboard.metrics.clean', 'Bersih')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Button variant="nexus-emerald" className="w-full mt-4 py-3 h-auto text-xs" onClick={() => router.push('/finance/insights')}>
            {t('dashboard.actions.viewRecommendations', 'Lihat rekomendasi')}
          </Button>
        </Card>

        <Card className="flex flex-col h-full justify-between gap-4">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" /> {t('dashboard.widget.pinjolEmergency', 'Pinjol perlu perhatian')}
            </CardTitle>
            <CardDescription>{t('dashboard.widget.pinjolStatus', 'Status cicilan & tagihan')}</CardDescription>
          </CardHeader>
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-xs text-rose-600/70 dark:text-rose-400/70">
                {t('dashboard.metrics.totalLiability', 'Total kewajiban')}
              </p>
              <p className="text-lg font-semibold text-rose-600 dark:text-rose-400 leading-none">
                <NumberTicker value={financialStats.totalRemainingDebt} formatter={formatCurrency} />
              </p>
            </div>
            <div className="h-1 w-full bg-rose-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 w-full" />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {financialStats.activeLoans.length > 0 ? (
              financialStats.activeLoans.slice(0, 2).map((loan) => (
                <div key={loan.id} className="p-3.5 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-[var(--nexus-text-primary)]">{loan.app_name || 'Pinjol'}</p>
                    <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70">{loan.category}</p>
                  </div>
                  <p className="text-xs font-semibold text-[var(--nexus-text-primary)]">{formatCurrency(Number(loan.monthly_payment))}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
                <p className="text-xs text-[var(--nexus-text-muted)]">
                  {t('dashboard.metrics.noActiveBills', 'Tidak ada tagihan aktif')}
                </p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full py-3 h-auto text-xs border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
            onClick={() => router.push('/finance/pinjol')}
          >
            {t('dashboard.actions.manageDebt', 'Kelola utang')}
          </Button>
        </Card>
      </section>

      {/* Widget optimizer hanya dirender bila ada saran; sebelumnya pembungkusnya
          selalu ada sehingga menyisakan sel grid kosong. */}
      {optimizerSuggestions.length > 0 && (
        <BudgetOptimizerWidget
          suggestions={optimizerSuggestions}
          onApply={handleApplyOptimization}
        />
      )}



      <div className="py-4" /> {/* Compact spacer between above-the-fold and below-the-fold content */}

      {/* Bottom Grid: Analysis + Activity + Debt */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Widget 1: Tren Kategori */}
        <Card className="flex flex-col h-full gap-4">
          <CardHeader className="pb-0">
            <CardTitle>{t('dashboard.chart.categoriesTitle', 'Tren kategori')}</CardTitle>
            <CardDescription>{t('dashboard.chart.categoriesDesc', 'Alokasi pengeluaran')}</CardDescription>
          </CardHeader>
          {categoryBreakdown.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] flex-1 flex items-center justify-center">
              <p className="text-xs text-[var(--nexus-text-muted)]">
                {t('dashboard.chart.noExpense', 'Belum ada pengeluaran pada periode ini.')}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-[var(--nexus-text-secondary)]">
                    {t('dashboard.metrics.fundAllocation', 'Alokasi dana')}
                  </span>
                  <span className="text-lg font-semibold text-[var(--nexus-text-emerald)]">
                    {categoryBreakdown[0].share}%{' '}
                    <span className="text-xs font-normal text-[var(--nexus-text-muted)]">{categoryBreakdown[0].name}</span>
                  </span>
                </div>
                <div className="h-4 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[var(--nexus-glass-border)]">
                  {categoryBreakdown.map((cat, i) => (
                    <div
                      key={cat.name}
                      className={`h-full rounded-full ${['bg-[var(--nexus-emerald)]', 'bg-rose-500/70', 'bg-amber-500/70', 'bg-[var(--nexus-text-muted)]'][i]}`}
                      style={{ width: `${cat.share}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="p-3.5 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] flex flex-col justify-center">
                    <p className="text-[10px] text-[var(--nexus-text-secondary)] truncate">{cat.name}</p>
                    <p className={`text-sm font-semibold ${['text-[var(--nexus-text-emerald)]', 'text-rose-600 dark:text-rose-400', 'text-amber-600 dark:text-amber-400', 'text-[var(--nexus-text-secondary)]'][i]}`}>
                      {formatCurrency(cat.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="flex flex-col h-full justify-between gap-4">
          <CardHeader className="pb-0">
            <CardTitle>{t('dashboard.insights.recentActivity', 'Aktivitas terbaru')}</CardTitle>
            <CardDescription>{t('dashboard.insights.recentActivityDesc', '3 transaksi terakhir')}</CardDescription>
          </CardHeader>
          <div className="space-y-3 flex-1">
            {recentTxs.length === 0 && (
              <div className="p-6 text-center rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
                <p className="text-xs text-[var(--nexus-text-muted)]">
                  {t('dashboard.insights.noRecent', 'Belum ada transaksi pada periode ini.')}
                </p>
              </div>
            )}
            {recentTxs.slice(0, 3).map((tx) => (
              <button
                key={tx.id}
                onClick={() => router.push(`/finance/transactions?id=${tx.id}`)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] hover:border-[var(--nexus-emerald-border)] transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-[var(--nexus-success)]/10 text-[var(--nexus-success)]' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <span className="text-xs font-medium text-[var(--nexus-text-primary)] truncate">{tx.note || '-'}</span>
                </div>
                <span className={`text-xs font-semibold shrink-0 ${tx.type === 'income' ? 'text-[var(--nexus-success)]' : 'text-rose-600 dark:text-rose-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                </span>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full text-xs text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)]"
            onClick={() => router.push('/finance/transactions')}
          >
            {t('dashboard.actions.viewAll', 'Lihat semua transaksi')}
          </Button>
        </Card>

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
