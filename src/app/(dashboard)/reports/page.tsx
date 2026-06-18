'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { transactionService } from '@/lib/services/transaction.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import {
  BarChart3,
  TrendingUpDown,
  Download,
  Info,
  Scale,
  Percent,
} from 'lucide-react';

export default function ReportsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // month, last_month, ytd
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'tax'>('analytics');
  
  // Aggregate stats
  const [reportStats, setReportStats] = useState({
    income: 0,
    expense: 0,
    savings: 0,
    savingsRate: 0,
  });

  // Categories spending list
  const [categorySpendings, setCategorySpendings] = useState<{
    name: string;
    amount: number;
    color: string;
    type: string;
    percentage: number;
  }[]>([]);

  // Tax metrics states
  const [taxRate, setTaxRate] = useState(15); // Default 15% estimated average bracket
  const [deductiblesRatio, setDeductiblesRatio] = useState(25); // Estimated 25% of expenses are tax deductible

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

      txs.forEach((tx) => {
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

      // Map categories rankings
      const catRankings = Object.entries(catAggregation)
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
      const msg = err instanceof Error ? err.message : 'Failed to assemble reports';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, period, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(generateReport);
    }
  }, [accountId, period, generateReport]);

  const handleExportData = () => {
    toast('Excel export initialized. Proceeding to compilation...', 'info');
    setTimeout(() => {
      toast('Redirecting to Excel export service...', 'success');
      window.location.href = '/settings?tab=data';
    }, 1000);
  };

  // Tax calculations
  const grossIncome = reportStats.income;
  const totalDeductibles = (reportStats.expense * deductiblesRatio) / 100;
  const taxableIncome = Math.max(0, grossIncome - totalDeductibles);
  const estimatedTax = (taxableIncome * taxRate) / 100;

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-emerald-500" />
            Laporan Keuangan & Estimasi Pajak
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Analisis konsentrasi kategori pengeluaran, margin, dan kinerja tabungan Anda
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Select
            options={[
              { value: 'month', label: 'Bulan Ini' },
              { value: 'last_month', label: 'Bulan Lalu' },
              { value: 'ytd', label: 'Tahun ke Tanggal (YTD)' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <Button variant="outline" className="flex items-center gap-1.5 cursor-pointer" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Ekspor Buku Besar
          </Button>
        </div>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex gap-4 border-b border-light-border/40 dark:border-dark-border/40 pb-2">
        <button
          onClick={() => setActiveSubTab('analytics')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeSubTab === 'analytics'
              ? 'border-b-2 border-emerald-500 text-emerald-500'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5 text-emerald-400" />
          Analisis Pengeluaran
        </button>
        <button
          onClick={() => setActiveSubTab('tax')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeSubTab === 'tax'
              ? 'border-b-2 border-emerald-500 text-emerald-500'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <Scale className="w-4.5 h-4.5" />
          Estimasi Perencanaan Pajak
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
                <TrendingUpDown className="w-4.5 h-4.5 text-emerald-500" />
                Aliran Kas Bersih
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Total Pemasukan</span>
                  <span className="text-success">+{formatCurrency(reportStats.income)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Total Pengeluaran</span>
                  <span className="text-danger">-{formatCurrency(reportStats.expense)}</span>
                </div>
                <div className="h-px bg-light-border/40 dark:bg-dark-border/40 my-2" />
                
                <div className="flex justify-between items-center text-sm font-extrabold">
                  <span className="text-light-text-primary dark:text-dark-text-primary">Margin Bersih</span>
                  <span className={reportStats.savings >= 0 ? 'text-emerald-500' : 'text-danger'}>
                    {reportStats.savings >= 0 ? '+' : '-'}{formatCurrency(Math.abs(reportStats.savings))}
                  </span>
                </div>
              </div>
            </Card>

            {/* Savings Rate Card */}
            <Card className="p-5 space-y-3">
              <span className="text-[10px] uppercase font-semibold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                Rasio Menabung Bulanan
              </span>
              <h4 className="text-2xl font-extrabold text-emerald-500 dark:text-white">
                {reportStats.savingsRate}%
              </h4>
              <Progress value={reportStats.savingsRate} className="bg-emerald-500" />
              <p className="text-[10.5px] font-medium text-light-text-secondary dark:text-dark-text-secondary/60 leading-relaxed pt-1">
                Anda menyisihkan {formatCurrency(reportStats.savings)} dari total pemasukan {formatCurrency(reportStats.income)} pada siklus ini.
              </p>
            </Card>
          </div>

          {/* Category Rank List table widget */}
          <div className="md:col-span-2">
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
                <BarChart3 className="w-4.5 h-4.5 text-emerald-500" />
                Peringkat Pengeluaran Kategori
              </h3>
              
              {categorySpendings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-10 h-10 rounded-xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-3 text-light-text-secondary">
                    <Info className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-light-text-secondary font-medium">
                    Tidak ada data transaksi pengeluaran untuk jangka waktu yang dipilih.
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
                <Percent className="w-4.5 h-4.5 text-emerald-500" />
                Variabel Tarif Pajak
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Estimasi Golongan Pajak ({taxRate}%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-light-border dark:bg-dark-border appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-light-text-secondary mt-1">
                    <span>5% (Rendah)</span>
                    <span>45% (Tinggi)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Pengeluaran Bebas Pajak ({deductiblesRatio}%)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={deductiblesRatio}
                    onChange={(e) => setDeductiblesRatio(Number(e.target.value))}
                    className="w-full h-2 rounded-lg bg-light-border dark:bg-dark-border appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-light-text-secondary mt-1">
                    <span>0% (Nihil)</span>
                    <span>100% (Semua)</span>
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
                  Pernyataan Proyeksi Pajak Penghasilan
                </h3>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                  Proyeksi pajak berdasarkan pemasukan dan pengeluaran periode aktif.
                </p>
              </div>

              <div className="divide-y divide-light-border/40 dark:divide-dark-border/40 text-xs font-semibold space-y-3.5">
                <div className="flex justify-between items-center pt-3.5">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Pendapatan Kotor (Total Pemasukan)</span>
                  <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                    {formatCurrency(grossIncome)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-3.5">
                  <div className="space-y-0.5">
                    <span className="text-light-text-secondary dark:text-dark-text-secondary">Pengurangan Pajak Pengeluaran</span>
                    <p className="text-[10px] text-light-text-secondary/60 font-medium">Mengasumsikan {deductiblesRatio}% dari pengeluaran bulanan dapat dikurangkan dari pajak</p>
                  </div>
                  <span className="text-success font-bold">
                    -{formatCurrency(totalDeductibles)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3.5">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">Penghasilan Kena Pajak Bersih Disesuaikan</span>
                  <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                    {formatCurrency(taxableIncome)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-3.5 border-t-2 border-primary/20">
                  <div className="space-y-0.5">
                    <span className="text-sm font-extrabold text-emerald-500">Estimasi Proyeksi Pajak</span>
                    <p className="text-[10px] text-light-text-secondary/60 font-medium">Menerapkan perkiraan tarif pajak sebesar {taxRate}%</p>
                  </div>
                  <span className="text-lg font-extrabold text-danger">
                    {formatCurrency(estimatedTax)}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/40 dark:bg-dark-bg/25">
                <Info className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] font-medium text-light-text-secondary leading-relaxed">
                  Disclaimer: Proyeksi ini dibuat murni untuk kemudahan perencanaan dan kejelasan anggaran. Ini tidak merupakan saran pajak profesional. Konsultasikan dengan Akuntan Pajak resmi untuk pelaporan SPT formal Anda.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
