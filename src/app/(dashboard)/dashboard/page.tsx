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
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 md:p-4 flex flex-col">
      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-xl font-black text-white tracking-[-0.03em]">
            Halo, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Pengguna'} 👋
          </h1>
          <p className="text-[11px] text-[#6F7A9E] font-semibold tracking-[-0.01em]">
            Kelola keuanganmu dengan bijak hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-[9px] font-bold text-[#A7B0D1] cursor-pointer hover:bg-white/10 transition-colors">
            <Calendar className="w-3 h-3" />
            <span>12 Mei - 12 Jun 2024</span>
            <ChevronDown className="w-3 h-3" />
          </div>
          <button className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-[#6F7A9E] hover:text-white hover:bg-white/10 transition-all">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Section: Financial Health Banner */}
      <Card 
        onClick={() => router.push('/wallets')}
        className="py-3 px-5 relative overflow-hidden bg-gradient-to-br from-[#1a0533] via-[#0d1a3a] to-[#050816] rounded-[24px] border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-white/10 transition-all duration-500 cursor-pointer shrink-0"
      >
        {/* Background Illustration */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
        <div className="relative z-10 flex-1 flex flex-row items-center gap-8">
          <div className="space-y-0.5">
             <span className="text-[9px] uppercase font-bold text-[#A7B0D1] tracking-[0.2em] opacity-80">Total Saldo</span>
             <h3 className="text-3xl font-black text-white tracking-[-0.04em] drop-shadow-2xl">
                {formatRupiah(financialStats.totalBalance)}
             </h3>
          </div>
          <div className="hidden lg:block h-8 w-px bg-white/10 mx-2" />
          <div className="space-y-0.5 hidden sm:block">
            <h2 className="text-sm font-bold text-white/95 leading-tight tracking-[-0.02em]">
              Kamu berada di <span className="text-[#8B7CFF]">jalur yang baik.</span>
            </h2>
            <p className="text-[10px] text-[#6F7A9E] font-semibold tracking-[-0.01em]">
              Pola keuanganmu stabil dan terencana.
            </p>
          </div>
        </div>

        {/* Right Side: Score indicator compact */}
        <div className="relative z-10 flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/5">
          <div className="flex flex-col items-center">
            <span className="text-[8px] uppercase font-bold text-[#6F7A9E] tracking-wider">Health</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-white">92</span>
              <span className="text-[10px] font-bold text-[#6F7A9E]">/100</span>
            </div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#28D17C]/10 border border-[#28D17C]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#28D17C] shadow-[0_0_8px_#28D17C]" />
            <span className="text-[8px] font-bold text-[#28D17C] uppercase tracking-wider">Sangat Baik</span>
          </div>
        </div>
      </Card>

      {/* Row 2: 4 Stats Widgets - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Pemasukan', val: financialStats.income, diff: financialStats.incomeDiff, col: '#28D17C', icon: TrendingUp, type: 'income' },
          { label: 'Pengeluaran', val: financialStats.expense, diff: financialStats.expenseDiff, col: '#FF4B5C', icon: TrendingDown, type: 'expense' },
          { label: 'Sisa Tabungan', val: financialStats.savings, diff: financialStats.savingsDiff, col: '#6E5CFF', icon: Wallet, path: '/savings' },
          { label: 'Utang Aktif', val: financialStats.activeDebt, desc: `${financialStats.activeLoansCount} aktif`, col: '#FFB347', icon: ShieldAlert, path: '/pinjol' },
        ].map((s: any, i) => (
          <button 
            key={i}
            onClick={() => {
              if (s.type) {
                setQuickAdd({ open: true, type: s.type });
              } else if (s.path) {
                router.push(s.path);
              }
            }}
            className="p-4 pt-8 rounded-[20px] bg-[#0A1028]/95 border border-white/5 space-y-1 relative overflow-hidden group hover:border-white/20 transition-all text-left"
          >
            <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/80 border border-white/10 group-hover:bg-white/10 transition-colors" style={{ color: s.col }}>
              <s.icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-bold text-[#6F7A9E] tracking-widest uppercase block">{s.label}</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white">{i === 1 ? '-' : '+'}{formatRupiah(s.val)}</h4>
              {s.diff !== undefined ? (
                <p className="text-[9px] font-bold" style={{ color: s.col }}>{s.diff >= 0 ? '+' : ''}{s.diff.toFixed(1)}%</p>
              ) : (
                <p className="text-[9px] font-bold text-[#6F7A9E]">{s.desc}</p>
              )}
            </div>
            <div className="absolute bottom-0 left-0 w-full opacity-30 h-6">
               {i < 3 && <Sparkline data={i === 0 ? financialStats.incomeSparkline : i === 1 ? financialStats.expenseSparkline : financialStats.savingsSparkline} color={s.col} />}
            </div>
          </button>
        ))}
      </div>

      {/* Row 3: 3 Main Widgets Grid - Optimized height */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Daily Spending Graph */}
        <div className="lg:col-span-5 p-5 rounded-[24px] bg-[#0A1028]/95 border border-white/5 space-y-4 flex flex-col group hover:border-white/10 transition-all min-h-[320px]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-[12px] font-bold text-white tracking-tight">Tren Pengeluaran</h3>
              <p className="text-[9px] text-[#6F7A9E] font-medium uppercase tracking-wider">7 Hari Terakhir</p>
            </div>
            <div className="flex items-center bg-white/5 p-1 rounded-lg border border-white/5">
              {['Harian', 'Mingguan'].map((range) => (
                <button 
                  key={range}
                  className={`px-2 py-1 rounded-md text-[8px] font-bold transition-all ${
                    range === 'Harian' ? 'bg-[#6E5CFF] text-white' : 'text-[#6F7A9E] hover:text-[#A7B0D1]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0 pt-2 -ml-4">
            <SpendingChart data={chartData} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-4 p-5 rounded-[24px] bg-[#0A1028]/90 border border-white/5 space-y-4 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-bold text-white">Kategori Pengeluaran</h3>
            <button onClick={() => setIsPieExpanded(true)} className="text-[9px] text-[#6E5CFF] font-bold uppercase hover:underline">Detail</button>
          </div>
          <div className="space-y-3.5 flex-1 pr-1">
            {pieData.slice(0, 5).map((item, idx) => {
              const percentage = Math.min((item.value / (financialStats.expense || 1)) * 100, 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-[#A7B0D1]">{translateCategory(item.name)}</span>
                    <span className="text-white">{formatRupiah(item.value)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}30`
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Summary */}
        <div className="lg:col-span-3 p-5 rounded-[24px] bg-[#0A1028]/90 border border-white/5 space-y-4 flex flex-col shrink-0">
          <h3 className="text-[12px] font-bold text-white">Ringkasan Bulan Ini</h3>
          <div className="space-y-2.5 flex-1">
            {[
              { label: 'Pemasukan', val: financialStats.income, col: '#28D17C', sign: '+' },
              { label: 'Pengeluaran', val: financialStats.expense, col: '#FF4B5C', sign: '-' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-0.5">
                <span className="text-[9px] text-[#6F7A9E] font-bold uppercase">{s.label}</span>
                <p className="text-sm font-bold" style={{ color: s.col }}>{s.sign}{formatRupiah(s.val)}</p>
              </div>
            ))}
            <div className="p-3 rounded-xl bg-[#6E5CFF]/10 border border-[#6E5CFF]/20 space-y-0.5">
              <span className="text-[9px] text-[#6E5CFF] font-bold uppercase">Sisa Kas</span>
              <p className="text-sm font-bold text-white">{formatRupiah(financialStats.savings)}</p>
            </div>
            <div className="pt-1">
               <button 
                onClick={() => router.push('/reports')}
                className="w-full py-2.5 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold text-[#A7B0D1] uppercase tracking-widest hover:bg-white/10 transition-all"
               >
                Laporan Detail
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent transaction rows - Always at the bottom */}
      <div className="pt-2 pb-8">
        <Card className="p-5 space-y-4 shadow-sm border-white/5 bg-[#0A1028]/90 rounded-[24px]">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            {loading ? (
              [1, 2, 3, 4].map((n) => <div key={n} className="h-12 rounded-xl shimmer my-2" />)
            ) : recentTxs.length === 0 ? (
              <p className="col-span-2 text-xs text-[#6F7A9E] py-8 text-center font-medium">
                {t("dashboard.insights.noRecent", "Belum ada transaksi terbaru.")}
              </p>
            ) : (
              recentTxs.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 gap-4 text-xs font-semibold hover:bg-white/5 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'income' ? 'text-success bg-success/10' : tx.type === 'expense' ? 'text-danger bg-danger/10' : 'text-info bg-info/10'
                    }`}>
                      {tx.type === 'income' ? <TrendingUp className="w-3.5 h-3.5" /> : tx.type === 'expense' ? <TrendingDown className="w-3.5 h-3.5" /> : <ArrowRightLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">
                        {tx.note || (tx.type === 'transfer' ? 'Transfer Dompet' : 'Catatan Pengeluaran')}
                      </p>
                      <p className="text-[10px] text-[#6F7A9E] font-medium mt-0.5">
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
      </div>

      {/* Expanded Category Pie Chart Modal */}
      <Modal
        isOpen={isPieExpanded}
        onClose={() => setIsPieExpanded(false)}
        title="Detail Konsentrasi Pengeluaran"
      >
        <div className="space-y-4">
          <div className="flex justify-center p-2 bg-light-bg/5 dark:bg-dark-bg/10 rounded-2xl border border-light-border/40 dark:border-dark-border/40">
            <div className="w-full max-w-[360px]">
              <CategoryRadarChart data={pieData} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
              Rincian Kategori Pengeluaran
            </h4>
            <div className="divide-y divide-light-border/30 dark:divide-dark-border/30 border border-light-border/40 dark:border-dark-border/40 rounded-xl overflow-hidden bg-light-bg/5 dark:bg-dark-bg/5">
              {pieData.map((item, index) => {
                const totalAmount = pieData.reduce((sum, i) => sum + i.value, 0);
                const pct = totalAmount > 0 ? ((item.value / totalAmount) * 100).toFixed(1) : '0';
                return (
                  <div key={index} className="flex items-center justify-between p-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
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
        <div className="space-y-4">
          <div className="p-2 bg-light-bg/5 dark:bg-dark-bg/10 rounded-2xl border border-light-border/40 dark:border-dark-border/40">
            <div className="h-48">
              <SpendingChart data={chartData} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
              Riwayat Pengeluaran Harian
            </h4>
            <div className="divide-y divide-light-border/30 dark:divide-dark-border/30 border border-light-border/40 dark:border-dark-border/40 rounded-xl overflow-hidden bg-light-bg/5 dark:bg-dark-bg/5 max-h-40 overflow-y-auto">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 text-[11px]">
                  <span className="font-bold text-light-text-primary dark:text-dark-text-primary">
                    {item.date}
                  </span>
                  <span className="font-extrabold text-danger">
                    -{formatRupiah(item.amount)}
                  </span>
                </div>
              ))}
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover aspect-square" />
              ) : (
                <span>{(profile?.full_name || user?.email || 'U')[0].toUpperCase()}</span>
              )}
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

