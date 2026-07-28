'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import type { SavingsGoal } from '@/lib/services/server/savings.service';
import type { Wallet } from '@/lib/services/server/wallet.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, PiggyBank, Trash2, Calendar, Coins, TrendingUp, Trophy } from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSavingsData,
  createSavingsGoalAction,
  addContributionAction,
  deleteSavingsGoalAction,
} from '@/app/actions/savings';

export default function SavingsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmt, setTargetAmt] = useState('');
  const [currentAmt, setCurrentAmt] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [contribWalletId, setContribWalletId] = useState('');
  const [contribAmount, setContribAmount] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { goals: gList, wallets: wList } = await getSavingsData();
      setGoals(gList);
      setWallets(wList);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal memuat data', 'danger');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(fetchData);
  }, [accountId, fetchData]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !targetAmt) return;
    setSubmitting(true);
    try {
      await createSavingsGoalAction({
        name: goalName,
        targetAmount: Number(targetAmt),
        currentAmount: Number(currentAmt),
        deadline: deadline || null,
      });
      toast('Target dibuat', 'success');
      setIsGoalModalOpen(false);
      setGoalName(''); setTargetAmt(''); setCurrentAmt('0'); setDeadline('');
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal membuat target', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contribWalletId || !contribAmount) return;
    setSubmitting(true);
    try {
      await addContributionAction(selectedGoal.id, Number(contribAmount), contribWalletId);
      toast('Dana dialokasikan', 'success');
      setIsContributionModalOpen(false);
      setContribAmount(''); setContribWalletId('');
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal mengalokasikan dana', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus target tabungan ini?')) return;
    try {
      await deleteSavingsGoalAction(id);
      toast('Target dihapus', 'success');
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus', 'danger');
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Tabungan"
        subtitle="Kumpulkan dana untuk tiap tujuanmu"
        actions={
          <Button variant="nexus-emerald" onClick={() => setIsGoalModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Target baru
          </Button>
        }
      />

      <section>
        <Card>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs text-[var(--nexus-text-secondary)]">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--nexus-emerald)]" /> Total tabungan
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                <NumberTicker value={totalSaved} formatter={(v) => formatCurrency(v)} />
              </h2>
              <p className="text-xs text-[var(--nexus-text-muted)]">
                Target: {formatCurrency(totalTarget)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-64 rounded-2xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
        ) : goals.length === 0 ? (
          <EmptyState
            className="md:col-span-2 lg:col-span-3"
            icon={PiggyBank}
            title="Belum ada target tabungan"
            description="Tetapkan tujuan dan nominalnya untuk memantau progres menabungmu."
            actionLabel="Buat target"
            onAction={() => setIsGoalModalOpen(true)}
          />
        ) : (
          <AnimatePresence>
            {goals.map((goal) => {
              const current = Number(goal.current_amount);
              const target = Number(goal.target_amount);
              const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;
              const finished = current >= target;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  className="group"
                >
                  <Card className="h-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] transition-all flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)] tracking-tight">{goal.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--nexus-text-muted)]">
                            <Calendar className="w-3.5 h-3.5" />
                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Tanpa tenggat'}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(goal.id)} className="p-2.5 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-all cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end text-[10px] font-semibold">
                          <span className="text-[var(--nexus-text-muted)]">Progres</span>
                          <span className="text-[var(--nexus-text-primary)]">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-[var(--nexus-emerald)]"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                          <span>{formatCurrency(current)}</span>
                          <span className="text-[var(--nexus-text-muted)]">{formatCurrency(target)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--nexus-glass-border)]">
                      {finished ? (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] text-xs font-semibold">
                          <Trophy className="w-4 h-4" /> Target tercapai
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] text-xs py-6"
                          disabled={wallets.length === 0}
                          onClick={() => { setSelectedGoal(goal); setIsContributionModalOpen(true); }}
                        >
                          <Coins className="w-3.5 h-3.5 mr-2" /> Alokasikan dana
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </section>

      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Buat target baru">
        <form onSubmit={handleCreateGoal} className="space-y-6">
          <Input label="Nama target" placeholder="mis. Dana darurat, Beli laptop" value={goalName} onChange={(e) => setGoalName(e.target.value)} required />
          <div className="grid grid-cols-2 gap-6">
            <Input label="Jumlah target" type="number" min="1" value={targetAmt} onChange={(e) => setTargetAmt(e.target.value)} required />
            <Input label="Setoran awal" type="number" min="0" value={currentAmt} onChange={(e) => setCurrentAmt(e.target.value)} required />
          </div>
          <DatePicker label="Tenggat" value={deadline} onChange={setDeadline} />
          <Button type="submit" variant="nexus-emerald" loading={submitting} className="w-full h-12 rounded-2xl">Simpan target</Button>
        </form>
      </Modal>

      <Modal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title={`Alokasikan: ${selectedGoal?.name ?? ''}`}>
        <form onSubmit={handleContributionSubmit} className="space-y-6">
          <Select
            label="Dompet sumber"
            options={[{ value: '', label: '-- Pilih dompet --' }, ...wallets.map(w => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance), w.currency || 'IDR')})` }))]}
            value={contribWalletId}
            onChange={(e) => setContribWalletId(e.target.value)}
            required
          />
          <Input label="Jumlah alokasi" type="number" min="1" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} required />
          <Button type="submit" variant="nexus-emerald" loading={submitting} className="w-full h-12 rounded-2xl">Alokasikan</Button>
        </form>
      </Modal>
    </div>
  );
}
