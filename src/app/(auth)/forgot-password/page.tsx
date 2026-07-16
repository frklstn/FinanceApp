'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthShell, AuthAlert, authInputClass } from '@/components/auth/auth-shell';

export default function ForgotPasswordPage() {
  const supabase = createClient();

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
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Tautan pemulihan sudah dikirim. Cek email kamu.');
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
    <AuthShell
      title="Lupa sandi"
      subtitle="Kirim tautan pemulihan ke emailmu."
      imageSeed="soft-tones-still-life"
    >
      {errorMsg && <AuthAlert tone="error">{errorMsg}</AuthAlert>}
      {successMsg && <AuthAlert tone="success">{successMsg}</AuthAlert>}

      <form onSubmit={handleResetRequest} className="space-y-4">
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
          className="w-full rounded-xl bg-[#1b1815] py-3 text-sm font-medium text-[#f6f2ea] transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#f3ede3] dark:text-[#15130f]"
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
      </form>
    </AuthShell>
  );
}
