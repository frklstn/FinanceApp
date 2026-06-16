'use client';

// Cache-breaker: 2026-06-15 20:18

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { insightsService } from '@/lib/services/insights.service';
import { transactionService, PopulatedTransaction } from '@/lib/services/transaction.service';
import { loanTrackerService } from '@/lib/services/loan-tracker.service';
import { walletService } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { SpendingChart } from '@/components/charts/spending-chart';
import { CategoryRadarChart } from '@/components/charts/category-radar-chart';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
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
  Bell,
  ChevronDown,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { QuickAddModal } from '@/components/transaction/quick-add-modal';

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  
  const width = 120;
  const height = 24;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-8 overflow-visible select-none pointer-events-none opacity-85">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

const categoryTranslations: { [key: string]: string } = {
  'Food': 'Makanan & Minuman',
  'Shopping': 'Belanja',
  'Transport': 'Transportasi',
  'Utilities': 'Tagihan & Listrik',
  'Entertainment': 'Hiburan',
  'Health': 'Kesehatan',
  'Education': 'Edukasi',
  'Housing': 'Rumah',
  'General': 'Lainnya',
  'Investment': 'Investasi',
  'Salary': 'Gaji',
  'Bonus': 'Bonus',
};

function translateCategory(name: string) {
  return categoryTranslations[name] || name;
}

