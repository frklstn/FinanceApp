'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { insightsService, FinancialInsight } from '@/lib/services/insights.service';
import { transactionService } from '@/lib/services/transaction.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';

export default function InsightsPage() {
  const { accountId, appSettings } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    score: 0,
    income: 0,
    expense: 0,
    savings: 0,
    runwayMonths: 0,
  });
  const [insights, setInsights] = useState<FinancialInsight[]>([]);

  const loadInsightsData = useCallback(async () => {
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
        runwayMonths: insightData.runwayMonths,
      });
      setInsights(insightData.insights);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat analisis keuangan.';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(loadInsightsData);
    }
  }, [accountId, loadInsightsData]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <ShieldCheck className="w-5 h-5 text-success shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning shrink-0" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-danger shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success/5 border-success/15 text-light-text-primary dark:text-dark-text-primary';
      case 'warning':
        return 'bg-warning/5 border-warning/15 text-light-text-primary dark:text-dark-text-primary';
      case 'danger':
        return 'bg-danger/5 border-danger/15 text-light-text-primary dark:text-dark-text-primary';
      default:
        return 'bg-emerald-500/5 border-emerald-500/15 text-light-text-primary dark:text-dark-text-primary';
    }
  };

  return (
    <div className="space-y-8">
      <UpgradeGate>
        {/* Title */}
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 uppercase">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            Intelijen Finansial
          </h2>
          <p className="text-xs md:text-sm text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
            Rangkuman skor kesehatan finansial, analisis anggaran belanja, dan rekomendasi dinamis untuk Anda.
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="h-48 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
            <div className="h-64 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Health Score Banner */}
            <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                <span className="text-[10px] uppercase font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full tracking-[0.2em] border border-emerald-500/20">
                  Skor Kesehatan {appSettings.app_name || 'FinanceApp'}
                </span>
                <h3 className="text-2xl font-extrabold text-light-text-primary dark:text-dark-text-primary">
                  {stats.score >= 80 ? (
                    'Kondisi Keuangan Anda Sangat Baik!'
                  ) : stats.score >= 50 ? (
                    'Kondisi Keuangan Anda Cukup Stabil'
                  ) : (
                    'Perlu Perhatian Lebih Pada Keuangan Anda'
                  )}
                </h3>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-md leading-relaxed">
                  {stats.score >= 80
                    ? 'Pertahankan pola pengeluaran ini untuk masa depan yang lebih aman dan terencana.'
                    : stats.score >= 50
                    ? 'Ada beberapa area pengeluaran yang bisa dioptimalkan untuk meningkatkan tabungan Anda.'
                    : 'Skor kesehatan Anda menunjukkan risiko penumpukan utang atau pengeluaran berlebih. Segera evaluasi anggaran.'}
                </p>
              </div>

              {/* Score Display (no progress ring, only score container) */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="nexus-panel p-5 border-emerald-500/20 flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-emerald-500/5">
                  <span className="text-[9px] uppercase font-bold text-white/40 tracking-widest mb-0.5">
                    Skor
                  </span>
                  <span className="text-4xl font-black text-emerald-400 tracking-tighter">
                    {stats.score}
                  </span>
                  <span className="text-[10px] font-bold text-white/40 mt-0.5">
                    / 100
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">Pemasukan Bulan Ini</span>
                  <p className="text-lg font-bold text-success">+{formatRupiah(stats.income)}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-success/70" />
              </Card>
              <Card className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">Pengeluaran Bulan Ini</span>
                  <p className="text-lg font-bold text-danger">-{formatRupiah(stats.expense)}</p>
                </div>
                <TrendingDown className="w-5 h-5 text-danger/70" />
              </Card>
              <Card className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">Runway Keuangan</span>
                  <p className={`text-lg font-bold ${stats.runwayMonths >= 6 ? 'text-emerald-500' : stats.runwayMonths >= 3 ? 'text-warning' : 'text-danger'}`}>
                    {stats.runwayMonths.toFixed(1)} Bulan
                  </p>
                </div>
                <Wallet className="w-5 h-5 text-emerald-400/70" />
              </Card>
            </div>

            {/* Detailed list of insights */}
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Rekomendasi &amp; Peringatan Sistem
              </h3>

              <div className="space-y-4">
                {insights.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-light-border dark:border-dark-border text-xs text-light-text-secondary font-medium">
                    <Info className="w-5 h-5 text-emerald-500 shrink-0" />
                    Semua sistem aman! Kami tidak mendeteksi kebiasaan buruk atau peringatan keuangan pada siklus ini.
                  </div>
                ) : (
                  insights.map((ins, index) => (
                    <div key={index} className={`flex items-start gap-4 p-4 rounded-xl border ${getInsightColor(ins.type)}`}>
                      {getInsightIcon(ins.type)}
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold">{ins.title}</h4>
                        <p className="text-[11px] font-medium leading-relaxed opacity-90">{ins.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </UpgradeGate>
    </div>
  );
}
