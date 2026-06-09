'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { insightsService, FinancialInsight } from '@/lib/services/insights.service';
import { transactionService } from '@/lib/services/transaction.service';
import { SpendingChart } from '@/components/charts/spending-chart';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Calendar,
  BookOpen,
  PieChart,
  Target,
  HandCoins,
  BarChart3,
  ShieldAlert,
  Maximize2,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

export default function DashboardPage() {
  const { accountId, isSuperAdmin } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    score: 0,
    income: 0,
    expense: 0,
    savings: 0,
  });
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [isPieExpanded, setIsPieExpanded] = useState(false);
  const [isTrendsExpanded, setIsTrendsExpanded] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);

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

      setStats({
        score: insightData.score,
        income: insightData.income,
        expense: insightData.expense,
        savings: insightData.savings,
      });
      setInsights(insightData.insights);

      const allTxs = monthTxs;
      setRecentTxs(allTxs.slice(0, 5));

      const dayAggregation: { [date: string]: number } = {};
      const categoryAggregation: { [name: string]: { amt: number; col: string } } = {};

      allTxs.forEach((tx) => {
        const amt = Number(tx.amount);
        const dateObj = new Date(tx.date);
        const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (tx.type === 'expense') {
          dayAggregation[dayLabel] = (dayAggregation[dayLabel] || 0) + amt;
          
          const catName = tx.categories?.name || 'General';
          const catColor = tx.categories?.color || '#9CA3AF';
          
          if (!categoryAggregation[catName]) {
            categoryAggregation[catName] = { amt: 0, col: catColor };
          }
          categoryAggregation[catName].amt += amt;
        }
      });

      // Format trends data (last 7 days)
      const trendList = Object.entries(dayAggregation)
        .map(([date, amount]) => ({ date, amount }))
        .slice(0, 7)
        .reverse();

      // Fallback data if empty
      setChartData(
        trendList.length > 0
          ? trendList
          : [
              { date: 'Mon', amount: 0 },
              { date: 'Tue', amount: 0 },
              { date: 'Wed', amount: 0 },
              { date: 'Thu', amount: 0 },
              { date: 'Fri', amount: 0 },
            ]
      );

      // Format pie categories
      const pieList = Object.entries(categoryAggregation).map(([name, item]) => ({
        name,
        value: item.amt,
        color: item.col,
      }));

      setPieData(pieList);

    } catch (err: any) {
      toast(err.message || 'Error compiling dashboard statistics.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(loadDashboardData);
    }
  }, [accountId, loadDashboardData]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <ShieldCheck className="w-5 h-5 text-success shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-danger shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-primary shrink-0" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/20 text-light-text-primary dark:text-dark-text-primary';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-light-text-primary dark:text-dark-text-primary';
      case 'danger':
        return 'bg-danger/10 border-danger/20 text-light-text-primary dark:text-dark-text-primary';
      default:
        return 'bg-primary/10 border-primary/20 text-light-text-primary dark:text-dark-text-primary';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Dynamic Welcome Heading */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-light-text-primary dark:text-dark-text-primary">
          Wealth Workspace Dashboard
        </h2>
        <p className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Live financial summary and smart budget analytics for this billing cycle
        </p>
      </div>

      {/* User Documentation Banner */}
      <div className="p-4 md:p-5 rounded-2xl border border-primary/15 bg-primary/5 dark:bg-primary/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            Panduan Pengguna &amp; Dokumentasi Fitur
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-2xl leading-relaxed">
            Pelajari alur kerja aplikasi, manajemen anggaran, tabungan, serta analisis formula Debt Survival Planner (Pinjol Tracker) secara lengkap.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-all duration-150 cursor-pointer border border-primary/20"
          >
            {showGuide ? 'Sembunyikan Panduan' : 'Lihat Panduan Singkat'}
          </button>
          <a 
            href="/read.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-all duration-150 shadow-md shadow-primary/10 shrink-0 cursor-pointer text-center"
          >
            Buka Panduan
          </a>
        </div>
      </div>

      {/* Collapsible Short Guide */}
      {showGuide && (
        <Card className="p-5 md:p-6 border-light-border dark:border-dark-border shadow-sm space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-light-border/40 dark:border-dark-border/40">
            <h3 className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2 uppercase tracking-wider">
              <BookOpen className="w-4 h-4 text-primary" />
              Panduan Penggunaan Fitur FinanceApp
            </h3>
            <span className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary">
              Pelajari cara kerja setiap modul aplikasi di bawah ini
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Wallet Guide */}
            <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/10 dark:bg-dark-bg/15 space-y-1.5">
              <h4 className="font-extrabold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary shrink-0" />
                1. Kelola Dompet (Wallets)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Dompet</strong>, klik <strong>Tambah Dompet</strong>. Buat dompet seperti "Cash", "BCA", atau "GoPay" dan masukkan saldo awalnya. Seluruh saldo dompet dikalkulasi sebagai aset bersih Anda.
              </p>
            </div>

            {/* Transactions Guide */}
            <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/10 dark:bg-dark-bg/15 space-y-1.5">
              <h4 className="font-extrabold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-primary shrink-0" />
                2. Catat Transaksi (Transactions)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Transaksi</strong>, lalu pilih <strong>Pemasukan</strong>, <strong>Pengeluaran</strong>, atau <strong>Transfer</strong>. Isi nominal, pilih kategori &amp; dompet yang sesuai, lalu simpan. Saldo dompet akan otomatis berubah.
              </p>
            </div>

            {/* Budgets Guide */}
            <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/10 dark:bg-dark-bg/15 space-y-1.5">
              <h4 className="font-extrabold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary shrink-0" />
                3. Anggaran Belanja (Budgets)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Anggaran</strong>, klik <strong>Buat Anggaran Baru</strong>. Pilih kategori belanja yang ingin dibatasi dan masukkan nominal batasnya. Indikator bar akan memperingatkan jika Anda hampir melampauinya.
              </p>
            </div>

            {/* Savings Guide */}
            <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/10 dark:bg-dark-bg/15 space-y-1.5">
              <h4 className="font-extrabold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                <Target className="w-4 h-4 text-primary shrink-0" />
                4. Rencana Tabungan (Savings Goals)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Tabungan</strong>, klik <strong>Tambah Target</strong>. Masukkan nama impian, target nominal, dan tenggat waktu. Setor tabungan secara berkala untuk memantau kemajuan menabung Anda.
              </p>
            </div>

            {/* Debts Guide */}
            <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/10 dark:bg-dark-bg/15 space-y-1.5">
              <h4 className="font-extrabold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary shrink-0" />
                5. Utang &amp; Piutang (Debts &amp; Loans)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Utang &amp; Piutang</strong> untuk mencatat pinjam-meminjam uang tradisional ke perorangan. Tentukan siapa yang meminjam dana dan kapan tanggal pelunasan yang disepakati.
              </p>
            </div>

            {/* Reports Guide */}
            <div className="p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/10 dark:bg-dark-bg/15 space-y-1.5">
              <h4 className="font-extrabold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary shrink-0" />
                6. Laporan Bulanan (Reports)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Laporan</strong> untuk menganalisis pengeluaran kategori bulanan Anda. Klik tombol ekspor untuk mengunduh seluruh transaksi Anda dalam format Excel (.xlsx) secara instan.
              </p>
            </div>

            {/* Pinjol Guide (Full span) */}
            <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 dark:bg-primary/10 md:col-span-2 space-y-1.5">
              <h4 className="font-extrabold text-primary flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                7. Debt Survival Planner / Pinjol Tracker (Fitur Unggulan)
              </h4>
              <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                Buka menu <strong>Pinjol Tracker</strong>. Atur tanggal gajian bulanan dan daftarkan nominal proyeksi gaji Anda. Catat seluruh pinjaman online aktif Anda. Sistem akan memproyeksikan sisa uang kas Anda selama 12 bulan mendatang, mendeteksi penumpukan jatuh tempo (*due-date clustering*), serta merangkum saran keuangan dinamis beserta skor bertahan hidup (*Survival Score*).
              </p>
            </div>

            {/* Admin Guide (Only shown if isSuperAdmin is true!) */}
            {isSuperAdmin && (
              <div className="p-4 rounded-xl border border-danger/10 bg-danger/5 dark:bg-danger/10 md:col-span-2 space-y-1.5 animate-in fade-in duration-200">
                <h4 className="font-extrabold text-danger flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-danger shrink-0" />
                  🛡️ Portal Admin (Khusus SuperAdmin)
                </h4>
                <p className="text-light-text-secondary dark:text-dark-text-secondary leading-relaxed font-medium">
                  Buka menu <strong>Admin</strong>. Anda dapat mengkustomisasi nama aplikasi secara global, mengunggah logo kustom melalui URL gambar, dan mengubah judul tab browser di seluruh sesi browser pengguna.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          ))}
        </div>
      ) : (
        /* Dynamic Stats summary widgets Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-5 flex items-center justify-between border-light-border dark:border-dark-border shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                Monthly Income
              </span>
              <h4 className="text-2xl font-extrabold text-success tracking-tight">
                +${stats.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center text-success">
              <TrendingUp className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between border-light-border dark:border-dark-border shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                Monthly Expenses
              </span>
              <h4 className="text-2xl font-extrabold text-danger tracking-tight">
                -${stats.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center text-danger">
              <TrendingDown className="w-5 h-5" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between border-light-border dark:border-dark-border shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                Net Savings Pool
              </span>
              <h4 className={`text-2xl font-extrabold tracking-tight ${stats.savings >= 0 ? 'text-primary' : 'text-danger'}`}>
                {stats.savings >= 0 ? '+' : '-'}${Math.abs(stats.savings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <Wallet className="w-5 h-5" />
            </div>
          </Card>

          {/* Financial Score Circular Gauge card */}
          <Card className="p-5 flex items-center justify-between border-light-border dark:border-dark-border shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                Health Score
              </span>
              <h4 className="text-2xl font-extrabold text-light-text-primary dark:text-dark-text-primary tracking-tight">
                {stats.score}/100
              </h4>
            </div>
            {/* SVG radial ring indicator */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="var(--border-color)" strokeWidth="3.5" fill="transparent" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="var(--color-primary)"
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="125"
                  strokeDashoffset={125 - (125 * stats.score) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-primary">{stats.score}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Charts & Analytics Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Spending chart widget */}
        <Card className="p-5 lg:col-span-2 space-y-4 shadow-sm border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
              Daily Spending Trends
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full tracking-wider">
                Last 7 Days
              </span>
              <button
                onClick={() => setIsTrendsExpanded(true)}
                className="p-1 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/60 text-light-text-secondary dark:text-dark-text-secondary cursor-pointer transition-colors"
                title="Perbesar Grafik"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="h-64 rounded-xl shimmer" />
          ) : (
            <SpendingChart data={chartData} />
          )}
        </Card>

        {/* Donut breakdown chart widget */}
        <Card className="p-5 space-y-4 shadow-sm border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
              Category Concentration
            </h3>
            <button
              onClick={() => setIsPieExpanded(true)}
              className="p-1 rounded-lg hover:bg-light-bg dark:hover:bg-dark-bg/60 text-light-text-secondary dark:text-dark-text-secondary cursor-pointer transition-colors"
              title="Perbesar Grafik"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
          {loading ? (
            <div className="h-64 rounded-xl shimmer" />
          ) : pieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-4">
              <div className="w-10 h-10 rounded-xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-2 text-light-text-secondary">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs text-light-text-secondary font-medium">No expenses logged yet for categories overview.</p>
            </div>
          ) : (
            <CategoryPieChart data={pieData} />
          )}
        </Card>
      </div>

      {/* Financial Health Insights & Recent Activity lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Smart Dynamic Insights alerts panel */}
        <Card className="p-5 space-y-4 shadow-sm border-light-border dark:border-dark-border lg:col-span-1">
          <div className="flex items-center gap-1.5 text-light-text-primary dark:text-dark-text-primary font-bold text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            Dynamic Wealth Insights
          </div>
          <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              [1, 2].map((n) => <div key={n} className="h-20 rounded-xl shimmer" />)
            ) : insights.length === 0 ? (
              <div className="flex items-center gap-2 p-3.5 rounded-xl border border-light-border dark:border-dark-border text-xs text-light-text-secondary font-medium">
                <Info className="w-4 h-4 text-primary shrink-0" />
                All clear! No financial alerts detected this cycle.
              </div>
            ) : (
              insights.map((ins, index) => (
                <div key={index} className={`flex items-start gap-3 p-3.5 rounded-xl border ${getInsightColor(ins.type)}`}>
                  {getInsightIcon(ins.type)}
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-extrabold tracking-tight">{ins.title}</h4>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80">{ins.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent transaction rows */}
        <Card className="p-5 space-y-4 shadow-sm border-light-border dark:border-dark-border lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
              <Calendar className="w-4.5 h-4.5 text-primary" />
              Recent Ledger Ledger Activity
            </h3>
          </div>
          <div className="divide-y divide-light-border/40 dark:divide-dark-border/40">
            {loading ? (
              [1, 2, 3].map((n) => <div key={n} className="h-12 rounded-xl shimmer my-2" />)
            ) : recentTxs.length === 0 ? (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary py-8 text-center font-medium">
                No recent transaction transactions compiled yet.
              </p>
            ) : (
              recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                      tx.type === 'income' ? 'text-success bg-success/15 border-success/25' : tx.type === 'expense' ? 'text-danger bg-danger/15 border-danger/25' : 'text-info bg-info/15 border-info/25'
                    }`}>
                      {tx.type === 'income' ? <TrendingUp className="w-3.5 h-3.5" /> : tx.type === 'expense' ? <TrendingDown className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-light-text-primary dark:text-dark-text-primary truncate">
                        {tx.note || (tx.type === 'transfer' ? 'Wallet Transfer' : 'Expense ledger')}
                      </p>
                      <p className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary font-medium tracking-tight mt-0.5">
                        {tx.wallets?.name} • {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold tracking-tight shrink-0 ${
                    tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-danger' : 'text-info'
                  }`}>
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
      {/* Expanded Category Pie Chart Modal */}
      <Modal
        isOpen={isPieExpanded}
        onClose={() => setIsPieExpanded(false)}
        title="Detail Konsentrasi Pengeluaran"
      >
        <div className="space-y-6">
          <div className="flex justify-center p-4 bg-light-bg/5 dark:bg-dark-bg/10 rounded-2xl border border-light-border/40 dark:border-dark-border/40">
            <div className="w-full max-w-[280px]">
              <CategoryPieChart data={pieData} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
              Rincian Kategori Pengeluaran
            </h4>
            <div className="divide-y divide-light-border/30 dark:divide-dark-border/30 border border-light-border/40 dark:border-dark-border/40 rounded-xl overflow-hidden bg-light-bg/5 dark:bg-dark-bg/5">
              {pieData.map((item, index) => {
                const totalAmount = pieData.reduce((sum, i) => sum + i.value, 0);
                const pct = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : '0';
                return (
                  <div key={index} className="flex items-center justify-between p-3.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-light-text-primary dark:text-dark-text-primary">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-light-text-primary dark:text-dark-text-primary">
                      ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Expanded Trends Modal */}
      <Modal
        isOpen={isTrendsExpanded}
        onClose={() => setIsTrendsExpanded(false)}
        title="Tren Pengeluaran Harian"
      >
        <div className="space-y-6">
          <div className="p-4 bg-light-bg/5 dark:bg-dark-bg/10 rounded-2xl border border-light-border/40 dark:border-dark-border/40">
            <div className="h-64">
              <SpendingChart data={chartData} />
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
              Riwayat Pengeluaran Harian
            </h4>
            <div className="divide-y divide-light-border/30 dark:divide-dark-border/30 border border-light-border/40 dark:border-dark-border/40 rounded-xl overflow-hidden bg-light-bg/5 dark:bg-dark-bg/5 max-h-48 overflow-y-auto">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3.5 text-xs">
                  <span className="font-bold text-light-text-primary dark:text-dark-text-primary">
                    {item.date}
                  </span>
                  <span className="font-extrabold text-danger">
                    -${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
