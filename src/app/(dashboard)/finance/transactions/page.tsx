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
import { CurrencyInput } from '@/components/ui/currency-input';
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
  Activity
} from 'lucide-react';
import { CategoryManagerModal } from '@/components/finance/transaction/CategoryManager';
import { PageHeader } from '@/components/shared/layout/page-header';
import { PageHelp } from '@/components/shared/page-help';
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

  const openEdit = (tx: PopulatedTransaction) => {
    setIsEditing(true);
    setEditingId(tx.id);
    setTxType(tx.type as 'income' | 'expense' | 'transfer');
    setTxAmount(tx.amount.toString());
    setTxNote(tx.note || '');
    setTxCategoryId(tx.category_id || '');
    setTxWalletId(tx.wallet_id);
    setTxDestWalletId(tx.destination_wallet_id || '');
    setTxDate(new Date(tx.date).toISOString().substring(0, 16));
    setIsModalOpen(true);
  };

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

      <PageHelp
        items={[
          'Klik "Baru" untuk mencatat pemasukan, pengeluaran, atau transfer antar dompet.',
          'Nominal otomatis diformat ribuan (mis. 200.000). Saldo dompet ikut menyesuaikan.',
          'Pakai bar filter untuk menyaring per tipe, dompet, atau rentang tanggal.',
          'Klik satu baris transaksi untuk melihat detail dan mengubahnya.',
          '"Kategori" untuk mengatur daftar kategori pemasukan/pengeluaran.',
        ]}
      />

      <section className="space-y-6">
        {/* Bar filter penuh di atas -- sebelumnya sidebar sempit 1/4 lebar yang
            memotong label select di desktop. Search penuh; Tipe/Dompet/Mulai/
            Selesai empat kolom di desktop, dua kolom (2x2) di hp. */}
        <Card className="p-4 gap-3 border-[var(--nexus-glass-border)]">
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

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--nexus-text-muted)]" />
              <Input placeholder="Cari transaksi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] pl-11 py-2.5 h-auto text-sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select label="Tipe" options={[{value: '', label: 'Semua tipe'}, {value: 'income', label: 'Pemasukan'}, {value: 'expense', label: 'Pengeluaran'}, {value: 'transfer', label: 'Transfer'}]} value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)]" />
              <Select label="Dompet" options={[{value: '', label: 'Semua dompet'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={filterWallet} onChange={(e) => setFilterWallet(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)]" />
              <DatePicker label="Mulai" value={filterStartDate} onChange={setFilterStartDate} placeholder="Mulai" />
              <DatePicker label="Selesai" value={filterEndDate} onChange={setFilterEndDate} placeholder="Selesai" />
            </div>
          </div>
        </Card>

        {/* Daftar transaksi: baris ringkas, bisa diklik untuk detail/edit,
            responsif tanpa scroll horizontal. Tombol aksi selalu tampak di hp
            (tak ada hover di layar sentuh), muncul saat hover di desktop. */}
        <Card className="xl:col-span-3 p-0 overflow-hidden border-[var(--nexus-glass-border)]">
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-[var(--nexus-text-secondary)]">
              {hasActiveFilter ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Belum ada transaksi.'}
            </div>
          ) : (
            <div className="divide-y divide-[var(--nexus-glass-border)]">
              <AnimatePresence mode="popLayout">
                {transactions.map((tx) => {
                  const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '';
                  const amountColor = tx.type === 'expense' ? 'text-rose-400' : 'text-[var(--nexus-emerald)]';
                  return (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => openEdit(tx)}
                      className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--nexus-bg-panel)] transition-colors"
                    >
                      <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)]' : tx.type === 'expense' ? 'text-rose-400 bg-rose-500/10' : 'text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)]'}`}>
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : tx.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--nexus-text-primary)] truncate">{tx.note || 'Tanpa keterangan'}</p>
                        <p className="text-xs text-[var(--nexus-text-muted)] truncate">
                          {tx.categories?.name ? `${tx.categories.name} · ` : ''}{tx.wallets?.name} · {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <span className={`text-sm font-semibold tracking-tight whitespace-nowrap ${amountColor}`}>
                        {sign}{formatCurrency(Number(tx.amount))}
                      </span>

                      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(tx); }}
                          className="p-2 rounded-lg text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] hover:bg-[var(--nexus-emerald-glow)] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); transactionService.deleteTransaction(tx.id).then(() => fetchTransactions()); }}
                          className="p-2 rounded-lg text-[var(--nexus-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {count > limit && (
            <div className="px-4 py-3 border-t border-[var(--nexus-glass-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--nexus-text-muted)]">
                {(page - 1) * limit + 1}–{Math.min(page * limit, count)} dari {count}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p * limit < count ? p + 1 : p)} disabled={page * limit >= count}>
                  Berikutnya <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditing ? 'Edit transaksi' : 'Tambah transaksi'}>
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-[var(--nexus-bg-panel)] rounded-xl border border-[var(--nexus-glass-border)]">
            {([['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer']] as const).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${txType === t ? 'bg-[var(--nexus-emerald)] text-white' : 'text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--nexus-text-secondary)]">Jumlah (IDR)</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nexus-emerald)]" />
                <CurrencyInput value={txAmount} onChange={setTxAmount} required className="pl-11 bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)] text-lg font-semibold tracking-tight" />
              </div>
            </div>
            <DatePicker label="Tanggal & waktu" showTime value={txDate} onChange={setTxDate} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Dompet asal" options={[{value: '', label: '-- Pilih dompet --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} required className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)]" />
            {txType === 'transfer' ? (
              <Select label="Dompet tujuan" options={[{value: '', label: '-- Pilih dompet --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txDestWalletId} onChange={(e) => setTxDestWalletId(e.target.value)} required className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)]" />
            ) : (
              <Select label="Kategori" options={[{value: '', label: '-- Umum --'}, ...categories.filter(c => c.type === txType).map(c => ({value: c.id, label: c.name}))]} value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)]" />
            )}
          </div>

          <Input label="Keterangan" placeholder="Catatan transaksi..." value={txNote} onChange={(e) => setTxNote(e.target.value)} className="bg-[var(--nexus-bg-panel)] border-[var(--nexus-glass-border)]" />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)]" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" variant="nexus-emerald" loading={submitting} className="flex-1 border-none">
              {isEditing ? 'Simpan perubahan' : 'Simpan transaksi'}
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
