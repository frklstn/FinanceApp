'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
    // Listen for AUTH_STATE_CHANGE dulu — Supabase SSR butuh waktu sync session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session valid, user boleh reset password
        setChecking(false);
      } else if (event === 'SIGNED_IN' && session) {
        // Fallback jika session sudah ada
        setChecking(false);
      } else if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        router.replace('/forgot-password');
      }
    });

    // Timeout fallback — jika 3 detik tidak ada event, cek manual
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
      setErrorMsg('Password harus memiliki panjang minimal 8 karakter.');
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
      <div className="glass-card p-6 md:p-8 w-full border-dark-border text-dark-text-primary flex items-center justify-center min-h-[200px]">
        <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6 md:p-8 w-full border-dark-border text-dark-text-primary">
      <h2 className="text-xl font-bold text-center mb-1">Buat Password Baru</h2>
      <p className="text-sm text-dark-text-secondary text-center mb-6">
        Pilih password baru yang kuat untuk akun Anda
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-xs font-semibold uppercase text-dark-text-secondary mb-1">
            Password Baru
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              disabled={loading}
              className="w-full px-4 py-2.5 pr-10 rounded-lg bg-dark-bg/40 border border-dark-border text-sm focus:outline-none focus:border-primary transition-all duration-200 placeholder:text-dark-text-secondary/40"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-secondary hover:text-dark-text-primary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold uppercase text-dark-text-secondary mb-1">
            Konfirmasi Password Baru
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              disabled={loading}
              className="w-full px-4 py-2.5 pr-10 rounded-lg bg-dark-bg/40 border border-dark-border text-sm focus:outline-none focus:border-primary transition-all duration-200 placeholder:text-dark-text-secondary/40"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-text-secondary hover:text-dark-text-primary transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {/* Password match indicator */}
          {confirmPassword && (
            <p className={`mt-1 text-xs font-medium ${password === confirmPassword ? 'text-success' : 'text-danger'}`}>
              {password === confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
            </p>
          )}
        </div>

        {/* Password strength hint */}
        {password && (
          <div className="flex gap-1.5">
            {[...Array(4)].map((_, i) => {
              const strength = password.length >= 8 ? 1 : 0
                + (password.length >= 12 ? 1 : 0)
                + (/[A-Z]/.test(password) ? 1 : 0)
                + (/[0-9!@#$%^&*]/.test(password) ? 1 : 0);
              const colors = ['bg-danger', 'bg-warning', 'bg-info', 'bg-success'];
              return (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? colors[strength - 1] : 'bg-dark-border'}`}
                />
              );
            })}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !!successMsg}
          className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            'Perbarui Password'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-text-secondary">
        Ingat password kamu?{' '}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover transition-all duration-150">
          Masuk
        </Link>
      </p>
    </div>
  );
}
