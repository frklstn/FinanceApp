'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { budgetService, type Budget } from '@/lib/services/budget.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { categoryService, type Category } from '@/lib/services/category.service';
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
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const [bList, cList] = await Promise.all([
        budgetService.getBudgets(accountId),
        categoryService.getCategories(accountId),
      ]);
      setBudgets(bList);
      setCategories(cList.filter((c) => c.type === 'expense'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchBudgets();
    }
  }, [accountId, fetchBudgets]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !categoryId || !limitAmount) return;
    setSubmitting(true);
    try {
      await budgetService.createBudget(accountId, categoryId, Number(limitAmount));
      toast('Budget Boundary Authorized', 'success');
      setIsModalOpen(false);
      setCategoryId('');
      setLimitAmount('');
      fetchBudgets();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error authorizing boundary';
      toast(msg, 'danger');
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
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Batas <span className="text-emerald-500">{appSettings.app_name || 'Nexus'}</span></h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Kontrol Margin Operasional • v2.0</p>
        </div>
        <Button variant="nexus-emerald" className="rounded-2xl" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Konfigurasi Batasan
        </Button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card glass className="lg:col-span-2 p-10 relative group overflow-hidden border-indigo-500/10 bg-gradient-to-br from-[#12042a] via-[#09112a] to-[#050816]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -mr-40 -mt-40 transition-all group-hover:bg-indigo-600/15" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/50">Margin Kumulatif</h3>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                <NumberTicker value={totalSpent} formatter={(v) => formatRupiah(v)} />
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                <Target className="w-3.5 h-3.5" /> Threshold: {formatRupiah(totalBudget)}
              </div>
            </div>
            <div className="w-20 h-20 rounded-[32px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 flex items-center justify-center text-emerald-400 shadow-2xl">
              <TrendingDown className="w-10 h-10" />
            </div>
          </div>
        </Card>

        <Card glass className="p-8 border-white/5 bg-white/[0.02] flex flex-col justify-center items-center text-center space-y-4">
          <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center ${totalRemaining < 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} border shadow-2xl`}>
            {totalRemaining < 0 ? <ShieldAlert className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Operational Buffer</p>
            <p className={`text-2xl font-black tracking-tighter ${totalRemaining < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatRupiah(totalRemaining)}
            </p>
          </div>
          <p className="text-[10px] font-bold text-muted-foreground leading-relaxed px-4">
            {totalRemaining < 0 
              ? 'Warning: Aggregate boundaries breached. Immediate liquidity relocation required.'
              : 'Protocol Secure: Consumption velocity within authorized margins.'}
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-48 rounded-[32px] border border-white/5 bg-white/[0.02] animate-pulse" />)
        ) : budgets.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="w-20 h-20 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/20">
              <PiggyBank className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black text-white uppercase tracking-tight">No Boundaries Defined</h4>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest max-w-sm"> Initialize category limits to establish operational margin control.</p>
            </div>
            <Button className="rounded-xl px-8" onClick={() => setIsModalOpen(true)}>Initialize Budget</Button>
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card glass className="p-8 h-full border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between rounded-[32px]">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: b.categories?.color }} />
                          <h4 className="text-lg font-black text-white uppercase tracking-tight truncate max-w-[150px]">
                            {b.categories?.name}
                          </h4>
                        </div>
                        <button 
                          onClick={() => budgetService.deleteBudget(b.id).then(() => fetchBudgets())}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                          <span className="text-white/40">Utilization</span>
                          <span className={isOver ? 'text-rose-400 font-black' : 'text-white'}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full shadow-[0_0_15px_rgba(99,102,241,0.2)] ${isOver ? 'bg-rose-500 shadow-rose-500/30' : progress > 80 ? 'bg-amber-500 shadow-amber-500/30' : 'bg-indigo-500 shadow-indigo-500/30'}`}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-black text-white tracking-tighter">
                          <span>{formatRupiah(spent)}</span>
                          <span className="text-white/30">{formatRupiah(limit)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2">
                      {isOver ? (
                        <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 w-full justify-center">
                          <AlertCircle className="w-3.5 h-3.5" /> Deficit {formatRupiah(Math.abs(remaining))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 w-full justify-center">
                          <Zap className="w-3.5 h-3.5" /> Margin {formatRupiah(remaining)}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Operational Boundary">
        <form onSubmit={handleSaveBudget} className="space-y-6">
          <Select
            label="Target Classification"
            options={[
              { value: '', label: '-- Select Category --' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Monthly Magnitude (IDR)"
            placeholder="0"
            type="number"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            required
            disabled={submitting}
          />

          <Button type="submit" loading={submitting} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/10 bg-emerald-500 hover:bg-emerald-600 border-none">Authorize Margin</Button>
        </form>
      </Modal>
    </div>
  );
}
