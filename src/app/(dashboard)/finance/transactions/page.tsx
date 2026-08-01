'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useApp } from '@/contexts/app-context';
import type { Wallet } from '@/lib/services/server/wallet.service';
import type { Category } from '@/lib/services/server/category.service';
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
  Activity
} from 'lucide-react';
import { CategoryManagerModal } from '@/components/finance/transaction/CategoryManager';
import { PageHeader } from '@/components/shared/layout/page-header';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getTransactionsData,
  listTransactions,
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from '@/app/actions/transaction';

interface PopulatedTransaction {
  id: string;
  wallet_id: string;
  destination_wallet_id: string | null;
  category_id: string | null;
  amount: number;
  type: string;
  note: string | null;
  date: string;
  categories: { name: string } | null;
  wallets: { name: string } | null;
}

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

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTxType('expense');
    setTxWalletId('');
    setTxDestWalletId('');
    setTxCategoryId('');
    setTxAmount('');
    setTxNote('');
    setTxDate(new Date().toISOString().substring(0, 16));
  };

  const fetchFiltersData = useCallback(async () => {
    try {
      const data = await getTransactionsData({ limit });
      setWallets(data.wallets);
      setCategories(data.categories);
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      const { data, count: total } = await listTransactions({
        walletId: filterWallet || undefined,
        type: filterType || undefined,
        // DatePicker mengirim YYYY-MM-DD; tanggal akhir dijadikan akhir hari
        // supaya transaksi di hari itu ikut terhitung.
        startDate: filterStartDate || undefined,
        endDate: filterEndDate ? `${filterEndDate}T23:59:59.999` : undefined,
        search: searchTerm.trim() || undefined,
        limit,
        offset: (page - 1) * limit,
      });
      setTransactions(data as PopulatedTransaction[]);
      setCount(total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat transaksi.';
      toast(message, 'danger');
    }
  }, [page, filterWallet, filterType, filterStartDate, filterEndDate, searchTerm, toast]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(fetchFiltersData);
  }, [accountId, fetchFiltersData]);

  useEffect(() => {
    if (accountId) Promise.resolve().then(fetchTransactions);
  }, [accountId, fetchTransactions]);

  const openEdit = useCallback((tx: PopulatedTransaction) => {
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
  }, []);

  // Dashboard menautkan ke /finance/transactions?id=... untuk membuka satu transaksi.
  useEffect(() => {
    const id = searchParams.get('id');
    if (!id || transactions.length === 0 || isEditing) return;

    const tx = transactions.find((t) => t.id === id);
    if (tx) Promise.resolve().then(() => openEdit(tx));
  }, [searchParams, transactions, isEditing, openEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txWalletId || !txAmount) return;
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
        currency: wallets.find((w) => w.id === txWalletId)?.currency || 'IDR',
      };

      if (isEditing && editingId) {
        await updateTransactionAction(editingId, payload);
        toast('Transaksi diperbarui', 'success');
      } else {
        await createTransactionAction(payload);
        toast('Transaksi tersimpan', 'success');
      }
      setIsModalOpen(false);
      resetForm();
      fetchTransactions();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast(message, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini? Saldo dompet akan dikembalikan.')) return;
    try {
      await deleteTransactionAction(id);
      toast('Transaksi dihapus', 'success');
      fetchTransactions();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus', 'danger');
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
              <Tags className="w-4 h-4 mr-2 text-primary" /> Kategori
            </Button>
            <Button
              variant="primary"
              className="flex-1 md:flex-none"
              disabled={wallets.length === 0}
              onClick={() => { resetForm(); setIsModalOpen(true); }}
            >
              <Plus className="w-4 h-4 mr-2" /> Baru
            </Button>
          </>
        }
      />

      <section className="space-y-6">
        {/* Bar filter penuh di atas -- sebelumnya sidebar sempit 1/4 lebar yang
            memotong label select di desktop. Search penuh; Tipe/Dompet/Mulai/
            Selesai empat kolom di desktop, dua kolom (2x2) di hp. */}
        <Card className="p-4 gap-3 border-line">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Filter className="w-4 h-4 text-primary" /> Cari & filter
            </h3>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <Input placeholder="Cari transaksi..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} className="bg-surface border-line pl-11 py-2.5 h-auto text-sm" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select label="Tipe" options={[{value: '', label: 'Semua tipe'}, {value: 'income', label: 'Pemasukan'}, {value: 'expense', label: 'Pengeluaran'}, {value: 'transfer', label: 'Transfer'}]} value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="bg-surface border-line" />
              <Select label="Dompet" options={[{value: '', label: 'Semua dompet'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={filterWallet} onChange={(e) => { setFilterWallet(e.target.value); setPage(1); }} className="bg-surface border-line" />
              <DatePicker label="Mulai" value={filterStartDate} onChange={(v) => { setFilterStartDate(v); setPage(1); }} placeholder="Mulai" />
              <DatePicker label="Selesai" value={filterEndDate} onChange={(v) => { setFilterEndDate(v); setPage(1); }} placeholder="Selesai" />
            </div>
          </div>
        </Card>

        {/* Daftar transaksi: baris ringkas, bisa diklik untuk detail/edit,
            responsif tanpa scroll horizontal. Tombol aksi selalu tampak di hp
            (tak ada hover di layar sentuh), muncul saat hover di desktop. */}
        <Card className="xl:col-span-3 p-0 overflow-hidden border-line">
          {transactions.length === 0 ? (
            <div className="py-16 text-center text-sm text-text-secondary">
              {hasActiveFilter
                ? 'Tidak ada transaksi yang cocok dengan filter.'
                : wallets.length === 0
                  ? 'Bikin dompet dulu di halaman Dompet sebelum mencatat transaksi.'
                  : 'Belum ada transaksi.'}
            </div>
          ) : (
            <div className="divide-y divide-line">
              <AnimatePresence mode="popLayout">
                {transactions.map((tx) => {
                  const sign = tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '';
                  const amountColor = tx.type === 'expense' ? 'text-rose-400' : 'text-primary';
                  return (
                    <motion.div
                      key={tx.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => openEdit(tx)}
                      className="group flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface transition-colors"
                    >
                      <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'text-primary bg-primary-glow' : tx.type === 'expense' ? 'text-rose-400 bg-rose-500/10' : 'text-primary bg-primary-glow'}`}>
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : tx.type === 'expense' ? <TrendingDown className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-primary truncate">{tx.note || 'Tanpa keterangan'}</p>
                        <p className="text-xs text-text-muted truncate">
                          {tx.categories?.name ? `${tx.categories.name} · ` : ''}{tx.wallets?.name} · {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      <span className={`text-sm font-semibold tracking-tight whitespace-nowrap ${amountColor}`}>
                        {sign}{formatCurrency(Number(tx.amount))}
                      </span>

                      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(tx); }}
                          className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-primary-glow transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                          className="p-2 rounded-lg text-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
            <div className="px-4 py-3 border-t border-line flex items-center justify-between">
              <span className="text-xs text-text-muted">
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={isEditing ? 'Edit transaksi' : 'Tambah transaksi'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface rounded-xl border border-line">
            {([['expense', 'Pengeluaran'], ['income', 'Pemasukan'], ['transfer', 'Transfer']] as const).map(([t, label]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTxType(t)}
                className={`py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${txType === t ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-text-secondary">Jumlah</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input type="number" min="1" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required className="pl-11 bg-surface border-line text-lg font-semibold tracking-tight" />
              </div>
            </div>
            <DatePicker label="Tanggal & waktu" showTime value={txDate} onChange={setTxDate} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Dompet asal" options={[{value: '', label: '-- Pilih dompet --'}, ...wallets.map(w => ({value: w.id, label: w.name}))]} value={txWalletId} onChange={(e) => setTxWalletId(e.target.value)} required className="bg-surface border-line" />
            {txType === 'transfer' ? (
              <Select label="Dompet tujuan" options={[{value: '', label: '-- Pilih dompet --'}, ...wallets.filter(w => w.id !== txWalletId).map(w => ({value: w.id, label: w.name}))]} value={txDestWalletId} onChange={(e) => setTxDestWalletId(e.target.value)} required className="bg-surface border-line" />
            ) : (
              <Select label="Kategori" options={[{value: '', label: '-- Umum --'}, ...categories.filter(c => c.type === txType).map(c => ({value: c.id, label: c.name}))]} value={txCategoryId} onChange={(e) => setTxCategoryId(e.target.value)} className="bg-surface border-line" />
            )}
          </div>

          <Input label="Keterangan" placeholder="Catatan transaksi..." value={txNote} onChange={(e) => setTxNote(e.target.value)} className="bg-surface border-line" />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1 border-line bg-surface" onClick={() => { setIsModalOpen(false); resetForm(); }}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting} className="flex-1 border-none">
              {isEditing ? 'Simpan perubahan' : 'Simpan transaksi'}
            </Button>
          </div>
        </form>
      </Modal>

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        workspaceId={accountId || ''}
        onChanged={fetchFiltersData}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-border border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
