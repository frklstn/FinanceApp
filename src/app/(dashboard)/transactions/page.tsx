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
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();

  const [transactions, setTransactions] = useState<PopulatedTransaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterWallet, setFilterWallet] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
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
        startDate: filterStartDate || undefined,
        endDate: filterEndDate || undefined,
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
  }, [accountId, page, filterWallet, filterType, filterStartDate, filterEndDate, searchTerm, toast]);

  useEffect(() => {
    if (accountId) {
      setTimeout(() => fetchFiltersData(), 0);
    }
  }, [accountId, fetchFiltersData]);

  useEffect(() => {
    if (accountId) {
      setTimeout(() => fetchTransactions(), 0);
    }
  }, [accountId, page, filterWallet, filterType, filterStartDate, filterEndDate, searchTerm, fetchTransactions]);

  // Handle URL edit trigger
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id || transactions.length === 0) return;
    
    const tx = transactions.find(t => t.id === id);
    if (tx && !isEditing) {
      setTimeout(() => {
        setEditingId(tx.id);
        setTxType(tx.type as 'income' | 'expense' | 'transfer');
        setTxAmount(tx.amount.toString());
        setTxNote(tx.note || '');
        setTxCategoryId(tx.category_id || '');
        setTxWalletId(tx.wallet_id);
        setTxDate(new Date(tx.date).toISOString().substring(0, 16));
        setIsEditing(true);
        setIsModalOpen(true);
      }, 0);
    }
  }, [searchParams, transactions, isEditing]);

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
        currency: 'IDR',
        exchange_rate: 1
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
          currency: 'IDR',
          exchange_rate: 1,
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
    <div className="space-y-8 no-scrollbar">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase"
          >
            Terminal <span className="text-emerald-500">Catatan</span>
          </motion.h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Registri Transaksi Kriptografis • v2.0</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 md:flex-none rounded-[24px] border-white/5 bg-white/[0.03] backdrop-blur-3xl px-8 py-6 h-auto text-[11px] font-black uppercase tracking-widest"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Tags className="w-4 h-4 mr-2 text-emerald-400" /> Klasifikasi
          </Button>
          <Button 
            className="flex-1 md:flex-none rounded-[24px] shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-emerald-500 hover:bg-emerald-600 border-none px-8 py-6 h-auto text-[11px] font-black uppercase tracking-widest"
            onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
          >
            <Plus className="w-5 h-5 mr-2" /> Entri Baru
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Advanced Filters */}
        <Card glass className="xl:col-span-1 p-6 space-y-8 h-fit border-white/5 relative z-50 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-[12px] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Filter className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">TERMINAL KUERI</h3>
          </div>
          <div className="space-y-4 relative z-10">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Cari Deskripsi</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <Input placeholder="Cari entri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/[0.03] border-white/5 pl-11 rounded-[14px] py-4 h-auto text-xs" />
              </div>
            </div>
            <div className="space-y-4">
              <Select label="Tipe Entri" options={[{value: '', label: 'Semua Protokol'}, {value: 'income', label: 'Pemasukan'}, {value: 'expense', label: 'Pengeluaran'}, {value: 'transfer', label: 'Transfer Internal'}]} value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-[14px] bg-white/[0.03] border-white/5 h-auto py-2.5 text-xs" />
              <Select label="Akun Aset" options={[{value: '', label: 'Semua Node'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="rounded-[14px] bg-white/[0.03] border-white/5 h-auto py-2.5 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                 <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="text-xs" placeholder="START" />
                 <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="text-xs" placeholder="END" />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/30">
              <span>Status Sinkron</span>
              <span className="text-emerald-400 animate-pulse">AKTIF</span>
            </div>
          </div>
        </Card>

        {/* Ledger Table */}
        <Card glass className="xl:col-span-3 overflow-hidden border-white/5 rounded-[40px] shadow-2xl bg-white/[0.01]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Stempel Waktu</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Identifikasi</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Node Protokol</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-right">Besaran</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">Aksi Protokol</th>
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
                          <p className="text-[14px] font-black text-white tracking-tight uppercase truncate leading-none">{tx.note || 'ENTRI TANPA LABEL'}</p>
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
                  <ChevronLeft className="w-4 h-4 mr-2" /> Sebelumnya
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p*limit < count ? p+1 : p)} disabled={page*limit >= count} className="rounded-[16px] border-white/5 text-[10px] font-black uppercase px-8 py-5 h-auto">
                  Berikutnya <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Modern Terminal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifikasi Catatan Transaksi" : "Otorisasi Entri Buku Besar"}>
        <form onSubmit={handleAddTransaction} className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/[0.02] rounded-[16px] border border-white/5 shadow-inner">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setTxType(t)} 
                className={`py-2 rounded-[12px] text-[9px] font-black uppercase tracking-[0.1em] transition-all duration-300 ${txType === t ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-white/30 hover:text-white hover:bg-white/5'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-white/30 uppercase tracking-widest pl-1">Besaran Entri (IDR)</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/50" />
                <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required className="pl-10 rounded-[16px] bg-white/[0.03] border-white/5 py-4 text-lg font-black tracking-tighter h-auto" />
              </div>
            </div>
            <DatePicker label="Kronologi Temporal" showTime value={txDate} onChange={setTxDate} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Node Aset Asal" options={[{value: '', label: '-- Pilih Aset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} required className="rounded-[16px] bg-white/[0.03] border-white/5 py-3 h-auto" />
            {txType === 'transfer' ? (
              <Select label="Node Aset Tujuan" options={[{value: '', label: '-- Pilih Aset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txDestWalletId} onChange={(e) => setTxDestWalletId(e.target.value)} required className="rounded-[16px] bg-white/[0.03] border-white/5 py-3 h-auto" />
            ) : (
              <Select label="Klasifikasi Protokol" options={[{value: '', label: '-- Entri Umum --'}, ...categories.filter(c => c.type === txType).map(c => ({value: c.id, label: c.name}))]} value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} className="rounded-[16px] bg-white/[0.03] border-white/5 py-3 h-auto" />
            )}
          </div>

          <Input label="Anotasi Registri" placeholder="Keterangan entri..." value={txNote} onChange={(e) => setTxNote(e.target.value)} className="rounded-[16px] bg-white/[0.03] border-white/5 py-4 h-auto" />
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 rounded-[16px] border-white/5 bg-white/[0.03] py-5 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[16px] bg-indigo-500 hover:bg-indigo-600 py-5 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 border-none">
              Otorisasi Entri
            </Button>
          </div>
        </form>
      </Modal>
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} workspaceId={accountId || ''} />
    </div>
  );
}
