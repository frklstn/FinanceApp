'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { debtService, Debt } from '@/lib/services/finance/debt.service';
import { walletService, Wallet } from '@/lib/services/workspace/wallet.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/date-picker';
import {
  HandCoins,
  Plus,
  Landmark,
  Trash2,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  Zap,
  TrendingDown,
  ArrowRightLeft,
  Target
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';

export default function DebtsPage() {
  const { accountId, t } = useApp();
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
  const [currency, setCurrency] = useState('IDR');
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
      const msg = err instanceof Error ? err.message : t('debts.toast.loadFailed', 'Failed to load ledger accounts.');
      toast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  }, [accountId, toast, t]);

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
      toast(t('debts.toast.invalidAmount', 'Please enter a valid ledger amount.'), 'danger');
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
        dueDate || null,
        currency
      );

      toast(t('debts.toast.addSuccess', 'Ledger account added successfully.'), 'success');
      setIsDebtModalOpen(false);
      setDebtName('');
      setAmount('');
      setContactInfo('');
      setDueDate('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('debts.toast.addFailed', 'Failed to save record.');
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPayment = (debt: Debt) => {
    setSelectedDebt(debt);
    setPayWalletId('');
    setPayAmount('');
    setPayNote(`Repayment: ${debt.name}`);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !selectedDebt || !payWalletId || !payAmount) return;

    const payNum = Number(payAmount);
    if (isNaN(payNum) || payNum <= 0) {
      toast(t('debts.toast.invalidPayAmount', 'Please enter a valid installment amount.'), 'danger');
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

      toast(t('debts.toast.paySuccess', 'Payment logged successfully!'), 'success');
      setIsPayModalOpen(false);
      setSelectedDebt(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('debts.toast.payFailed', 'Repayment failed.');
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm(t('debts.toast.deleteConfirm', 'Are you sure you want to delete this debt/loan ledger account?'))) return;
    try {
      await debtService.deleteDebt(id);
      toast(t('debts.toast.deleteSuccess', 'Record removed.'), 'success');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('debts.toast.deleteFailed', 'Failed to delete record.');
      toast(msg, 'danger');
    }
  };

  const totalOwe = debts.filter((d) => d.type === 'owe').reduce((sum, d) => sum + Number(d.remaining_amount), 0);
  // Note: Simplified totals. Real implementation would convert to base currency.
  const totalLend = debts.filter((d) => d.type === 'lend').reduce((sum, d) => sum + Number(d.remaining_amount), 0);
  const netPosition = totalLend - totalOwe;
  /** Porsi piutang terhadap seluruh catatan. Dipakai untuk angka dan lebar bar. */
  const rasioPiutang = (totalLend / (totalOwe + totalLend || 1)) * 100;

  return (
    <div className="space-y-8 no-scrollbar">
      <PageHeader
        title={t('debts.title', 'Utang & Piutang')}
        subtitle={t('debts.subtitle', 'Pantau utang dan piutangmu')}
        actions={
          <Button
            variant="nexus-emerald"
            className="flex-1 md:flex-none"
            onClick={() => setIsDebtModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> {t('debts.addBtn', 'Tambah catatan')}
          </Button>
        }
      />

      {/* Aggregate Hero Section */}
      <section>
        <Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-[var(--nexus-text-secondary)]">
                  {t('debts.netPosition', 'Posisi bersih')}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-2xl md:text-3xl font-semibold tracking-tight ${netPosition >= 0 ? 'text-[var(--nexus-emerald)]' : 'text-rose-500'}`}>
                    <NumberTicker value={Math.abs(netPosition)} formatter={formatCurrency} />
                  </span>
                  <span className="text-xs text-[var(--nexus-text-muted)]">
                    {netPosition >= 0 ? t('debts.surplus', 'Surplus') : t('debts.deficit', 'Defisit')}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 rounded-[24px] bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-semibold text-rose-400  ">
                    {t('debts.pay', 'Bayar:')} <NumberTicker value={totalOwe} formatter={formatCurrency} />
                  </span>
                </div>
                <div className="px-6 py-3 rounded-[24px] bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex items-center gap-3">
                  <HandCoins className="w-4 h-4 text-[var(--nexus-emerald)]" />
                  <span className="text-[11px] font-semibold text-[var(--nexus-emerald)]  ">
                    {t('debts.receive', 'Terima:')} <NumberTicker value={totalLend} formatter={formatCurrency} />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--nexus-bg-panel)] rounded-2xl border border-[var(--nexus-glass-border)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                      {t('debts.auditTitle', 'Ringkasan')}
                    </h4>
                    <p className="text-xs text-[var(--nexus-text-muted)]">
                      {t('debts.systemMonitor', 'Utang & piutang aktif')}
                    </p>
                  </div>
                </div>
                <div className="text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                  {debts.length} <span className="text-xs font-normal text-[var(--nexus-text-muted)]">{t('debts.unit', 'catatan')}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--nexus-text-muted)]">{t('debts.repaymentRatio', 'Rasio piutang')}</span>
                  {/* Angkanya sudah dihitung untuk lebar bar di bawah; sebelumnya
                      di sini hanya tertulis label statis "Dihitung", sehingga
                      rasionya tidak pernah benar-benar terbaca. */}
                  <span className="font-semibold text-[var(--nexus-text-primary)]">{Math.round(rasioPiutang)}%</span>
                </div>
                <div className="w-full h-2 bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rasioPiutang}%` }}
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400"
                  />
                </div>
              </div>
              <p className="text-[11px] font-bold text-[var(--nexus-text-muted)] leading-relaxed  tracking-tight">
                {t('debts.status.riskMsg', 'Current audit identifies {loans} liability contracts and {receivables} asset receivables. Risk level: {risk}.')
                  .replace('{loans}', `${debts.filter(d => d.type === 'owe').length}`)
                  .replace('{receivables}', `${debts.filter(d => d.type === 'lend').length}`)
                  .replace('{risk}', netPosition >= 0 ? t('debts.risk.stable', 'STABLE') : t('debts.risk.elevated', 'ELEVATED'))}
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Debt & Credit Lists */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12">
        {/* Owe - Liability Ledger */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[var(--nexus-text-primary)]  tracking-tight flex items-center gap-3">
                <Landmark className="w-6 h-6 text-rose-500" /> {t('debts.liabilityLedger', 'Liability Ledger')}
              </h3>
              <p className="text-[10px] font-bold text-[var(--nexus-text-muted)]  ">
                {t('debts.activeObligations', 'Active Obligations')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="wait">
              {loading ? (
                [1, 2].map((n) => <div key={n} className="h-48 rounded-[32px] border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
              ) : debts.filter(d => d.type === 'owe').length === 0 ? (
                <div className="p-12 rounded-[32px] bg-[var(--nexus-bg-panel)] border border-dashed border-[var(--nexus-glass-border)] flex flex-col items-center justify-center text-center space-y-4">
                  <ShieldCheck className="w-12 h-12 text-[var(--nexus-text-muted)]" />
                  <p className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  tracking-[0.3em]">
                    {t('debts.emptyLiability', 'Tidak Ada Liabilitas Terdeteksi')}
                  </p>
                </div>
              ) : (
                debts.filter(d => d.type === 'owe').map((debt, i) => {
                  const rem = Number(debt.remaining_amount);
                  const tot = Number(debt.amount);
                  const paid = tot - rem;
                  const progress = Math.min((paid / tot) * 100, 100);
                  const isPaid = rem <= 0;

                  return (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="p-8 md:p-10 border-[var(--nexus-glass-border)] hover:bg-[var(--nexus-bg-panel)] transition-all relative overflow-hidden group">
                        
                        <div className="flex flex-col h-full justify-between space-y-8 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)]  tracking-tight">{debt.name}</h4>
                              <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-semibold text-rose-400  ">
                                  {t('debts.type.liability', 'Liability')}
                                </span>
                                {debt.contact_info && (
                                  <span className="text-[10px] text-[var(--nexus-text-muted)] font-bold  tracking-tight flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> {debt.contact_info}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-3 rounded-2xl bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-semibold  tracking-[0.2em]">
                              <span className="text-[var(--nexus-text-muted)]">{t('debts.repaymentAudit', 'Repayment Audit')}</span>
                              <span className="text-[var(--nexus-text-primary)]">
                                <NumberTicker value={paid} formatter={(v) => formatCurrency(v, debt.currency || 'IDR')} /> / {formatCurrency(tot, debt.currency || 'IDR')}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)] shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-400" 
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-[var(--nexus-glass-border)]">
                            <div className="flex items-center gap-3 text-[10px] font-semibold text-[var(--nexus-text-muted)]  ">
                              <Calendar className="w-4 h-4" />
                              {debt.due_date ? t('debts.deadline', 'Deadline: {date}').replace('{date}', new Date(debt.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })) : t('debts.infiniteCycle', 'Infinite Cycle')}
                            </div>
                            {isPaid ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] text-[10px] font-semibold  tracking-[0.2em]">
                                <ShieldCheck className="w-4 h-4" /> {t('debts.status.secured', 'Secured')}
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-2xl border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] text-[9px] font-semibold  tracking-[0.2em] px-6 py-5 h-auto hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all" 
                                onClick={() => handleOpenPayment(debt)}
                              >
                                <Zap className="w-4 h-4 mr-2" /> {t('debts.action.executePayment', 'Execute Payment')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Lend - Asset Receivable */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[var(--nexus-text-primary)]  tracking-tight flex items-center gap-3">
                <HandCoins className="w-6 h-6 text-[var(--nexus-emerald)]" /> {t('debts.assetReceivable', 'Asset Receivable')}
              </h3>
              <p className="text-[10px] font-bold text-[var(--nexus-text-muted)]  ">{t('debts.activeCredits', 'Active Credits')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="wait">
              {loading ? (
                [1, 2].map((n) => <div key={n} className="h-48 rounded-[32px] border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] animate-pulse" />)
              ) : debts.filter(d => d.type === 'lend').length === 0 ? (
                <div className="p-12 rounded-[32px] bg-[var(--nexus-bg-panel)] border border-dashed border-[var(--nexus-glass-border)] flex flex-col items-center justify-center text-center space-y-4">
                  <Target className="w-12 h-12 text-[var(--nexus-text-muted)]" />
                  <p className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  tracking-[0.3em]">{t('debts.emptyReceivable', 'No Active Receivables')}</p>
                </div>
              ) : (
                debts.filter(d => d.type === 'lend').map((debt, i) => {
                  const rem = Number(debt.remaining_amount);
                  const tot = Number(debt.amount);
                  const paid = tot - rem;
                  const progress = Math.min((paid / tot) * 100, 100);
                  const isPaid = rem <= 0;

                  return (
                    <motion.div
                      key={debt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="p-8 md:p-10 border-[var(--nexus-glass-border)] hover:bg-[var(--nexus-bg-panel)] transition-all relative overflow-hidden group">
                        
                        <div className="flex flex-col h-full justify-between space-y-8 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="text-lg font-semibold text-[var(--nexus-text-primary)]  tracking-tight">{debt.name}</h4>
                              <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-full bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] text-[9px] font-semibold text-[var(--nexus-emerald)]  ">
                                  {t('debts.type.asset', 'Asset')}
                                </span>
                                {debt.contact_info && (
                                  <span className="text-[10px] text-[var(--nexus-text-muted)] font-bold  tracking-tight flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> {debt.contact_info}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-3 rounded-2xl bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-semibold  tracking-[0.2em]">
                              <span className="text-[var(--nexus-text-muted)]">{t('debts.collectionAudit', 'Collection Audit')}</span>
                              <span className="text-[var(--nexus-text-primary)]">
                                <NumberTicker value={paid} formatter={(v) => formatCurrency(v, debt.currency || 'IDR')} /> / {formatCurrency(tot, debt.currency || 'IDR')}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)] shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-[var(--nexus-emerald)] to-[var(--nexus-emerald)] shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-[var(--nexus-glass-border)]">
                            <div className="flex items-center gap-3 text-[10px] font-semibold text-[var(--nexus-text-muted)]  ">
                              <Calendar className="w-4 h-4" />
                              {debt.due_date ? t('debts.inflow', 'Inflow: {date}').replace('{date}', new Date(debt.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })) : t('debts.infiniteCycle', 'Infinite Cycle')}
                            </div>
                            {isPaid ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] text-[10px] font-semibold  tracking-[0.2em]">
                                <ShieldCheck className="w-4 h-4" /> {t('debts.status.collected', 'Collected')}
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-2xl border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] text-[9px] font-semibold  tracking-[0.2em] px-6 py-5 h-auto hover:bg-[var(--nexus-emerald-glow)] hover:border-[var(--nexus-emerald-border)] hover:text-[var(--nexus-emerald)] transition-all" 
                                onClick={() => handleOpenPayment(debt)}
                              >
                                <ArrowRightLeft className="w-4 h-4 mr-2" /> {t('debts.action.receiveInflow', 'Receive Inflow')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Add Debt/Lend record modal */}
      <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title={t('debts.modal.addTitle', 'Initialize Ledger Protocol')}>
        <form onSubmit={handleCreateDebt} className="space-y-8 p-2">
          <div className="grid grid-cols-2 gap-3 bg-[var(--nexus-bg-panel)] p-2 rounded-[24px] border border-[var(--nexus-glass-border)] shadow-inner">
            {(['owe', 'lend'] as const).map((dt) => (
              <button
                key={dt}
                type="button"
                onClick={() => setDebtType(dt)}
                className={`py-4 rounded-[18px] text-[10px] font-semibold  tracking-[0.2em] transition-all duration-300 shadow-xl ${
                  debtType === dt
                    ? dt === 'owe'
                      ? 'bg-rose-500 text-[var(--nexus-text-primary)] shadow-rose-500/20'
                      : 'bg-[var(--nexus-emerald)] text-[var(--nexus-text-primary)]'
                    : 'text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] hover:bg-[var(--nexus-bg-panel)]'
                }`}
              >
                {dt === 'owe' ? t('debts.type.liability', 'Liability') : t('debts.type.asset', 'Asset')}
              </button>
            ))}
          </div>

          <Input
            label={t('debts.modal.label', 'Protocol Label')}
            placeholder="e.g. Nexus Venture Capital, Personal Loan"
            value={debtName}
            onChange={(e) => setDebtName(e.target.value)}
            required
            disabled={submitting}
            className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6"
          />
          <Select
            label={t('debts.modal.currency', 'Currency Base')}
            options={currencyService.getSupportedCurrencies().map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={submitting}
            className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyInput
              label={t('debts.modal.magnitude', 'Jumlah ({currency})').replace('{currency}', currency)}
              placeholder="0"
              value={amount}
              onChange={setAmount}
              required
              disabled={submitting}
              className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6"
            />
            <DatePicker
              label={t('debts.modal.deadline', 'Chronological Deadline')}
              value={dueDate}
              onChange={(val) => setDueDate(val)}
              disabled={submitting}
            />
          </div>
          <Input
            label={t('debts.modal.note', 'Counterparty / Protocol Note')}
            placeholder="Entity Name or Identifier"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            disabled={submitting}
            className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6"
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-[24px] border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] py-8 text-[11px] font-semibold  "
              onClick={() => setIsDebtModalOpen(false)}
              disabled={submitting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              type="submit" 
              loading={submitting}
              className="flex-1 rounded-[24px] bg-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald)] py-8 text-[11px] font-semibold   shadow-xl border-none"
            >
              {t('debts.modal.submitAdd', 'Authorize Protocol')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Installment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title={t('debts.modal.payTitle', 'Execute Repayment Protocol')}>
        {selectedDebt && (
          <form onSubmit={handlePaymentSubmit} className="space-y-8 p-2">
            <div className="p-6 rounded-[24px] bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-2">
              <p className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  ">{t('debts.modal.targetEntity', 'Target Entity')}</p>
              <h4 className="text-xl font-semibold text-[var(--nexus-text-primary)]  tracking-tight">{selectedDebt.name}</h4>
            </div>

            <Select
              label={selectedDebt.type === 'owe' ? t('debts.modal.sourceAccount', 'Source Asset Account') : t('debts.modal.destinationAccount', 'Destination Asset Account')}
              options={[
                { value: '', label: `-- ${t('debts.modal.selectAsset', 'Select Asset')} --` },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance), w.currency || 'IDR')})` })),
              ]}
              value={payWalletId}
              onChange={(e) => setPayWalletId(e.target.value)}
              required
              disabled={submitting}
              className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto"
            />
            <CurrencyInput
              label={t('debts.modal.authMagnitude', 'Jumlah bayar ({currency})').replace('{currency}', selectedDebt.currency || 'Rp')}
              placeholder="0"
              value={payAmount}
              onChange={setPayAmount}
              required
              disabled={submitting}
              className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6"
            />
            <Input
              label={t('debts.modal.txNote', 'Transaction Log Note')}
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              disabled={submitting}
              className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6"
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-[24px] border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] py-8 text-[11px] font-semibold  "
                onClick={() => setIsPayModalOpen(false)}
                disabled={submitting}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button 
                type="submit" 
                loading={submitting}
                className={`flex-1 rounded-[24px] py-8 text-[11px] font-semibold   shadow-xl border-none ${
                  selectedDebt.type === 'owe' 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                    : 'bg-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald)]'
                }`}
              >
                {selectedDebt.type === 'owe' ? t('debts.modal.submitPay', 'Authorize Payment') : t('debts.modal.submitInflow', 'Authorize Inflow')}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
