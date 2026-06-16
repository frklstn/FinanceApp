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
import { GlobalBrandingForm } from '@/components/admin/GlobalBrandingForm';
import { WhatsappContactForm } from '@/components/admin/WhatsappContactForm';
import { adminService } from '@/lib/services/admin.service';
import {
  ShieldAlert,
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
}

export default function AdminPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const { user, isSuperAdmin, isLoading: appLoading } = useApp();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<ProfileUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editAppName, setEditAppName] = useState('');
  const [editAppIconUrl, setEditAppIconUrl] = useState('');
  const [editAppTitle, setEditAppTitle] = useState('');

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, is_suspended, created_at, plan, app_name, app_icon_url, app_title')
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
      router.replace('/dashboard');
      return;
    }

    Promise.resolve().then(() => fetchAllUsers().finally(() => setLoading(false)));
  }, [appLoading, user, isSuperAdmin, router, toast, fetchAllUsers]);

  // Toggle user suspension
  const handleToggleSuspend = async (userId: string, currentSuspendedState: boolean) => {
    setUpdatingUserId(userId);
    try {
      const newState = !currentSuspendedState;
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: newState })
        .eq('id', userId);

      if (error) throw error;

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_suspended: newState } : u))
      );

      toast(
        `Akun berhasil ${newState ? 'dinonaktifkan' : 'diaktifkan'}!`,
        newState ? 'warning' : 'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Aksi gagal';
      toast(msg, 'danger');
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

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
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
  };

  // Save edited details
  const handleSaveUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUpdatingUserId(editingUser.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          avatar_url: editAvatar,
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
      <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
        <div className="h-16 w-1/3 rounded-xl shimmer" />
        <div className="h-96 rounded-2xl border border-light-border dark:border-dark-border shimmer" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text-primary dark:text-dark-text-primary flex items-center gap-2">
            <ShieldAlert className="w-5.5 h-5.5 text-danger animate-pulse" />
            Panel Manajemen Pengguna
          </h2>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
            Portal admin untuk mengelola profil pengguna, mengganti avatar, dan menonaktifkan akun.
          </p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-light-text-secondary dark:text-dark-text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-xl border border-light-border/40 dark:border-dark-border/40 bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-150"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlobalBrandingForm />
        <WhatsappContactForm />
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden border border-light-border/40 dark:border-dark-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-light-border/40 dark:border-dark-border/40 bg-light-bg/30 dark:bg-dark-bg/20 text-[10px] font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
                <th className="px-5 py-3">Profil Pengguna</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Terdaftar</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status Akun</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-light-border/30 dark:divide-dark-border/30 text-xs font-semibold">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-light-text-secondary dark:text-dark-text-secondary font-medium">
                    Tidak ada pengguna yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`hover:bg-light-bg/20 dark:hover:bg-dark-bg/10 transition-colors duration-150 ${
                      u.is_suspended ? 'opacity-70 bg-danger/5 dark:bg-danger/10' : ''
                    }`}
                  >
                    {/* User Profile */}
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <div className="relative w-9 h-9 rounded-full border border-light-border/40 dark:border-dark-border/40 bg-light-bg dark:bg-dark-bg overflow-hidden flex items-center justify-center shrink-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.full_name || 'User'}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <User className="w-4 h-4 text-light-text-secondary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-light-text-primary dark:text-dark-text-primary truncate">
                          {u.full_name || 'Unnamed User'}
                        </p>
                        <p className="text-[10px] text-light-text-secondary dark:text-dark-text-secondary font-medium mt-0.5">
                          ID: {u.id.slice(0, 8)}...
                        </p>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5 text-light-text-primary dark:text-dark-text-primary font-medium">
                      {u.email || 'No email set'}
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-[11px] text-light-text-secondary dark:text-dark-text-secondary font-medium">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.plan === 'pro'
                            ? 'bg-primary/15 text-primary border border-primary/20'
                            : 'bg-light-text-secondary/15 text-light-text-secondary dark:bg-dark-text-secondary/15 dark:text-dark-text-secondary border border-light-border/40'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>

                    {/* Suspend Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.is_suspended
                            ? 'bg-danger/15 text-danger border border-danger/20'
                            : 'bg-success/15 text-success border border-success/20'
                        }`}
                      >
                        {u.is_suspended ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {u.is_suspended ? 'NONAKTIF' : 'AKTIF'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-light-border/40 dark:border-dark-border/40 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 cursor-pointer"
                        title="Edit profil pengguna"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleTogglePlan(u.id, u.plan)}
                        disabled={updatingUserId === u.id}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-light-border/40 dark:border-dark-border/40 text-light-text-secondary dark:text-dark-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-150 cursor-pointer"
                        title={u.plan === 'pro' ? 'Turunkan ke Free' : 'Upgrade ke Pro'}
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleSuspend(u.id, u.is_suspended)}
                        disabled={updatingUserId === u.id}
                        className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                          u.is_suspended
                            ? 'border-success/30 text-success hover:bg-success/5 hover:border-success'
                            : 'border-danger/30 text-danger hover:bg-danger/5 hover:border-danger'
                        }`}
                        title={u.is_suspended ? 'Aktifkan akun' : 'Nonaktifkan akun'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal Overlay */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md p-6 space-y-6 shadow-2xl border border-light-border/40 dark:border-dark-border/40 bg-light-card dark:bg-dark-card animate-scale-up">
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
