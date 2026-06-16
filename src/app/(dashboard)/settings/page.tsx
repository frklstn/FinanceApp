'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { transactionService } from '@/lib/services/transaction.service';
import { categoryService, type Category } from '@/lib/services/category.service';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import * as XLSX from 'xlsx';
import {
  User,
  Settings,
  Database,
  Download,
  Plus,
  Pencil,
  Trash2,
  Tag,
} from 'lucide-react';

export default function SettingsPage() {
  const { accountId, appSettings } = useApp();
  const { toast } = useToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'data'>('profile');
  const [loading, setLoading] = useState(true);

  // Category CRUD states
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [catIcon, setCatIcon] = useState('tag');
  const [catColor, setCatColor] = useState('#6366f1');
  const [catLoading, setCatLoading] = useState(false);

  // Profile preferences fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Predefined premium avatar presets
  const PRESET_AVATARS = [
    { name: 'Trader Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
    { name: 'Gold Investor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
    { name: 'Fintech Guru', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Finance' },
    { name: 'Wealth Star', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wealth' },
    { name: 'Crypto Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Trader' },
  ];

  const fetchCategories = useCallback(async () => {
    if (!accountId) return;
    try {
      const list = await categoryService.getCategories(accountId);
      setCategoriesList(list);
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Gagal memuat kategori';
      toast(msg, 'danger');
    }
  }, [accountId, toast]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || 'User');
        setCurrency(user.user_metadata?.currency || 'IDR');
        
        // Fetch current custom profile details from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setAvatarUrl(profile.avatar_url || '');
        }
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    Promise.resolve().then(fetchProfile);
    if (accountId) {
      Promise.resolve().then(fetchCategories);
    }
    // Query param tab select check
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam === 'data') {
        Promise.resolve().then(() => setActiveTab('data'));
      } else if (tabParam === 'categories') {
        Promise.resolve().then(() => setActiveTab('categories'));
      }
    }
  }, [fetchProfile, fetchCategories, accountId]);

  useEffect(() => {
    if (fullName && appSettings?.document_title) {
      document.title = `${appSettings.document_title} - ${fullName}`;
    }
  }, [fullName, appSettings?.document_title]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Pengguna tidak terotentikasi');

      // 1. Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          currency: currency,
          avatar_url: avatarUrl,
        },
      });
      if (authError) throw authError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      toast('Profil dan avatar berhasil diperbarui!', 'success');
      
      // Instantly update tab title
      if (appSettings?.document_title) {
        document.title = `${appSettings.document_title} - ${fullName}`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !catName.trim()) return;
    setCatLoading(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(
          editingCategory.id,
          catName.trim(),
          catIcon,
          catColor,
          catType,
          accountId
        );
        toast('Kategori berhasil diperbarui!', 'success');
      } else {
        await categoryService.createCategory(
          accountId,
          catName.trim(),
          catIcon,
          catColor,
          catType
        );
        toast('Kategori berhasil ditambahkan!', 'success');
      }
      setCatModalOpen(false);
      setCatName('');
      setCatIcon('tag');
      setCatColor('#6366f1');
      setCatType('expense');
      setEditingCategory(null);
      fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kategori';
      toast(msg, 'danger');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini? Transaksi yang menggunakan kategori ini akan kehilangan relasinya.')) return;
    try {
      await categoryService.deleteCategory(catId);
      toast('Kategori berhasil dihapus.', 'success');
      fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus kategori';
      toast(msg, 'danger');
    }
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon || 'tag');
    setCatColor(cat.color || '#6366f1');
    setCatModalOpen(true);
  };

  const handleExcelExport = async () => {
    if (!accountId) return;
    toast('Mengambil seluruh data transaksi...', 'info');

    try {
      // 1. Fetch ALL transactions inside workspace
      const { data: allTxs } = await transactionService.getTransactions(accountId, {
        limit: 10000,
      });

      if (allTxs.length === 0) {
        toast('Tidak ada transaksi untuk diekspor.', 'warning');
        return;
      }

      // 2. Map items to neat headers
      const rows = allTxs.map((tx) => ({
        ID: tx.id,
        Tanggal: new Date(tx.date).toLocaleDateString('id-ID'),
        Tipe: tx.type === 'income' ? 'PEMASUKAN' : tx.type === 'expense' ? 'PENGELUARAN' : 'TRANSFER',
        Nominal: Number(tx.amount),
        Dompet: tx.wallets?.name || 'Umum',
        Kategori: tx.categories?.name || 'Umum',
        Catatan: tx.note || '',
        Tag: tx.tags?.join(', ') || '',
      }));

      // 3. Create SheetJS sheet & workbook
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan');

      // Autofit widths
      const colWidths = [
        { wch: 25 }, // ID
        { wch: 12 }, // Tanggal
        { wch: 12 }, // Tipe
        { wch: 15 }, // Nominal
        { wch: 15 }, // Dompet
        { wch: 15 }, // Kategori
        { wch: 30 }, // Catatan
        { wch: 20 }, // Tag
      ];
      worksheet['!cols'] = colWidths;

      // 4. Save file
      const fileName = `${appSettings.app_name.replace(/\s+/g, '_')}_Buku_Besar.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast('Buku besar berhasil diekspor ke Excel!', 'success');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengekspor file Excel.';
      toast(msg, 'danger');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 pb-24">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
          <Settings className="w-5.5 h-5.5 text-primary" />
          Preferensi & Pengaturan Sistem
        </h2>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Atur informasi profil, mata uang utama, kategori keuangan, serta ekspor laporan transaksi.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-light-border/40 dark:border-dark-border/40 pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary text-primary'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <User className="w-4 h-4" />
          Preferensi Profil
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-b-2 border-primary text-primary'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <Tag className="w-4 h-4" />
          Kelola Kategori
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase transition-all duration-150 cursor-pointer ${
            activeTab === 'data'
              ? 'border-b-2 border-primary text-primary'
              : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary'
          }`}
        >
          <Database className="w-4 h-4" />
          Ekspor & Impor
        </button>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
      ) : activeTab === 'profile' ? (
        /* Profile tab */
        <Card className="p-6">
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
              Informasi Pribadi
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={submitting}
              />
              <Input
                label="Alamat Email"
                value={email}
                required
                disabled
                description="Alamat email untuk masuk sistem bersifat tetap."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Simbol Mata Uang Utama"
                options={[
                  { value: 'IDR', label: 'IDR (Rp) - Indonesia' },
                  { value: 'USD', label: 'USD ($) - Amerika Serikat' },
                  { value: 'EUR', label: 'EUR (€) - Uni Eropa' },
                  { value: 'GBP', label: 'GBP (£) - Inggris' },
                ]}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Premium User Avatar Customizer Section */}
            <div className="space-y-4 pt-4 border-t border-light-border/40 dark:border-dark-border/40">
              <label className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                Avatar Profil
              </label>
              
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/20 dark:bg-dark-bg/10">
                {/* Live Preview Avatar Circle */}
                <div className="relative w-20 h-20 rounded-full border-2 border-primary/45 bg-light-card dark:bg-dark-card flex items-center justify-center overflow-hidden shadow-md shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-light-text-secondary" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-3">
                  <Input
                    label="URL Avatar Kustom"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={submitting}
                    description="Tempel tautan langsung gambar kustom, atau pilih dari preset di bawah."
                  />
                </div>
              </div>

              {/* Predefined Avatars Picker Grid */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-light-text-secondary dark:text-dark-text-secondary tracking-wider">
                  Pilih Preset Avatar Premium:
                </p>
                <div className="grid grid-cols-5 gap-3 max-w-lg">
                  {PRESET_AVATARS.map((av) => (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => setAvatarUrl(av.url)}
                      className={`relative aspect-square rounded-xl border flex items-center justify-center p-1.5 transition-all duration-150 cursor-pointer ${
                        avatarUrl === av.url
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-light-border/40 dark:border-dark-border/40 hover:border-primary/40 hover:bg-light-bg/50 dark:hover:bg-dark-bg/25'
                      }`}
                      title={av.name}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-full object-contain" />
                      {avatarUrl === av.url && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[8px] text-white font-extrabold shadow-sm border border-light-bg dark:border-dark-bg">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-light-border/40 dark:border-dark-border/40">
              <Button type="submit" loading={submitting}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>
      ) : activeTab === 'categories' ? (
        /* Categories Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
                Kategori Keuangan
              </h3>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                Kelola kategori pemasukan dan pengeluaran Anda untuk pencatatan transaksi yang akurat.
              </p>
            </div>
            <Button className="flex items-center gap-1.5 cursor-pointer text-xs" size="sm" onClick={() => {
              setEditingCategory(null);
              setCatName('');
              setCatType('expense');
              setCatIcon('tag');
              setCatColor('#6366f1');
              setCatModalOpen(true);
            }}>
              <Plus className="w-4 h-4" />
              Kategori Baru
            </Button>
          </div>

          <div className="space-y-6">
            {/* Section: Pengeluaran */}
            <Card className="p-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-danger flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                Kategori Pengeluaran (Expenses)
              </h4>
              {categoriesList.filter((c) => c.type === 'expense').length === 0 ? (
                <p className="text-center text-xs text-light-text-secondary py-8">
                  Belum ada kategori pengeluaran yang dikonfigurasi.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoriesList
                    .filter((c) => c.type === 'expense')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-light-border/40 dark:border-dark-border/40 hover:bg-light-bg/30 dark:hover:bg-dark-bg/20 transition-all duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary">
                                {cat.name}
                              </h4>
                              {cat.workspace_id === null && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-light-bg dark:bg-dark-bg/60 text-light-text-secondary/60 select-none">
                                  Bawaan
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-light-text-secondary">
                              Pengeluaran
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-light-text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Edit Kategori"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>

            {/* Section: Pemasukan */}
            <Card className="p-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-success flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />
                Kategori Pemasukan (Incomes)
              </h4>
              {categoriesList.filter((c) => c.type === 'income').length === 0 ? (
                <p className="text-center text-xs text-light-text-secondary py-8">
                  Belum ada kategori pemasukan yang dikonfigurasi.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categoriesList
                    .filter((c) => c.type === 'income')
                    .map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-light-border/40 dark:border-dark-border/40 hover:bg-light-bg/30 dark:hover:bg-dark-bg/20 transition-all duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-bold text-light-text-primary dark:text-dark-text-primary">
                                {cat.name}
                              </h4>
                              {cat.workspace_id === null && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-light-bg dark:bg-dark-bg/60 text-light-text-secondary/60 select-none">
                                  Bawaan
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-light-text-secondary">
                              Pemasukan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-light-text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Edit Kategori"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Data Tab */
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5 pb-2 border-b border-light-border/40 dark:border-dark-border/40">
              Ekspor Data Keuangan
            </h3>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              Unduh seluruh transaksi akun Anda dalam format `.xlsx` (kategori, dompet, nominal, catatan).
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Button className="flex items-center gap-2 cursor-pointer" onClick={handleExcelExport}>
                <Download className="w-4 h-4" />
                Ekspor Buku Besar ke Excel (.xlsx)
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Category CRUD Modal */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}>
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Nama Kategori"
            placeholder="misal: Makan Siang, Transportasi"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
            disabled={catLoading}
          />
          
          <Select
            label="Tipe Kategori"
            options={[
              { value: 'expense', label: 'Pengeluaran (Expense)' },
              { value: 'income', label: 'Pemasukan (Income)' },
            ]}
            value={catType}
            onChange={(e) => setCatType(e.target.value as 'income' | 'expense' | 'transfer')}
            disabled={catLoading}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ikon Kategori"
              options={[
                { value: 'tag', label: 'Tag' },
                { value: 'coffee', label: 'Kopi / Makanan' },
                { value: 'shopping-bag', label: 'Belanja' },
                { value: 'home', label: 'Rumah / Kost' },
                { value: 'car', label: 'Kendaraan' },
                { value: 'gift', label: 'Hadiah' },
                { value: 'wallet', label: 'Dompet' },
                { value: 'heart', label: 'Kesehatan' },
                { value: 'book', label: 'Pendidikan' },
              ]}
              value={catIcon}
              onChange={(e) => setCatIcon(e.target.value)}
              disabled={catLoading}
            />

            <div>
              <label className="block text-xs font-semibold uppercase text-light-text-secondary dark:text-dark-text-secondary mb-1.5">
                Warna Tema Kategori
              </label>
              <div className="flex flex-wrap gap-2">
                {['#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setCatColor(col)}
                    className={`w-6 h-6 rounded-full border cursor-pointer transition-all duration-150 ${
                      catColor === col ? 'scale-110 ring-2 ring-primary/20 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCatModalOpen(false)}
              disabled={catLoading}
            >
              Batal
            </Button>
            <Button type="submit" loading={catLoading}>
              Simpan Kategori
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
