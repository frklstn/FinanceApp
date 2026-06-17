'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { User, ShieldAlert } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { name: 'Trader Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
  { name: 'Gold Investor', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack' },
  { name: 'Fintech Guru', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=Finance' },
  { name: 'Wealth Star', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Wealth' },
  { name: 'Crypto Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Trader' },
];

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, profile, refreshSession } = useApp();
  const { toast } = useToast();
  const supabase = createClient();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize fields on open
  useEffect(() => {
    if (isOpen) {
      const initFields = () => {
        setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
        setEmail(profile?.email || user?.email || '');
        setAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
        setPassword('');
        setConfirmPassword('');
      };
      
      initFields();
    }
  }, [isOpen, profile, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      toast('Konfirmasi kata sandi tidak cocok.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Pengguna tidak terotentikasi');

      // 1. Update auth user data (email/password/metadata)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateAuthData: any = {
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      };

      if (email && email !== currentUser.email) {
        updateAuthData.email = email;
      }
      if (password) {
        updateAuthData.password = password;
      }

      const { error: authError } = await supabase.auth.updateUser(updateAuthData);
      if (authError) throw authError;

      // 2. Update profiles table row
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      // 3. Refresh layout session context
      await refreshSession();

      let successMsg = 'Profil berhasil diperbarui!';
      if (email && email !== currentUser.email) {
        successMsg += ' Tautan verifikasi email telah dikirim ke alamat baru Anda.';
      }
      toast(successMsg, 'success');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      toast(msg, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Preferensi Akun & Profil">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info & Warning */}
        <div className="flex gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 items-start text-xs text-white/50 leading-relaxed uppercase">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-white mb-0.5">Catatan Keamanan</p>
            <p>Perubahan email membutuhkan konfirmasi link verifikasi. Sandi minimal berisi 6 karakter. Kosongkan sandi jika tidak ingin diubah.</p>
          </div>
        </div>

        {/* Input fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Avatar Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="text-xs font-bold uppercase tracking-wider text-[#A7B0D1]">
            Avatar / Foto Profil
          </label>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border border-white/5 bg-[#0a0a0c]/40">
            <div className="relative w-20 h-20 rounded-full border-2 border-emerald-500/30 bg-[#0A1028]/50 flex items-center justify-center overflow-hidden shadow-md shrink-0">
              {avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarUrl} alt="Preview Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white/40" />
              )}
            </div>

            <div className="flex-1 w-full space-y-3">
              <Input
                label="URL Avatar Kustom"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                disabled={submitting}
                description="Tempel tautan gambar, atau gunakan salah satu preset di bawah."
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              Pilih Preset Avatar:
            </p>
            <div className="grid grid-cols-5 gap-3 max-w-md">
              {PRESET_AVATARS.map((av) => (
                <button
                  key={av.name}
                  type="button"
                  onClick={() => setAvatarUrl(av.url)}
                  className={`relative aspect-square rounded-xl border flex items-center justify-center p-1.5 transition-all duration-150 cursor-pointer ${
                    avatarUrl === av.url
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-white/5 hover:border-emerald-500/40 hover:bg-white/5'
                  }`}
                  title={av.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={av.url} alt={av.name} className="w-full h-full object-contain" />
                  {avatarUrl === av.url && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-extrabold shadow-sm border border-[#0a0a0c]">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" variant="nexus-emerald" loading={submitting}>
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
