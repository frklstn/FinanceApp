'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { transactionService, PopulatedTransaction } from '@/lib/services/transaction.service';
import { walletService, type Wallet } from '@/lib/services/wallet.service';
import { categoryService, type Category } from '@/lib/services/category.service';
import { formatRupiah } from '@/lib/debt-planner/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Edit2,
  Tags,
  Filter,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Database,
  Terminal,
  Activity
} from 'lucide-react';
import { CategoryManagerModal } from '@/components/transaction/category-manager-modal';
import { motion, AnimatePresence } from 'framer-motion';

export default function TransactionsPage() {
  const { accountId } = useApp();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterWallet, setFilterWallet] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [txType, setTxType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [txWalletId, setTxWalletId] = useState('');
  const [txDestWalletId, setTxDestWalletId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().substring(0, 16));
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchFiltersData = useCallback(async () => {
    if (!accountId) return;
    try {
      const [wList, cList] = await Promise.all([
        walletService.getWallets(accountId),
        categoryService.getCategories(accountId),
      ]);
      setWallets(wList);
      setCategories(cList);
    } catch (err: unknown) {
      console.error(err);
    }
  }, [accountId]);

  const fetchTransactions = useCallback(async () => {
    if (!accountId) return;
    try {
      const offset = (page - 1) * limit;
      const { data, count: total } = await transactionService.getTransactions(accountId, {
        walletId: filterWallet || undefined,
        type: filterType || undefined,
        search: searchTerm.trim() || undefined,
        limit,
        offset,
      });
      setTransactions(data);
      setCount(total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat transaksi.';
      toast(message, 'danger');
    }
  }, [accountId, page, filterWallet, filterType, searchTerm, toast]);

  useEffect(() => {
    if (accountId) {
      fetchFiltersData();
    }
  }, [accountId, fetchFiltersData]);

  useEffect(() => {
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, page, filterWallet, filterType, searchTerm, fetchTransactions]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !txWalletId || !txAmount) return;
    setSubmitting(true);
    try {
      const payload = {
        wallet_id: txWalletId,
        category_id: txType !== 'transfer' ? txCategoryId || null : null,
        amount: Number(txAmount),
        type: txType,
        destination_wallet_id: txType === 'transfer' ? txDestWalletId : null,
        note: txNote.trim() || null,
        date: new Date(txDate).toISOString(),
        tags: [] as string[],
      };

      if (isEditing && editingId) {
        await transactionService.updateTransaction(editingId, payload);
        toast('Record Optimized', 'success');
      } else {
        await transactionService.createTransaction(accountId, {
          ...payload,
          workspace_id: accountId,
          attachment_url: null,
          is_recurring: false,
          recurring_id: null,
        });
        toast('Entry Authorized', 'success');
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050816] py-6 md:py-10 px-4 md:px-8 space-y-8 md:space-y-12 no-scrollbar">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase"
          >
            Ledger <span className="text-indigo-500">Terminal</span>
          </motion.h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Cryptographic Transaction Registry • v2.0</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none rounded-[24px] border-white/5 bg-white/[0.03] backdrop-blur-3xl px-8 py-6 h-auto text-[11px] font-black uppercase tracking-widest"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Tags className="w-4 h-4 mr-2 text-indigo-400" /> Classifications
          </Button>
          <Button 
            className="flex-1 md:flex-none rounded-[24px] shadow-[0_0_30px_rgba(99,102,241,0.2)] bg-indigo-500 hover:bg-indigo-600 border-none px-8 py-6 h-auto text-[11px] font-black uppercase tracking-widest"
            onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
          >
            <Plus className="w-5 h-5 mr-2" /> New Entry
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Advanced Filters */}
        <Card glass className="xl:col-span-1 p-8 md:p-10 space-y-10 h-fit border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-[12px] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Filter className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Nexus Query</h3>
          </div>
          <div className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Search Description</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <Input placeholder="Query entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/[0.03] border-white/5 pl-12 rounded-[16px] py-6 h-auto" />
              </div>
            </div>
            <Select label="Entry Type" options={[{value: '', label: 'All Protocols'}, {value: 'income', label: 'Inflow'}, {value: 'expense', label: 'Outflow'}, {value: 'transfer', label: 'Internal Transfer'}]} value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-[16px] bg-white/[0.03] border-white/5 h-auto py-3" />
            <Select label="Asset Account" options={[{value: '', label: 'All Nodes'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="rounded-[16px] bg-white/[0.03] border-white/5 h-auto py-3" />
          </div>
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/30">
              <span>Sync Status</span>
              <span className="text-emerald-400">Live</span>
            </div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-1/3 h-full bg-indigo-500/50" />
            </div>
          </div>
        </Card>

        {/* Ledger Table */}
        <Card glass className="xl:col-span-3 overflow-hidden border-white/5 rounded-[40px] shadow-2xl bg-white/[0.01]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Timestamp</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Identification</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Protocol Node</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Magnitude</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Protocol Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode='popLayout'>
                  {transactions.map((tx, i) => (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-white/[0.03] transition-all duration-300 group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border shadow-xl ${tx.type === 'income' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : tx.type === 'expense' ? 'border-rose-500/20 text-rose-400 bg-rose-500/10' : 'border-indigo-500/20 text-indigo-400 bg-indigo-500/10'}`}>
                            {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-black text-white uppercase tracking-tight block">
                              {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">
                              {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="min-w-[200px] space-y-1">
                          <p className="text-[14px] font-black text-white tracking-tight uppercase truncate leading-none">{tx.note || 'UNLABELED ENTRY'}</p>
                          <div className="flex items-center gap-2">
                            <Database className="w-3 h-3 text-indigo-500/50" />
                            <span className="text-[9px] font-black text-indigo-400/60 uppercase tracking-[0.2em]">{tx.categories?.name || 'GEN-PROTOCOL'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-white/10" />
                          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">
                            {tx.wallets?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right whitespace-nowrap">
                        <span className={`text-base font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-rose-400' : 'text-indigo-400'}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatRupiah(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => { setIsEditing(true); setEditingId(tx.id); setTxType(tx.type as 'income' | 'expense' | 'transfer'); setTxAmount(tx.amount.toString()); setTxNote(tx.note || ''); setTxCategoryId(tx.category_id || ''); setTxWalletId(tx.wallet_id); setTxDate(new Date(tx.date).toISOString().substring(0, 16)); setIsModalOpen(true); }} className="p-3 rounded-[12px] bg-white/5 hover:bg-indigo-500/20 text-white transition-all shadow-xl"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => transactionService.deleteTransaction(tx.id).then(() => fetchTransactions())} className="p-3 rounded-[12px] bg-white/5 hover:bg-rose-500/20 text-white transition-all shadow-xl"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {count > limit && (
            <div className="px-10 py-8 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Registry Segment { (page-1)*limit+1 } - { Math.min(page*limit, count) } of { count }</span>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(p-1, 1))} disabled={page === 1} className="rounded-[16px] border-white/5 text-[10px] font-black uppercase px-8 py-5 h-auto">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p*limit < count ? p+1 : p)} disabled={page*limit >= count} className="rounded-[16px] border-white/5 text-[10px] font-black uppercase px-8 py-5 h-auto">
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Modern Terminal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modify Transaction Record" : "Authorize Ledger Entry"}>
        <form onSubmit={handleAddTransaction} className="space-y-8 p-2">
          <div className="grid grid-cols-3 gap-3 p-2 bg-white/[0.02] rounded-[24px] border border-white/5 shadow-inner">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setTxType(t)} 
                className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${txType === t ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">Entry Magnitude (IDR)</label>
              <div className="relative">
                <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/50" />
                <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required className="pl-14 rounded-[20px] bg-white/[0.03] border-white/5 py-7 text-xl font-black tracking-tighter h-auto" />
              </div>
            </div>
            <DatePicker label="Temporal Chronology" showTime value={txDate} onChange={setTxDate} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Select label="Origin Asset Node" options={[{value: '', label: '-- Select Asset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} required className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
            {txType === 'transfer' ? (
              <Select label="Target Destination Node" options={[{value: '', label: '-- Select Asset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txDestWalletId} onChange={(e) => setTxDestWalletId(e.target.value)} required className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
            ) : (
              <Select label="Protocol Classification" options={[{value: '', label: '-- General Entry --'}, ...categories.filter(c => c.type === txType).map(c => ({value: c.id, label: c.name}))]} value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} className="rounded-[20px] bg-white/[0.03] border-white/5 py-4 h-auto" />
            )}
          </div>

          <Input label="Registry Annotation" placeholder="Nature of entry..." value={txNote} onChange={(e) => setTxNote(e.target.value)} className="rounded-[20px] bg-white/[0.03] border-white/5 py-6 h-auto" />
          
          <div className="flex gap-4 pt-4">
            <Button variant="outline" type="button" className="flex-1 rounded-[24px] border-white/5 bg-white/[0.03] py-8 text-[11px] font-black uppercase tracking-widest" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[24px] bg-indigo-500 hover:bg-indigo-600 py-8 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 border-none">
              Authorize Entry
            </Button>
          </div>
        </form>
      </Modal>
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} workspaceId={accountId || ''} />
    </div>
  );
}
