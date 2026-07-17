'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { transactionService, PopulatedTransaction } from '@/lib/services/workspace/transaction.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart3,
  TrendingUpDown,
  Download,
  Info,
  Scale,
  Percent,
} from 'lucide-react';

interface ReportStats {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

interface CategorySpending {
  name: string;
  amount: number;
  color: string;
  type: string;
  percentage: number;
}

interface TaxCalculation {
  grossIncome: number;
  totalDeductibles: number;
  taxableIncome: number;
  estimatedTax: number;
}

export default function ReportsPage() {
  const { accountId, profile, t } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // month, last_month, ytd
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'tax'>('analytics');
  
  // Aggregate stats with strict type structure
  const [reportStats, setReportStats] = useState<ReportStats>({
    income: 0,
    expense: 0,
    savings: 0,
    savingsRate: 0,
  });

  // Categories spending list with strict type structure
  const [categorySpendings, setCategorySpendings] = useState<CategorySpending[]>([]);

  // Tax metrics states
  const [taxRate, setTaxRate] = useState(15); // Default 15% estimated average bracket
  const [deductiblesRatio, setDeductiblesRatio] = useState(25); // Estimated 25% of expenses are tax deductible

  // Synchronize taxRate with profile setting once loaded
  useEffect(() => {
    if (profile?.tax_rate !== undefined && profile?.tax_rate !== null) {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setTaxRate(Number(profile.tax_rate));
    }
  }, [profile?.tax_rate]);

  const persistTaxRate = useCallback(async (rate: number) => {
    if (!profile?.id) return;
    try {
      const supabase = createClient();
      await supabase
        .from('profiles')
        .update({ tax_rate: rate })
        .eq('id', profile.id);
    } catch (err) {
      console.error('Failed to persist tax rate:', err);
    }
  }, [profile]);

  const generateReport = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);

      const startDate = new Date();
      const endDate = new Date();

      if (period === 'month') {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'last_month') {
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        endDate.setDate(0); // Last day of previous month
        endDate.setHours(23, 59, 59, 999);
      } else if (period === 'ytd') {
        startDate.setMonth(0); // Jan 1st
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      // Fetch all transactions in date range
      const { data: txs } = await transactionService.getTransactions(accountId, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000, // Safe fetch for report
      });

      let inc = 0;
      let exp = 0;
      const catAggregation: { [name: string]: { amt: number; col: string; type: string } } = {};

