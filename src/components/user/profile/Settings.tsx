'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useApp } from '@/contexts/app-context';
import { User, Monitor, Languages, Download, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { SubscriptionStatus } from '../subscription/subscription-status';
import { useUser } from '@/lib/hooks/use-user';
import { profileService } from '@/lib/services/user/user.service';
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
  const { updateProfile, updateLanguage, resetData, deleteAccount, submitting } = useUser();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  // Zona berbahaya: kata konfirmasi harus diketik ulang persis sebelum aksi
  // destruktif aktif. 'reset' mengosongkan data, 'delete' menghapus akun.
  const [tab, setTab] = useState('account');
  const [danger, setDanger] = useState<null | 'reset' | 'delete'>(null);
  const [confirmText, setConfirmText] = useState('');
  const dangerWord = danger === 'delete' ? 'HAPUS' : 'RESET';

  const handleReset = async () => {
    const ok = await resetData();
    if (ok) {
      setDanger(null);
      setConfirmText('');
      router.refresh();
      window.location.href = '/finance/dashboard';
    }
  };

  const handleDelete = async () => {
    const ok = await deleteAccount();
    if (ok) window.location.href = '/';
  };

  const handleToggleLanguage = () => updateLanguage(profile?.language === 'en' ? 'id' : 'en');

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
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  // Upgrade ke Pro lewat kontak admin (WhatsApp), sama seperti UpgradeGate --
  // tombol ini sebelumnya tanpa onClick sehingga tidak melakukan apa pun.
  useEffect(() => {
    if (profile?.plan !== 'free') return;
    let batal = false;
    profileService.getWhatsappContact()
      .then((link) => { if (!batal) setWhatsappLink(link); })
      .catch(() => {});
    return () => { batal = true; };
  }, [profile?.plan]);

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
    // Konfirmasi sandi sebelumnya tidak pernah dicek: pengguna bisa mengetik
    // sandi baru yang berbeda dari konfirmasinya dan diam-diam tersimpan.
    if (password && password !== confirmPassword) {
      toast(t('settings.password.mismatch', 'Konfirmasi kata sandi tidak cocok.'), 'danger');
      return;
    }
    const success = await updateProfile({
      fullName,
      email,
      password: password || undefined,
      avatarUrl
    });
    if (success) {
      setPassword('');
      setConfirmPassword('');
      if (onClose) onClose();
    }
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as string)} className="w-full">
      <TabsList className="w-full grid grid-cols-4 mb-6 rounded-xl bg-[var(--nexus-bg-panel)]">
        <TabsTrigger value="account" className="py-2">Akun</TabsTrigger>
        <TabsTrigger value="plan" className="py-2">Plan</TabsTrigger>
        <TabsTrigger value="preferences" className="py-2">Preferensi</TabsTrigger>
        <TabsTrigger value="data" className="py-2">Data</TabsTrigger>
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
            <label className="text-sm font-semibold text-[var(--nexus-text-primary)] mb-3 block">
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

              <div className="flex-1 w-full">
                <Input
                  label=""
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="Tempel URL gambar avatar..."
                  disabled={submitting}
                  className="bg-transparent border-light-border/40"
                />
              </div>
            </div>
          </div>
          
        </TabsContent>

        <TabsContent value="plan" className="space-y-6">
          <SubscriptionStatus plan={profile?.plan} expiresAt={profile?.plan_expires_at} />
          {profile?.plan === 'free' && (
            <div className="p-4 rounded-xl border border-[var(--nexus-emerald-border)] bg-[var(--nexus-emerald-glow)]">
              <p className="text-xs text-[var(--nexus-text-primary)] mb-3">Upgrade ke Pro untuk fitur tanpa batas dan analisis lebih mendalam.</p>
              {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block">
                  <Button type="button" variant="nexus-emerald" className="w-full">Hubungi admin untuk upgrade</Button>
                </a>
              ) : (
                <Button type="button" variant="nexus-emerald" className="w-full" disabled>Memuat kontak admin...</Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40">
              <div className="flex items-center gap-3">
                <Monitor className="w-4 h-4 text-[var(--nexus-emerald)]" />
                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">Mode Tampilan</span>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="capitalize font-bold cursor-pointer">
                {theme === 'light' ? 'Mode Terang' : 'Mode Gelap'}
              </Button>
            </div>

            {/* Sebelumnya baris ini hanya label statis bertuliskan "Bahasa
                Indonesia" padahal kolom profiles.language bisa bernilai 'en',
                dan tidak ada cara mengubahnya dari UI. */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-light-border/40 dark:border-dark-border/40">
              <div className="flex items-center gap-3">
                <Languages className="w-4 h-4 text-[var(--nexus-emerald)]" />
                <span className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">Bahasa</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                loading={submitting}
                className="font-bold cursor-pointer"
                onClick={handleToggleLanguage}
              >
                {profile?.language === 'en' ? 'English' : 'Bahasa Indonesia'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
              Ekspor Data Keuangan
            </h4>
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">
              Unduh seluruh transaksi akun Anda dalam format `.xlsx` (kategori, dompet, nominal, catatan).
            </p>
            <Button type="button" variant="outline" className="flex items-center justify-center gap-2 cursor-pointer w-full border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)]" onClick={handleExcelExport}>
              <Download className="w-4 h-4" />
              Ekspor ke Excel (.xlsx)
            </Button>
          </div>

          {/* Zona berbahaya */}
          <div className="pt-4 border-t border-danger/20 space-y-3">
            <h4 className="text-sm font-semibold text-danger flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Zona Berbahaya
            </h4>

            <div className="flex flex-col gap-3 rounded-2xl border border-danger/20 bg-danger/[0.04] p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--nexus-text-primary)]">Reset data</p>
                  <p className="text-xs text-[var(--nexus-text-secondary)]">Kosongkan semua transaksi, dompet, dan catatan. Akun tetap ada, mulai dari nol.</p>
                </div>
                <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={() => { setDanger('reset'); setConfirmText(''); }}>
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-danger/15">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-danger">Hapus akun</p>
                  <p className="text-xs text-[var(--nexus-text-secondary)]">Menghapus akun dan seluruh data secara permanen. Tidak bisa dibatalkan.</p>
                </div>
                <Button type="button" variant="destructive" className="shrink-0 gap-2" onClick={() => { setDanger('delete'); setConfirmText(''); }}>
                  <Trash2 className="w-4 h-4" /> Hapus akun
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Footer simpan hanya relevan untuk tab Akun; Preferensi & Data
            menyimpan aksinya masing-masing secara langsung. */}
        {tab === 'account' && (
          <div className="flex justify-end gap-4 pt-8 border-t border-[var(--nexus-glass-border)] mt-8">
            {isModal && (
              <Button variant="outline" type="button" onClick={onClose} disabled={submitting} className="px-6">
                Batal
              </Button>
            )}
            <Button type="submit" variant="nexus-emerald" loading={submitting} className="px-6">
              Simpan Perubahan
            </Button>
          </div>
        )}
      </form>

      {danger && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => { setDanger(null); setConfirmText(''); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-card)] p-6 space-y-4 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-semibold tracking-tight text-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {danger === 'delete' ? 'Hapus akun permanen' : 'Reset semua data'}
              </h3>
              <p className="text-sm text-[var(--nexus-text-secondary)]">
                {danger === 'delete'
                  ? 'Akun dan seluruh data akan dihapus permanen dan tidak bisa dipulihkan.'
                  : 'Semua transaksi, dompet, dan catatan akan dikosongkan. Akun tetap ada.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[var(--nexus-text-secondary)]">
                Ketik <span className="font-semibold text-[var(--nexus-text-primary)]">{dangerWord}</span> untuk konfirmasi
              </label>
              <Input
                label=""
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={dangerWord}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setDanger(null); setConfirmText(''); }} disabled={submitting}>
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                loading={submitting}
                disabled={confirmText.trim().toUpperCase() !== dangerWord}
                onClick={danger === 'delete' ? handleDelete : handleReset}
              >
                {danger === 'delete' ? 'Hapus akun' : 'Reset data'}
              </Button>
            </div>
          </div>
        </div>
      )}
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
