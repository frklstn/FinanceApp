'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/contexts/app-context';
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass } from '@/components/auth/auth-shell';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { t } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMsg(t('auth.register.errorFieldsRequired', 'Semua kolom wajib diisi.'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t('auth.register.errorPasswordMin', 'Password minimal 6 karakter.'));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.register.errorConfirmMismatch', 'Konfirmasi password tidak cocok.'));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        const isSessionActive = data.session !== null;
        if (isSessionActive) {
          setSuccessMsg(t('auth.register.successInitializing', 'Akun berhasil dibuat. Mengalihkan...'));
          setTimeout(() => {
            router.push('/finance/dashboard');
            router.refresh();
          }, 1500);
        } else {
          setSuccessMsg(t('auth.register.successVerification', 'Akun terdaftar. Cek email untuk verifikasi.'));
          setFullName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.register.errorGeneric', 'Terjadi kesalahan, coba lagi.');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      topRight={
        <Link href="/login" className="hover:underline">
          Sudah punya akun? Masuk
        </Link>
      }
    >
      {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}
      {successMsg && <AuthAlert tone="success">{successMsg}</AuthAlert>}

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
            placeholder="Kata sandi (min. 6 karakter)"
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
          className="w-full rounded-xl bg-[#1b1815] py-3 text-sm font-medium text-[#f6f2ea] transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#f3ede3] dark:text-[#15130f]"
        >
          {loading ? t('auth.register.loadingButton', 'Membuat akun...') : t('auth.register.submitButton', 'Buat akun')}
        </button>
      </form>
    </AuthShell>
  );
}
