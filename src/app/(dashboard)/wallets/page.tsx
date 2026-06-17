'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { type Wallet, walletService } from '@/lib/services/wallet.service';
import { formatRupiah } from '@/lib/debt-planner/format';
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
  Zap,
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletsPage() {
  const { accountId } = useApp();
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchWallets();
    }
  }, [accountId, fetchWallets]);

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !name.trim()) return;
    setSubmitting(true);
    try {
      if (editingWallet) {
        await walletService.updateWallet(editingWallet.id, name, type, color, icon, editingWallet.is_active);
        toast('Asset Updated', 'success');
      } else {
        await walletService.createWallet(accountId, name, type, Number(balance), color, icon);
        toast('Asset Created', 'success');
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
    const iconClass = 'w-6 h-6';
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
    <div className="min-h-screen bg-[#0a0a0c] py-10 px-8 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Vault <span className="text-indigo-500">Nexus</span></h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Asset Infrastructure • v2.0</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="rounded-2xl border-white/5 bg-white/[0.03] backdrop-blur-xl" onClick={() => setIsTransferModalOpen(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
          </Button>
          <Button className="rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)]" onClick={() => { setEditingWallet(null); setName(''); setBalance('0'); setIsWalletModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Asset
          </Button>
        </div>
      </header>

      <section>
        <Card glass className="p-10 relative group overflow-hidden border-indigo-500/10 bg-gradient-to-br from-[#12042a] via-[#09112a] to-[#050816]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -mr-40 -mt-40 transition-all group-hover:bg-indigo-600/15" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/50">Cumulative Liquidity</h3>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
                <NumberTicker value={totalBalance} formatter={(v) => formatRupiah(v)} />
              </h2>
            </div>
            <div className="w-20 h-20 rounded-[32px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 flex items-center justify-center text-indigo-400 shadow-2xl">
              <WalletIcon className="w-10 h-10" />
            </div>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {wallets.map((wallet) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <Card glass className="p-8 h-full border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between rounded-[32px]">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner" style={{ boxShadow: `inset 0 0 20px ${wallet.color}20` }}>
                    {getWalletIcon(wallet.type, wallet.color)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingWallet(wallet); setName(wallet.name); setType(wallet.type); setBalance(wallet.balance.toString()); setColor(wallet.color); setIcon(wallet.icon); setIsWalletModalOpen(true); }} className="p-2.5 rounded-xl bg-white/5 hover:bg-indigo-500/20 text-white/60 hover:text-white transition-all"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => walletService.deleteWallet(wallet.id).then(() => fetchWallets())} className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">{wallet.name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">{wallet.type}</p>
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Available Funds</p>
                    <p className="text-2xl font-black text-white tracking-tighter">{formatRupiah(Number(wallet.balance))}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title={editingWallet ? 'Refactor Asset' : 'Initialize Asset'}>
        <form onSubmit={handleSaveWallet} className="space-y-6">
          <Input label="Asset Alias" placeholder="e.g. Cold Storage, Corporate Bank" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select label="Asset Class" options={[{value: 'cash', label: 'Physical Cash'}, {value: 'bank', label: 'Financial Institution'}, {value: 'e-wallet', label: 'Digital Ledger'}, {value: 'crypto', label: 'Cryptographic Asset'}, {value: 'savings', label: 'High-Yield Deposit'}]} value={type} onChange={(e) => setType(e.target.value)} />
          {!editingWallet && <Input label="Initial Magnitude" type="number" value={balance} onChange={(e) => setBalance(e.target.value)} required />}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Visual Identity</label>
            <div className="flex gap-3">
              {['#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((col) => (
                <button key={col} type="button" onClick={() => setColor(col)} className={`w-8 h-8 rounded-full border-2 transition-all ${color === col ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-50'}`} style={{ backgroundColor: col }} />
              ))}
            </div>
          </div>
          <Button type="submit" loading={submitting} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/10">Authorize Asset</Button>
        </form>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Relocate Liquidity">
        <form onSubmit={(e) => { e.preventDefault(); walletService.transferFunds(accountId!, sourceId, destId, Number(transferAmount), transferNote).then(() => { setIsTransferModalOpen(false); fetchWallets(); }); }} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Select label="Source Account" options={[{value: '', label: '-- Select --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={sourceId} onChange={(e) => setSourceId(e.target.value)} required />
            <Select label="Target Account" options={[{value: '', label: '-- Select --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={destId} onChange={(e) => setDestId(e.target.value)} required />
          </div>
          <Input label="Transfer Magnitude" type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required />
          <Input label="Protocol Note" placeholder="Reason for relocation..." value={transferNote} onChange={(e) => setTransferNote(e.target.value)} />
          <Button type="submit" loading={submitting} className="w-full h-14 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-500/10">Execute Relocation</Button>
        </form>
      </Modal>
    </div>
  );
}
