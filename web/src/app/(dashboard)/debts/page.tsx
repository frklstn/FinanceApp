'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { debtService, Debt } from '@/lib/services/debt.service';
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
import { HandCoins, Plus, Landmark, Trash2, Calendar, Coins, User, ShieldCheck } from 'lucide-react';

export default function DebtsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<'owe' | 'lend'>('owe');
  const [amount, setAmount] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Installment Modal States
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payWalletId, setPayWalletId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const fetchData = useCallback(async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      const [dList, wList] = await Promise.all([
        debtService.getDebts(accountId),
        walletService.getWallets(accountId),
      ]);
      setDebts(dList);
      setWallets(wList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assemble ledger accounts.';
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

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !debtName || !amount) return;

    const amtNum = Number(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      toast('Please enter a valid ledger amount.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await debtService.createDebt(
        accountId,
        debtName,
        debtType,
        amtNum,
        contactInfo || null,
        dueDate || null
      );

      toast('Ledger account added successfully.', 'success');
      setIsDebtModalOpen(false);
      setDebtName('');
      setAmount('');
      setContactInfo('');
      setDueDate('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save record.';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayWalletId('');
    setPayAmount('');
    setPayNote(`Installment repayment: ${debt.name}`);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedDebt || !payWalletId || !payAmount) return;

    const payNum = Number(payAmount);
    if (isNaN(payNum) || payNum <= 0) {
      toast('Please enter a valid installment amount.', 'danger');
      return;
    }

    setSubmitting(true);
    try {
      await debtService.recordPayment(
        accountId,
        selectedDebt.id,
        payNum,
        payWalletId,
        payNote
      );

      toast('Payment logged successfully!', 'success');
      setIsPayModalOpen(false);
      setSelectedDebt(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Repayment failed.';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this debt/loan ledger account?')) return;
    try {
      await debtService.deleteDebt(id);
      toast('Record removed.', 'success');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete record.';
      toast(msg, 'danger');
    }
  };

  // Compile aggregations
  const totalOwe = debts.filter((d) => d.type === 'owe').reduce((sum, d) => sum + Number(d.remaining_amount), 0);
  const totalLend = debts.filter((d) => d.type === 'lend').reduce((sum, d) => sum + Number(d.remaining_amount), 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <HandCoins className="w-5.5 h-5.5 text-primary" />
            Buku Utang & Piutang
          </h2>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            Pantau utang (uang yang harus Anda bayar) dan piutang (uang yang Anda pinjamkan)
          </p>
        </div>
        <Button className="flex items-center gap-2 cursor-pointer" onClick={() => setIsDebtModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Tambah Utang / Piutang
        </Button>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-5 bg-gradient-to-r from-danger/5 to-danger/10 border-danger/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-danger/80 tracking-wider">
              Total Kewajiban (Utang Saya)
            </span>
            <h3 className="text-2xl font-extrabold text-danger mt-1">
              {formatRupiah(totalOwe)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center text-danger">
            <Landmark className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-r from-success/5 to-success/10 border-success/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-success/80 tracking-wider">
              Total Aset (Piutang Saya)
            </span>
            <h3 className="text-2xl font-extrabold text-success mt-1">
              {formatRupiah(totalLend)}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <HandCoins className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Debts Table list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
          ))}
        </div>
      ) : debts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-light-border/40 dark:bg-dark-border/40 flex items-center justify-center mb-4 text-light-text-secondary">
            <HandCoins className="w-6.5 h-6.5" />
          </div>
          <h4 className="text-base font-bold text-light-text-primary dark:text-dark-text-primary mb-1">
            Belum ada catatan utang/piutang
          </h4>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary max-w-sm mb-4">
            Buat catatan saat Anda meminjam uang atau meminjamkan dana kepada orang lain agar keuangan Anda tetap tercatat dengan benar.
          </p>
          <Button size="sm" onClick={() => setIsDebtModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Catatan Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owe list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary uppercase tracking-wider">
              Utang Saya (Kewajiban)
            </h3>
            {debts.filter((d) => d.type === 'owe').length === 0 ? (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary py-4 font-semibold">
                Tidak ada kewajiban aktif yang tercatat.
              </p>
            ) : (
              debts.filter((d) => d.type === 'owe').map((debt) => {
                const rem = Number(debt.remaining_amount);
                const tot = Number(debt.amount);
                const paid = tot - rem;
                const percentage = tot > 0 ? (paid / tot) * 100 : 0;
                const isPaid = rem <= 0;

                return (
                  <Card key={debt.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                            {debt.name}
                          </h4>
                          {debt.contact_info && (
                            <span className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-1 font-semibold mt-0.5">
                              <User className="w-3.5 h-3.5" /> {debt.contact_info}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Repayment Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-end text-xs font-semibold">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Rasio Pelunasan</span>
                          <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                            {formatRupiah(paid)} / {formatRupiah(tot)}
                          </span>
                        </div>
                        <Progress value={percentage} variant="danger" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-light-border/40 dark:border-dark-border/40">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        {debt.due_date ? `Jatuh tempo ${new Date(debt.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}` : 'Tanpa Tenggat'}
                      </div>
                      {isPaid ? (
                        <span className="text-xs font-bold text-success flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Lunas
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => handleOpenPayment(debt)}>
                          <Coins className="w-3 h-3" />
                          Bayar Cicilan
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          {/* Lend list */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary uppercase tracking-wider">
              Piutang Saya (Aset)
            </h3>
            {debts.filter((d) => d.type === 'lend').length === 0 ? (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary py-4 font-semibold">
                Tidak ada piutang aktif yang tercatat.
              </p>
            ) : (
              debts.filter((d) => d.type === 'lend').map((debt) => {
                const rem = Number(debt.remaining_amount);
                const tot = Number(debt.amount);
                const paid = tot - rem;
                const percentage = tot > 0 ? (paid / tot) * 100 : 0;
                const isPaid = rem <= 0;

                return (
                  <Card key={debt.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition-all duration-200">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                            {debt.name}
                          </h4>
                          {debt.contact_info && (
                            <span className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary flex items-center gap-1 font-semibold mt-0.5">
                              <User className="w-3.5 h-3.5" /> {debt.contact_info}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Repayment Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-end text-xs font-semibold">
                          <span className="text-light-text-secondary dark:text-dark-text-secondary">Rasio Pengumpulan</span>
                          <span className="text-light-text-primary dark:text-dark-text-primary font-bold">
                            {formatRupiah(paid)} / {formatRupiah(tot)}
                          </span>
                        </div>
                        <Progress value={percentage} variant="success" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-6 pt-3 border-t border-light-border/40 dark:border-dark-border/40">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-light-text-secondary dark:text-dark-text-secondary">
                        <Calendar className="w-3.5 h-3.5" />
                        {debt.due_date ? `Jatuh tempo ${new Date(debt.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}` : 'Tanpa Tenggat'}
                      </div>
                      {isPaid ? (
                        <span className="text-xs font-bold text-success flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Lunas
                        </span>
                      ) : (
                        <Button size="sm" variant="outline" className="flex items-center gap-1 cursor-pointer" onClick={() => handleOpenPayment(debt)}>
                          <Coins className="w-3 h-3" />
                          Tagih Cicilan
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Debt/Lend record modal */}
      <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title="Daftarkan Catatan Utang / Piutang">
        <form onSubmit={handleCreateDebt} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-light-bg dark:bg-dark-bg/60 p-1 rounded-xl border border-light-border/40 dark:border-dark-border/40">
            {(['owe', 'lend'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDebtType(t)}
                className={`py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
                  debtType === t
                    ? t === 'owe'
                      ? 'bg-danger text-white'
                      : 'bg-success text-white'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
                }`}
              >
                {t === 'owe' ? 'Utang Saya' : 'Piutang Saya'}
              </button>
            ))}
          </div>

          <Input
            label="Nama / Judul Catatan"
            placeholder="misal: KPR Bank, Pinjaman Laptop ke Dave"
            value={debtName}
            onChange={(e) => setDebtName(e.target.value)}
            required
            disabled={submitting}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Nominal (Rp)"
              placeholder="1000000"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={submitting}
            />
            <DatePicker
              label="Tanggal Jatuh Tempo"
              value={dueDate}
              onChange={(val) => setDueDate(val)}
              disabled={submitting}
            />
          </div>
          <Input
            label="Kontak / Catatan Tambahan"
            placeholder="Dave (dave@email.com)"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            disabled={submitting}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDebtModalOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              Daftar Catatan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Installment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={`Pembayaran Catatan: ${selectedDebt?.name}`}>
        {selectedDebt && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <Select
              label={selectedDebt.type === 'owe' ? 'Sumber Dompet Pembayaran' : 'Dompet Penerima Pembayaran'}
              options={[
                { value: '', label: '-- Pilih --' },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatRupiah(Number(w.balance))})` })),
              ]}
              value={payWalletId}
              onChange={(e) => setPayWalletId(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Nominal Cicilan (Rp)"
              placeholder="100000"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Catatan Pembayaran"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              disabled={submitting}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPayModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" loading={submitting}>
                {selectedDebt.type === 'owe' ? 'Bayar Cicilan' : 'Terima Pembayaran'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
