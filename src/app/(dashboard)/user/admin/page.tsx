/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app-context';
import { PageHeader } from '@/components/shared/layout/page-header';
import { GlobalBrandingForm } from '@/components/finance/admin/GlobalBrandingForm';
import { WhatsappContactForm } from '@/components/finance/admin/WhatsappContactForm';
import { adminService } from '@/lib/services/user/admin.service';
import {
  Search,
  User,
  Settings,
  Ban,
  Edit2,
  Lock,
  Unlock,
  Zap,
} from 'lucide-react';

interface ProfileUser {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  created_at: string;
  plan: 'free' | 'pro';
  app_name: string | null;
  app_icon_url: string | null;
  app_title: string | null;
  plan_expires_at?: string | null;
}

export default function AdminPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const { user, isSuperAdmin, isLoading: appLoading } = useApp();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Konfirmasi untuk aksi konsekuensial (suspend, ganti plan) yang sebelumnya
  // langsung tereksekusi hanya dari satu klik ikon ke akun orang lain.
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    tone: 'danger' | 'primary';
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const [editingUser, setEditingUser] = useState<ProfileUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editAppName, setEditAppName] = useState('');
  const [editAppIconUrl, setEditAppIconUrl] = useState('');
  const [editAppTitle, setEditAppTitle] = useState('');
  const [editPlanExpiresAt, setEditPlanExpiresAt] = useState('');

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_suspended, created_at, plan, app_name, app_icon_url, app_title, plan_expires_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((profiles as ProfileUser[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar pengguna';
      toast(msg, 'danger');
    }
  }, [supabase, toast]);

  useEffect(() => {
    if (appLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isSuperAdmin) {
      toast('Akses ditolak: hanya superadmin.', 'danger');
      router.replace('/finance/dashboard');
      return;
    }

    Promise.resolve().then(() => fetchAllUsers().finally(() => setLoading(false)));
  }, [appLoading, user, isSuperAdmin, router, toast, fetchAllUsers]);

  // Toggle user suspension
  const handleToggleSuspend = async (userId: string, currentSuspendedState: boolean) => {
    // Menonaktifkan akun sendiri = terkunci permanen: middleware mengalihkan
    // semua path terproteksi (termasuk /user/admin) ke /suspended, jadi tidak
    // ada jalan mengaktifkannya kembali lewat UI -- hanya lewat SQL.
    if (userId === user?.id && !currentSuspendedState) {
      toast('Tidak bisa menonaktifkan akun sendiri: kamu akan terkunci dari panel ini.', 'warning');
      return;
    }
    setUpdatingUserId(userId);
    try {
      await adminService.bulkUpdateStatus([userId], !currentSuspendedState);
      
      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_suspended: !currentSuspendedState } : u))
      );

      toast(
        `Akun berhasil ${!currentSuspendedState ? 'dinonaktifkan' : 'diaktifkan'}!`,
        !currentSuspendedState ? 'warning' : 'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Aksi gagal';
      toast(msg, 'danger');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleBulkSuspend = async (isSuspended: boolean) => {
    // Alasan sama seperti handleToggleSuspend: "pilih semua" ikut menyeret akun
    // sendiri, jadi dikeluarkan sebelum aksi massal dijalankan.
    const ids = Array.from(selectedUserIds).filter((id) => !(isSuspended && id === user?.id));
    if (ids.length === 0) {
      toast('Tidak ada akun yang bisa diproses (akun sendiri dilewati).', 'warning');
      return;
    }
    setUpdatingUserId('bulk');
    try {
      await adminService.bulkUpdateStatus(ids, isSuspended);
      setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, is_suspended: isSuspended } : u));
      setSelectedUserIds(new Set());
      toast(`Berhasil ${isSuspended ? 'menonaktifkan' : 'mengaktifkan'} ${ids.length} pengguna`, 'success');
    } catch {
      toast('Gagal melakukan aksi massal', 'danger');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Toggle user plan
  const handleTogglePlan = async (userId: string, currentPlan: 'free' | 'pro') => {
    setUpdatingUserId(userId);
    try {
      const newPlan = currentPlan === 'pro' ? 'free' : 'pro';
      await adminService.setUserPlan(userId, newPlan);

      const newExpiresAt = newPlan === 'pro'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan, plan_expires_at: newExpiresAt } : u))
      );

      toast(`Plan berhasil diubah ke ${newPlan.toUpperCase()}!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Aksi gagal';
      toast(msg, 'danger');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Open edit modal
  const openEditModal = (profile: ProfileUser) => {
    setEditingUser(profile);
    setEditName(profile.full_name || '');
    setEditAvatar(profile.avatar_url || '');
    setEditAppName(profile.app_name || '');
    setEditAppIconUrl(profile.app_icon_url || '');
    setEditAppTitle(profile.app_title || '');
    setEditPlanExpiresAt(profile.plan_expires_at ? profile.plan_expires_at.split('T')[0] : '');
  };

  // Save edited details
  const handleSaveUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdatingUserId(editingUser.id);
    try {
      const formattedExpiresAt = editPlanExpiresAt ? new Date(editPlanExpiresAt).toISOString() : null;
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          avatar_url: editAvatar,
          plan_expires_at: formattedExpiresAt,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await adminService.setUserBranding(editingUser.id, {
        app_name: editAppName.trim() || null,
        app_icon_url: editAppIconUrl.trim() || null,
        app_title: editAppTitle.trim() || null,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                full_name: editName,
                avatar_url: editAvatar,
                plan_expires_at: formattedExpiresAt,
                app_name: editAppName.trim() || null,
                app_icon_url: editAppIconUrl.trim() || null,
                app_title: editAppTitle.trim() || null,
              }
            : u
        )
      );

      toast('Profil pengguna diperbarui.', 'success');
      setEditingUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui pengguna';
      toast(msg, 'danger');
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Filter users based on query
  const filteredUsers = users.filter((u) => {
    const name = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-16 w-1/3 rounded-xl shimmer" />
        <div className="h-96 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen"
        accent="Pengguna"
        subtitle="Kelola profil, plan, dan status akun seluruh pengguna."
        actions={
          <div className="relative w-full md:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nexus-text-muted)]" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-primary)] outline-none focus:border-[var(--nexus-emerald-border)] transition-colors"
            />
          </div>
        }
      />

      {/* Baris pilih-semua + aksi massal. Muncul hanya saat ada pilihan supaya
          tidak menambah kebisingan saat tidak dipakai. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-sm text-[var(--nexus-text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--nexus-emerald)]"
            checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
            onChange={(e) => {
              if (e.target.checked) setSelectedUserIds(new Set(filteredUsers.map((u) => u.id)));
              else setSelectedUserIds(new Set());
            }}
          />
          {selectedUserIds.size > 0
            ? `${selectedUserIds.size} dipilih`
            : `${filteredUsers.length} pengguna`}
        </label>

        {selectedUserIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="destructive" loading={updatingUserId === 'bulk'} onClick={() => setConfirm({
              title: 'Nonaktifkan massal',
              message: `Nonaktifkan ${selectedUserIds.size} akun terpilih? Akun sendiri akan dilewati.`,
              tone: 'danger',
              confirmLabel: 'Nonaktifkan',
              onConfirm: () => handleBulkSuspend(true),
            })}>Nonaktifkan</Button>
            <Button size="sm" variant="outline" loading={updatingUserId === 'bulk'} onClick={() => handleBulkSuspend(false)}>Aktifkan</Button>
          </div>
        )}
      </div>

      {/* Daftar pengguna sebagai kartu, bukan tabel lebar. Tabel sebelumnya
          mendorong kolom Plan/Status/Aksi keluar layar di hp dan memaksa scroll
          horizontal; kartu menumpuk rapi di lebar berapa pun. */}
      {filteredUsers.length === 0 ? (
        <Card className="py-12 text-center text-sm text-[var(--nexus-text-secondary)]">
          Tidak ada pengguna yang cocok dengan pencarian.
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isSelf = u.id === user?.id;
            const selected = selectedUserIds.has(u.id);
            const busy = updatingUserId === u.id;
            return (
              <div
                key={u.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  selected ? 'border-[var(--nexus-emerald-border)]' : 'border-[var(--nexus-glass-border)]'
                } ${u.is_suspended ? 'bg-danger/5' : 'bg-[var(--nexus-bg-card)]'}`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 accent-[var(--nexus-emerald)] shrink-0"
                    checked={selected}
                    onChange={() => {
                      const next = new Set(selectedUserIds);
                      if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                      setSelectedUserIds(next);
                    }}
                  />

                  <div className="w-10 h-10 rounded-full border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] overflow-hidden flex items-center justify-center shrink-0">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.full_name || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <User className="w-4 h-4 text-[var(--nexus-text-muted)]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--nexus-text-primary)] truncate">
                        {u.full_name || 'Tanpa nama'}
                      </p>
                      {isSelf && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)]">kamu</span>
                      )}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        u.plan === 'pro'
                          ? 'bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)]'
                          : 'bg-[var(--nexus-bg-panel)] text-[var(--nexus-text-muted)]'
                      }`}>
                        {u.plan}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.is_suspended ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                      }`}>
                        {u.is_suspended ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {u.is_suspended ? 'Nonaktif' : 'Aktif'}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--nexus-text-secondary)] truncate">{u.email || 'Tanpa email'}</p>
                    <p className="text-xs text-[var(--nexus-text-muted)] mt-0.5">
                      Terdaftar {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {u.plan === 'pro' && u.plan_expires_at && ` · Berakhir ${new Date(u.plan_expires_at).toLocaleDateString('id-ID')}`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirm({
                      title: u.plan === 'pro' ? 'Turunkan ke Free' : 'Upgrade ke Pro',
                      message: `Ubah plan ${u.full_name || u.email || u.id.slice(0, 8)} menjadi ${u.plan === 'pro' ? 'Free' : 'Pro'}?`,
                      tone: 'primary',
                      confirmLabel: u.plan === 'pro' ? 'Turunkan' : 'Upgrade',
                      onConfirm: () => handleTogglePlan(u.id, u.plan),
                    })}
                  >
                    <Zap className="w-3.5 h-3.5" /> {u.plan === 'pro' ? 'Turunkan' : 'Upgrade'}
                  </Button>
                  <Button
                    size="sm"
                    variant={u.is_suspended ? 'outline' : 'destructive'}
                    disabled={busy || (isSelf && !u.is_suspended)}
                    title={isSelf && !u.is_suspended ? 'Tidak bisa menonaktifkan akun sendiri' : undefined}
                    onClick={() => setConfirm({
                      title: u.is_suspended ? 'Aktifkan akun' : 'Nonaktifkan akun',
                      message: `${u.is_suspended ? 'Aktifkan kembali' : 'Nonaktifkan'} akun ${u.full_name || u.email || u.id.slice(0, 8)}?`,
                      tone: u.is_suspended ? 'primary' : 'danger',
                      confirmLabel: u.is_suspended ? 'Aktifkan' : 'Nonaktifkan',
                      onConfirm: () => handleToggleSuspend(u.id, u.is_suspended),
                    })}
                  >
                    <Ban className="w-3.5 h-3.5" /> {u.is_suspended ? 'Aktifkan' : 'Nonaktifkan'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Konfigurasi aplikasi -- terpisah dari manajemen pengguna supaya panel
          tidak terasa mencampur dua hal yang berbeda. */}
      <div className="pt-4 space-y-4 border-t border-[var(--nexus-glass-border)]">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight text-[var(--nexus-text-primary)]">Konfigurasi aplikasi</h2>
          <p className="text-xs text-[var(--nexus-text-secondary)]">Branding global dan kontak upgrade yang berlaku untuk semua pengguna.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlobalBrandingForm />
          <WhatsappContactForm />
        </div>
      </div>

      {/* Dialog konfirmasi aksi konsekuensial */}
      {confirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setConfirm(null)}>
          <Card className="w-full max-w-sm space-y-5 shadow-2xl animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1.5">
              <h3 className="font-heading text-base font-semibold tracking-tight text-[var(--nexus-text-primary)]">
                {confirm.title}
              </h3>
              <p className="text-sm text-[var(--nexus-text-secondary)]">{confirm.message}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirm(null)}>Batal</Button>
              <Button
                variant={confirm.tone === 'danger' ? 'destructive' : 'nexus-emerald'}
                onClick={() => { confirm.onConfirm(); setConfirm(null); }}
              >
                {confirm.confirmLabel}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit User Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md space-y-6 shadow-2xl border border-light-border/40 dark:border-dark-border/40 bg-light-card dark:bg-dark-card animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-light-border/40 dark:border-dark-border/40">
              <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-primary" />
                Edit Detail Pengguna
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary font-bold cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUserDetails} className="space-y-4">
              <Input
                label="Nama Lengkap"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <Input
                  label="URL Avatar"
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                {editAvatar && (
                  <div className="flex items-center gap-2.5 pt-2">
                    <span className="text-[10px] text-light-text-secondary">Preview:</span>
                    <div className="w-8 h-8 rounded-full border border-light-border/40 dark:border-dark-border/40 bg-light-bg dark:bg-dark-bg overflow-hidden flex items-center justify-center">
                      <img
                        src={editAvatar}
                        alt="Logo preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Nama App (Kustom)"
                value={editAppName}
                onChange={(e) => setEditAppName(e.target.value)}
                placeholder="Nama kustom untuk FinanceApp"
              />

              <div className="space-y-1.5">
                <Input
                  label="URL Icon App"
                  value={editAppIconUrl}
                  onChange={(e) => setEditAppIconUrl(e.target.value)}
                  placeholder="https://example.com/icon.png"
                />
                {editAppIconUrl && (
                  <div className="flex items-center gap-2.5 pt-2">
                    <span className="text-[10px] text-light-text-secondary">Preview:</span>
                    <div className="w-8 h-8 rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-bg dark:bg-dark-bg overflow-hidden flex items-center justify-center p-1">
                      <img
                        src={editAppIconUrl}
                        alt="Icon preview"
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Judul Tab (Kustom)"
                value={editAppTitle}
                onChange={(e) => setEditAppTitle(e.target.value)}
                placeholder="Judul tab kustom browser"
              />

              <Input
                label="Periode Langganan Berakhir (Expires At)"
                type="date"
                value={editPlanExpiresAt}
                onChange={(e) => setEditPlanExpiresAt(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-light-border/40 dark:border-dark-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  disabled={updatingUserId !== null}
                >
                  Batal
                </Button>
                <Button type="submit" loading={updatingUserId !== null}>
                  Simpan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
