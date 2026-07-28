'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { register } from './actions';
import { useApp } from '@/contexts/app-context';
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass, authButtonClass } from '@/components/auth/auth-shell';

export default function RegisterPage() {
  const { t } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg(t('auth.register.errorFieldsRequired', 'Semua kolom wajib diisi.'));
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMsg(t('auth.register.errorPasswordMin', 'Password minimal 8 karakter.'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.register.errorConfirmMismatch', 'Konfirmasi password tidak cocok.'));
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.set('email', email);
      formData.set('password', password);
      formData.set('fullName', fullName);

      // Sukses berakhir dengan redirect() di server, jadi tidak ada yang kembali.
      // Nilai balik hanya muncul kalau gagal.
      const result = await register(null, formData);
      if (result?.error) setErrorMsg(result.error);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.register.errorGeneric', 'Terjadi kesalahan, coba lagi.');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}

      <form onSubmit={handleRegister} className="space-y-3">
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('auth.register.fullNamePlaceholder', 'Nama lengkap')}
            disabled={loading}
            className={`${authInputClass} pl-11 pr-4`}
          />
        </div>

        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            disabled={loading}
            className={`${authInputClass} pl-11 pr-4`}
          />
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata sandi (min. 8 karakter)"
            disabled={loading}
            className={`${authInputClass} pl-11 pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1b1815]/35 hover:text-[#1b1815]/70 dark:text-[#f3ede3]/35 dark:hover:text-[#f3ede3]/70"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi kata sandi"
            disabled={loading}
            className={`${authInputClass} pl-11 pr-4`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={authButtonClass}
        >
          {loading ? t('auth.register.loadingButton', 'Membuat akun...') : t('auth.register.submitButton', 'Buat akun')}
        </button>

        <p className="pt-1 text-xs text-[#1b1815]/50 dark:text-[#f3ede3]/50">
          Sudah punya akun?{' '}
          <Link href="/login" className="underline hover:no-underline">
            Masuk
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
