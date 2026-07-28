'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { BarChart3, TrendingUpDown, Info, Scale, Percent } from 'lucide-react';
import { getReportData, saveTaxRateAction } from '@/app/actions/report';

interface CategorySpending {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

export default function ReportsPage() {
  const { accountId, profile } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'last_month' | 'ytd'>('month');
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'tax'>('analytics');

  const [reportStats, setReportStats] = useState({ income: 0, expense: 0, savings: 0, savingsRate: 0 });
  const [categorySpendings, setCategorySpendings] = useState<CategorySpending[]>([]);

  const [taxRate, setTaxRate] = useState(15);
  const [deductiblesRatio, setDeductiblesRatio] = useState(25);

  useEffect(() => {
    if (profile?.tax_rate !== undefined && profile?.tax_rate !== null) {
      setTaxRate(Number(profile.tax_rate));
    }
  }, [profile?.tax_rate]);

  const persistTaxRate = useCallback(async (rate: number) => {
    try {
      await saveTaxRateAction(rate);
    } catch (err) {
      console.error('Gagal menyimpan tarif pajak:', err);
    }
  }, []);

  const generateReport = useCallback(async () => {
    try {
      setLoading(true);
      const { transactions } = await getReportData(period);

      let inc = 0;
      let exp = 0;
      const catAggregation: { [name: string]: { amt: number; col: string } } = {};

      transactions.forEach((tx) => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          inc += amt;
        } else if (tx.type === 'expense') {
          exp += amt;
          const catName = tx.categories?.name || 'Lainnya';
          if (!catAggregation[catName]) catAggregation[catName] = { amt: 0, col: '#a8532f' };
          catAggregation[catName].amt += amt;
        }
      });

      const sav = inc - exp;
      const rate = inc > 0 ? (sav / inc) * 100 : 0;

      setReportStats({
        income: inc,
        expense: exp,
        savings: sav,
        savingsRate: Math.max(0, Math.round(rate)),
      });

      setCategorySpendings(
        Object.entries(catAggregation)
          .map(([name, item]) => ({
            name,
            amount: item.amt,
            color: item.col,
            percentage: exp > 0 ? Math.round((item.amt / exp) * 100) : 0,
          }))
          .sort((a, b) => b.amount - a.amount)
      );
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal memproses laporan keuangan.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(generateReport);
  }, [accountId, generateReport]);

  const totalDeductibles = (reportStats.expense * deductiblesRatio) / 100;
  const taxableIncome = Math.max(0, reportStats.income - totalDeductibles);
  const estimatedTax = (taxableIncome * taxRate) / 100;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Laporan"
        subtitle="Analisis pengeluaran, margin, dan kinerja tabunganmu"
        actions={
          <Select
            options={[
              { value: 'month', label: 'Bulan ini' },
              { value: 'last_month', label: 'Bulan lalu' },
              { value: 'ytd', label: 'Tahun berjalan' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="min-w-[180px]"
          />
        }
      />

      <div className="flex gap-4 border-b border-[var(--nexus-glass-border)] pb-2">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 pb-2 text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-b-2 border-[var(--nexus-emerald)] text-[var(--nexus-emerald)]'
              : 'text-[var(--nexus-text-secondary)] hover:text-[var(--nexus-text-primary)]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analisis pengeluaran
        </button>
        <button
          onClick={() => setActiveSubTab('tax')}
          className={`flex items-center gap-2 pb-2 text-xs font-medium transition-colors cursor-pointer ${
            activeSubTab === 'tax'
              ? 'border-b-2 border-[var(--nexus-emerald)] text-[var(--nexus-emerald)]'
              : 'text-[var(--nexus-text-secondary)] hover:text-[var(--nexus-text-primary)]'
          }`}
        >
          <Scale className="w-4 h-4" />
          Estimasi pajak
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-80 rounded-2xl bg-[var(--nexus-bg-panel)] animate-pulse" />
          <div className="md:col-span-2 h-80 rounded-2xl bg-[var(--nexus-bg-panel)] animate-pulse" />
        </div>
      ) : activeSubTab === 'analytics' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6 md:col-span-1">
            <Card className="space-y-4">
              <h3 className="font-heading text-sm font-semibold text-[var(--nexus-text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--nexus-glass-border)]">
                <TrendingUpDown className="w-4 h-4 text-[var(--nexus-emerald)]" />
                Aliran kas bersih
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--nexus-text-secondary)]">Total pemasukan</span>
                  <span className="font-semibold text-[var(--nexus-success)]">+{formatCurrency(reportStats.income)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[var(--nexus-text-secondary)]">Total pengeluaran</span>
                  <span className="font-semibold text-rose-400">-{formatCurrency(reportStats.expense)}</span>
                </div>
                <div className="h-px bg-[var(--nexus-glass-border)] my-2" />
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-[var(--nexus-text-primary)]">Margin bersih</span>
                  <span className={reportStats.savings >= 0 ? 'text-[var(--nexus-emerald)]' : 'text-rose-400'}>
                    {reportStats.savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(reportStats.savings))}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="space-y-3">
              <span className="text-[10px] font-semibold text-[var(--nexus-text-secondary)]">
                Rasio menabung
              </span>
              <h4 className="font-heading text-2xl font-semibold text-[var(--nexus-emerald)]">
                {reportStats.savingsRate}%
              </h4>
              <Progress value={reportStats.savingsRate} className="bg-[var(--nexus-emerald)]" />
              <p className="text-[11px] text-[var(--nexus-text-secondary)] leading-relaxed pt-1">
                Kamu menyisihkan {formatCurrency(reportStats.savings)} dari total pemasukan {formatCurrency(reportStats.income)} pada periode ini.
              </p>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="space-y-4">
              <h3 className="font-heading text-sm font-semibold text-[var(--nexus-text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--nexus-glass-border)]">
                <BarChart3 className="w-4 h-4 text-[var(--nexus-emerald)]" />
                Peringkat pengeluaran per kategori
              </h3>

