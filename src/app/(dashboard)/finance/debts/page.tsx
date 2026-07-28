'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Debt } from '@/lib/services/server/debt.service';
import type { Wallet } from '@/lib/services/server/wallet.service';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import NumberTicker from '@/components/ui/number-ticker';
import { Plus, Scale, Trash2, HandCoins, ArrowDownLeft, ArrowUpRight, CheckCircle2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getDebtsData,
  createDebtAction,
  recordDebtPaymentAction,
  deleteDebtAction,
} from '@/app/actions/debt';

export default function DebtsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtName, setDebtName] = useState('');
  const [debtType, setDebtType] = useState<'owe' | 'lend'>('owe');
  const [amount, setAmount] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('IDR');

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [payWalletId, setPayWalletId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getDebtsData();
      setDebts(data.debts);
      setWallets(data.wallets);
    } catch {
      toast('Gagal memuat data utang.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(fetchData);
  }, [accountId, fetchData]);

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName || !amount) return;
    setSubmitting(true);
    try {
      await createDebtAction({
        name: debtName,
        type: debtType,
        amount: Number(amount),
        contact: contactInfo || null,
        dueDate: dueDate || null,
        currency,
      });
      toast('Catatan utang ditambahkan.', 'success');
      setIsDebtModalOpen(false);
      setDebtName(''); setAmount(''); setContactInfo(''); setDueDate('');
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayWalletId('');
    setPayAmount('');
    setPayNote(debt.type === 'owe' ? `Bayar: ${debt.name}` : `Terima: ${debt.name}`);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt || !payWalletId || !payAmount) return;
    setSubmitting(true);
    try {
      await recordDebtPaymentAction(selectedDebt.id, Number(payAmount), payWalletId, payNote);
      toast('Pembayaran dicatat.', 'success');
      setIsPayModalOpen(false);
      setSelectedDebt(null);
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal mencatat pembayaran.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm('Hapus catatan utang ini?')) return;
    try {
      await deleteDebtAction(id);
      toast('Catatan dihapus.', 'success');
      fetchData();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus.', 'danger');
    }
  };

  const active = debts.filter((d) => d.status !== 'settled');
  const totalOwe = active.filter((d) => d.type === 'owe').reduce((s, d) => s + Number(d.remaining_amount), 0);
  const totalLend = active.filter((d) => d.type === 'lend').reduce((s, d) => s + Number(d.remaining_amount), 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Utang &"
        accent="Piutang"
        subtitle="Catatan utang pribadi ke orang lain, dan yang orang lain pinjam darimu"
        actions={
          <Button variant="nexus-emerald" onClick={() => setIsDebtModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Catatan baru
          </Button>
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs text-[var(--nexus-text-secondary)]">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" /> Total utangmu
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-rose-400 tracking-tight">
                <NumberTicker value={totalOwe} formatter={(v) => formatCurrency(v)} />
              </h2>
              <p className="text-xs text-[var(--nexus-text-muted)]">Yang masih harus kamu bayar</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs text-[var(--nexus-text-secondary)]">
                <ArrowDownLeft className="w-3.5 h-3.5 text-[var(--nexus-emerald)]" /> Total piutang
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--nexus-emerald)] tracking-tight">
                <NumberTicker value={totalLend} formatter={(v) => formatCurrency(v)} />
              </h2>
              <p className="text-xs text-[var(--nexus-text-muted)]">Yang belum dikembalikan ke kamu</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-56 rounded-2xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
        ) : debts.length === 0 ? (
          <EmptyState
            className="md:col-span-2 lg:col-span-3"
            icon={Scale}
            title="Belum ada catatan utang"
            description="Catat utang atau piutang pribadi supaya tidak ada yang terlupa."
            actionLabel="Buat catatan"
            onAction={() => setIsDebtModalOpen(true)}
          />
        ) : (
          <AnimatePresence>
            {debts.map((debt) => {
              const remaining = Number(debt.remaining_amount);
              const total = Number(debt.amount);
              const paid = total - remaining;
              const progress = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
              const settled = debt.status === 'settled' || remaining <= 0;
              const isOwe = debt.type === 'owe';

              return (
                <motion.div
                  key={debt.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -6 }}
                >
                  <Card className="h-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] flex flex-col justify-between">
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)] tracking-tight truncate">{debt.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isOwe ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)] border-[var(--nexus-emerald-border)]'}`}>
                              {isOwe ? 'Utang' : 'Piutang'}
                            </span>
                            {debt.due_date && (
                              <span className="flex items-center gap-1 text-[10px] text-[var(--nexus-text-muted)]">
                                <Calendar className="w-3 h-3" />
                                {new Date(debt.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="p-2.5 rounded-xl bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-muted)] hover:text-rose-400 transition-all border border-[var(--nexus-glass-border)] cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-[var(--nexus-text-muted)]">Terbayar</span>
                          <span className="text-[var(--nexus-text-primary)]">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full ${isOwe ? 'bg-rose-500' : 'bg-[var(--nexus-emerald)]'}`}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                          <span>Sisa {formatCurrency(remaining, debt.currency || 'IDR')}</span>
                          <span className="text-[var(--nexus-text-muted)]">{formatCurrency(total, debt.currency || 'IDR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-[var(--nexus-glass-border)]">
                      {settled ? (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Lunas
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] text-xs py-5"
                          disabled={wallets.length === 0}
                          onClick={() => handleOpenPayment(debt)}
                        >
                          <HandCoins className="w-3.5 h-3.5 mr-2" />
                          {isOwe ? 'Catat pembayaran' : 'Catat penerimaan'}
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

      <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title="Catatan utang baru">
        <form onSubmit={handleCreateDebt} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[var(--nexus-bg-panel)] rounded-xl border border-[var(--nexus-glass-border)]">
            {([['owe', 'Saya berutang'], ['lend', 'Saya meminjamkan']] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setDebtType(v)}
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${debtType === v ? 'bg-[var(--nexus-emerald)] text-white' : 'text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <Input label="Nama / keterangan" placeholder="mis. Pinjam ke Budi" value={debtName} onChange={(e) => setDebtName(e.target.value)} required />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Jumlah" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Select
              label="Mata uang"
              options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>

          <Input label="Kontak (opsional)" placeholder="Nama atau nomor telepon" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
          <DatePicker label="Jatuh tempo (opsional)" value={dueDate} onChange={setDueDate} />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setIsDebtModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="nexus-emerald" loading={submitting} className="flex-1">Simpan</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={selectedDebt?.type === 'lend' ? 'Catat penerimaan' : 'Catat pembayaran'}>
        <form onSubmit={handlePaymentSubmit} className="space-y-5">
          <div className="p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
            <p className="text-xs text-[var(--nexus-text-muted)]">Sisa</p>
            <p className="text-lg font-semibold text-[var(--nexus-text-primary)]">
              {selectedDebt ? formatCurrency(Number(selectedDebt.remaining_amount), selectedDebt.currency || 'IDR') : '-'}
            </p>
          </div>

          <Select
            label={selectedDebt?.type === 'lend' ? 'Dompet penerima' : 'Dompet sumber'}
            options={[{ value: '', label: '-- Pilih dompet --' }, ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance), w.currency || 'IDR')})` }))]}
            value={payWalletId}
            onChange={(e) => setPayWalletId(e.target.value)}
            required
          />
          <Input label="Jumlah" type="number" min="1" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required />
          <Input label="Catatan" value={payNote} onChange={(e) => setPayNote(e.target.value)} />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setIsPayModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="nexus-emerald" loading={submitting} className="flex-1">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
