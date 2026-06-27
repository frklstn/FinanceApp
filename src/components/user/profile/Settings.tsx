'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useApp } from '@/contexts/app-context';
import { User, Monitor, Languages, RefreshCw, Trash2, Download } from 'lucide-react';
import { SubscriptionStatus } from '../subscription/subscription-status';
import { useUser } from '@/lib/hooks/use-user';
import * as XLSX from 'xlsx';
import { transactionService } from '@/lib/services/workspace/transaction.service';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/contexts/theme-context';

interface SettingsFormProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function SettingsForm({ isModal = false, onClose }: SettingsFormProps) {
  const { user, profile, accountId, appSettings, t } = useApp();
  const { toast } = useToast();
  const { updateProfile, submitting } = useUser();
  const { theme, toggleTheme } = useTheme();

  const handleExcelExport = async () => {
    if (!accountId) {
      toast(t('settings.export.noWorkspace', 'Workspace ID tidak ditemukan.'), 'warning');
      return;
    }
    toast(t('settings.export.fetching', 'Mengambil seluruh data transaksi...'), 'info');

    try {
      const { data: allTxs } = await transactionService.getTransactions(accountId, {
        limit: 10000,
      });

      if (allTxs.length === 0) {
        toast(t('settings.export.empty', 'Tidak ada transaksi untuk diekspor.'), 'warning');
        return;
      }

      const rows = allTxs.map((tx) => ({
        [t('settings.export.id', 'ID')]: tx.id,
        [t('settings.export.date', 'Tanggal')]: new Date(tx.date).toLocaleDateString('id-ID'),
        [t('settings.export.type', 'Tipe')]: tx.type === 'income' 
          ? t('settings.export.income', 'PEMASUKAN') 
          : tx.type === 'expense' 
            ? t('settings.export.expense', 'PENGELUARAN') 
            : t('settings.export.transfer', 'TRANSFER'),
        [t('settings.export.amount', 'Nominal')]: Number(tx.amount),
        [t('settings.export.wallet', 'Dompet')]: tx.wallets?.name || t('settings.export.general', 'Umum'),
        [t('settings.export.category', 'Kategori')]: tx.categories?.name || t('settings.export.general', 'Umum'),
        [t('settings.export.note', 'Catatan')]: tx.note || '',
        [t('settings.export.tag', 'Tag')]: tx.tags?.join(', ') || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, t('settings.export.sheetName', 'Laporan Keuangan'));

      const colWidths = [
        { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, 
        { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 20 },
      ];
      worksheet['!cols'] = colWidths;

      const appName = appSettings?.app_name || 'FinanceApp';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${appName.replace(/\s+/g, '_')}_Buku_Besar_${timestamp}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast(t('settings.export.success', 'Buku besar berhasil diekspor ke Excel!'), 'success');

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings.export.failed', 'Gagal mengekspor file Excel.');
      toast(msg, 'danger');
    }
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fn = profile?.full_name || user?.user_metadata?.full_name || '';
    const em = profile?.email || user?.email || '';
    const av = profile?.avatar_url || user?.user_metadata?.avatar_url || '';
    Promise.resolve().then(() => {
      setFullName(fn);
      setEmail(em);
      setAvatarUrl(av);
    });
  }, [profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      fullName,
      email,
      password: password || undefined,
      avatarUrl
    });
    if (success && onClose) onClose();
  };

  return (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="w-full grid grid-cols-4 mb-6 p-1 bg-light-border/40 dark:bg-dark-border/40 rounded-xl">
        <TabsTrigger value="account" className="text-xs font-bold uppercase py-2">Akun</TabsTrigger>
        <TabsTrigger value="plan" className="text-xs font-bold uppercase py-2">Plan</TabsTrigger>
        <TabsTrigger value="preferences" className="text-xs font-bold uppercase py-2">Preferensi</TabsTrigger>
        <TabsTrigger value="data" className="text-xs font-bold uppercase py-2">Data</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit}>
        <TabsContent value="account" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Input
              label="Nama Pengguna"
              placeholder="Masukkan nama Anda"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={submitting}
            />
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Input
              label="Kata Sandi Baru"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              disabled={submitting}
              description="Kosongkan jika tidak ingin mengubah kata sandi."
            />
            <Input
              label="Konfirmasi Kata Sandi Baru"
              type="password"
              placeholder="••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="pt-4 border-t border-light-border/40 dark:border-dark-border/40">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3 block">
              Foto Profil
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg/50 dark:bg-dark-bg/25">
              <div className="w-16 h-16 rounded-2xl bg-light-border/40 flex items-center justify-center overflow-hidden shrink-0 border border-light-border/50">
                {avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-light-text-secondary" />
                )}
              </div>

              <div className="flex-1 w-full flex items-center gap-3">
                <Input
                  label=""
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="URL Avatar..."
                  disabled={submitting}
                  className="bg-transparent border-light-border/40"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={submitting}
                  className="shrink-0"
                >
                  Upload
                </Button>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-rose-500/20">
            <Button type="button" variant="ghost" className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 w-full flex gap-2">
              <Trash2 className="w-4 h-4" />
              Hapus Akun Permanen
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <SubscriptionStatus plan={profile?.plan} expiresAt={profile?.plan_expires_at} />
          {profile?.plan === 'free' && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs text-white mb-3">Upgrade ke Pro untuk fitur tanpa batas dan analisis lebih mendalam.</p>
              <Button type="button" variant="nexus-emerald" className="w-full">Upgrade ke Pro Sekarang</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">Mode Tampilan</span>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="capitalize font-bold cursor-pointer">
                {theme === 'light' ? 'Mode Terang' : 'Mode Gelap'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40">
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">Bahasa</span>
              </div>
              <span className="text-xs text-light-text-secondary">Bahasa Indonesia</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">Sinkronisasi Data</span>
              </div>
              <span className="text-xs text-emerald-500">2 min ago</span>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary uppercase tracking-wider flex items-center gap-2">
              Ekspor Data Keuangan
            </h4>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              Unduh seluruh transaksi akun Anda dalam format `.xlsx` (kategori, dompet, nominal, catatan).
            </p>
            <Button type="button" variant="outline" className="flex items-center gap-2 cursor-pointer w-full py-6 rounded-2xl border-white/5 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest" onClick={handleExcelExport}>
              <Download className="w-4 h-4 mr-2" />
              Ekspor Buku Besar ke Excel (.xlsx)
            </Button>
          </div>
        </TabsContent>

        <div className="flex justify-end gap-4 pt-8 border-t border-light-border/40 dark:border-dark-border/40 mt-8">
          {isModal && (
            <Button variant="outline" type="button" onClick={onClose} disabled={submitting} className="px-6 font-black uppercase tracking-widest text-[10px]">
              Batal
            </Button>
          )}
          <Button type="submit" variant="nexus-emerald" loading={submitting} className="px-6 font-black uppercase tracking-widest text-[10px]">
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Tabs>
  );
}

export function AccountSettings({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Akun & Aplikasi">
      <SettingsForm isModal={true} onClose={onClose} />
    </Modal>
  );
}
