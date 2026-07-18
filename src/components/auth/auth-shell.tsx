'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/app-context';

// Kelas input bersama untuk semua form auth (gaya cream/dark).
export const authInputClass =
  'w-full rounded-xl border border-[#1b1815]/15 bg-white/70 py-3 text-sm outline-none transition-colors placeholder:text-[#1b1815]/35 focus:border-[#1b1815]/40 dark:border-[#f3ede3]/15 dark:bg-white/[0.04] dark:placeholder:text-[#f3ede3]/35 dark:focus:border-[#f3ede3]/40';

// Tombol utama form auth. Lebarnya penuh supaya sejajar dengan kolom input.
export const authButtonClass =
  'w-full rounded-xl bg-[#1b1815] py-3 text-sm font-medium text-[#f6f2ea] transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#f3ede3] dark:text-[#15130f] cursor-pointer';

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const cls =
    tone === 'error'
      ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300'
      : 'border-[var(--nexus-emerald-border)] bg-[var(--nexus-emerald-glow)] text-[var(--nexus-emerald)]';
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

// Plakat batu berukir F. Kolom kanan untuk seluruh halaman auth termasuk landing.
function StonePlaque() {
  return (
    <div
      className="relative min-h-[320px] overflow-hidden rounded-2xl md:rounded-3xl"
      style={{
        background: 'linear-gradient(155deg, #e7ddc7 0%, #d9cbac 45%, #c2b190 100%)',
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
              className="font-serif text-6xl font-semibold"
              style={{
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
  );
}

/**
 * Kerangka dua kolom untuk landing dan seluruh halaman auth. Satu-satunya
 * sumber: sebelumnya landing punya salinan kerangka ini sendiri, sehingga
 * /register dan /forgot-password perlahan menyimpang desainnya.
 *
 * Hanya `children` (blok form) yang berubah antar halaman. Header, judul, dan
 * plakat tetap sama persis supaya pindah halaman tidak terasa ganti situs.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { appSettings } = useApp();
  const appName = appSettings?.app_name || 'FinanceApp';
  const brandMark = appName === 'FinanceApp' ? 'FRKLSTN' : appName;

  return (
    <div className="min-h-[100dvh] bg-[#f6f2ea] text-[#1b1815] dark:bg-[#15130f] dark:text-[#f3ede3]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col px-6 py-6 md:px-10 md:py-8">
        {/* Baris tanda tangan. Di hp turun ke bawah layar supaya form yang
            dilihat duluan; di desktop tetap jadi header. */}
        <div className="order-last mt-8 flex items-center justify-between text-sm text-[#1b1815]/70 md:order-first md:mt-0 dark:text-[#f3ede3]/70">
          <Link href="/" className="font-medium tracking-tight">
            {brandMark}
          </Link>
          <div className="flex items-center gap-6">
            <span>Personal Finance</span>
            <span>2026</span>
          </div>
        </div>

        <div className="grid flex-1 min-h-0 gap-8 md:mt-6 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col justify-center gap-6 py-10 md:py-0 md:pr-10">
            <h1 className="font-serif text-4xl leading-[1.1] md:text-5xl lg:text-6xl">
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

            <div className="w-full max-w-sm space-y-3">{children}</div>
          </div>

          <StonePlaque />
        </div>
      </div>
    </div>
  );
}
