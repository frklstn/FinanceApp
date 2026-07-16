'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { savingsService, type SavingsGoal } from '@/lib/services/finance/savings.service';
import { walletService, type Wallet } from '@/lib/services/workspace/wallet.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  Target, 
  Plus, 
  PiggyBank, 
  Trash2, 
  Calendar, 
  Coins, 
  TrendingUp, 
  Trophy 
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [contribNote, setContribNote] = useState('');

  const fetchData = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const [gList, wList] = await Promise.all([
        savingsService.getSavingsGoals(accountId),
        walletService.getWallets(accountId),
      ]);
      setGoals(gList);
      setWallets(wList);
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
      fetchData();
    }
  }, [accountId, fetchData]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !goalName || !targetAmt) return;
    setSubmitting(true);
    try {
      await savingsService.createSavingsGoal(accountId, goalName, Number(targetAmt), Number(currentAmt), deadline || null);
      toast('Target dibuat', 'success');
      setIsGoalModalOpen(false);
      setGoalName(''); setTargetAmt(''); setCurrentAmt('0'); setDeadline('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error forging target';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedGoal || !contribWalletId || !contribAmount) return;
    setSubmitting(true);
    try {
      await savingsService.addContribution(accountId, selectedGoal.id, Number(contribAmount), contribWalletId, contribNote);
      toast('Dana dialokasikan', 'success');
      setIsContributionModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error allocating liquidity';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSaved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold text-[var(--nexus-text-primary)] tracking-tighter ">Tabungan <span className="text-[var(--nexus-emerald)]">Kas</span></h1>
          <p className="text-xs font-bold text-muted-foreground  tracking-[0.3em]">Kumpulkan dana untuk tiap tujuanmu</p>
        </div>
        <Button className="rounded-2xl  bg-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald)] border-none" onClick={() => setIsGoalModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Target baru
        </Button>
      </header>

      <section>
        <Card glass className="p-10 relative group overflow-hidden border-border/20 bg-gradient-to-br from-[var(--nexus-emerald)] via-[var(--bg-card)] to-[var(--bg-main)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--nexus-emerald-glow)] blur-[100px] rounded-full -mr-40 -mt-40 transition-all group-hover:bg-[var(--nexus-emerald-glow)]" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--nexus-emerald)]" />
                <h3 className="text-xs font-semibold  tracking-[0.4em] text-text-secondary/50">Total tabungan</h3>
              </div>
              <h2 className="text-5xl md:text-7xl font-semibold text-text-primary tracking-tighter">
                <NumberTicker value={totalSaved} formatter={(v) => formatCurrency(v)} />
              </h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted   mt-2">
                <Target className="w-3.5 h-3.5" /> Target: {formatCurrency(totalTarget)}
              </div>
            </div>
            <div className="w-20 h-20 rounded-[32px] bg-border/10 backdrop-blur-3xl border border-border/20 flex items-center justify-center text-[var(--nexus-emerald)] shadow-2xl">
              <PiggyBank className="w-10 h-10" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-64 rounded-[32px] border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
        ) : (
          <AnimatePresence>
            {goals.map((goal) => {
              const current = Number(goal.current_amount);
              const target = Number(goal.target_amount);
              const progress = Math.min((current / target) * 100, 100);
              const finished = current >= target;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <Card glass className="p-8 h-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-bg-panel)] transition-all flex flex-col justify-between rounded-[32px]">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)]  tracking-tight">{goal.name}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground  ">
                            <Calendar className="w-3.5 h-3.5" />
                            {goal.deadline ? new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'No Deadline'}
                          </div>
                        </div>
                        <button onClick={() => savingsService.deleteSavingsGoal(goal.id).then(() => fetchData())} className="p-2.5 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-end text-[10px] font-semibold  ">
                          <span className="text-[var(--nexus-text-muted)]">Efisiensi</span>
                          <span className="text-[var(--nexus-text-primary)]">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)]">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full shadow-[0_0_15px_rgba(99,102,241,0.3)] ${finished ? 'bg-[var(--nexus-emerald)]' : 'bg-[var(--nexus-emerald)]'}`}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-[var(--nexus-text-primary)] tracking-tighter">
                          <span>{formatCurrency(current)}</span>
                          <span className="text-[var(--nexus-text-muted)]">{formatCurrency(target)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-[var(--nexus-glass-border)]">
                      {finished ? (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] text-xs font-semibold  ">
                          <Trophy className="w-4 h-4" /> Target tercapai
                        </div>
                      ) : (
                        <Button variant="outline" className="w-full rounded-2xl border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] text-[10px] font-semibold   py-6" onClick={() => { setSelectedGoal(goal); setContribNote(`Allocation for ${goal.name}`); setIsContributionModalOpen(true); }}>
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
            <Input label="Jumlah target" type="number" value={targetAmt} onChange={(e) => setTargetAmt(e.target.value)} required />
            <Input label="Initial Deposit" type="number" value={currentAmt} onChange={(e) => setCurrentAmt(e.target.value)} required />
          </div>
          <DatePicker label="Chronological Deadline" value={deadline} onChange={setDeadline} />
          <Button type="submit" loading={submitting} className="w-full h-14 font-semibold   rounded-2xl shadow-xl">Simpan target</Button>
        </form>
      </Modal>

      <Modal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title={`Allocate: ${selectedGoal?.name}`}>
        <form onSubmit={handleContributionSubmit} className="space-y-6">
          <Select label="Source Account" options={[{value: '', label: '-- Select --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={contribWalletId} onChange={(e) => setContribWalletId(e.target.value)} required />
          <Input label="Jumlah alokasi" type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} required />
          <Input label="Catatan" value={contribNote} onChange={(e) => setContribNote(e.target.value)} />
          <Button type="submit" loading={submitting} className="w-full h-14 font-semibold   rounded-2xl shadow-xl">Alokasikan</Button>
        </form>
      </Modal>
    </div>
  );
}
