'use client';

// Cache-breaker: 2026-06-15 20:18

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { insightsService, type FinancialInsight } from '@/lib/services/insights.service';
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
  Calendar,
  PieChart,
  ShieldAlert,
  Bell,
  ChevronDown,
  Zap,
  ShieldCheck,
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
  const { accountId, user, profile, t } = useApp();
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
    walletCount: 0,
    totalBalance: 0,
    incomeDiff: 0,
    expenseDiff: 0,
    savingsDiff: 0,
    incomeSparkline: [] as number[],
    expenseSparkline: [] as number[],
    savingsSparkline: [] as number[],
    debtSparkline: [] as number[],
    insights: [] as FinancialInsight[],
  });

  const [recentTxs, setRecentTxs] = useState<PopulatedTransaction[]>([]);
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [isPieExpanded, setIsPieExpanded] = useState(false);
  const [isTrendsExpanded, setIsTrendsExpanded] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ open: boolean; type: 'income' | 'expense' | 'transfer' }>({
    open: false,
    type: 'expense',
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [dateFilter, setDateFilter] = useState('12 Mei - 12 Jun 2024');

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
      let walletCount = 0;
      try {
        const wallets = await walletService.getWallets(accountId);
        totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
        walletCount = wallets.length;
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
        walletCount,
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



  // Score-dependent banner status variables
  const score = financialStats.score;
  const statusLabel = score >= 80 ? 'Sangat Baik' : score >= 50 ? 'Cukup Baik' : 'Perlu Perbaikan';
  const statusTextColor = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-indigo-400' : 'text-rose-400';
  const statusBgColor = score >= 80 ? 'bg-emerald-400' : score >= 50 ? 'bg-indigo-400' : 'bg-rose-400';
  const statusDesc = score >= 80 
    ? 'Keuangan Anda berada di level elit. Jalur bebas hambatan.' 
    : score >= 50 
      ? 'Keuangan Anda stabil. Menuju posisi aman.' 
      : 'Keuangan Anda kritis. Restrukturisasi diperlukan segera.';
  const statusNeon = score >= 80 ? 'Tanpa Hambatan' : 'Progress Ke Aman';

  // Quadratic Bezier Calculation: P0=(150, 90), P1=(500, 90), P2=(850, 30)
  const tParam = Math.min(Math.max(score / 100, 0.05), 1);
  const p0 = [150, 90];
  const p1 = [500, 90];
  const p2 = [850, 60];

  const q1 = [
    (1 - tParam) * p0[0] + tParam * p1[0],
    (1 - tParam) * p0[1] + tParam * p1[1]
  ];
  const q2_x = (1 - tParam) * (1 - tParam) * p0[0] + 2 * (1 - tParam) * tParam * p1[0] + tParam * tParam * p2[0];
  const q2_y = (1 - tParam) * (1 - tParam) * p0[1] + 2 * (1 - tParam) * tParam * p1[1] + tParam * tParam * p2[1];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-10 md:pt-6 flex flex-col pb-32">
      {/* Dynamic Keyframes for Waving Flag */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flag-wave {
          0% { transform: scaleX(1) skewY(0deg); }
          50% { transform: scaleX(0.95) skewY(4deg); }
          100% { transform: scaleX(1) skewY(0deg); }
        }
        .waving-flag {
          animation: flag-wave 1.5s ease-in-out infinite;
          transform-origin: left center;
        }
      ` }} />

      {/* Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
        <div className="space-y-0.5">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter">
            Halo, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Majesti'} 👋
          </h1>
          <p className="text-[11px] text-[#6F7A9E] font-medium tracking-wide opacity-80 uppercase tracking-widest">
            Monitor ekosistem finansial Anda dengan intelijen real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-bold text-[#A7B0D1] cursor-pointer hover:bg-white/10 transition-all shadow-lg active:scale-95">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>{dateFilter}</span>
              <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
            {/* Simple Date Dropdown Placeholder */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0D122B] border border-white/10 rounded-2xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all z-[60] p-2">
              {['Bulan Ini', 'Bulan Lalu', '3 Bulan Terakhir'].map((opt) => (
                <button key={opt} onClick={() => setDateFilter(opt)} className="w-full text-left px-4 py-2 hover:bg-white/5 rounded-lg text-[10px] font-bold text-neutral-400 hover:text-white transition-colors">
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#6F7A9E] hover:text-white hover:bg-white/10 transition-all relative shadow-lg active:scale-95"
            >
              <Bell className="w-4.5 h-4.5" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full border-2 border-[#0a0a0c] animate-pulse" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[#0D122B]/95 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-2xl z-[60] p-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/50">Notifikasi Intelijen</h4>
                  <span className="text-[9px] font-bold text-indigo-400 cursor-pointer">Tandai Dibaca</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white">Target Tabungan Tercapai!</p>
                      <p className="text-[9px] text-[#6F7A9E] mt-0.5">Anda telah menyisihkan 10% lebih banyak dari bulan lalu.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section: Financial Health Compact Banner */}
      <Card 
        onClick={() => router.push('/wallets')}
        className="py-6 px-8 md:px-12 relative overflow-hidden bg-gradient-to-br from-[#12042a] via-[#09112a] to-[#050816] rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group hover:shadow-indigo-500/10 transition-all duration-1000 cursor-pointer shrink-0"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5" />
        
        {/* Live Progress Path SVG Background */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          viewBox="0 0 1000 120" 
          preserveAspectRatio="none"
        >
          {/* Base journey path */}
          <path 
            d="M 150 90 Q 500 90, 850 60" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.05)" 
            strokeWidth="3" 
            strokeLinecap="round"
          />
          {/* Active glowing path representing user's score */}
          <path 
            d={`M 150 90 Q ${q1[0]} ${q1[1]}, ${q2_x} ${q2_y}`} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            className={`transition-all duration-1000 ${statusTextColor} drop-shadow-[0_0_6px_currentColor]`}
          />
        </svg>

        {/* Live Progress Flag at the Peak */}
        <div 
          className="absolute z-10 pointer-events-none transition-all duration-1000"
          style={{ left: '85%', top: '50%', transform: 'translate(-5px, -100%)' }}
        >
          {/* Flagpole */}
          <div className="w-[2px] h-5 bg-white/20 rounded-full relative">
            {/* Flag banner */}
            <div className="absolute top-0 left-[2px] flex items-center transition-all duration-1000">
              <svg width="24" height="14" viewBox="0 0 24 16" className={`${statusTextColor} fill-current/20 waving-flag`}>
                <path d="M 0 0 C 8 2, 12 -2, 20 0 L 20 10 C 12 8, 8 12, 0 10 Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Neon Status Banner Text above the Peak */}
        <div 
          className="absolute z-10 pointer-events-none transition-all duration-1000 select-none"
          style={{ left: '85%', top: '50%', transform: 'translate(-50%, -150%)' }}
        >
          <span className={`text-[8px] font-black tracking-widest uppercase ${statusTextColor} drop-shadow-[0_0_8px_currentColor] bg-[#0a0f26]/80 px-2.5 py-1 rounded-full border border-white/5 backdrop-blur-sm`}>
            {statusNeon}
          </span>
        </div>

        {/* Glowing Indicator Dot along the path */}
        <div 
          className="absolute z-10 pointer-events-none transition-all duration-1000"
          style={{ left: `${(q2_x / 10).toFixed(2)}%`, top: `${(q2_y / 1.05).toFixed(2)}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center relative">
            <div className={`absolute inset-0 rounded-full animate-ping opacity-40 ${statusBgColor}`} />
            <div className={`w-2 h-2 rounded-full relative z-10 ${statusBgColor} shadow-[0_0_8px_currentColor]`} />
          </div>
        </div>

        {/* Left Side: Score & Narrative */}
        <div className="relative z-20 flex items-center gap-6">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0 bg-white/[0.03] backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl">
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-xl font-black text-white">{score}</span>
               <span className="text-[7px] font-bold text-[#6F7A9E] uppercase">Health</span>
             </div>
          </div>
          <div className="space-y-1">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full animate-pulse ${statusBgColor}`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${statusTextColor}`}>
                 {statusLabel}
               </span>
             </div>
             <p className="text-xs font-bold text-white/90 leading-tight max-w-[280px]">
               {statusDesc}
             </p>
          </div>
        </div>

        {/* Right Side: Total Likuiditas & Dynamic Badges */}
        <div className="relative z-20 text-left md:text-right flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
          <span className="text-[9px] uppercase font-black text-indigo-400 tracking-[0.3em] opacity-80 block">
            Total Likuiditas
          </span>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-2xl">
              {formatRupiah(financialStats.totalBalance)}
            </h3>
            <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
              <span className="text-[10px] text-[#6F7A9E] font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                Tersebar di {financialStats.walletCount} aset
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Row 2: 4 Stats Widgets - Compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Pemasukan', val: financialStats.income, diff: financialStats.incomeDiff, col: '#28D17C', icon: TrendingUp, type: 'income' as const },
          { label: 'Pengeluaran', val: financialStats.expense, diff: financialStats.expenseDiff, col: '#FF4B5C', icon: TrendingDown, type: 'expense' as const },
          { label: 'Sisa Tabungan', val: financialStats.savings, diff: financialStats.savingsDiff, col: '#6E5CFF', icon: Wallet, path: '/savings' },
          { label: 'Utang Aktif', val: financialStats.activeDebt, desc: `${financialStats.activeLoansCount} aktif`, col: '#FFB347', icon: ShieldAlert, path: '/pinjol' },
        ].map((s, i) => (
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
            <div className="relative">
              <select className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold text-white pr-10 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer hover:bg-white/10">
                <option value="daily" className="bg-[#0A1028]">Harian</option>
                <option value="weekly" className="bg-[#0A1028]">Mingguan</option>
                <option value="monthly" className="bg-[#0A1028]">Bulanan</option>
                <option value="yearly" className="bg-[#0A1028]">Tahunan</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6F7A9E] pointer-events-none" />
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
                  <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner relative group/bar">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out relative" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: item.color,
                        boxShadow: `0 0 20px ${item.color}50`
                      }} 
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    {/* Percentage Tooltip/Indicator */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black text-white/90">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Month Summary */}
        <div className="lg:col-span-3 p-6 rounded-[32px] bg-gradient-to-b from-[#0A1028] to-[#050816] border border-white/5 space-y-5 flex flex-col shadow-2xl">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-[12px] font-black uppercase tracking-widest text-white/50">Financial Intelligence</h3>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <TrendingUp className="w-12 h-12" />
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed font-medium">
                Kesehatan finansial Anda berada di level <span className="text-emerald-400 font-bold">Prima</span>. 
                Rasio tabungan meningkat {financialStats.savingsDiff.toFixed(1)}% periode ini. 
                Pertahankan pola pengeluaran di kategori <span className="text-indigo-400">Utilitas</span> untuk efisiensi maksimal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <span className="text-[8px] font-bold text-emerald-400/70 uppercase">Inflow</span>
                <p className="text-xs font-black text-white">+{formatRupiah(financialStats.income)}</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                <span className="text-[8px] font-bold text-rose-400/70 uppercase">Outflow</span>
                <p className="text-xs font-black text-white">-{formatRupiah(financialStats.expense)}</p>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => router.push('/reports')}
                className="w-full py-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95"
              >
                Analisis Mendalam
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
        title="Intelijen Distribusi Pengeluaran"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 bg-white/[0.02] rounded-[32px] border border-white/5">
            <div className="relative aspect-square flex items-center justify-center">
              {/* Replacing Radar with clean visualization or keeping radar but with better styling if needed */}
              <CategoryRadarChart data={pieData} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Total</p>
                 <p className="text-lg font-black text-white">{formatRupiah(financialStats.expense)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Dominasi Kategori</h4>
              <div className="space-y-3">
                {pieData.slice(0, 4).map((item, idx) => {
                  const pct = ((item.value / (financialStats.expense || 1)) * 100).toFixed(1);
                  return (
                    <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-indigo-500/10 transition-all cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: item.color, backgroundColor: item.color }} />
                        <span className="text-[11px] font-bold text-white/80">{translateCategory(item.name)}</span>
                      </div>
                      <span className="text-[11px] font-black text-white">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Daftar Lengkap Ekosistem</h4>
               <span className="text-[9px] font-bold text-[#6F7A9E]">{pieData.length} Kategori Terdeteksi</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar divide-y divide-white/5 border border-white/5 rounded-3xl bg-[#050816]/50">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10" style={{ color: item.color }}>
                      <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{translateCategory(item.name)}</p>
                      <p className="text-[10px] text-[#6F7A9E] font-bold uppercase tracking-tight">Kategori Aktif</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">{formatRupiah(item.value)}</p>
                    <p className="text-[10px] text-emerald-400 font-bold">{((item.value / (financialStats.expense || 1)) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
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

