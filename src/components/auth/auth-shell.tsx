'use client';

import React from 'react';
import Link from 'next/link';
import { Lora } from 'next/font/google';
import { motion, useReducedMotion } from 'framer-motion';

const serif = Lora({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif' });

// Kelas input bersama untuk semua form auth (gaya cream/dark).
export const authInputClass =
  'w-full rounded-xl border border-[#1b1815]/15 bg-white/70 py-3 text-sm outline-none transition-colors placeholder:text-[#1b1815]/35 focus:border-[#1b1815]/40 dark:border-[#f3ede3]/15 dark:bg-white/[0.04] dark:placeholder:text-[#f3ede3]/35 dark:focus:border-[#f3ede3]/40';

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const cls =
    tone === 'error'
      ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300'
      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  return <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

// Mark arus kas animasi, gantikan foto stok yang tidak relevan dengan produk finansial.
function FlowMark() {
  const reduce = useReducedMotion();
  return (
    <div className="relative hidden min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-[#1b1815]/[0.035] dark:bg-white/[0.03] md:flex md:rounded-3xl">
      <motion.div
        className="absolute h-[65%] w-[65%] rounded-full bg-[var(--nexus-emerald)]/15 blur-3xl"
        animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.svg
        viewBox="0 0 200 200"
        className="relative h-40 w-40 md:h-56 md:w-56"
        animate={reduce ? undefined : { scale: [1, 1.04, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.path
          d="M32 128 Q 70 55 100 100 T 168 62"
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-[var(--nexus-emerald)]"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <circle cx="168" cy="62" r="9" className="fill-[var(--nexus-emerald)]" />
      </motion.svg>
    </div>
  );
}

export function AuthShell({
  topRight,
  children,
}: {
  topRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${serif.variable} min-h-[100dvh] bg-[#f6f2ea] text-[#1b1815] dark:bg-[#15130f] dark:text-[#f3ede3]`}
    >
      <div className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col px-6 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between text-sm text-[#1b1815]/70 dark:text-[#f3ede3]/70">
          <Link href="/" className="font-medium tracking-tight">
            FRKLSTN
          </Link>
          {topRight}
        </div>

        <div className="mt-6 grid flex-1 min-h-0 items-center gap-8 md:grid-cols-2 md:gap-12">
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

            <div className="max-w-sm space-y-3">{children}</div>
          </div>

          <FlowMark />
        </div>
      </div>
    </div>
  );
}
