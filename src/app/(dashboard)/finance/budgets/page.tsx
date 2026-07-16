'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { budgetService, type Budget } from '@/lib/services/finance/budget.service';
import { debtService } from '@/lib/services/finance/debt.service';

import { formatCurrency } from '@/lib/debt-planner/format';
import { categoryService, type Category } from '@/lib/services/finance/category.service';
import { incomeProjectionService } from '@/lib/services/finance/income-projection.service';

import { debtPlannerSettingsService } from '@/lib/services/finance/debt-planner-settings.service';
import { 
  getSalaryPeriods, 
  getIncomeForDate, 
  calcPeriodDebtTotal 
} from '@/lib/debt-planner/calculations';
import type { IncomeTimelineEntry, LoanTracker, SalaryPeriod } from '@/lib/debt-planner/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { 
  Plus, 
  PiggyBank, 
  Trash2, 
  ShieldCheck, 
  AlertCircle, 
  Target, 
  Zap, 
  PieChart, 
  TrendingDown, 
  ShieldAlert 
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';

export default function BudgetsPage() {
  const { accountId, appSettings } = useApp();
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Salary Cycle Logic
  const [salaryDay, setSalaryDay] = useState(25); // Default common salary day
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [incomeTimeline, setIncomeTimeline] = useState<IncomeTimelineEntry[]>([]);
  const [activeLoans, setActiveLoans] = useState<LoanTracker[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generate Salary Periods
  const periods = useMemo(() => getSalaryPeriods(salaryDay, 6), [salaryDay]);
  const currentPeriod = periods[selectedPeriodIndex];
  
  // Format for DB (YYYY-MM) - use the start date of period as reference
  const dbPeriod = currentPeriod.start.toISOString().substring(0, 7);

  const fetchBudgets = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const [bList, cList, timeline, trackers, settings] = await Promise.all([
        budgetService.getBudgets(accountId, dbPeriod),
        categoryService.getCategories(accountId),
        incomeProjectionService.getTimeline(accountId),
        debtService.getLoanTrackers(accountId),
        debtPlannerSettingsService.getSettings(accountId)
      ]);
      setBudgets(bList);
      setCategories(cList.filter((c: Category) => c.type === 'expense'));
      setIncomeTimeline(timeline);
      setActiveLoans(trackers.filter((l: LoanTracker) => l.status === 'active'));
      if (settings?.salary_day) setSalaryDay(settings.salary_day);
    } catch {
      toast('Gagal memuat data protokol.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, dbPeriod, toast]);

  useEffect(() => {
    if (accountId) {
      const load = async () => await fetchBudgets();
      load();
    }
  }, [accountId, fetchBudgets]);

  const [pendingBudgets, setPendingBudgets] = useState<{ categoryId: string; categoryName: string; amount: number }[]>([]);

  // Calculation for limitation
  const currentIncome = useMemo(() => getIncomeForDate(incomeTimeline, currentPeriod.start), [incomeTimeline, currentPeriod]);
  const currentDebt = useMemo(() => calcPeriodDebtTotal(activeLoans, currentPeriod.start, currentPeriod.end), [activeLoans, currentPeriod]);
  const availableForBudget = currentIncome - currentDebt;
  const totalAllocated = pendingBudgets.reduce((sum, b) => sum + b.amount, 0);
  const remainingLimit = availableForBudget - totalAllocated;

  const handleAddToBatch = () => {
    if (!categoryId || !limitAmount) return;
    
    const amountNum = Number(limitAmount);
    if (amountNum > remainingLimit) {
      toast(`Alokasi melebihi batas aman (${formatCurrency(remainingLimit)}).`, 'warning');
      return;
    }

    if (pendingBudgets.some(b => b.categoryId === categoryId)) {
      toast('Kategori sudah ada di daftar.', 'warning');
      return;
    }

    const cat = categories.find(c => c.id === categoryId);
    setPendingBudgets(prev => [...prev, { categoryId, categoryName: cat?.name || 'Unknown', amount: amountNum }]);
    setCategoryId('');
    setLimitAmount('');
  };

  const handleSaveAll = async () => {
    if (pendingBudgets.length === 0) return;
    setSubmitting(true);
    try {
      await Promise.all(pendingBudgets.map(b => 
        budgetService.createBudget(accountId!, b.categoryId, b.amount, dbPeriod)
      ));
      toast('Anggaran berhasil disimpan.', 'success');
      setPendingBudgets([]);
      setIsModalOpen(false);
      fetchBudgets();
    } catch {
      toast('Gagal menyimpan anggaran.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };


  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold text-[var(--nexus-text-primary)] tracking-tighter ">Batas <span className="text-[var(--nexus-emerald)]">{appSettings.app_name || 'Nexus'}</span></h1>
          <p className="text-[10px] font-bold text-muted-foreground  tracking-[0.4em]">Atur batas pengeluaran per kategori</p>
        </div>
        <div className="flex items-center gap-3">
           <Select
            options={periods.map((p: SalaryPeriod, i: number) => ({ value: i.toString(), label: p.label.toUpperCase() }))}
            value={selectedPeriodIndex.toString()}
            onChange={(e) => setSelectedPeriodIndex(parseInt(e.target.value))}
            className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-3 h-auto text-[10px] font-semibold   min-w-[220px]"
          />
          <Button variant="nexus-emerald" className="rounded-[20px] px-8 py-6 h-auto text-[11px] font-semibold  " onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Konfigurasi
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glass className="lg:col-span-2 p-10 relative group overflow-hidden border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-card)] rounded-[40px] shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--nexus-emerald-glow)] blur-[100px] rounded-full -mr-40 -mt-40" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[var(--nexus-emerald)]" />
                <h3 className="text-[10px] font-semibold  tracking-[0.4em] text-[var(--nexus-text-muted)]">Anggaran terpakai • {currentPeriod.label}</h3>
              </div>
              <h2 className="text-5xl md:text-7xl font-semibold text-[var(--nexus-text-primary)] tracking-tighter italic">
                <NumberTicker value={totalSpent} formatter={(v) => formatCurrency(v)} />
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--nexus-text-muted)]   pt-2">
                <Target className="w-3.5 h-3.5" /> Alokasi Maksimal: {formatCurrency(totalBudget)}
              </div>
            </div>
            <div className="w-24 h-24 rounded-[32px] bg-[var(--nexus-bg-panel)] backdrop-blur-3xl border border-[var(--nexus-glass-border)] flex items-center justify-center text-[var(--nexus-emerald)] shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <TrendingDown className="w-10 h-10" />
            </div>
          </div>
        </Card>

        <Card glass className="p-8 border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] flex flex-col justify-center items-center text-center space-y-6 rounded-[40px] shadow-2xl">
          <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center ${totalRemaining < 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)] border-[var(--nexus-emerald-border)]'} border shadow-2xl`}>
            {totalRemaining < 0 ? <ShieldAlert className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  tracking-[0.3em]">Sisa anggaran</p>
            <p className={`text-3xl font-semibold tracking-tighter ${totalRemaining < 0 ? 'text-rose-400' : 'text-[var(--nexus-emerald)]'}`}>
              {formatCurrency(totalRemaining)}
            </p>
          </div>
          <p className="text-[9px] font-semibold text-[var(--nexus-text-muted)] leading-relaxed px-4  tracking-tighter">
            {totalRemaining < 0 
              ? 'Peringatan: total anggaran terlampaui. Segera sesuaikan alokasi.'
              : 'Aman: laju pengeluaran masih dalam batas anggaran.'}
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-48 rounded-[32px] border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
        ) : budgets.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center space-y-6 bg-[var(--nexus-bg-panel)] rounded-[40px] border border-dashed border-[var(--nexus-glass-border)]">
            <div className="w-20 h-20 rounded-[32px] bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] flex items-center justify-center text-[var(--nexus-text-muted)]">
              <PiggyBank className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)]  tracking-tight">Belum ada anggaran</h4>
              <p className="text-[10px] font-bold text-[var(--nexus-text-muted)]   max-w-sm"> Tetapkan batas per kategori untuk mengontrol pengeluaran.</p>
            </div>
            <Button className="rounded-2xl px-12 py-6 h-auto text-[11px] font-semibold   bg-[var(--nexus-emerald)] shadow-xl border-none" onClick={() => setIsModalOpen(true)}>Buat anggaran</Button>
          </div>
        ) : (
          <AnimatePresence>
            {budgets.map((b) => {
              const spent = Number(b.spent);
              const limit = Number(b.amount);
              const progress = Math.min((spent / limit) * 100, 100);
              const isOver = spent > limit;
              const remaining = limit - spent;

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card glass className="p-8 h-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-bg-panel)] transition-all flex flex-col justify-between rounded-[32px] shadow-xl">
                    <div className="space-y-8">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-[var(--nexus-glass-border)]" style={{ backgroundColor: b.categories?.color }} />
                          <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)]  tracking-tight truncate max-w-[150px]">
                            {b.categories?.name}
                          </h4>
                        </div>
                        <button 
                          onClick={() => budgetService.deleteBudget(b.id).then(() => fetchBudgets())}
                          className="p-3 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-muted)] hover:text-rose-400 transition-all border border-[var(--nexus-glass-border)]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end text-[10px] font-semibold  ">
                          <span className="text-[var(--nexus-text-muted)]">Utilization</span>
                          <span className={isOver ? 'text-rose-400 font-semibold' : 'text-[var(--nexus-text-primary)]'}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)] p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)] ${isOver ? 'bg-rose-500 shadow-rose-500/40' : progress > 80 ? 'bg-amber-500' : 'bg-[var(--nexus-emerald)]'}`}
                          />
                        </div>
                        <div className="flex justify-between text-[13px] font-semibold text-[var(--nexus-text-primary)] tracking-tighter">
                          <span>{formatCurrency(spent, b.currency || 'IDR')}</span>
                          <span className="text-[var(--nexus-text-muted)]">{formatCurrency(limit, b.currency || 'IDR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--nexus-glass-border)] flex items-center gap-2">
                      {isOver ? (
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-rose-400   bg-rose-500/5 px-4 py-2.5 rounded-xl border border-rose-500/10 w-full justify-center">
                          <AlertCircle className="w-3.5 h-3.5" /> Deficit {formatCurrency(Math.abs(remaining), b.currency || 'IDR')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--nexus-emerald)]   bg-[var(--nexus-emerald-glow)] px-4 py-2.5 rounded-xl border border-[var(--nexus-emerald-border)] w-full justify-center">
                          <Zap className="w-3.5 h-3.5" /> Margin {formatCurrency(remaining, b.currency || 'IDR')}
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Atur anggaran">
        <div className="space-y-6 p-2">
          {/* Limitation Panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-5 rounded-[24px] bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-1">
               <label className="text-[9px] font-semibold  text-[var(--nexus-text-muted)] ">Gaji Estimasi</label>
               <div className="text-xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">{formatCurrency(currentIncome)}</div>
             </div>
             <div className="p-5 rounded-[24px] bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-1">
               <label className="text-[9px] font-semibold  text-rose-500/40 ">Kewajiban Tagihan</label>
               <div className="text-xl font-semibold text-rose-400 tracking-tight">-{formatCurrency(currentDebt)}</div>
             </div>
             <div className="md:col-span-2 p-5 rounded-[24px] bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex justify-between items-center">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-semibold  text-[var(--nexus-emerald)] ">Limitasi Saldo Aman</label>
                  <p className="text-[8px] font-bold text-[var(--nexus-emerald)] ">Tersedia untuk alokasi budget</p>
                </div>
                <div className={`text-xl font-semibold tracking-tighter italic ${remainingLimit < 0 ? 'text-rose-500' : remainingLimit === 0 ? 'text-amber-500' : 'text-[var(--nexus-emerald)]'}`}>
                  {remainingLimit < 0 
                    ? `Defisit: -${formatCurrency(Math.abs(remainingLimit))}` 
                    : remainingLimit === 0 
                      ? 'Tidak ada sisa saldo' 
                      : formatCurrency(remainingLimit)}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--nexus-bg-panel)] p-4 rounded-[24px] border border-[var(--nexus-glass-border)]">
            <div className="flex-1">
               <Select
                options={[{ value: '', label: '-- Pilih Kategori --' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
                className="rounded-xl"
              />
            </div>
            <div className="w-32">
              <Input
                type="number"
                placeholder="Nominal"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                disabled={submitting}
                className="rounded-xl text-lg font-semibold"
              />
            </div>
            <Button onClick={handleAddToBatch} className="rounded-xl bg-[var(--nexus-emerald)] p-6 shadow-xl border-none">
              <Plus className="w-5 h-5" />
            </Button>
          </div>

          <Button 
            onClick={handleSaveAll} 
            loading={submitting} 
            disabled={pendingBudgets.length === 0}
            className="w-full h-16 rounded-[24px] bg-[var(--nexus-emerald)] text-[11px] font-semibold   shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
          >
            Simpan Semua Budget
          </Button>
        </div>
      </Modal>
    </div>
  );
}
