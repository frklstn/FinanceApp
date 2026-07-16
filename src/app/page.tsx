'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lora } from 'next/font/google';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useApp } from '@/contexts/app-context';
import { createClient } from '@/lib/supabase/client';
import { authInputClass } from '@/components/auth/auth-shell';
import { ArrowRight, Mail, Lock, Eye, EyeOff, X } from 'lucide-react';

const serif = Lora({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif' });

export default function LandingPage() {
  const { appSettings } = useApp();
  const appName = appSettings?.app_name || 'FinanceApp';
  const brandMark = appName === 'FinanceApp' ? 'FRKLSTN' : appName;

  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }
      router.push('/finance/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div
      className={`${serif.variable} min-h-[100dvh] bg-[#f6f2ea] text-[#1b1815] dark:bg-[#15130f] dark:text-[#f3ede3]`}
    >
      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Top labels, bukan nav fungsional - fungsi & teks berkumpul di kolom kiri bawah */}
        <div className="flex items-center justify-between text-sm text-[#1b1815]/70 dark:text-[#f3ede3]/70">
          <span className="font-medium tracking-tight">{brandMark}</span>
          <div className="flex items-center gap-6">
            <span>Personal Finance</span>
            <span>2026</span>
          </div>
        </div>

        {/* Dua kolom penuh: kiri teks+fungsi rata kiri tengah, kanan gambar */}
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

            <div className="w-full max-w-xs">
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
                  <motion.form
                    key="login-form"
                    onSubmit={handleLogin}
                    initial={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                    className="space-y-2.5 overflow-hidden"
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

                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Username"
                        disabled={loading}
                        autoFocus
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
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1b1815]/35 hover:text-[#1b1815]/70 dark:text-[#f3ede3]/35 dark:hover:text-[#f3ede3]/70 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-4 pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-xl bg-[#1b1815] px-6 py-2.5 text-sm font-medium text-[#f6f2ea] transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#f3ede3] dark:text-[#15130f] cursor-pointer"
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
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            className="relative min-h-[320px] overflow-hidden rounded-2xl md:rounded-3xl"
            style={{
              background:
                'linear-gradient(155deg, #e7ddc7 0%, #d9cbac 45%, #c2b190 100%)',
            }}
            role="img"
            aria-label="Plakat batu bertanda F, simbol arus kas yang tenang"
          >
            {/* grain/depth, bukan foto stok generik */}
            <div
              className="absolute inset-0 opacity-70 mix-blend-overlay"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 18% 22%, rgba(255,255,255,0.55), transparent 38%), radial-gradient(circle at 82% 78%, rgba(27,24,21,0.35), transparent 42%)',
              }}
            />
            {/* lipatan kain linen di pojok bawah */}
            <div
              className="absolute -bottom-6 -right-10 h-40 w-56 opacity-80 dark:opacity-60"
              style={{
                background:
                  'linear-gradient(115deg, transparent 40%, rgba(221,205,175,0.9) 55%, rgba(198,180,148,0.95) 75%, rgba(178,158,124,0.9) 100%)',
                filter: 'blur(0.5px)',
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center p-10">
              <div className="relative flex flex-col items-center gap-7">
                {/* ranting kecil, bukan hiasan generik */}
                <svg width="56" height="76" viewBox="0 0 56 76" fill="none" className="text-[#7a6f5c]">
                  <path d="M28 76 L28 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  {[
                    [28, 44, 10, 34, -28],
                    [28, 36, 46, 22, 30],
                    [28, 26, 8, 14, -24],
                    [28, 18, 44, 6, 26],
                  ].map(([x1, y1, x2, y2, rot], i) => (
                    <ellipse
                      key={i}
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      rx="9"
                      ry="4"
                      transform={`rotate(${rot} ${(x1 + x2) / 2} ${(y1 + y2) / 2})`}
                      fill="currentColor"
                      opacity="0.55"
                    />
                  ))}
                </svg>

                {/* plakat batu berukir F */}
                <div
                  className="flex h-40 w-32 items-center justify-center rounded-2xl"
                  style={{
                    background: 'linear-gradient(160deg, #f1ead9 0%, #e3d7bc 100%)',
                    boxShadow:
                      'inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -3px 6px rgba(120,104,74,0.25), 0 24px 40px -12px rgba(60,48,30,0.35)',
                  }}
                >
                  <span
                    className="text-6xl font-semibold"
                    style={{
                      fontFamily: 'var(--font-serif)',
                      color: '#d9cbac',
                      textShadow:
                        '1px 1.5px 0 rgba(255,255,255,0.75), -1px -1px 1.5px rgba(120,104,74,0.45)',
                    }}
                  >
                    F
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