      txs.forEach((tx: PopulatedTransaction) => {
        const amt = Number(tx.amount);
        if (tx.type === 'income') {
          inc += amt;
        } else if (tx.type === 'expense') {
          exp += amt;
          const catName = tx.categories?.name || 'General';
          const catColor = tx.categories?.color || '#9CA3AF';
          
          if (!catAggregation[catName]) {
            catAggregation[catName] = { amt: 0, col: catColor, type: tx.type };
          }
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

      // Map categories rankings with strict type checking
      const catRankings: CategorySpending[] = Object.entries(catAggregation)
        .map(([name, item]) => ({
          name,
          amount: item.amt,
          color: item.col,
          type: item.type,
          percentage: exp > 0 ? Math.round((item.amt / exp) * 100) : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      setCategorySpendings(catRankings);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('reports.error.assemble', 'Gagal memproses laporan keuangan.');
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, period, toast, t]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(generateReport);
    }
  }, [accountId, period, generateReport]);

  const handleExportData = () => {
    toast(t('reports.toast.exportInit', 'Ekspor Excel dimulai. Memproses kompilasi...'), 'info');
    setTimeout(() => {
      toast(t('reports.toast.redirect', 'Mengalihkan ke modul ekspor data...'), 'success');
      window.location.href = '/finance/settings?tab=data';
    }, 1000);
  };

  // Strictly typed tax calculation dataset
  const taxCalculations: TaxCalculation = {
    grossIncome: reportStats.income,
    totalDeductibles: (reportStats.expense * deductiblesRatio) / 100,
    taxableIncome: Math.max(0, reportStats.income - (reportStats.expense * deductiblesRatio) / 100),
    estimatedTax: (Math.max(0, reportStats.income - (reportStats.expense * deductiblesRatio) / 100) * taxRate) / 100,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('reports.title', 'Laporan')}
        subtitle={t('reports.subtitle', 'Analisis pengeluaran, margin, dan kinerja tabunganmu')}
        actions={
          <>
            <Select
              options={[
                { value: 'month', label: t('common.thisMonth', 'Bulan Ini') },
                { value: 'last_month', label: t('common.lastMonth', 'Bulan Lalu') },
                { value: 'ytd', label: t('common.ytd', 'Tahun ke Tanggal (YTD)') },
              ]}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="min-w-[180px]"
            />
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              {t('reports.exportLedger', 'Ekspor laporan')}
            </Button>
          </>
        }
      />

      {/* Sub tabs selectors */}
      <div className="flex gap-4 border-b border-light-border/40 dark:border-dark-border/40 pb-2">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold  transition-all duration-150 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-b-2 border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)]'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5 text-[var(--nexus-emerald)]" />
          {t('reports.tab.analytics', 'Analisis Pengeluaran')}
        </button>
        <button
          onClick={() => setActiveSubTab('tax')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold  transition-all duration-150 cursor-pointer ${
            activeSubTab === 'tax'
              ? 'border-b-2 border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)]'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <Scale className="w-4.5 h-4.5" />
          {t('reports.tab.tax', 'Estimasi Perencanaan Pajak')}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-80 rounded-2xl shimmer" />
          <div className="md:col-span-2 h-80 rounded-2xl shimmer" />
        </div>
      ) : activeSubTab === 'analytics' ? (
        /* Analytics view */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net balance changes summary column */}
          <div className="space-y-6 md:col-span-1">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
                <TrendingUpDown className="w-4.5 h-4.5 text-[var(--nexus-emerald)]" />
                {t('reports.analytics.netCashflow', 'Aliran Kas Bersih')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('reports.analytics.totalIncome', 'Total Pemasukan')}</span>
                  <span className="text-success">+{formatCurrency(reportStats.income)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('reports.analytics.totalExpense', 'Total Pengeluaran')}</span>
                  <span className="text-danger">-{formatCurrency(reportStats.expense)}</span>
                </div>
                <div className="h-px bg-light-border/40 dark:bg-dark-border/40 my-2" />
                
                <div className="flex justify-between items-center text-sm font-extrabold">
                  <span className="text-light-text-primary dark:text-dark-text-primary">{t('reports.analytics.netMargin', 'Margin Bersih')}</span>
                  <span className={reportStats.savings >= 0 ? 'text-[var(--nexus-emerald)]' : 'text-danger'}>
                    {reportStats.savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(reportStats.savings))}
                  </span>
                </div>
              </div>
            </Card>

            {/* Savings Rate Card */}
            <Card className="p-5 space-y-3">
              <span className="text-[10px]  font-semibold text-light-text-secondary dark:text-dark-text-secondary ">
                {t('reports.analytics.monthlySavingsRate', 'Rasio Menabung Bulanan')}
              </span>
              <h4 className="text-2xl font-extrabold text-[var(--nexus-emerald)] dark:text-[var(--nexus-text-primary)]">
                {reportStats.savingsRate}%
              </h4>
              <Progress value={reportStats.savingsRate} className="bg-[var(--nexus-emerald)]" />
              <p className="text-[10.5px] font-medium text-light-text-secondary dark:text-dark-text-secondary/60 leading-relaxed pt-1">
                {t('reports.analytics.savingsMsg', 'Anda menyisihkan {savings} dari total pemasukan {income} pada siklus ini.')
                  .replace('{savings}', formatCurrency(reportStats.savings))
                  .replace('{income}', formatCurrency(reportStats.income))}
              </p>
            </Card>
          </div>

          {/* Category Rank List table widget */}
          <div className="md:col-span-2">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
                <BarChart3 className="w-4.5 h-4.5 text-[var(--nexus-emerald)]" />
                {t('reports.analytics.categoryRanking', 'Peringkat Pengeluaran Kategori')}
              </h3>
              
