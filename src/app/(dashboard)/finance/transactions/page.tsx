'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useApp } from '@/contexts/app-context';
import { transactionService, PopulatedTransaction } from '@/lib/services/workspace/transaction.service';
import { walletService, type Wallet } from '@/lib/services/workspace/wallet.service';
import { categoryService, type Category } from '@/lib/services/finance/category.service';
import { formatCurrency } from '@/lib/debt-planner/format';
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
import { CategoryManagerModal } from '@/components/finance/transaction/CategoryManager';
import { PageHeader } from '@/components/shared/layout/page-header';
import { motion, AnimatePresence } from 'framer-motion';

function TransactionsContent() {
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

  const hasActiveFilter = Boolean(searchTerm || filterType || filterWallet || filterStartDate || filterEndDate);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterWallet('');
    setFilterStartDate('');
    setFilterEndDate('');
    setPage(1);
  };

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
        toast('Transaksi diperbarui', 'success');
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
        toast('Transaksi tersimpan', 'success');
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
      <PageHeader
        title="Semua"
        accent="Catatan"
        subtitle="Semua catatan transaksimu"
        actions={
          <>
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <Tags className="w-4 h-4 mr-2 text-[var(--nexus-emerald)]" /> Kategori
            </Button>
            <Button
              variant="nexus-emerald"
              className="flex-1 md:flex-none"
              onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-2" /> Baru
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Advanced Filters */}
        <Card className="xl:col-span-1 p-5 gap-4 h-fit border-[var(--nexus-glass-border)]">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-[var(--nexus-text-primary)]">
              <Filter className="w-4 h-4 text-[var(--nexus-emerald)]" /> Cari & filter
            </h3>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Di bawah xl kartu ini melebar penuh, jadi field disusun menyamping biar tidak menjulang. */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="space-y-1.5 sm:col-span-2 xl:col-span-1">
              <label className="text-xs text-[var(--nexus-text-secondary)]">Cari deskripsi</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nexus-text-muted)]" />
                <Input placeholder="Cari transaksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] pl-11 py-2.5 h-auto text-xs" />
              </div>
            </div>
            <Select label="Tipe" options={[{value: '', label: 'Semua tipe'}, {value: 'income', label: 'Pemasukan'}, {value: 'expense', label: 'Pengeluaran'}, {value: 'transfer', label: 'Transfer antar dompet'}]} value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] h-auto py-2.5 text-xs" />
            <Select label="Dompet" options={[{value: '', label: 'Semua dompet'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] h-auto py-2.5 text-xs" />
            <DatePicker value={filterStartDate} onChange={setFilterStartDate} className="text-xs" placeholder="Mulai" />
            <DatePicker value={filterEndDate} onChange={setFilterEndDate} className="text-xs" placeholder="Selesai" />
          </div>
        </Card>

        {/* Ledger Table */}
        <Card className="xl:col-span-3 overflow-hidden border-[var(--nexus-glass-border)] rounded-[40px] shadow-2xl bg-[var(--nexus-bg-panel)]">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)]">
                  <th className="px-8 py-6 text-[10px] font-semibold  tracking-[0.3em] text-[var(--nexus-text-muted)]">Waktu</th>
                  <th className="px-8 py-6 text-[10px] font-semibold  tracking-[0.3em] text-[var(--nexus-text-muted)]">Keterangan</th>
                  <th className="px-8 py-6 text-[10px] font-semibold  tracking-[0.3em] text-[var(--nexus-text-muted)]">Transaksi</th>
                  <th className="px-8 py-6 text-[10px] font-semibold  tracking-[0.3em] text-[var(--nexus-text-muted)] text-right">Jumlah</th>
                  <th className="px-8 py-6 text-[10px] font-semibold  tracking-[0.3em] text-[var(--nexus-text-muted)] text-center">Aksi</th>
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
                      className="hover:bg-[var(--nexus-bg-panel)] transition-all duration-300 group"
                    >
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center border shadow-xl ${tx.type === 'income' ? 'border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)]' : tx.type === 'expense' ? 'border-rose-500/20 text-rose-400 bg-rose-500/10' : 'border-[var(--nexus-emerald-border)] text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)]'}`}>
                            {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : tx.type === 'expense' ? <TrendingDown className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-[var(--nexus-text-primary)]  tracking-tight block">
                              {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[9px] font-bold text-[var(--nexus-text-muted)]  tracking-[0.2em]">
                              {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="min-w-[200px] space-y-1">
                          <p className="text-[14px] font-semibold text-[var(--nexus-text-primary)] tracking-tight  truncate leading-none">{tx.note || 'Tanpa keterangan'}</p>
                          <div className="flex items-center gap-2">
                            <Database className="w-3 h-3 text-[var(--nexus-emerald)]" />
                            <span className="text-[9px] font-semibold text-[var(--nexus-emerald)]  tracking-[0.2em]">{tx.categories?.name || 'GEN-PROTOCOL'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5 text-[var(--nexus-text-muted)]" />
                          <span className="px-4 py-1.5 rounded-full bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] text-[9px] font-semibold text-[var(--nexus-text-muted)]  ">
                            {tx.wallets?.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right whitespace-nowrap">
                        <span className={`text-base font-semibold tracking-tighter ${tx.type === 'income' ? 'text-[var(--nexus-emerald)]' : tx.type === 'expense' ? 'text-rose-400' : 'text-[var(--nexus-emerald)]'}`}>
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}{formatCurrency(Number(tx.amount))}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          <button onClick={() => { setIsEditing(true); setEditingId(tx.id); setTxType(tx.type as 'income' | 'expense' | 'transfer'); setTxAmount(tx.amount.toString()); setTxNote(tx.note || ''); setTxCategoryId(tx.category_id || ''); setTxWalletId(tx.wallet_id); setTxDate(new Date(tx.date).toISOString().substring(0, 16)); setIsModalOpen(true); }} className="p-3 rounded-[12px] bg-[var(--nexus-bg-panel)] hover:bg-[var(--nexus-emerald-glow)] text-[var(--nexus-text-primary)] transition-all shadow-xl"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => transactionService.deleteTransaction(tx.id).then(() => fetchTransactions())} className="p-3 rounded-[12px] bg-[var(--nexus-bg-panel)] hover:bg-rose-500/20 text-[var(--nexus-text-primary)] transition-all shadow-xl"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          {count > limit && (
            <div className="px-10 py-8 border-t border-[var(--nexus-glass-border)] flex items-center justify-between bg-[var(--nexus-bg-panel)]">
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full bg-[var(--nexus-emerald)] animate-pulse" />
                <span className="text-[10px] font-semibold text-[var(--nexus-text-muted)]  tracking-[0.3em]">Registry Segment { (page-1)*limit+1 } - { Math.min(page*limit, count) } of { count }</span>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(p-1, 1))} disabled={page === 1} className="rounded-[16px] border-[var(--nexus-glass-border)] text-[10px] font-semibold  px-8 py-5 h-auto">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Sebelumnya
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p*limit < count ? p+1 : p)} disabled={page*limit >= count} className="rounded-[16px] border-[var(--nexus-glass-border)] text-[10px] font-semibold  px-8 py-5 h-auto">
                  Berikutnya <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Modern Terminal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? "Modifikasi Catatan Transaksi" : "Tambah transaksi"}>
        <form onSubmit={handleAddTransaction} className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-[var(--nexus-bg-panel)] rounded-[16px] border border-[var(--nexus-glass-border)] shadow-inner">
            {(['expense', 'income', 'transfer'] as const).map((t) => (
              <button 
                key={t} 
                type="button" 
                onClick={() => setTxType(t)} 
                className={`py-2 rounded-[12px] text-[9px] font-semibold  tracking-[0.1em] transition-all duration-300 ${txType === t ? 'bg-[var(--nexus-emerald)] text-[var(--nexus-text-primary)] shadow-xl' : 'text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] hover:bg-[var(--nexus-bg-panel)]'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-semibold text-[var(--nexus-text-muted)]   pl-1">Jumlah (IDR)</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nexus-emerald)]" />
                <Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required className="pl-10 rounded-[16px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 text-lg font-semibold tracking-tighter h-auto" />
              </div>
            </div>
            <DatePicker label="Kronologi Temporal" showTime value={txDate} onChange={setTxDate} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Dompet asal" options={[{value: '', label: '-- Pilih Aset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} required className="rounded-[16px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-3 h-auto" />
            {txType === 'transfer' ? (
              <Select label="Dompet tujuan" options={[{value: '', label: '-- Pilih Aset --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txDestWalletId} onChange={(e) => setTxDestWalletId(e.target.value)} required className="rounded-[16px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-3 h-auto" />
            ) : (
              <Select label="Kategori" options={[{value: '', label: '-- Umum --'}, ...categories.filter(c => c.type === txType).map(c => ({value: c.id, label: c.name}))]} value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} className="rounded-[16px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-3 h-auto" />
            )}
          </div>

          <Input label="Anotasi Registri" placeholder="Keterangan entri..." value={txNote} onChange={(e) => setTxNote(e.target.value)} className="rounded-[16px] bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] py-4 h-auto" />
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 rounded-[16px] border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] py-5 text-[10px] font-semibold  " onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting} className="flex-1 rounded-[16px] bg-[var(--nexus-emerald)] hover:bg-[var(--nexus-emerald)] py-5 text-[10px] font-semibold   shadow-xl border-none">
              Otorisasi Entri
            </Button>
          </div>
        </form>
      </Modal>
      <CategoryManagerModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} workspaceId={accountId || ''} />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[var(--nexus-emerald-border)] border-t-[var(--nexus-emerald)] rounded-full animate-spin" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
