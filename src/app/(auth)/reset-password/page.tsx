'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass, authButtonClass } from '@/components/auth/auth-shell';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Verify user has a valid recovery session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        setChecking(false);
      } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        router.replace('/forgot-password');
      }
    });

    const timeout = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/forgot-password');
      } else {
        setChecking(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, router]);

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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Password berhasil diperbarui! Mengalihkan...');
        setTimeout(() => router.replace('/finance/dashboard'), 2000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan yang tidak terduga.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthShell>
        <p className="text-sm text-[#1b1815]/60 dark:text-[#f3ede3]/60">
          Memverifikasi tautan pemulihan...
        </p>
        <div className="flex min-h-[80px] items-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1b1815]/20 border-t-[#1b1815] dark:border-[#f3ede3]/20 dark:border-t-[#f3ede3]" />
        </div>
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
