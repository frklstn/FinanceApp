'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { type Wallet, walletService } from '@/lib/services/workspace/wallet.service';
import { currencyService } from '@/lib/services/finance/currency.service';
import { transactionService } from '@/lib/services/workspace/transaction.service';
import { formatCurrency } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import {
  Banknote,
  Landmark,
  Smartphone,
  Bitcoin,
  PiggyBank,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  Wallet as WalletIcon,
  Activity,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { PageHeader } from '@/components/shared/layout/page-header';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletsPage() {
  const { accountId, t } = useApp();
  const { toast } = useToast();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('wallet');
  const [currency, setCurrency] = useState('IDR');

  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchWallets = useCallback(async () => {
    if (!accountId) return;
    try {
      const list = await walletService.getWallets(accountId);
      setWallets(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    }
  }, [accountId, toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchWallets);
    }
  }, [accountId, fetchWallets]);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !name.trim()) return;
    setSubmitting(true);
    try {
      if (editingWallet) {
        await walletService.updateWallet(editingWallet.id, { name, type: type as Wallet['type'], color, icon, currency });
        toast('Dompet diperbarui', 'success');
      } else {
        await walletService.createWallet(accountId, name, type as Wallet['type'], Number(balance), color, icon, currency);
        toast('Dompet disimpan', 'success');
      }
      setIsWalletModalOpen(false);
      fetchWallets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const getWalletIcon = (wType: string, wColor: string) => {
    const iconClass = 'w-7 h-7';
    const style = { color: wColor };
    switch (wType) {
      case 'cash': return <Banknote className={iconClass} style={style} />;
      case 'bank': return <Landmark className={iconClass} style={style} />;
      case 'e-wallet': return <Smartphone className={iconClass} style={style} />;
      case 'crypto': return <Bitcoin className={iconClass} style={style} />;
      case 'savings': return <PiggyBank className={iconClass} style={style} />;
      default: return <CreditCard className={iconClass} style={style} />;
    }
  };

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);

  return (
    <div className="space-y-8 no-scrollbar">
      <PageHeader
        title={t('wallets.title', 'Dompet')}
        subtitle={t('wallets.subtitle', 'Kelola semua dompet & saldomu')}
        actions={
          <>
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => setIsTransferModalOpen(true)}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2 text-[var(--nexus-emerald)]" /> {t('wallets.transfer', 'Pindahkan')}
            </Button>
            <Button
              variant="nexus-emerald"
              className="flex-1 md:flex-none"
              onClick={() => { setEditingWallet(null); setName(''); setBalance('0'); setIsWalletModalOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-2" /> {t('wallets.newAsset', 'Dompet baru')}
            </Button>
          </>
        }
      />

      <section>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <p className="text-xs text-[var(--nexus-text-secondary)]">
                {t('wallets.cumulativeLiquidity', 'Total saldo')}
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tight">
                <NumberTicker value={totalBalance} formatter={formatCurrency} />
              </h2>
              <p className="text-xs text-[var(--nexus-text-muted)]">
                {t('wallets.synchronized', '{count} dompet aktif').replace('{count}', String(wallets.length))}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)] flex items-center justify-center text-[var(--nexus-emerald)] shrink-0">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {wallets.map((wallet, i) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="relative group h-full"
            >
              <Card className="p-10 h-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-bg-panel)] transition-all flex flex-col justify-between rounded-[40px] shadow-2xl">
                <div className="flex items-start justify-between mb-10">
                  <div className="w-16 h-16 rounded-[24px] bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] flex items-center justify-center shadow-inner relative overflow-hidden" style={{ boxShadow: `inset 0 0 30px ${wallet.color}25` }}>
                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: wallet.color }} />
                    {getWalletIcon(wallet.type, wallet.color)}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                    <button onClick={() => { setEditingWallet(wallet); setName(wallet.name); setType(wallet.type); setBalance(wallet.balance.toString()); setColor(wallet.color); setIcon(wallet.icon); setCurrency(wallet.currency || 'IDR'); setIsWalletModalOpen(true); }} className="p-3 rounded-2xl bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-emerald-glow)] text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-all shadow-xl"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => walletService.deleteWallet(wallet.id).then(() => fetchWallets())} className="p-3 rounded-2xl bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-all shadow-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-[var(--nexus-text-primary)]  tracking-tight mb-2 truncate">{wallet.name}</h4>
                    <div className="flex items-center gap-3">
                      <Terminal className="w-3.5 h-3.5 text-[var(--nexus-text-muted)]" />
                      <span className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  tracking-[0.3em]">{t('wallets.node', '{type} Node').replace('{type}', wallet.type)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-[var(--nexus-glass-border)] space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-semibold   text-[var(--nexus-text-muted)]">
                      <span>{t('wallets.availableLiquidity', 'Available Liquidity')}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[var(--nexus-emerald)]" />
                    </div>
                    <p className="text-3xl font-semibold text-[var(--nexus-text-primary)] tracking-tighter leading-none">
                      {formatCurrency(Number(wallet.balance), wallet.currency || 'IDR')}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title={editingWallet ? t('wallets.modal.editTitle', 'Refactor Asset Node') : t('wallets.modal.addTitle', 'Initialize Asset Node')}>
        <form onSubmit={handleSaveWallet} className="space-y-8 p-2">
          <Input label={t('wallets.modal.label', 'Asset Label')} placeholder="e.g. Nexus Prime, Global Ledger" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6" />
          
          <Select 
            label={t('wallets.modal.classification', 'Classification Protocol')}
            options={[
              {value: 'cash', label: t('wallets.modal.classification.cash', 'Physical Capital')},
              {value: 'bank', label: t('wallets.modal.classification.bank', 'Institutional Custody')},
              {value: 'e-wallet', label: t('wallets.modal.classification.ewallet', 'Digital Terminal')},
              {value: 'crypto', label: t('wallets.modal.classification.crypto', 'Cryptographic Asset')},
              {value: 'savings', label: t('wallets.modal.classification.savings', 'Treasury Reserves')}
            ]} 
            value={type} 
            onChange={(e) => setType(e.target.value)} 
            className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto" 
          />
          
          <Select label={t('wallets.modal.currency', 'Currency Base')} options={currencyService.getSupportedCurrencies().map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))} value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto" />
          
          {!editingWallet && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  ">{t('wallets.modal.initialMagnitude', 'Initial Magnitude ({currency})').replace('{currency}', currency)}</label>
              <div className="relative">
                <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--nexus-emerald)]" />
                <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} required className="pl-14 rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-7 text-xl font-semibold tracking-tighter h-auto" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  ">{t('wallets.modal.visualFrequency', 'Visual Frequency')}</label>
            <div className="flex flex-wrap gap-4">
              {['#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((col) => (
                <button key={col} type="button" onClick={() => setColor(col)} className={`w-10 h-10 rounded-[12px] border-2 transition-all duration-300 ${color === col ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-30 hover:opacity-100'}`} style={{ backgroundColor: col }} />
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" className="flex-1 rounded-[24px] border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] py-8 text-[11px] font-semibold  " onClick={() => setIsWalletModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[24px] bg-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald)] py-8 text-[11px] font-semibold   shadow-xl border-none">
              {editingWallet ? t('wallets.modal.submitEdit', 'Authorize Node') : t('wallets.modal.submitAdd', 'Authorize Node')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title={t('wallets.modal.transferTitle', 'Execute Liquidity Relocation')}>
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            setSubmitting(true);
            transactionService.createTransaction(accountId!, {
              workspace_id: accountId!,
              wallet_id: sourceId,
              destination_wallet_id: destId,
              amount: Number(transferAmount),
              type: 'transfer',
              note: transferNote || t('wallets.modal.protocolLogDefault', 'Liquidity Relocation'), // Default note for transfer
              date: new Date().toISOString(),
              currency: wallets.find(w => w.id === sourceId)?.currency || 'IDR',
              exchange_rate: 1.0,
              category_id: null,
              tags: [],
              attachment_url: null,
              is_recurring: false,
              recurring_id: null
            }).then(() => { 
              setIsTransferModalOpen(false); 
              fetchWallets(); 
              toast(t('wallets.toast.relocationSuccess', 'Relocation Success'), 'success');
            }).finally(() => setSubmitting(false)); 
          }} 
          className="space-y-8 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select 
              label={t('wallets.modal.originNode', 'Origin Node')} 
              options={[
                {value: '', label: `-- ${t('wallets.modal.selectAsset', 'Select Asset')} --`},
                ...wallets.map(w => ({value: w.id, label: w.name}))
              ]} 
              value={sourceId} 
              onChange={(e) => setSourceId(e.target.value)} 
              required 
              className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto" 
            />
            <Select 
              label={t('wallets.modal.destinationNode', 'Destination Node')} 
              options={[
                {value: '', label: `-- ${t('wallets.modal.selectAsset', 'Select Asset')} --`},
                ...wallets.map(w => ({value: w.id, label: w.name}))
              ]} 
              value={destId} 
              onChange={(e) => setDestId(e.target.value)} 
              required 
              className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  ">{t('wallets.modal.relocationMagnitude', 'Relocation Magnitude ({currency})').replace('{currency}', wallets.find(w => w.id === sourceId)?.currency || 'IDR')}</label>
            <div className="relative">
              <ArrowRightLeft className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--nexus-emerald)]" />
              <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required className="pl-14 rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-7 text-xl font-semibold tracking-tighter h-auto" />
            </div>
          </div>

          <Input 
            label={t('wallets.modal.protocolLog', 'Protocol Log Annotation')} 
            placeholder={t('wallets.modal.protocolLogPlaceholder', 'Nature of relocation...')} 
            value={transferNote} 
            onChange={(e) => setTransferNote(e.target.value)} 
            className="rounded-[20px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-6 h-auto" 
          />
          
          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" className="flex-1 rounded-[24px] border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] py-8 text-[11px] font-semibold  " onClick={() => setIsTransferModalOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[24px] bg-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald)] py-8 text-[11px] font-semibold   shadow-xl border-none">
              {t('wallets.modal.executeRelocation', 'Execute Relocation')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
