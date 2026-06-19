'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { debtService, Debt } from '@/lib/services/finance/debt.service';
import { walletService, Wallet } from '@/lib/services/workspace/wallet.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Bell,
  Target
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';

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
        dueDate || null,
        currency
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

  const totalOwe = debts.filter((d) => d.type === 'owe').reduce((sum, d) => sum + Number(d.remaining_amount), 0);
  // Note: Simplified totals. Real implementation would convert to base currency.
  const totalLend = debts.filter((d) => d.type === 'lend').reduce((sum, d) => sum + Number(d.remaining_amount), 0);
  const netPosition = totalLend - totalOwe;

  return (
    <div className="space-y-8 no-scrollbar">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase"
          >
            Liabilitas <span className="text-rose-500">Terminal</span>
          </motion.h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Infrastruktur Audit Utang & Piutang • v2.0</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            className="flex-1 md:flex-none bg-rose-500 hover:bg-rose-600 px-8 py-6 h-auto text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-500/10 border-none"
            onClick={() => setIsDebtModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" /> Inisialisasi Protokol
          </Button>
          <button className="p-4 rounded-[24px] bg-white/[0.03] backdrop-blur-3xl border border-white/5 text-white hover:bg-white/[0.08] transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,1)]" />
          </button>
        </div>
      </header>

      {/* Aggregate Hero Section */}
      <section>
        <Card glass className="p-8 md:p-12 relative group overflow-hidden border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-rose-500/10" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em]">Posisi Eksposur Bersih</p>
                <div className="flex items-baseline gap-3">
                  <span className={`text-5xl md:text-8xl font-black tracking-tighter ${netPosition >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    <NumberTicker value={Math.abs(netPosition)} formatter={formatCurrency} />
                  </span>
                  <span className="text-xs font-black text-white/20 uppercase tracking-widest">{netPosition >= 0 ? 'Surplus' : 'Defisit'}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-3 rounded-[24px] bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-black text-rose-400 uppercase tracking-widest">
                    Bayar: <NumberTicker value={totalOwe} formatter={formatCurrency} />
                  </span>
                </div>
                <div className="px-6 py-3 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <HandCoins className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                    Terima: <NumberTicker value={totalLend} formatter={formatCurrency} />
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-3xl rounded-[40px] border border-white/5 p-8 md:p-10 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-[24px] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
                    <ShieldAlert className="w-7 h-7 text-rose-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Audit Liabilitas</h4>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Pemantauan Sistem</p>
                  </div>
                </div>
                <div className="text-4xl font-black text-white italic tracking-tighter">
                  {debts.length} <span className="text-xs not-italic text-white/20">Unit</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                  <span className="text-white/30">Repayment Ratio</span>
                  <span className="text-white">Calculated</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(totalLend / (totalOwe + totalLend || 1)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]" 
                  />
                </div>
              </div>
              <p className="text-[11px] font-bold text-white/40 leading-relaxed uppercase tracking-tight">
                Current audit identifies <span className="text-white">{debts.filter(d => d.type === 'owe').length} liability contracts</span> and <span className="text-white">{debts.filter(d => d.type === 'lend').length} asset receivables</span>. Risk level: <span className={netPosition >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{netPosition >= 0 ? 'STABLE' : 'ELEVATED'}</span>.
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
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <Landmark className="w-6 h-6 text-rose-500" /> Liability Ledger
              </h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Obligations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="wait">
              {loading ? (
                [1, 2].map((n) => <div key={n} className="h-48 rounded-[32px] border border-white/5 bg-white/[0.02] animate-pulse" />)
              ) : debts.filter(d => d.type === 'owe').length === 0 ? (
                <div className="p-12 rounded-[32px] bg-white/[0.01] border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                  <ShieldCheck className="w-12 h-12 text-white/10" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Tidak Ada Liabilitas Terdeteksi</p>
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
                      <Card glass className="p-8 md:p-10 border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-rose-500/10 transition-all" />
                        
                        <div className="flex flex-col h-full justify-between space-y-8 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="text-lg font-black text-white uppercase tracking-tight">{debt.name}</h4>
                              <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 uppercase tracking-widest">Liability</span>
                                {debt.contact_info && (
                                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-tight flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> {debt.contact_info}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-3 rounded-2xl bg-white/5 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.2em]">
                              <span className="text-white/30">Repayment Audit</span>
                              <span className="text-white">
                                <NumberTicker value={paid} formatter={(v) => formatCurrency(v, debt.currency || 'IDR')} /> / {formatCurrency(tot, debt.currency || 'IDR')}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-widest">
                              <Calendar className="w-4 h-4" />
                              {debt.due_date ? `Deadline: ${new Date(debt.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}` : 'Infinite Cycle'}
                            </div>
                            {isPaid ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <ShieldCheck className="w-4 h-4" /> Secured
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-2xl border-white/5 bg-white/[0.03] text-[9px] font-black uppercase tracking-[0.2em] px-6 py-5 h-auto hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all" 
                                onClick={() => handleOpenPayment(debt)}
                              >
                                <Zap className="w-4 h-4 mr-2" /> Execute Payment
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
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                <HandCoins className="w-6 h-6 text-emerald-500" /> Asset Receivable
              </h3>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Credits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="wait">
              {loading ? (
                [1, 2].map((n) => <div key={n} className="h-48 rounded-[32px] border border-white/5 bg-white/[0.02] animate-pulse" />)
              ) : debts.filter(d => d.type === 'lend').length === 0 ? (
                <div className="p-12 rounded-[32px] bg-white/[0.01] border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                  <Target className="w-12 h-12 text-white/10" />
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">No Receivables Active</p>
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
                      <Card glass className="p-8 md:p-10 border-white/5 hover:bg-white/[0.04] transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                        
                        <div className="flex flex-col h-full justify-between space-y-8 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <h4 className="text-lg font-black text-white uppercase tracking-tight">{debt.name}</h4>
                              <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Asset</span>
                                {debt.contact_info && (
                                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-tight flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> {debt.contact_info}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="p-3 rounded-2xl bg-white/5 text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.2em]">
                              <span className="text-white/30">Collection Audit</span>
                              <span className="text-white">
                                <NumberTicker value={paid} formatter={(v) => formatCurrency(v, debt.currency || 'IDR')} /> / {formatCurrency(tot, debt.currency || 'IDR')}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]" 
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3 text-[10px] font-black text-white/30 uppercase tracking-widest">
                              <Calendar className="w-4 h-4" />
                              {debt.due_date ? `Inflow: ${new Date(debt.due_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}` : 'Infinite Cycle'}
                            </div>
                            {isPaid ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <ShieldCheck className="w-4 h-4" /> Collected
                              </div>
                            ) : (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="rounded-2xl border-white/5 bg-white/[0.03] text-[9px] font-black uppercase tracking-[0.2em] px-6 py-5 h-auto hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 transition-all" 
                                onClick={() => handleOpenPayment(debt)}
                              >
                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Receive Inflow
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
      <Modal isOpen={isDebtModalOpen} onClose={() => setIsDebtModalOpen(false)} title="Initialize Ledger Protocol">
        <form onSubmit={handleCreateDebt} className="space-y-8 p-2">
          <div className="grid grid-cols-2 gap-3 bg-white/[0.02] p-2 rounded-[24px] border border-white/5 shadow-inner">
            {(['owe', 'lend'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDebtType(t)}
                className={`py-4 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl ${
                  debtType === t
                    ? t === 'owe'
                      ? 'bg-rose-500 text-white shadow-rose-500/20'
                      : 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : 'text-white/30 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'owe' ? 'Liability' : 'Asset'}
              </button>
            ))}
          </div>

          <Input
            label="Protocol Label"
            placeholder="e.g. Nexus Venture Capital, Personal Loan"
            value={debtName}
            onChange={(e) => setDebtName(e.target.value)}
            required
            disabled={submitting}
            className="rounded-[20px] bg-white/[0.03] border-white/5 py-6"
          />
          <Select
            label="Currency Base"
            options={currencyService.getSupportedCurrencies().map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={submitting}
            className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label={`Magnitude (${currency})`}
              placeholder="0"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={submitting}
              className="rounded-[20px] bg-white/[0.03] border-white/5 py-6"
            />
            <DatePicker
              label="Chronological Deadline"
              value={dueDate}
              onChange={(val) => setDueDate(val)}
              disabled={submitting}
            />
          </div>
          <Input
            label="Counterparty / Protocol Note"
            placeholder="Entity Name or Identifier"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            disabled={submitting}
            className="rounded-[20px] bg-white/[0.03] border-white/5 py-6"
          />

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-[24px] border-white/5 bg-white/[0.03] py-8 text-[11px] font-black uppercase tracking-widest"
              onClick={() => setIsDebtModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={submitting}
              className="flex-1 rounded-[24px] bg-emerald-500 hover:bg-emerald-600 py-8 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 border-none"
            >
              Authorize Protocol
            </Button>
          </div>
        </form>
      </Modal>

      {/* Pay Installment Modal */}
      <Modal isOpen={isPayModalOpen} onClose={() => setIsPayModalOpen(false)} title="Execute Repayment Protocol">
        {selectedDebt && (
          <form onSubmit={handlePaymentSubmit} className="space-y-8 p-2">
            <div className="p-6 rounded-[24px] bg-white/[0.02] border border-white/5 space-y-2">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Target Entity</p>
              <h4 className="text-xl font-black text-white uppercase tracking-tight">{selectedDebt.name}</h4>
            </div>

            <Select
              label={selectedDebt.type === 'owe' ? 'Source Asset Account' : 'Destination Asset Account'}
              options={[
                { value: '', label: '-- Select Asset --' },
                ...wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatCurrency(Number(w.balance), w.currency || 'IDR')})` })),
              ]}
              value={payWalletId}
              onChange={(e) => setPayWalletId(e.target.value)}
              required
              disabled={submitting}
              className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto"
            />
            <Input
              label={`Authorization Magnitude (${selectedDebt.currency || 'Rp'})`}
              placeholder="0"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
              disabled={submitting}
              className="rounded-[20px] bg-white/[0.03] border-white/5 py-6"
            />
            <Input
              label="Transaction Log Note"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              disabled={submitting}
              className="rounded-[20px] bg-white/[0.03] border-white/5 py-6"
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-[24px] border-white/5 bg-white/[0.03] py-8 text-[11px] font-black uppercase tracking-widest"
                onClick={() => setIsPayModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                loading={submitting}
                className={`flex-1 rounded-[24px] py-8 text-[11px] font-black uppercase tracking-widest shadow-xl border-none ${
                  selectedDebt.type === 'owe' 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                }`}
              >
                {selectedDebt.type === 'owe' ? 'Authorize Payment' : 'Authorize Inflow'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