export default function DashboardPage() {
  const { accountId, isSuperAdmin, user, profile, t } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [financialStats, setFinancialStats] = useState({
    score: 0,
    income: 0,
    expense: 0,
    savings: 0,
    activeDebt: 0,
    activeLoansCount: 0,
    totalBalance: 0,
    incomeDiff: 0,
    expenseDiff: 0,
    savingsDiff: 0,
    incomeSparkline: [] as number[],
    expenseSparkline: [] as number[],
    savingsSparkline: [] as number[],
    debtSparkline: [] as number[],
    insights: [] as any[],
  });

  const [recentTxs, setRecentTxs] = useState<PopulatedTransaction[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [isPieExpanded, setIsPieExpanded] = useState(false);
  const [isTrendsExpanded, setIsTrendsExpanded] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: 'income' | 'expense' | 'transfer' }>({
    open: false,
    type: 'expense'
  });

  const loadDashboardData = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // 1. Fetch current month transactions
      const { data: monthTxs } = await transactionService.getTransactions(accountId, {
        startDate: startOfMonth.toISOString(),
        limit: 200,
      });

      const insightData = await insightsService.generateInsights(accountId, {
        prefetchedTransactions: monthTxs,
      });

      // 2. Fetch last month transactions
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);

      const endOfLastMonth = new Date();
      endOfLastMonth.setDate(0); // Last day of previous month
      endOfLastMonth.setHours(23, 59, 59, 999);

      const { data: lastMonthTxs } = await transactionService.getTransactions(accountId, {
        startDate: startOfLastMonth.toISOString(),
        endDate: endOfLastMonth.toISOString(),
        limit: 500,
      });

      let lastMonthIncome = 0;
      let lastMonthExpense = 0;
      lastMonthTxs.forEach((tx) => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          lastMonthIncome += amt;
        } else if (tx.type === 'expense') {
          lastMonthExpense += amt;
        }
      });
      const lastMonthSavings = lastMonthIncome - lastMonthExpense;

      const currentIncome = insightData.income;
      const currentExpense = insightData.expense;
      const currentSavings = insightData.savings;

      const incomeDiff = lastMonthIncome > 0 ? ((currentIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
      const expenseDiff = lastMonthExpense > 0 ? ((currentExpense - lastMonthExpense) / lastMonthExpense) * 100 : 0;
      const savingsDiff = lastMonthSavings !== 0 ? ((currentSavings - lastMonthSavings) / Math.abs(lastMonthSavings)) * 100 : 0;

      // 3. Fetch active loans/debts
      let totalActiveDebt = 0;
      let activeLoansCount = 0;
      try {
        const trackers = await loanTrackerService.getLoanTrackers(accountId);
        const activeLoans = trackers.filter((l) => l.status === 'active');
        totalActiveDebt = activeLoans.reduce((sum, l) => sum + Number(l.total_repayment), 0);
        activeLoansCount = activeLoans.length;
      } catch (err) {
        console.error('Failed to load loan trackers for stats:', err);
      }

      // 3.5. Fetch wallets to calculate total balance
      let totalBalance = 0;
      try {
        const wallets = await walletService.getWallets(accountId);
        totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
      } catch (err) {
        console.error('Failed to load wallets for stats:', err);
      }

      // 4. Compute 7 days sparkline
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();

      const dailyIncome = Array(7).fill(0);
      const dailyExpense = Array(7).fill(0);

      monthTxs.forEach((tx) => {
        const txDate = new Date(tx.date);
        txDate.setHours(0, 0, 0, 0);
        const dayIdx = last7Days.findIndex((d) => d.getTime() === txDate.getTime());
        if (dayIdx !== -1) {
          if (tx.type === 'income') {
            dailyIncome[dayIdx] += Number(tx.amount);
          } else if (tx.type === 'expense') {
            dailyExpense[dayIdx] += Number(tx.amount);
          }
        }
      });

      const dailySavings = dailyIncome.map((inc, i) => inc - dailyExpense[i]);
      const debtSparkline = Array(7).fill(totalActiveDebt);

      setFinancialStats({
        score: insightData.score,
        income: currentIncome,
        expense: currentExpense,
        savings: currentSavings,
        activeDebt: totalActiveDebt,
        activeLoansCount,
        totalBalance,
        incomeDiff,
        expenseDiff,
        savingsDiff,
        incomeSparkline: dailyIncome,
        expenseSparkline: dailyExpense,
        savingsSparkline: dailySavings,
        debtSparkline,
        insights: insightData.insights,
      });


      setRecentTxs(monthTxs.slice(0, 5));

      const last7DaysLabels: string[] = [];
      const dayAggregation: { [date: string]: number } = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        last7DaysLabels.push(label);
        dayAggregation[label] = 0;
      }

      const categoryAggregation: { [name: string]: { amt: number; col: string } } = {};

      monthTxs.forEach((tx) => {
        const amt = Number(tx.amount);
        const dateObj = new Date(tx.date);
        const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        if (tx.type === 'expense') {
          if (dayAggregation[dayLabel] !== undefined) {
            dayAggregation[dayLabel] += amt;
          }
          
          const catName = tx.categories?.name || 'General';
          const catColor = tx.categories?.color || '#9CA3AF';
          
          if (!categoryAggregation[catName]) {
            categoryAggregation[catName] = { amt: 0, col: catColor };
          }
          categoryAggregation[catName].amt += amt;
        }
      });

      // Format trends data (last 7 days in chronological order)
      const trendList = last7DaysLabels.map((date) => ({
        date,
        amount: dayAggregation[date],
      }));

      setChartData(trendList);

      // Format pie categories
      const pieList = Object.entries(categoryAggregation)
        .map(([name, item]) => ({
          name,
          value: item.amt,
          color: item.col,
        }))
        .sort((a, b) => b.value - a.value);

      setPieData(pieList);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error compiling dashboard statistics.';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(loadDashboardData);
    }
  }, [accountId, loadDashboardData]);



  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 h-screen flex flex-col overflow-hidden">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Halo, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Pengguna'} 👋
          </h1>
          <p className="text-sm text-[#6F7A9E] font-medium">
            Kelola keuanganmu dengan bijak hari ini.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/5 bg-white/5 text-[10px] font-bold text-[#A7B0D1] cursor-pointer hover:bg-white/10 transition-colors">
            <Calendar className="w-3 h-3" />
            <span>12 Mei - 12 Jun 2024</span>
            <ChevronDown className="w-3 h-3" />
          </div>
          <button className="p-2 rounded-xl bg-white/5 border border-white/5 text-[#6F7A9E] hover:text-white hover:bg-white/10 transition-all">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>



      {/* Hero Section: Financial Health Banner */}
      <Card 
        onClick={() => router.push('/wallets')}
        className="p-8 relative overflow-visible bg-gradient-to-br from-[#1a0533] via-[#0d1a3a] to-[#050816] rounded-[32px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-white/10 transition-all duration-500 cursor-pointer shrink-0"
      >
        {/* Background Illustration: Siluet Jalan/Path */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-[32px] pointer-events-none">
          <svg viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute right-0 bottom-0 w-full h-full opacity-10">
            <path d="M0 200 Q200 180 400 120 T800 40" stroke="url(#pathGradient)" strokeWidth="4" fill="none" strokeDasharray="12 8" />
            <path d="M780 20 L800 40 L780 60 Z" fill="#8B7CFF" />
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6E5CFF" stopOpacity="0" />
                <stop offset="100%" stopColor="#8B7CFF" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Left Side: Labels & Message */}
        <div className="relative z-10 flex-1 space-y-6">
          <div className="space-y-1">
             <span className="text-[10px] uppercase font-bold text-[#A7B0D1] tracking-[0.2em]">Total Saldo</span>
             <h3 className="text-4xl font-extrabold text-white tracking-tighter">
                {formatRupiah(financialStats.totalBalance)}
             </h3>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white/90 leading-tight">
              Kamu berada di <span className="text-[#8B7CFF]">jalur yang baik.</span>
            </h2>
            <p className="text-xs text-[#6F7A9E] font-medium leading-relaxed max-w-xs">
              Terus pertahankan pola ini untuk masa depan yang lebih aman dan terencana.
            </p>
          </div>
        </div>

        {/* Right Side: Simple Score Indicator (No progress ring as per spec) */}
        <div className="relative z-10 flex flex-col items-center gap-3 bg-white/5 backdrop-blur-md p-6 rounded-[28px] border border-white/5 min-w-[180px]">
          <span className="text-[10px] uppercase font-bold text-[#6F7A9E] tracking-widest">Financial Health</span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black text-white tracking-tighter">92</span>
            <span className="text-sm font-bold text-[#6F7A9E]">/ 100</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#28D17C]/10 border border-[#28D17C]/20">
            <div className="w-2 h-2 rounded-full bg-[#28D17C] animate-pulse shadow-[0_0_8px_#28D17C]" />
            <span className="text-[10px] font-bold text-[#28D17C] uppercase tracking-wider">Sangat Baik</span>
          </div>
        </div>
      </Card>

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
                Buka menu <strong>Dompet</strong>, klik <strong>Tambah Dompet</strong>. Buat dompet seperti &quot;Cash&quot;, &quot;BCA&quot;, atau &quot;GoPay&quot; dan masukkan saldo awalnya. Seluruh saldo dompet dikalkulasi sebagai aset bersih Anda.
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 rounded-2xl border border-light-border/40 dark:border-dark-border/40 shimmer" />
          ))}
        </div>
      ) : (
        <>
          {/* Row 2: 4 Stats Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
            {/* Pemasukan */}
            <button 
              onClick={() => router.push('/transactions/new?type=income')}
              className="p-6 pt-10 rounded-[24px] bg-[#0A1028]/95 border border-white/5 space-y-3 relative overflow-hidden group hover:border-[#28D17C]/30 transition-all text-left"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-[#28D17C]/10 flex items-center justify-center text-[#28D17C] border border-[#28D17C]/20">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#6F7A9E] tracking-widest uppercase">Pemasukan</span>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">+{formatRupiah(financialStats.income)}</h4>
                  <p className="text-[10px] font-bold text-[#28D17C]">+{financialStats.incomeDiff.toFixed(1)}%</p>
                </div>
              </div>
              <div className="absolute bottom-1 left-0 w-full opacity-40 px-1">
                <Sparkline data={financialStats.incomeSparkline} color="#28D17C" />
              </div>
            </button>

            {/* Pengeluaran */}
            <button 
              onClick={() => router.push('/transactions/new?type=expense')}
              className="p-6 pt-10 rounded-[24px] bg-[#0A1028]/95 border border-white/5 space-y-3 relative overflow-hidden group hover:border-[#FF4B5C]/30 transition-all text-left"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-[#FF4B5C]/10 flex items-center justify-center text-[#FF4B5C] border border-[#FF4B5C]/20">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#6F7A9E] tracking-widest uppercase">Pengeluaran</span>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">-{formatRupiah(financialStats.expense)}</h4>
                  <p className="text-[10px] font-bold text-[#FF4B5C]">+{financialStats.expenseDiff.toFixed(1)}%</p>
                </div>
              </div>
              <div className="absolute bottom-1 left-0 w-full opacity-40 px-1">
                <Sparkline data={financialStats.expenseSparkline} color="#FF4B5C" />
              </div>
            </button>

            {/* Sisa Tabungan */}
            <button 
              onClick={() => router.push('/savings')}
              className="p-6 pt-10 rounded-[24px] bg-[#0A1028]/95 border border-white/5 space-y-3 relative overflow-hidden group hover:border-[#6E5CFF]/30 transition-all text-left"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-[#6E5CFF]/10 flex items-center justify-center text-[#6E5CFF] border border-[#6E5CFF]/20">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#6F7A9E] tracking-widest uppercase">Sisa Tabungan</span>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">+{formatRupiah(financialStats.savings)}</h4>
                  <p className="text-[10px] font-bold text-[#6E5CFF]">+{financialStats.savingsDiff.toFixed(1)}%</p>
                </div>
              </div>
              <div className="absolute bottom-1 left-0 w-full opacity-40 px-1">
                <Sparkline data={financialStats.savingsSparkline} color="#6E5CFF" />
              </div>
            </button>

            {/* Utang Aktif */}
            <button 
              onClick={() => router.push('/pinjol')}
              className="p-6 pt-10 rounded-[24px] bg-[#0A1028]/95 border border-white/5 space-y-3 relative overflow-hidden group hover:border-[#FFB347]/30 transition-all text-left"
            >
              <div className="absolute top-4 left-4 w-8 h-8 rounded-lg bg-[#FFB347]/10 flex items-center justify-center text-[#FFB347] border border-[#FFB347]/20">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#6F7A9E] tracking-widest uppercase">Utang Aktif</span>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">{formatRupiah(financialStats.activeDebt)}</h4>
                  <p className="text-[10px] font-bold text-[#6F7A9E]">{financialStats.activeLoansCount} pinjaman aktif</p>
                </div>
              </div>
              <div className="absolute bottom-1 left-0 w-full px-4 pb-1">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FFB347]" style={{ width: '40%' }} />
                </div>
              </div>
            </button>
          </div>

          {/* Row 3: 3 Main Widgets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
            {/* Daily Spending Graph */}
            <div className="lg:col-span-5 p-6 rounded-[32px] bg-[#0A1028]/95 border border-white/5 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Tren Pengeluaran</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6F7A9E] font-bold uppercase tracking-wider">7 Hari Terakhir</span>
                </div>
              </div>
              <div className="h-64">
                <SpendingChart data={chartData} />
              </div>
            </div>

            {/* Category Breakdown (Horizontal Progress Bars as per spec) */}
            <div className="lg:col-span-4 p-8 rounded-[32px] bg-[#0A1028]/90 border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Kategori Pengeluaran</h3>
                <button onClick={() => setIsPieExpanded(true)} className="text-[10px] text-[#6E5CFF] font-bold uppercase hover:underline">Lihat Semua</button>
              </div>
              <div className="space-y-5">
                {pieData.slice(0, 5).map((item, idx) => {
                  const percentage = Math.min((item.value / (financialStats.expense || 1)) * 100, 100);
                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-[#A7B0D1]">{translateCategory(item.name)}</span>
                        <span className="text-white">{formatRupiah(item.value)}</span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: item.color,
                            boxShadow: `0 0 10px ${item.color}40`
                          }} 
                        />
                      </div>
                    </div>
                  );
                })}
                {pieData.length === 0 && (
                   <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-50">
                      <HandCoins className="w-8 h-8 text-[#6F7A9E]" />
                      <p className="text-[10px] text-[#6F7A9E] font-medium uppercase tracking-wider">Belum ada data kategori</p>
                   </div>
                )}
              </div>
            </div>

            {/* Month Summary (Restored according to spec) */}
            <div className="lg:col-span-3 p-8 rounded-[32px] bg-[#0A1028]/90 border border-white/5 space-y-6">
              <h3 className="text-sm font-bold text-white">Ringkasan Bulan Ini</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-[#6F7A9E] font-bold uppercase">Total Pemasukan</span>
                  <p className="text-lg font-bold text-[#28D17C]">+{formatRupiah(financialStats.income)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                  <span className="text-[10px] text-[#6F7A9E] font-bold uppercase">Total Pengeluaran</span>
                  <p className="text-lg font-bold text-[#FF4B5C]">-{formatRupiah(financialStats.expense)}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#6E5CFF]/10 border border-[#6E5CFF]/20 space-y-1">
                  <span className="text-[10px] text-[#6E5CFF] font-bold uppercase">Sisa Kas Bulan Ini</span>
                  <p className="text-lg font-bold text-white">{formatRupiah(financialStats.savings)}</p>
                </div>
                <div className="pt-2">
                   <button 
                    onClick={() => router.push('/reports')}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-[#A7B0D1] uppercase tracking-widest hover:bg-white/10 transition-all"
                   >
                    Lihat Laporan Detail
                   </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent transaction rows (Full Width Layout below the grid) */}
      {/* Transaksi Terbaru */}
      <Card className="p-5 space-y-4 shadow-sm border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
            <Calendar className="w-4.5 h-4.5 text-primary" />
            Transaksi Terbaru
          </h3>
          <button
            onClick={() => router.push('/transactions')}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            Lihat Semua
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {loading ? (
            [1, 2, 3].map((n) => <div key={n} className="h-12 rounded-xl shimmer my-2" />)
          ) : recentTxs.length === 0 ? (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary py-8 text-center font-medium">
              {t("dashboard.insights.noRecent", "Belum ada transaksi terbaru.")}
            </p>
          ) : (
            recentTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-1 gap-4 text-xs font-semibold">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'income' ? 'text-success bg-success/15' : tx.type === 'expense' ? 'text-danger bg-danger/15' : 'text-info bg-info/15'
                  }`}>
                    {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : tx.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <ArrowRightLeft className="w-4.5 h-4.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-light-text-primary dark:text-dark-text-primary truncate">
                      {tx.note || (tx.type === 'transfer' ? 'Transfer Dompet' : 'Catatan Pengeluaran')}
                    </p>
                    <p className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary font-medium mt-0.5">
                      {tx.wallets?.name} • {new Date(tx.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold tracking-tight shrink-0 text-sm ${
                  tx.type === 'income' ? 'text-success' : tx.type === 'expense' ? 'text-danger' : 'text-info'
                }`}>
                  {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatRupiah(Number(tx.amount))}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
      {/* Expanded Category Pie Chart Modal */}
      <Modal
        isOpen={isPieExpanded}
        onClose={() => setIsPieExpanded(false)}
        title="Detail Konsentrasi Pengeluaran"
      >
        <div className="space-y-6">
          <div className="flex justify-center p-4 bg-light-bg/5 dark:bg-dark-bg/10 rounded-2xl border border-light-border/40 dark:border-dark-border/40">
            <div className="w-full max-w-[360px]">
              <CategoryRadarChart data={pieData} />
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
                        {translateCategory(item.name)}
                      </span>
                    </div>
                    <span className="font-extrabold text-light-text-primary dark:text-dark-text-primary">
                      {formatRupiah(item.value)} ({pct}%)
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
                    -{formatRupiah(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Global Dashboard Quick Add Modal */}
      {accountId && (
        <QuickAddModal
          isOpen={quickAdd.open}
          onClose={() => setQuickAdd(prev => ({ ...prev, open: false }))}
          accountId={accountId}
          initialType={quickAdd.type}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
}

