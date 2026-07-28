'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass, authButtonClass } from '@/components/auth/auth-shell';
import { requestPasswordResetAction } from '@/app/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email) {
      setErrorMsg('Email wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const result = await requestPasswordResetAction(email);

      if (!result.ok) {
        setErrorMsg(result.error);
      } else {
        // Kalimatnya sengaja tidak memastikan email itu terdaftar — kalau
        // dibedakan, halaman ini jadi alat menebak email mana yang punya akun.
        setSuccessMsg('Kalau email itu terdaftar, tautan pemulihan sudah dikirim. Cek kotak masuk kamu.');
        setEmail('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}
      {successMsg && <AuthAlert tone="success">{successMsg}</AuthAlert>}

      <form onSubmit={handleResetRequest} className="space-y-3">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1b1815]/35 dark:text-[#f3ede3]/35" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email terdaftar"
            disabled={loading}
            className={`${authInputClass} pl-11 pr-4`}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={authButtonClass}
        >
          {loading ? 'Memproses...' : 'Kirim tautan pemulihan'}
        </button>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-[#1b1815]/55 hover:underline dark:text-[#f3ede3]/55"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke halaman masuk
        </Link>

        <p className="pt-1 text-xs text-[#1b1815]/50 dark:text-[#f3ede3]/50">
          Belum punya akun?{' '}
          <Link href="/register" className="underline hover:no-underline">
            Daftar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
