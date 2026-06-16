'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { transactionService } from '@/lib/services/transaction.service';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import * as XLSX from 'xlsx';
import {
  User,
  Settings,
  Database,
  Download,
} from 'lucide-react';

export default function SettingsPage() {
  const { accountId, appSettings } = useApp();
  const { toast } = useToast();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'data'>('profile');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Profile preferences fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Predefined premium avatar presets
  const PRESET_AVATARS = [
    { name: 'Trader Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
    { name: 'Gold Investor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
    { name: 'Fintech Guru', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Finance' },
    { name: 'Wealth Star', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wealth' },
    { name: 'Crypto Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Trader' },
  ];

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        setFullName(user.user_metadata?.full_name || 'User');
        setCurrency(user.user_metadata?.currency || 'IDR');
        
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
    Promise.resolve().then(() => {
      void fetchProfile();
      
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam === 'data') {
          setActiveTab('data');
        }
      }
    });
  }, [fetchProfile]);

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

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          currency: currency,
          avatar_url: avatarUrl,
        },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      toast('Profil dan avatar berhasil diperbarui!', 'success');
      
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

  const handleExcelExport = async () => {
    if (!accountId) return;
    toast('Mengambil seluruh data transaksi...', 'info');

    try {
      const { data: allTxs } = await transactionService.getTransactions(accountId, {
        limit: 10000,
      });

      if (allTxs.length === 0) {
        toast('Tidak ada transaksi untuk diekspor.', 'warning');
        return;
      }

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

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan');

      const colWidths = [
        { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 },
      ];
      worksheet['!cols'] = colWidths;

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
          Atur informasi profil, mata uang utama, serta ekspor laporan transaksi.
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

            <div className="space-y-4 pt-4 border-t border-light-border/40 dark:border-dark-border/40">
              <label className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                Avatar Profil
              </label>
              
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/20 dark:bg-dark-bg/10">
                <div className="relative w-20 h-20 rounded-full border-2 border-primary/45 bg-light-card dark:bg-dark-card flex items-center justify-center overflow-hidden shadow-md shrink-0">
                  {avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
      ) : (
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
    </div>
  );
}
