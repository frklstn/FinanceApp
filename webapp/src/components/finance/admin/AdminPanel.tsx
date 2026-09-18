'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toast';
import { WhatsappContactForm } from '@/components/finance/admin/WhatsappContactForm';
import { Search, ShieldCheck, ShieldOff, Crown, Pencil, Users } from 'lucide-react';
import {
  listUsersAction,
  bulkUpdateStatusAction,
  setUserPlanAction,
  updateUserProfileAction,
  type AdminUser,
} from '@/app/actions/admin';

/**
 * Bagian admin di halaman Pengaturan.
 *
 * Sebelumnya halaman terpisah di /user/admin. Digabung ke Pengaturan supaya
 * tidak ada dua tempat berbeda untuk mengatur hal yang mirip.
 *
 * Pemanggil bertanggung jawab hanya merender ini untuk superadmin; penegakan
 * sebenarnya tetap di requireSuperAdmin() pada tiap server action.
 */
export function AdminPanel() {
  const { toast } = useToast();
  const { user, isLoading: appLoading } = useApp();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editPlanExpiresAt, setEditPlanExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setUsers(await listUsersAction());
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal memuat daftar pengguna', 'danger');
    }
  }, [toast]);

  useEffect(() => {
    if (appLoading) return;
    Promise.resolve().then(() => fetchUsers().finally(() => setLoading(false)));
  }, [appLoading, fetchUsers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.full_name || '').toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleToggleSuspend = async (target: AdminUser) => {
    setBusyId(target.id);
    try {
      await bulkUpdateStatusAction([target.id], !target.is_suspended);
      toast(target.is_suspended ? 'Akun diaktifkan kembali.' : 'Akun dinonaktifkan.', 'success');
      await fetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal mengubah status', 'danger');
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePlan = async (target: AdminUser) => {
    setBusyId(target.id);
    try {
      const next = target.plan === 'pro' ? 'free' : 'pro';
      await setUserPlanAction(target.id, next);
      toast(next === 'pro' ? 'Akun jadi PRO (30 hari).' : 'Akun kembali ke Free.', 'success');
      await fetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal mengubah paket', 'danger');
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (target: AdminUser) => {
    setEditingUser(target);
    setEditName(target.full_name || '');
    setEditAvatar(target.avatar_url || '');
    setEditPlanExpiresAt(target.plan_expires_at ? target.plan_expires_at.substring(0, 10) : '');
  };

  const handleSaveUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    try {
      await updateUserProfileAction(editingUser.id, {
        full_name: editName.trim() || null,
        avatar_url: editAvatar.trim() || null,
      });
      if (editPlanExpiresAt) {
        await setUserPlanAction(editingUser.id, editingUser.plan, new Date(editPlanExpiresAt).toISOString());
      }
      toast('Perubahan disimpan.', 'success');
      setEditingUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  if (appLoading || loading) {
    return <div className="h-64 rounded-2xl bg-surface animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-text-primary">Admin</h3>
        <p className="text-xs text-text-muted">{users.length} akun terdaftar</p>
      </div>

      <WhatsappContactForm />

      <Card className="gap-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-heading text-sm font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Pengguna
          </h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <Input
              placeholder="Cari email, username, nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border-line pl-11 py-2.5 h-auto text-sm"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="py-12 text-center text-xs text-text-muted">
            Tidak ada pengguna yang cocok.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((u) => {
              const isSelf = u.id === user?.id;
              return (
                <div key={u.id} className="flex items-center gap-3 py-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {u.full_name || u.email}
                      </span>
                      {u.is_admin && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-glow text-primary border border-primary-border">
                          superadmin
                        </span>
                      )}
                      {u.plan === 'pro' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          PRO
                        </span>
                      )}
                      {u.is_suspended && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          nonaktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted truncate">
                      {u.email}{u.username ? ` · @${u.username}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={busyId === u.id}
                      onClick={() => handleTogglePlan(u)}
                      title={u.plan === 'pro' ? 'Turunkan ke Free' : 'Naikkan ke PRO'}
                    >
                      <Crown className={`w-3.5 h-3.5 ${u.plan === 'pro' ? 'text-amber-500' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      loading={busyId === u.id}
                      // Menonaktifkan diri sendiri mengunci akses admin secara permanen.
                      disabled={isSelf && !u.is_suspended}
                      onClick={() => handleToggleSuspend(u)}
                      title={isSelf && !u.is_suspended ? 'Tidak bisa menonaktifkan akun sendiri' : undefined}
                    >
                      {u.is_suspended
                        ? <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        : <ShieldOff className="w-3.5 h-3.5 text-rose-400" />}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Ubah: ${editingUser?.email ?? ''}`}>
        <form onSubmit={handleSaveUserDetails} className="space-y-4">
          <Input label="Nama lengkap" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Input label="URL avatar" value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} />


          <DatePicker label="Masa aktif PRO sampai" value={editPlanExpiresAt} onChange={setEditPlanExpiresAt} />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setEditingUser(null)}>Batal</Button>
            <Button type="submit" variant="primary" loading={submitting} className="flex-1">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
