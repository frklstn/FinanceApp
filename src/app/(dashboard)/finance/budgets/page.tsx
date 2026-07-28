'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Budget } from '@/lib/services/server/budget.service';
import type { Category } from '@/lib/services/server/category.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { getSalaryPeriods, getIncomeForDate, calcPeriodDebtTotal } from '@/lib/debt-planner/calculations';
import type { IncomeTimelineEntry, LoanTracker, SalaryPeriod } from '@/lib/debt-planner/types';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import {
  Plus, PiggyBank, Trash2, ShieldCheck, AlertCircle, Zap, PieChart, TrendingDown, ShieldAlert, X,
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';
import { getBudgetsData, saveBudgetsAction, deleteBudgetAction } from '@/app/actions/budget';

export default function BudgetsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [salaryDay, setSalaryDay] = useState(25);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [incomeTimeline, setIncomeTimeline] = useState<IncomeTimelineEntry[]>([]);
  const [activeLoans, setActiveLoans] = useState<LoanTracker[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingBudgets, setPendingBudgets] = useState<{ categoryId: string; categoryName: string; amount: number }[]>([]);

  const periods = useMemo(() => getSalaryPeriods(salaryDay, 6), [salaryDay]);
  const currentPeriod = periods[selectedPeriodIndex];
  const dbPeriod = currentPeriod.start.toISOString().substring(0, 7);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBudgetsData(dbPeriod);
      setBudgets(data.budgets);
      setCategories(data.categories.filter((c) => c.type === 'expense'));
      setIncomeTimeline(data.incomeTimeline);
      setActiveLoans(data.loanTrackers.filter((l) => l.status === 'active'));
      setSalaryDay(data.salaryDay);
    } catch {
      toast('Gagal memuat data anggaran.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [dbPeriod, toast]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(fetchBudgets);
  }, [accountId, fetchBudgets]);

  const currentIncome = useMemo(() => getIncomeForDate(incomeTimeline, currentPeriod.start), [incomeTimeline, currentPeriod]);
  const currentDebt = useMemo(() => calcPeriodDebtTotal(activeLoans, currentPeriod.start, currentPeriod.end), [activeLoans, currentPeriod]);
  const availableForBudget = currentIncome - currentDebt;
  const totalAllocated = pendingBudgets.reduce((sum, b) => sum + b.amount, 0);
  const remainingLimit = availableForBudget - totalAllocated;

  const handleAddToBatch = () => {
    if (!categoryId || !limitAmount) return;

    const amountNum = Number(limitAmount);
    if (!(amountNum > 0)) {
      toast('Nominal harus lebih dari 0.', 'warning');
      return;
    }
    if (amountNum > remainingLimit) {
      toast(`Alokasi melebihi batas aman (${formatCurrency(remainingLimit)}).`, 'warning');
      return;
    }
    if (pendingBudgets.some((b) => b.categoryId === categoryId)) {
      toast('Kategori sudah ada di daftar.', 'warning');
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    setPendingBudgets((prev) => [...prev, { categoryId, categoryName: cat?.name || 'Tanpa nama', amount: amountNum }]);
    setCategoryId('');
    setLimitAmount('');
  };

  const handleSaveAll = async () => {
    if (pendingBudgets.length === 0) return;
    setSubmitting(true);
    try {
      await saveBudgetsAction(dbPeriod, pendingBudgets.map((b) => ({ categoryId: b.categoryId, amount: b.amount })));
      toast('Anggaran berhasil disimpan.', 'success');
      setPendingBudgets([]);
      setIsModalOpen(false);
      fetchBudgets();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan anggaran.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus anggaran ini?')) return;
    try {
      await deleteBudgetAction(id);
      toast('Anggaran dihapus', 'success');
      fetchBudgets();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus', 'danger');
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spent), 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="space-y-10">
      <PageHeader
        title="Anggaran"
        subtitle="Atur batas pengeluaran per kategori"
        actions={
          <>
            <Select
              options={periods.map((p: SalaryPeriod, i: number) => ({ value: i.toString(), label: p.label }))}
              value={selectedPeriodIndex.toString()}
              onChange={(e) => setSelectedPeriodIndex(parseInt(e.target.value))}
              className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-2.5 h-auto text-xs min-w-[200px]"
            />
            <Button variant="nexus-emerald" disabled={categories.length === 0} onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Atur
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs text-[var(--nexus-text-secondary)]">
                <PieChart className="w-3.5 h-3.5 text-[var(--nexus-emerald)]" /> Anggaran terpakai • {currentPeriod.label}
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                <NumberTicker value={totalSpent} formatter={(v) => formatCurrency(v)} />
              </h2>
              <p className="text-xs text-[var(--nexus-text-muted)]">
                Alokasi maksimal: {formatCurrency(totalBudget)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Anatomi disamakan dengan kartu di sebelahnya: label, angka, catatan,
            ikon di kanan. */}
        <Card>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs text-[var(--nexus-text-secondary)]">
                {totalRemaining < 0 ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-[var(--nexus-emerald)]" />}
                Sisa anggaran
              </p>
              <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${totalRemaining < 0 ? 'text-rose-400' : 'text-[var(--nexus-emerald)]'}`}>
                {formatCurrency(totalRemaining)}
              </h2>
              <p className="text-xs text-[var(--nexus-text-muted)]">
                {totalRemaining < 0
                  ? 'Total anggaran terlampaui. Segera sesuaikan alokasi.'
                  : 'Laju pengeluaran masih dalam batas anggaran.'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${totalRemaining < 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)] border-[var(--nexus-emerald-border)]'}`}>
              {totalRemaining < 0 ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-48 rounded-2xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
        ) : budgets.length === 0 ? (
          <EmptyState
            className="md:col-span-2 lg:col-span-3"
            icon={PiggyBank}
            title="Belum ada anggaran"
            description={categories.length === 0
              ? 'Bikin kategori pengeluaran dulu di halaman Transaksi, lalu tetapkan batasnya di sini.'
              : 'Tetapkan batas per kategori untuk mengontrol pengeluaran.'}
            actionLabel={categories.length === 0 ? undefined : 'Buat anggaran'}
            onAction={categories.length === 0 ? undefined : () => setIsModalOpen(true)}
          />
        ) : (
          <AnimatePresence>
            {budgets.map((b) => {
              const spent = Number(b.spent);
              const limit = Number(b.amount);
              const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
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
                  <Card className="h-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] transition-all flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0 border border-[var(--nexus-glass-border)]" style={{ backgroundColor: b.categories?.color || 'var(--nexus-emerald)' }} />
                          <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)] tracking-tight truncate">
                            {b.categories?.name}
                          </h4>
                        </div>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="p-2.5 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-muted)] hover:text-rose-400 transition-all border border-[var(--nexus-glass-border)] cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end text-[10px] font-semibold">
                          <span className="text-[var(--nexus-text-muted)]">Terpakai</span>
                          <span className={isOver ? 'text-rose-400' : 'text-[var(--nexus-text-primary)]'}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${isOver ? 'bg-rose-500' : progress > 80 ? 'bg-amber-500' : 'bg-[var(--nexus-emerald)]'}`}
                          />
                        </div>
                        <div className="flex justify-between text-[13px] font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                          <span>{formatCurrency(spent, b.currency || 'IDR')}</span>
                          <span className="text-[var(--nexus-text-muted)]">{formatCurrency(limit, b.currency || 'IDR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--nexus-glass-border)] flex items-center gap-2">
                      {isOver ? (
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-rose-400 bg-rose-500/5 px-4 py-2.5 rounded-xl border border-rose-500/10 w-full justify-center">
                          <AlertCircle className="w-3.5 h-3.5" /> Lebih {formatCurrency(Math.abs(remaining), b.currency || 'IDR')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)] px-4 py-2.5 rounded-xl border border-[var(--nexus-emerald-border)] w-full justify-center">
                          <Zap className="w-3.5 h-3.5" /> Sisa {formatCurrency(remaining, b.currency || 'IDR')}
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-1">
              <label className="text-[10px] font-semibold text-[var(--nexus-text-muted)]">Perkiraan pemasukan</label>
              <div className="text-xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">{formatCurrency(currentIncome)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-1">
              <label className="text-[10px] font-semibold text-[var(--nexus-text-muted)]">Kewajiban tagihan</label>
              <div className="text-xl font-semibold text-rose-400 tracking-tight">-{formatCurrency(currentDebt)}</div>
            </div>
            <div className="md:col-span-2 p-4 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex justify-between items-center gap-4">
              <div className="space-y-0.5">
                <label className="text-[10px] font-semibold text-[var(--nexus-emerald)]">Batas aman</label>
                <p className="text-[10px] text-[var(--nexus-text-muted)]">Tersedia untuk dialokasikan</p>
              </div>
              <div className={`text-xl font-semibold tracking-tight ${remainingLimit < 0 ? 'text-rose-400' : remainingLimit === 0 ? 'text-amber-500' : 'text-[var(--nexus-emerald)]'}`}>
                {remainingLimit < 0
                  ? `-${formatCurrency(Math.abs(remainingLimit))}`
                  : formatCurrency(remainingLimit)}
              </div>
            </div>
          </div>

          {currentIncome === 0 && (
            <p className="text-xs text-amber-500">
              Pemasukan periode ini belum tercatat, jadi batas amannya nol. Isi dulu di halaman Pinjol.
            </p>
          )}

          <div className="flex items-end gap-3 bg-[var(--nexus-bg-panel)] p-4 rounded-2xl border border-[var(--nexus-glass-border)]">
            <div className="flex-1 min-w-0">
              <Select
                label="Kategori"
                options={[{ value: '', label: '-- Pilih kategori --' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="w-32 shrink-0">
              <Input
                label="Nominal"
                type="number"
                min="1"
                placeholder="0"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="button" variant="nexus-emerald" onClick={handleAddToBatch} className="h-11 px-4 shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {pendingBudgets.length > 0 && (
            <div className="space-y-2">
              {pendingBudgets.map((b) => (
                <div key={b.categoryId} className="flex items-center justify-between p-3 rounded-xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
                  <span className="text-sm text-[var(--nexus-text-primary)] truncate">{b.categoryName}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-semibold text-[var(--nexus-text-primary)]">{formatCurrency(b.amount)}</span>
                    {/* Sebelumnya daftar ini tidak punya cara menghapus entri; salah
                        ketik berarti harus menutup modal dan mengulang dari awal. */}
                    <button
                      type="button"
                      onClick={() => setPendingBudgets((prev) => prev.filter((p) => p.categoryId !== b.categoryId))}
                      className="p-1 text-[var(--nexus-text-muted)] hover:text-rose-400 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleSaveAll}
            variant="nexus-emerald"
            loading={submitting}
            disabled={pendingBudgets.length === 0}
            className="w-full h-12 rounded-2xl"
          >
            Simpan anggaran
          </Button>
        </div>
      </Modal>
    </div>
  );
}