              {categorySpendings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-3 text-light-text-secondary">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-light-text-secondary font-medium">
                    {t('reports.analytics.noData', 'Tidak ada data transaksi pengeluaran untuk jangka waktu yang dipilih.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categorySpendings.map((cat, index) => (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary/40 font-bold w-4">
                            #{index + 1}
                          </span>
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                          {formatCurrency(cat.amount)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
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
        /* Tax Estimator Planner View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Controls column */}
          <div className="md:col-span-1 space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
                <Percent className="w-4.5 h-4.5 text-[var(--nexus-emerald)]" />
                {t('reports.tax.variables', 'Variabel Tarif Pajak')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold  text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    {t('reports.tax.estimatedBracket', 'Estimasi Golongan Pajak')} ({taxRate}%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    onMouseUp={(e) => persistTaxRate(Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => persistTaxRate(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-2 rounded-lg bg-light-border dark:bg-dark-border appearance-none cursor-pointer accent-[var(--nexus-emerald)]"
                  />
                  <div className="flex justify-between text-[10px] text-light-text-secondary mt-1">
                    <span>5% ({t('reports.tax.low', 'Rendah')})</span>
                    <span>45% ({t('reports.tax.high', 'Tinggi')})</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold  text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    {t('reports.tax.deductiblesRatio', 'Pengeluaran Bebas Pajak')} ({deductiblesRatio}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={deductiblesRatio}
                    onChange={(e) => setDeductiblesRatio(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-light-border dark:bg-dark-border appearance-none cursor-pointer accent-[var(--nexus-emerald)]"
                  />
                  <div className="flex justify-between text-[10px] text-light-text-secondary mt-1">
                    <span>0% ({t('reports.tax.zero', 'Nihil')})</span>
                    <span>100% ({t('reports.tax.all', 'Semua')})</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tax Estimator Statement worksheet */}
          <div className="md:col-span-2">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-extrabold text-light-text-primary dark:text-dark-text-primary">
                  {t('reports.tax.statement', 'Pernyataan Proyeksi Pajak Penghasilan')}
                </h3>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                  {t('reports.tax.statementDesc', 'Proyeksi pajak berdasarkan pemasukan dan pengeluaran periode aktif.')}
                </p>
              </div>

              <div className="divide-y divide-light-border/40 dark:divide-dark-border/40 text-xs font-semibold space-y-3.5">
                <div className="flex justify-between items-center pt-3.5">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('reports.tax.grossIncome', 'Pendapatan Kotor (Total Pemasukan)')}</span>
                  <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                    {formatCurrency(taxCalculations.grossIncome)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-3.5">
                  <div className="space-y-0.5">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('reports.tax.deductions', 'Pengurangan Pajak Pengeluaran')}</span>
                    <p className="text-[10px] text-light-text-secondary/60 font-medium">
                      {t('reports.tax.deductionsDesc', 'Mengasumsikan {ratio}% dari pengeluaran bulanan dapat dikurangkan dari pajak')
                        .replace('{ratio}', String(deductiblesRatio))}
                    </p>
                  </div>
                  <span className="text-success font-bold">
                    -{formatCurrency(taxCalculations.totalDeductibles)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3.5">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('reports.tax.taxableIncome', 'Penghasilan Kena Pajak Bersih Disesuaikan')}</span>
                  <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                    {formatCurrency(taxCalculations.taxableIncome)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t-2 border-primary/20">
                  <div className="space-y-0.5">
                    <span className="text-sm font-extrabold text-[var(--nexus-emerald)]">{t('reports.tax.estimatedTax', 'Estimasi Proyeksi Pajak')}</span>
                    <p className="text-[10px] text-light-text-secondary/60 font-medium">
                      {t('reports.tax.estimatedTaxDesc', 'Menerapkan perkiraan tarif pajak sebesar {rate}%')
                        .replace('{rate}', String(taxRate))}
                    </p>
                  </div>
                  <span className="text-lg font-extrabold text-danger">
                    {formatCurrency(taxCalculations.estimatedTax)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/40 dark:bg-dark-bg/25">
                <Info className="w-4.5 h-4.5 text-[var(--nexus-emerald)] shrink-0 mt-0.5" />
                <p className="text-[10.5px] font-medium text-light-text-secondary leading-relaxed">
                  {t('reports.tax.disclaimer', 'Disclaimer: Proyeksi ini dibuat murni untuk kemudahan perencanaan dan kejelasan anggaran. Ini tidak merupakan saran pajak profesional. Konsultasikan dengan Akuntan Pajak resmi untuk pelaporan SPT formal Anda.')}
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
