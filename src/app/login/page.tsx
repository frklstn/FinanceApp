'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass } from '@/components/auth/auth-shell';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12.24v3.91h6.44c-.13 1.06-.83 2.67-2.38 3.75l-.02.15 3.46 2.66.24.02c2.2-2.02 3.46-5 3.46-8.44z"
      />
      <path
        fill="#34A853"
        d="M12.24 24c3.13 0 5.76-1.02 7.68-2.79l-3.66-2.83c-.98.68-2.3 1.15-4.02 1.15-3.07 0-5.68-2.02-6.61-4.81l-.14.01-3.6 2.77-.05.13C3.8 21.3 7.7 24 12.24 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.63 14.72A7.53 7.53 0 0 1 5.22 12c0-.95.17-1.87.4-2.72L5.6 9.13l-3.65-2.83-.12.06A11.98 11.98 0 0 0 .5 12c0 1.94.47 3.77 1.33 5.39l3.8-2.67z"
      />
      <path
        fill="#EA4335"
        d="M12.24 4.75c2.18 0 3.65.94 4.49 1.73l3.28-3.2C17.98 1.4 15.37 0 12.24 0 7.7 0 3.8 2.7 1.95 6.6l3.79 2.68c.94-2.79 3.55-4.53 6.5-4.53z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      setTimeout(() => {
        setErrorMsg(decodeURIComponent(urlError));
      }, 0);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    let loginEmail = email.trim();
    let loginPassword = password;

    if (loginEmail.toUpperCase() === 'DEMO@FRKLSTN') {
      loginEmail = 'demo@frklstn.com';
      loginPassword = 'DEMO@FRKLSTN';
    } else if (!loginEmail || !loginPassword) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Berhasil masuk. Mengalihkan...');
        setTimeout(() => {
          router.push('/finance/dashboard');
          router.refresh();
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      topRight={
        <Link href="/register" className="hover:underline">
          Belum punya akun? Daftar
        </Link>
      }
    >
      {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}
      {successMsg && <AuthAlert tone="success">{successMsg}</AuthAlert>}

      <form onSubmit={handleLogin} className="space-y-3">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username"
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
            placeholder="Password"
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

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#1b1815] px-6 py-2.5 text-sm font-medium text-[#f6f2ea] transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#f3ede3] dark:text-[#15130f]"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
          <Link
            href="/forgot-password"
            className="text-xs text-[#1b1815]/55 hover:underline dark:text-[#f3ede3]/55"
          >
            Lupa sandi?
          </Link>
        </div>

        <button
          type="button"
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${window.location.origin}/auth/callback` },
            })
          }
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[#1b1815]/15 bg-white/70 py-2.5 text-sm font-medium transition-colors hover:bg-white dark:border-[#f3ede3]/15 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        >
          <GoogleIcon />
          Lanjutkan dengan Google
        </button>
      </form>
    </AuthShell>
  );
}
