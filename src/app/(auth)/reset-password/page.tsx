'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass, authButtonClass } from '@/components/auth/auth-shell';
import { resetPasswordAction } from '@/app/actions/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 8) {
      setErrorMsg('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const result = await resetPasswordAction(token, password);

      if (!result.ok) {
        setErrorMsg(result.error);
      } else {
        // Diarahkan ke halaman masuk, bukan dashboard: mengganti kata sandi tidak
        // membuat sesi. Sebelumnya langsung ke dashboard padahal tidak login.
        setSuccessMsg('Kata sandi berhasil diperbarui. Silakan masuk kembali.');
        setTimeout(() => router.replace('/login'), 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak terduga.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Tanpa token tidak ada yang bisa dikerjakan. Form sengaja tidak ditampilkan
  // supaya tidak terlihat seolah kata sandi bisa diganti dari halaman ini begitu saja.
  if (!token) {
    return (
      <AuthShell>
        <AuthAlert tone="error">
          Tautan pemulihan tidak lengkap. Buka halaman ini lewat tautan yang kamu terima.
        </AuthAlert>
        <Link href="/login" className="text-xs text-[#1b1815]/55 hover:underline dark:text-[#f3ede3]/55">
          Kembali ke halaman masuk
        </Link>
      </AuthShell>
    );
  }

  // strength: 0-4 dari panjang & keragaman karakter
  const strength =
    (password.length >= 8 ? 1 : 0) +
    (password.length >= 12 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9!@#$%^&*]/.test(password) ? 1 : 0);
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

  return (
    <AuthShell>
      {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}
      {successMsg && <AuthAlert tone="success">{successMsg}</AuthAlert>}

      <form onSubmit={handleResetPassword} className="space-y-3">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kata sandi baru (min. 8 karakter)"
            disabled={loading}
            className={`${authInputClass} pl-11 pr-11`}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1b1815]/35 hover:text-[#1b1815]/70 dark:text-[#f3ede3]/35 dark:hover:text-[#f3ede3]/70"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {password && (
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i < strength ? strengthColors[strength - 1] : 'bg-[#1b1815]/12 dark:bg-[#f3ede3]/12'
                }`}
              />
            ))}
          </div>
        )}

        <div className="relative">
          <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ulangi kata sandi baru"
            disabled={loading}
            className={`${authInputClass} pl-11 pr-11`}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1b1815]/35 hover:text-[#1b1815]/70 dark:text-[#f3ede3]/35 dark:hover:text-[#f3ede3]/70"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {confirmPassword && (
          <p
            className={`text-xs font-medium ${
              password === confirmPassword ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {password === confirmPassword ? 'Password cocok' : 'Password tidak cocok'}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !!successMsg}
          className={authButtonClass}
        >
          {loading ? 'Memproses...' : 'Perbarui kata sandi'}
        </button>

        <Link href="/login" className="text-xs text-[#1b1815]/55 hover:underline dark:text-[#f3ede3]/55">
          Ingat kata sandi? Masuk
        </Link>
      </form>
    </AuthShell>
  );
}

/**
 * useSearchParams() memaksa render di client, dan Next menolak mem-prerender
 * halaman yang memakainya tanpa batas Suspense.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <p className="text-sm text-[#1b1815]/60 dark:text-[#f3ede3]/60">
            Memuat tautan pemulihan...
          </p>
        </AuthShell>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
