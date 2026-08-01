'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Wallet } from '@/lib/services/server/wallet.service';
import { SUPPORTED_CURRENCIES } from '@/lib/currencies';
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
  Activity
} from 'lucide-react';
import { PageHeader } from '@/components/shared/layout/page-header';
import { SummaryCard } from '@/components/shared/summary-card';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getWalletsData,
  createWalletAction,
  updateWalletAction,
  deleteWalletAction,
  transferFundsAction,
} from '@/app/actions/wallet';

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
  const [color, setColor] = useState('#a8532f');
  const [icon, setIcon] = useState('wallet');
  const [currency, setCurrency] = useState('IDR');

  const [sourceId, setSourceId] = useState('');
  const [destId, setDestId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      const list = await getWalletsData();
      setWallets(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    }
  }, [toast]);

  useEffect(() => {
    if (accountId) {
      Promise.resolve().then(fetchWallets);
    }
  }, [accountId, fetchWallets]);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingWallet) {
        await updateWalletAction(editingWallet.id, {
          name,
          type: type as Wallet['type'],
          color,
          icon,
          currency,
        });
        toast(t('wallets.toast.updated', 'Dompet diperbarui'), 'success');
      } else {
        await createWalletAction({ name, type, balance: Number(balance), color, icon, currency });
        toast(t('wallets.toast.created', 'Dompet disimpan'), 'success');
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

  const handleDeleteWallet = async (id: string) => {
    try {
      await deleteWalletAction(id);
      toast(t('wallets.toast.deleted', 'Dompet dihapus'), 'success');
      fetchWallets();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transferFundsAction({
        sourceId,
        destId,
        amount: Number(transferAmount),
        note: transferNote,
        currency: wallets.find((w) => w.id === sourceId)?.currency || 'IDR',
      });
      setIsTransferModalOpen(false);
      setSourceId('');
      setDestId('');
      setTransferAmount('');
      setTransferNote('');
      fetchWallets();
      toast(t('wallets.toast.relocationSuccess', 'Dana berhasil dipindahkan'), 'success');
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
              disabled={wallets.length < 2}
              onClick={() => setIsTransferModalOpen(true)}
            >
              <ArrowRightLeft className="w-4 h-4 mr-2 text-primary" /> {t('wallets.transfer', 'Pindahkan')}
            </Button>
            <Button
              variant="primary"
              className="flex-1 md:flex-none"
              onClick={() => { setEditingWallet(null); setName(''); setBalance('0'); setType('cash'); setCurrency('IDR'); setIsWalletModalOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-2" /> {t('wallets.newAsset', 'Dompet baru')}
            </Button>
          </>
        }
      />

      <section>
        <SummaryCard
          label={t('wallets.cumulativeLiquidity', 'Total saldo')}
          value={totalBalance}
          hint={t('wallets.synchronized', '{count} dompet aktif').replace('{count}', String(wallets.length))}
          icon={WalletIcon}
        />
      </section>

      {wallets.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-text-muted">
            {t('wallets.empty', 'Belum ada dompet. Bikin satu dulu buat mulai mencatat transaksi.')}
          </p>
        </Card>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                <Card className="h-full border-line bg-surface hover:bg-surface transition-all flex flex-col justify-between">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface border border-line flex items-center justify-center shadow-inner relative overflow-hidden" style={{ boxShadow: `inset 0 0 30px ${wallet.color}25` }}>
                      <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: wallet.color }} />
                      {getWalletIcon(wallet.type, wallet.color)}
                    </div>
                    {/* Selalu tampak di layar sentuh: hover tidak ada di hp, jadi
                        opacity-0 membuat tombol ubah & hapus mustahil disentuh. */}
                    <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-y-[-10px] md:group-hover:translate-y-0">
                      <button onClick={() => { setEditingWallet(wallet); setName(wallet.name); setType(wallet.type); setBalance(wallet.balance.toString()); setColor(wallet.color); setIcon(wallet.icon); setCurrency(wallet.currency || 'IDR'); setIsWalletModalOpen(true); }} className="p-3 rounded-2xl bg-surface hover:bg-primary-glow text-text-muted hover:text-text-primary transition-all shadow-xl"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteWallet(wallet.id)} className="p-3 rounded-2xl bg-surface hover:bg-rose-500/20 text-text-muted hover:text-text-primary transition-all shadow-xl"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-text-primary tracking-tight mb-1 truncate">{wallet.name}</h4>
                      <span className="text-xs text-text-muted">{wallet.type}</span>
                    </div>

                    <div className="pt-4 border-t border-line space-y-1.5">
                      <span className="text-xs text-text-muted">{t('wallets.availableLiquidity', 'Saldo tersedia')}</span>
                      <p className="text-2xl md:text-3xl font-semibold text-text-primary tracking-tight leading-none">
                        {formatCurrency(Number(wallet.balance), wallet.currency || 'IDR')}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      )}

      <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title={editingWallet ? t('wallets.modal.editTitle', 'Ubah dompet') : t('wallets.modal.addTitle', 'Dompet baru')}>
        <form onSubmit={handleSaveWallet} className="space-y-5">
          <Input label={t('wallets.modal.label', 'Nama dompet')} placeholder="mis. BCA, Dana, Dompet tunai" value={name} onChange={(e) => setName(e.target.value)} required className="bg-surface border-line" />

          <Select
            label={t('wallets.modal.classification', 'Jenis dompet')}
            options={[
              {value: 'cash', label: t('wallets.modal.classification.cash', 'Tunai')},
              {value: 'bank', label: t('wallets.modal.classification.bank', 'Rekening bank')},
              {value: 'e-wallet', label: t('wallets.modal.classification.ewallet', 'Dompet digital')},
              {value: 'crypto', label: t('wallets.modal.classification.crypto', 'Kripto')},
              {value: 'savings', label: t('wallets.modal.classification.savings', 'Tabungan')}
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-surface border-line"
          />

          <Select label={t('wallets.modal.currency', 'Mata uang')} options={SUPPORTED_CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))} value={currency} onChange={(e) => setCurrency(e.target.value)} className="bg-surface border-line" />

          {!editingWallet && (
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-text-muted">{t('wallets.modal.initialMagnitude', 'Saldo awal ({currency})').replace('{currency}', currency)}</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} required className="pl-11 bg-surface border-line text-lg font-semibold tracking-tight" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-semibold text-text-muted">{t('wallets.modal.visualFrequency', 'Warna')}</label>
            <div className="flex flex-wrap gap-4">
              {/* Palet bersahaja selaras aksen terracotta; pelangi generik lama
                  (indigo/hijau/biru terang) bentrok dengan bahasa desain. */}
              {['#a8532f', '#c2693f', '#b45309', '#7a6f5c', '#6b6156', '#8a4526'].map((col) => (
                <button key={col} type="button" onClick={() => setColor(col)} className={`w-10 h-10 rounded-[12px] border-2 transition-all duration-300 ${color === col ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-30 hover:opacity-100'}`} style={{ backgroundColor: col }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 border-line bg-surface" onClick={() => setIsWalletModalOpen(false)}>{t('common.cancel', 'Batal')}</Button>
            <Button type="submit" loading={submitting} className="flex-1 bg-primary hover:bg-primary border-none">
              {editingWallet ? t('wallets.modal.submitEdit', 'Simpan perubahan') : t('wallets.modal.submitAdd', 'Simpan dompet')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title={t('wallets.modal.transferTitle', 'Pindahkan dana')}>
        <form onSubmit={handleTransfer} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={t('wallets.modal.originNode', 'Dompet asal')}
              options={[
                {value: '', label: `-- ${t('wallets.modal.selectAsset', 'Pilih dompet')} --`},
                ...wallets.map(w => ({value: w.id, label: w.name}))
              ]}
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              required
              className="bg-surface border-line"
            />
            <Select
              label={t('wallets.modal.destinationNode', 'Dompet tujuan')}
              options={[
                {value: '', label: `-- ${t('wallets.modal.selectAsset', 'Pilih dompet')} --`},
                ...wallets.filter(w => w.id !== sourceId).map(w => ({value: w.id, label: w.name}))
              ]}
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              required
              className="bg-surface border-line"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-semibold text-text-muted">{t('wallets.modal.relocationMagnitude', 'Jumlah ({currency})').replace('{currency}', wallets.find(w => w.id === sourceId)?.currency || 'IDR')}</label>
            <div className="relative">
              <ArrowRightLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input type="number" min="1" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required className="pl-11 bg-surface border-line text-lg font-semibold tracking-tight" />
            </div>
          </div>

          <Input
            label={t('wallets.modal.protocolLog', 'Catatan')}
            placeholder={t('wallets.modal.protocolLogPlaceholder', 'Keterangan transfer...')}
            value={transferNote}
            onChange={(e) => setTransferNote(e.target.value)}
            className="bg-surface border-line"
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 border-line bg-surface" onClick={() => setIsTransferModalOpen(false)}>{t('common.cancel', 'Batal')}</Button>
            <Button type="submit" loading={submitting} className="flex-1 bg-primary hover:bg-primary border-none">
              {t('wallets.modal.executeRelocation', 'Pindahkan')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
