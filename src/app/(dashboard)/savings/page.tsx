'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { savingsService, SavingsGoal } from '@/lib/services/savings.service';
import { walletService, Wallet } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/date-picker';
import { Target, Plus, PiggyBank, Trash2, Calendar, Coins, ShieldCheck } from 'lucide-react';

export default function SavingsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Creation Goal Form Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmt, setTargetAmt] = useState('');
  const [currentAmt, setCurrentAmt] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Contribution Modal states
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
      const msg = err instanceof Error ? err.message : 'Gagal memuat modul target tabungan.';
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchData);
    }
  }, [accountId, fetchData]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !goalName || !targetAmt) return;

    const targetNum = Number(targetAmt);
    const currentNum = Number(currentAmt);

    if (isNaN(targetNum) || targetNum <= 0) {
      toast('Masukkan jumlah target yang valid dan positif.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await savingsService.createSavingsGoal(
        accountId,
        goalName,
        targetNum,
        currentNum,
        deadline || null
      );
      toast('Target tabungan berhasil dibuat!', 'success');
      setIsGoalModalOpen(false);
      setGoalName('');
      setTargetAmt('');
      setCurrentAmt('0');
      setDeadline('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat target tabungan.';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenContribution = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContribWalletId('');
    setContribAmount('');
    setContribNote(`Setoran untuk: ${goal.name}`);
    setIsContributionModalOpen(true);
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedGoal || !contribWalletId || !contribAmount) return;

    const amtNum = Number(contribAmount);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast('Tentukan jumlah setoran yang positif.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await savingsService.addContribution(
        accountId,
        selectedGoal.id,
        amtNum,
        contribWalletId,
        contribNote
      );

      toast(`Berhasil menyetor ${formatRupiah(amtNum)} ke "${selectedGoal.name}"!`, 'success');
      setIsContributionModalOpen(false);
      setSelectedGoal(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyetor tabungan.';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus target tabungan ini?')) return;
    try {
      await savingsService.deleteSavingsGoal(id);
      toast('Target tabungan dihapus.', 'success');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus target.';
      toast(msg, 'danger');
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto p-4 md:p-5 pb-24">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <Target className="w-5.5 h-5.5 text-primary" />
            Target Tabungan Mandiri
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Kumpulkan dana untuk pencapaian khusus, investasi, dan pengeluaran besar Anda
          </p>
        </div>
        <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setIsGoalModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tambah Target Tabungan
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-4 text-light-text-secondary">
            <PiggyBank className="w-6.5 h-6.5" />
          </div>
          <h4 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">Belum Ada Target Aktif</h4>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-4">
            Mulai buat target tabungan Anda (seperti dana darurat, pembelian aset, DP rumah) dan setor saldo secara berkala.
          </p>
          <Button size="sm" onClick={() => setIsGoalModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Buat Target Tabungan
          </Button>
        </div>
      ) : (
        /* Goals list Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const currentNum = Number(goal.current_amount);
            const targetNum = Number(goal.target_amount);
            const percentage = targetNum > 0 ? (currentNum / targetNum) * 100 : 0;
            const isFinished = currentNum >= targetNum;

            return (
              <Card key={goal.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
                <div className="space-y-4">
                  {/* Title & Delete */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                      {goal.name}
                    </h4>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress ring indicators */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-end text-xs font-semibold">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">Progres Terkumpul</span>
                      <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                        {formatRupiah(currentNum)} / {formatRupiah(targetNum)}
                      </span>
                    </div>
                    <Progress value={percentage} variant={isFinished ? 'success' : 'primary'} />
                  </div>
                </div>

                {/* Contribution details and CTA */}
                <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-light-border/40 dark:border-dark-border/40">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                    <Calendar className="w-3.5 h-3.5" />
                    {goal.deadline
                      ? `Selesai s.d. ${new Date(goal.deadline).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}`
                      : 'Tanpa Tenggat Waktu'}
                  </div>
                  {isFinished ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-success">
                      <ShieldCheck className="w-4 h-4" />
                      Selesai
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => handleOpenContribution(goal)}>
                      <Coins className="w-3 h-3" />
                      Setor Tabungan
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add goal target modal */}
      <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Tambah Target Tabungan">
        <form onSubmit={handleCreateGoal} className="space-y-4">
          <Input
            label="Nama Target"
            placeholder="misal: Dana Darurat, DP Rumah"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
            disabled={submitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Target Nominal (Rp)"
              placeholder="5000000"
              type="number"
              value={targetAmt}
              onChange={(e) => setTargetAmt(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Setoran Awal (Rp)"
              type="number"
              value={currentAmt}
              onChange={(e) => setCurrentAmt(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          <DatePicker
            label="Tanggal Batas Waktu / Tenggat"
            value={deadline}
            onChange={(val) => setDeadline(val)}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGoalModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Buat Target
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribution Drawer modal */}
      <Modal isOpen={isContributionModalOpen} onClose={() => setIsContributionModalOpen(false)} title={`Setor Tabungan: ${selectedGoal?.name}`}>
        {selectedGoal && (
          <form onSubmit={handleContributionSubmit} className="space-y-4">
            <Select
              label="Sumber Dompet Pendanaan"
              options={[
                { value: '', label: '-- Pilih --' },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatRupiah(Number(w.balance))})` })),
              ]}
              value={contribWalletId}
              onChange={(e) => setContribWalletId(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Jumlah Setoran (Rp)"
              placeholder="100000"
              type="number"
              value={contribAmount}
              onChange={(e) => setContribAmount(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Catatan Setoran"
              value={contribNote}
              onChange={(e) => setContribNote(e.target.value)}
              disabled={submitting}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributionModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" loading={submitting}>
                Proses Setoran
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
