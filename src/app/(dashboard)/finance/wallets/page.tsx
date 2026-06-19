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
  Zap,
  Activity,
  Database,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import NumberTicker from '@/components/ui/number-ticker';
import { motion, AnimatePresence } from 'framer-motion';

export default function WalletsPage() {
  const { accountId, appSettings } = useApp();
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
        toast('Asset Node Optimized', 'success');
      } else {
        await walletService.createWallet(accountId, name, type as Wallet['type'], Number(balance), color, icon, currency);
        toast('Asset Node Authorized', 'success');
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase"
          >
            Brankas <span className="text-emerald-500">{appSettings.app_name || 'Nexus'}</span>
          </motion.h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Infrastruktur Alokasi Aset • v2.0</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none rounded-[24px] border-white/5 bg-white/[0.03] backdrop-blur-3xl px-8 py-6 h-auto text-[11px] font-black uppercase tracking-widest"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2 text-emerald-400" /> Pindahkan
          </Button>
          <Button 
            variant="nexus-emerald"
            className="flex-1 md:flex-none px-8 py-6 h-auto"
            onClick={() => { setEditingWallet(null); setName(''); setBalance('0'); setIsWalletModalOpen(true); }}
          >
            <Plus className="w-5 h-5 mr-2" /> Aset Baru
          </Button>
        </div>
      </header>

      <section>
        <Card glass className="p-10 md:p-14 relative group overflow-hidden border-white/5 shadow-2xl bg-gradient-to-br from-[#0a1028] to-[#050816]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-all group-hover:bg-indigo-600/10" />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40">Cumulative Liquidity Position</h3>
              </div>
              <h2 className="text-5xl md:text-8xl font-black text-white tracking-tighter">
                <NumberTicker value={totalBalance} formatter={formatCurrency} />
              </h2>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                  Live Audit Active
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                  <Database className="w-3.5 h-3.5" /> Synchronized with {wallets.length} Nodes
                </div>
              </div>
            </div>
            
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[40px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 flex items-center justify-center text-indigo-400 shadow-2xl group-hover:scale-110 transition-transform duration-500">
              <WalletIcon className="w-12 h-12 md:w-16 md:h-16" />
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
              <Card glass className="p-10 h-full border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col justify-between rounded-[40px] shadow-2xl">
                <div className="flex items-start justify-between mb-10">
                  <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden" style={{ boxShadow: `inset 0 0 30px ${wallet.color}25` }}>
                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: wallet.color }} />
                    {getWalletIcon(wallet.type, wallet.color)}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
                    <button onClick={() => { setEditingWallet(wallet); setName(wallet.name); setType(wallet.type); setBalance(wallet.balance.toString()); setColor(wallet.color); setIcon(wallet.icon); setCurrency(wallet.currency || 'IDR'); setIsWalletModalOpen(true); }} className="p-3 rounded-2xl bg-white/5 hover:bg-emerald-500/20 text-white/40 hover:text-white transition-all shadow-xl"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => walletService.deleteWallet(wallet.id).then(() => fetchWallets())} className="p-3 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-white transition-all shadow-xl"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2 truncate">{wallet.name}</h4>
                    <div className="flex items-center gap-3">
                      <Terminal className="w-3.5 h-3.5 text-white/10" />
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{wallet.type} Node</span>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/30">
                      <span>Available Liquidity</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/50" />
                    </div>
                    <p className="text-3xl font-black text-white tracking-tighter leading-none">
                      {formatCurrency(Number(wallet.balance), wallet.currency || 'IDR')}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      <Modal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} title={editingWallet ? 'Refactor Asset Node' : 'Initialize Asset Node'}>
        <form onSubmit={handleSaveWallet} className="space-y-8 p-2">
          <Input label="Asset Label" placeholder="e.g. Nexus Prime, Global Ledger" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-[20px] bg-white/[0.03] border-white/5 py-6" />
          
          <Select label="Classification Protocol" options={[{value: 'cash', label: 'Physical Capital'}, {value: 'bank', label: 'Institutional Custody'}, {value: 'e-wallet', label: 'Digital Terminal'}, {value: 'crypto', label: 'Cryptographic Asset'}, {value: 'savings', label: 'Treasury Reserves'}]} value={type} onChange={(e) => setType(e.target.value)} className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
          
          <Select label="Currency Base" options={currencyService.getSupportedCurrencies().map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` }))} value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
          
          {!editingWallet && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Initial Magnitude (IDR)</label>
              <div className="relative">
                <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} required className="pl-14 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-xl font-black tracking-tighter h-auto" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Visual Frequency</label>
            <div className="flex flex-wrap gap-4">
              {['#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'].map((col) => (
                <button key={col} type="button" onClick={() => setColor(col)} className={`w-10 h-10 rounded-[12px] border-2 transition-all duration-300 ${color === col ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-30 hover:opacity-100'}`} style={{ backgroundColor: col }} />
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" className="flex-1 rounded-[24px] border-white/5 bg-white/[0.03] py-8 text-[11px] font-black uppercase tracking-widest" onClick={() => setIsWalletModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[24px] bg-indigo-500 hover:bg-indigo-600 py-8 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 border-none">
              Authorize Node
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Execute Liquidity Relocation">
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
              note: transferNote || 'Liquidity Relocation',
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
              toast('Relocation Success', 'success');
            }).finally(() => setSubmitting(false)); 
          }} 
          className="space-y-8 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select label="Origin Node" options={[{value: '', label: '-- Select Asset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={sourceId} onChange={(e) => setSourceId(e.target.value)} required className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
            <Select label="Destination Node" options={[{value: '', label: '-- Select Asset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={destId} onChange={(e) => setDestId(e.target.value)} required className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Relocation Magnitude (IDR)</label>
            <div className="relative">
              <ArrowRightLeft className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
              <Input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} required className="pl-14 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-xl font-black tracking-tighter h-auto" />
            </div>
          </div>

          <Input label="Protocol Log Annotation" placeholder="Nature of relocation..." value={transferNote} onChange={(e) => setTransferNote(e.target.value)} className="rounded-[20px] bg-white/[0.03] border-white/5 py-6 h-auto" />
          
          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" className="flex-1 rounded-[24px] border-white/5 bg-white/[0.03] py-8 text-[11px] font-black uppercase tracking-widest" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[24px] bg-indigo-500 hover:bg-indigo-600 py-8 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 border-none">
              Execute Relocation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
