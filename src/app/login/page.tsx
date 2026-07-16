'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Lora } from 'next/font/google';
import { createClient } from '@/lib/supabase/client';
import { useApp } from '@/contexts/app-context';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const serif = Lora({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif' });

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

const inputClass =
  'w-full rounded-xl border border-[#1b1815]/15 bg-white/70 py-3 text-sm outline-none transition-colors placeholder:text-[#1b1815]/35 focus:border-[#1b1815]/40 dark:border-[#f3ede3]/15 dark:bg-white/[0.04] dark:placeholder:text-[#f3ede3]/35 dark:focus:border-[#f3ede3]/40';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { appSettings } = useApp();
  const appName = appSettings?.app_name || 'FinanceApp';
  const brandMark = appName === 'FinanceApp' ? 'FRKLSTN' : appName;

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
    <div
      className={`${serif.variable} min-h-[100dvh] bg-[#f6f2ea] text-[#1b1815] dark:bg-[#15130f] dark:text-[#f3ede3]`}
    >
      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between text-sm text-[#1b1815]/70 dark:text-[#f3ede3]/70">
          <Link href="/" className="font-medium tracking-tight">
            {brandMark}
          </Link>
          <Link href="/register" className="hover:underline">
            Belum punya akun? Daftar
          </Link>
        </div>

        <div className="mt-6 grid flex-1 min-h-0 gap-8 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col justify-center gap-6 py-10 md:py-0 md:pr-10">
            <h1
              className="text-4xl leading-[1.1] md:text-5xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Kendalikan
              <br />
              arus kas,
              <br />
              bebas pinjol.
            </h1>

            <p className="max-w-[34ch] text-sm leading-relaxed text-[#1b1815]/60 md:text-base dark:text-[#f3ede3]/60">
              Catat transaksi, atur anggaran, dan pantau cicilan pinjaman online lewat Survival
              Score yang selaras dengan gajianmu.
            </p>

            {errorMsg && (
              <div className="max-w-sm rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="max-w-sm rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="max-w-sm space-y-3">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Username"
                  disabled={loading}
                  className={`${inputClass} pl-11 pr-4`}
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
                  className={`${inputClass} pl-11 pr-11`}
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
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-2xl md:rounded-3xl">
            <Image
              src="https://picsum.photos/seed/quiet-stone-warm-light/900/1200"
              alt="Suasana tenang mengatur keuangan"
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