              {categorySpendings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[var(--nexus-bg-panel)] flex items-center justify-center mb-3 text-[var(--nexus-text-muted)]">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-[var(--nexus-text-secondary)]">
                    Tidak ada pengeluaran pada periode yang dipilih.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categorySpendings.map((cat, index) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[var(--nexus-text-muted)] w-4 shrink-0">#{index + 1}</span>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium text-[var(--nexus-text-primary)] truncate">{cat.name}</span>
                        </div>
                        <span className="font-semibold text-[var(--nexus-text-primary)] shrink-0">
                          {formatCurrency(cat.amount)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--nexus-bg-panel)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <Card className="space-y-4">
              <h3 className="font-heading text-sm font-semibold text-[var(--nexus-text-primary)] flex items-center gap-2 pb-2 border-b border-[var(--nexus-glass-border)]">
                <Percent className="w-4 h-4 text-[var(--nexus-emerald)]" />
                Variabel tarif pajak
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[var(--nexus-text-secondary)] mb-1">
                    Perkiraan golongan pajak ({taxRate}%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    onMouseUp={(e) => persistTaxRate(Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => persistTaxRate(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-2 rounded-lg bg-[var(--nexus-bg-panel)] appearance-none cursor-pointer accent-[var(--nexus-emerald)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--nexus-text-muted)] mt-1">
                    <span>5% (rendah)</span>
                    <span>45% (tinggi)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[var(--nexus-text-secondary)] mb-1">
                    Pengeluaran bebas pajak ({deductiblesRatio}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={deductiblesRatio}
                    onChange={(e) => setDeductiblesRatio(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-[var(--nexus-bg-panel)] appearance-none cursor-pointer accent-[var(--nexus-emerald)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--nexus-text-muted)] mt-1">
                    <span>0% (nihil)</span>
                    <span>100% (semua)</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="space-y-6">
              <div>
                <h3 className="font-heading text-base font-semibold text-[var(--nexus-text-primary)]">
                  Proyeksi pajak penghasilan
                </h3>
                <p className="text-xs text-[var(--nexus-text-secondary)] mt-0.5">
                  Perkiraan berdasarkan pemasukan dan pengeluaran periode aktif.
                </p>
              </div>

              <div className="divide-y divide-[var(--nexus-glass-border)] text-xs space-y-3.5">
                <div className="flex justify-between items-center pt-3.5">
                  <span className="text-[var(--nexus-text-secondary)]">Pendapatan kotor</span>
                  <span className="font-semibold text-[var(--nexus-text-primary)]">{formatCurrency(reportStats.income)}</span>
                </div>

                <div className="flex justify-between items-center pt-3.5 gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[var(--nexus-text-secondary)]">Pengurang pajak</span>
                    <p className="text-[10px] text-[var(--nexus-text-muted)]">
                      Mengasumsikan {deductiblesRatio}% pengeluaran bisa dikurangkan
                    </p>
                  </div>
                  <span className="font-semibold text-[var(--nexus-success)] shrink-0">-{formatCurrency(totalDeductibles)}</span>
                </div>

                <div className="flex justify-between items-center pt-3.5">
                  <span className="text-[var(--nexus-text-secondary)]">Penghasilan kena pajak</span>
                  <span className="font-semibold text-[var(--nexus-text-primary)]">{formatCurrency(taxableIncome)}</span>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t-2 border-[var(--nexus-emerald-border)] gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-sm font-semibold text-[var(--nexus-emerald)]">Estimasi pajak</span>
                    <p className="text-[10px] text-[var(--nexus-text-muted)]">
                      Memakai tarif {taxRate}%
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-rose-400 shrink-0">{formatCurrency(estimatedTax)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)]">
                <Info className="w-4 h-4 text-[var(--nexus-emerald)] shrink-0 mt-0.5" />
                <p className="text-[11px] text-[var(--nexus-text-secondary)] leading-relaxed">
                  Angka ini hanya untuk perencanaan, bukan saran pajak profesional. Untuk pelaporan SPT resmi, konsultasikan dengan konsultan pajak.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
