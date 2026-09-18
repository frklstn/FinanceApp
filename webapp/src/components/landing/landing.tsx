'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { login } from '@/app/login/actions';
import { AuthShell, authInputClass, authButtonClass } from '@/components/auth/auth-shell';
import { ArrowRight, Mail, Lock, Eye, EyeOff, X } from 'lucide-react';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.91h6.44c-.13 1.06-.83 2.67-2.38 3.75l-.02.15 3.46 2.66.24.02c2.2-2.02 3.46-5 3.46-8.44z" />
      <path fill="#34A853" d="M12.24 24c3.13 0 5.76-1.02 7.68-2.79l-3.66-2.83c-.98.68-2.3 1.15-4.02 1.15-3.07 0-5.68-2.02-6.61-4.81l-.14.01-3.6 2.77-.05.13C3.8 21.3 7.7 24 12.24 24z" />
      <path fill="#FBBC05" d="M5.63 14.72A7.53 7.53 0 0 1 5.22 12c0-.95.17-1.87.4-2.72L5.6 9.13l-3.65-2.83-.12.06A11.98 11.98 0 0 0 .5 12c0 1.94.47 3.77 1.33 5.39l3.8-2.67z" />
      <path fill="#EA4335" d="M12.24 4.75c2.18 0 3.65.94 4.49 1.73l3.28-3.2C17.98 1.4 15.37 0 12.24 0 7.7 0 3.8 2.7 1.95 6.6l3.79 2.68c.94-2.79 3.55-4.53 6.5-4.53z" />
    </svg>
  );
}

interface SavedAccount {
  email: string;
  name?: string;
  avatar_url?: string | null;
  provider?: string;
}

interface LandingProps {
  /** Buka form login sejak awal. Dipakai route /login. */
  openLogin?: boolean;
}

export function Landing({ openLogin = false }: LandingProps) {
  const reduceMotion = useReducedMotion();
  const [showLogin, setShowLogin] = useState(openLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<SavedAccount | null>(null);
  const [useOtherAccount, setUseOtherAccount] = useState(false);

  useEffect(() => {
    // 1. Baca url error jika ada
    const urlError = new URLSearchParams(window.location.search).get('error');
    if (urlError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLogin(true);
      setErrorMsg(decodeURIComponent(urlError));
    }

    // 2. Baca akun tersimpan dari cookie / localStorage
    try {
      const match = document.cookie.match(new RegExp('(^| )fin_saved_account=([^;]+)'));
      if (match) {
        const parsed = JSON.parse(decodeURIComponent(match[2]));
        if (parsed?.email) {
          setSavedAccount(parsed);
          localStorage.setItem('fin_saved_account', JSON.stringify(parsed));
          return;
        }
      }
      const local = localStorage.getItem('fin_saved_account');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.email) {
          setSavedAccount(parsed);
        }
      }
    } catch {
      // Abaikan jika parsing gagal
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    document.cookie = 'fin_saved_account=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('fin_saved_account');
    setSavedAccount(null);
    setUseOtherAccount(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const identifier = email.trim();

    if (!identifier || !password) {
      setErrorMsg('Email/username dan kata sandi wajib diisi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.set('identifier', identifier);
      formData.set('password', password);

      const result = await login(null, formData);
      if (result?.error) {
        setErrorMsg(result.error);
        setLoading(false);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.');
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait" initial={false}>
        {!showLogin ? (
          <motion.div
            key="cta"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-start gap-3"
          >
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="group inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3 cursor-pointer"
            >
              Mulai gratis
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="text-xs text-[#1b1815]/50 hover:underline dark:text-[#f3ede3]/50 cursor-pointer"
            >
              Sudah punya akun? Masuk
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
            className="space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1b1815]/50 dark:text-[#f3ede3]/50">Masuk ke akunmu</span>
              <button
                type="button"
                onClick={() => { setShowLogin(false); setErrorMsg(null); }}
                className="text-[#1b1815]/40 hover:text-[#1b1815]/70 dark:text-[#f3ede3]/40 dark:hover:text-[#f3ede3]/70 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
            )}

            {/* Cloudflare-style Saved Account Card */}
            {savedAccount && !useOtherAccount ? (
              <div className="space-y-2.5">
                <div className="rounded-xl border border-[#1b1815]/15 bg-white/60 p-3 dark:border-[#f3ede3]/15 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {savedAccount.avatar_url ? (
                        <img src={savedAccount.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover border border-[#1b1815]/10 dark:border-[#f3ede3]/10" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1b1815]/10 font-bold text-xs text-[#1b1815] dark:bg-white/10 dark:text-[#f3ede3]">
                          {savedAccount.name?.[0]?.toUpperCase() || savedAccount.email[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-[#1b1815] dark:text-[#f3ede3]">
                          {savedAccount.name || 'Akun Google'}
                        </p>
                        <p className="text-[11px] truncate text-[#1b1815]/60 dark:text-[#f3ede3]/60">
                          {savedAccount.email}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveSavedAccount}
                      title="Lupakan akun ini"
                      className="text-[#1b1815]/35 hover:text-rose-600 dark:text-[#f3ede3]/35 dark:hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b1815] py-2.5 text-xs font-medium text-[#f3ede3] transition-opacity hover:opacity-90 dark:bg-[#f3ede3] dark:text-[#1b1815] cursor-pointer shadow-sm"
                  >
                    <GoogleIcon />
                    Lanjutkan sebagai {savedAccount.name?.split(' ')[0] || savedAccount.email.split('@')[0]}
                  </button>
                </div>

                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setUseOtherAccount(true)}
                    className="text-xs text-[#1b1815]/60 hover:underline dark:text-[#f3ede3]/60 cursor-pointer"
                  >
                    Gunakan akun lain / password
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-2.5">
                {savedAccount && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setUseOtherAccount(false)}
                      className="text-[11px] text-[#1b1815]/50 hover:underline dark:text-[#f3ede3]/50 cursor-pointer"
                    >
                      ← Kembali ke akun tersimpan
                    </button>
                  </div>
                )}

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email atau username"
                    disabled={loading}
                    autoFocus
                    className={`${authInputClass} pl-11 pr-4`}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#1b1815]/55 hover:underline dark:text-[#f3ede3]/55"
                    >
                      Lupa sandi?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      disabled={loading}
                      className={`${authInputClass} pl-11 pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1b1815]/35 hover:text-[#1b1815]/70 dark:text-[#f3ede3]/35 dark:hover:text-[#f3ede3]/70 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={authButtonClass}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#1b1815]/15 bg-white/70 py-3 text-sm font-medium transition-colors hover:bg-white dark:border-[#f3ede3]/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] cursor-pointer"
                >
                  <GoogleIcon />
                  Lanjutkan dengan Google
                </button>

                <p className="pt-1 text-xs text-[#1b1815]/50 dark:text-[#f3ede3]/50">
                  Belum punya akun?{' '}
                  <Link href="/register" className="underline hover:no-underline">
                    Daftar
                  </Link>
                </p>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
