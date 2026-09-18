'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import type { FinancialInsight } from '@/lib/services/server/insights.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { useToast } from '@/components/ui/toast';
import { UpgradeGate } from '@/components/ui/UpgradeGate';
import { EmergencyRunwayCard } from '@/components/finance/insights/emergency-runway-card';
import { Sparkles, ShieldCheck, AlertTriangle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { BRAND } from '@/lib/branding';
import { getInsightsData } from '@/app/actions/insights';

const INSIGHT_CONFIG = {
  success: {
    icon: <ShieldCheck className="w-5 h-5 text-success shrink-0" />,
    style: 'bg-primary-glow border-primary-border',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    style: 'bg-amber-500/5 border-amber-500/20',
  },
  danger: {
    icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
    style: 'bg-rose-500/5 border-rose-500/20',
  },
  default: {
    icon: <Info className="w-5 h-5 text-primary shrink-0" />,
    style: 'bg-primary-glow border-primary-border',
  },
};

export default function InsightsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ score: 0, income: 0, expense: 0, savings: 0, runwayMonths: 0 });
  const [insights, setInsights] = useState<FinancialInsight[]>([]);

  const loadInsightsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getInsightsData();
      if (!data) return;

      setStats({
        score: data.score,
        income: data.income,
        expense: data.expense,
        savings: data.savings,
        runwayMonths: data.runwayMonths,
      });
      setInsights(data.insights);
    } catch {
      toast('Gagal memuat analisis keuangan.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(loadInsightsData);
  }, [accountId, loadInsightsData]);

  return (
    <div className="space-y-8">
      <UpgradeGate>
        <PageHeader
          title="Insight keuangan"
          subtitle="Rangkuman skor kesehatan finansial, analisis belanja, dan rekomendasi untukmu"
        />

        {loading ? (
          <div className="space-y-6">
            <div className="h-48 rounded-2xl border border-line bg-surface animate-pulse" />
            <div className="h-64 rounded-2xl border border-line bg-surface animate-pulse" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                <span className="inline-block text-[10px] font-semibold text-primary bg-primary-glow px-3 py-1.5 rounded-full border border-primary-border">
                  Skor kesehatan {BRAND.name}
                </span>
                <h3 className="font-heading text-2xl font-semibold text-text-primary tracking-tight">
                  {stats.score >= 80
                    ? 'Kondisi keuanganmu sangat baik'
                    : stats.score >= 50
                      ? 'Kondisi keuanganmu cukup stabil'
                      : 'Keuanganmu perlu perhatian lebih'}
                </h3>
                <p className="text-xs text-text-secondary max-w-md leading-relaxed">
                  {stats.score >= 80
                    ? 'Pertahankan pola pengeluaran ini untuk masa depan yang lebih aman dan terencana.'
                    : stats.score >= 50
                      ? 'Ada beberapa pengeluaran yang bisa dioptimalkan untuk menambah tabungan.'
                      : 'Skormu menunjukkan risiko penumpukan utang atau pengeluaran berlebih. Segera evaluasi anggaran.'}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="p-5 rounded-2xl bg-surface border border-primary-border flex flex-col items-center justify-center min-w-[110px]">
                  <span className="text-[10px] font-semibold text-text-muted mb-0.5">Skor</span>
                  <span className="font-heading text-4xl font-semibold text-primary tracking-tight">
                    {stats.score}
                  </span>
                  <span className="text-[10px] text-text-muted mt-0.5">/ 100</span>
                </div>
              </div>
            </Card>

            <EmergencyRunwayCard runwayMonths={stats.runwayMonths} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-text-secondary">Pemasukan bulan ini</span>
                  <p className="text-lg font-semibold text-success">+{formatCurrency(stats.income)}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-success/70" />
              </Card>
              <Card className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-text-secondary">Pengeluaran bulan ini</span>
                  <p className="text-lg font-semibold text-rose-400">-{formatCurrency(stats.expense)}</p>
                </div>
                <TrendingDown className="w-5 h-5 text-rose-400/70" />
              </Card>
            </div>

            <Card className="space-y-4">
              <h3 className="font-heading text-sm font-semibold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Rekomendasi &amp; peringatan
              </h3>

              <div className="space-y-4">
                {insights.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-line text-xs text-text-secondary">
                    <Info className="w-5 h-5 text-primary shrink-0" />
                    Belum ada yang bisa dianalisis. Catat beberapa transaksi dulu.
                  </div>
                ) : (
                  insights.map((ins, index) => {
                    const config = INSIGHT_CONFIG[ins.type as keyof typeof INSIGHT_CONFIG] || INSIGHT_CONFIG.default;
                    return (
                      <div key={index} className={`flex items-start gap-4 p-4 rounded-xl border ${config.style}`}>
                        {config.icon}
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-text-primary">{ins.title}</h4>
                          <p className="text-[11px] text-text-secondary leading-relaxed">{ins.description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}
      </UpgradeGate>
    </div>
  );
}
