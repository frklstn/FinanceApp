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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchFiltersData();
    }
  }, [accountId, fetchFiltersData]);

  useEffect(() => {
    if (accountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        toast('Updated!', 'success');
      } else {
        await transactionService.createTransaction(accountId, {
          ...payload,
          workspace_id: accountId,
          attachment_url: null,
          is_recurring: false,
          recurring_id: null,
        });
        toast('Recorded!', 'success');
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
    <div className="min-h-screen bg-[#0a0a0c] py-10 px-8 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Ledger <span className="text-indigo-500">Terminal</span></h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em]">Transaction Registry • v2.0</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="rounded-2xl border-white/5 bg-white/[0.03] backdrop-blur-xl" onClick={() => setIsCategoryModalOpen(true)}>
            <Tags className="w-4 h-4 mr-2" /> Categories
          </Button>
          <Button className="rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)]" onClick={() => { setIsEditing(false); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card glass className="lg:col-span-1 p-8 space-y-6 h-fit border-indigo-500/10">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Nexus Filters</h3>
          </div>
          <div className="space-y-4">
            <Input placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent border-white/5" />
            <Select label="Type" options={[{value: '', label: 'All'}, {value: 'income', label: 'Income'}, {value: 'expense', label: 'Expense'}, {value: 'transfer', label: 'Transfer'}]} value={filterType} onChange={(e) => setFilterType(e.target.value)} />
            <Select label="Wallet" options={[{value: '', label: 'All Wallets'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} />
          </div>
        </Card>

        <Card glass className="lg:col-span-3 overflow-hidden border-white/5">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Timestamp</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Description</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Account</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 text-right">Magnitude</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode='popLayout'>
                  {transactions.map((tx) => (
                    <motion.tr 
                      key={tx.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${tx.type === 'income' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : tx.type === 'expense' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' : 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5'}`}>
                            {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : tx.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                          </div>
                          <span className="text-[11px] font-bold text-white/60 tracking-tighter">
                            {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="min-w-[150px]">
                          <p className="text-[13px] font-black text-white tracking-tight uppercase truncate">{tx.note || 'UNLABELED ENTRY'}</p>
                          <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-widest mt-0.5">{tx.categories?.name || 'General'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">
                          {tx.wallets?.name}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">
                        <span className={`text-sm font-black tracking-tighter ${tx.type === 'income' ? 'text-emerald-400' : tx.type === 'expense' ? 'text-rose-400' : 'text-indigo-400'}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatRupiah(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setIsEditing(true); setEditingId(tx.id); setTxType(tx.type as 'income' | 'expense' | 'transfer'); setTxAmount(tx.amount.toString()); setTxNote(tx.note || ''); setTxCategoryId(tx.category_id || ''); setTxWalletId(tx.wallet_id); setTxDate(new Date(tx.date).toISOString().substring(0, 16)); setIsModalOpen(true); }} className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-white transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => transactionService.deleteTransaction(tx.id).then(() => fetchTransactions())} className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {count > limit && (
            <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Record { (page-1)*limit+1 } - { Math.min(page*limit, count) } OF { count }</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(p-1, 1))} disabled={page === 1} className="rounded-xl border-white/5 text-[10px] font-black uppercase">Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p*limit < count ? p+1 : p)} disabled={page*limit >= count} className="rounded-xl border-white/5 text-[10px] font-black uppercase">Next</Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modify Transaction" : "Initialize Record"}>
        <form onSubmit={handleAddTransaction} className="space-y-6">
          <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTxType(t)} className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all ${txType === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Input label="Magnitude (IDR)" type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required />
            <DatePicker label="Chronology" showTime value={txDate} onChange={setTxDate} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Select label="Source Account" options={[{value: '', label: '-- Select --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} required />
            {txType === 'transfer' ? (
              <Select label="Target Account" options={[{value: '', label: '-- Select --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txDestWalletId} onChange={(e) => setTxDestWalletId(e.target.value)} required />
            ) : (
              <Select label="Classification" options={[{value: '', label: '-- General --'}, ...categories.filter(c => c.type === txType).map(c => ({value: c.id, label: c.name}))]} value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} />
            )}
          </div>
          <Input label="Annotation" placeholder="Nature of transaction..." value={txNote} onChange={(e) => setTxNote(e.target.value)} />
          <Button type="submit" loading={submitting} className="w-full rounded-2xl h-14 font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Authorize Entry</Button>
        </form>
      </Modal>
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} workspaceId={accountId || ''} />
    </div>
  );
}
