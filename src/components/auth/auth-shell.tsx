'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lora } from 'next/font/google';
import { motion } from 'framer-motion';

const serif = Lora({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif' });

// Kelas input bersama untuk semua form auth (gaya cream/dark baru).
export const authInputClass =
  'w-full rounded-xl border border-[#1b1815]/15 bg-white/70 py-3 text-sm outline-none transition-colors placeholder:text-[#1b1815]/35 focus:border-[#1b1815]/40 dark:border-[#f3ede3]/15 dark:bg-white/[0.04] dark:placeholder:text-[#f3ede3]/35 dark:focus:border-[#f3ede3]/40';

export function AuthAlert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  const cls =
    tone === 'error'
      ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300'
      : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
  return <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function AuthShell({
  title,
  subtitle,
  topRight,
  children,
  imageSeed = 'quiet-stone-warm-light',
}: {
  title: string;
  subtitle: string;
  topRight?: React.ReactNode;
  children: React.ReactNode;
  imageSeed?: string;
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
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-md rounded-2xl border border-[#1b1815]/10 bg-white/70 p-8 backdrop-blur-sm dark:border-[#f3ede3]/10 dark:bg-white/[0.04] md:rounded-3xl md:p-10"
          >
            <h1 className="mb-1 text-3xl" style={{ fontFamily: 'var(--font-serif)' }}>
              {title}
            </h1>
            <p className="mb-6 text-sm text-[#1b1815]/60 dark:text-[#f3ede3]/60">{subtitle}</p>
            {children}
          </motion.div>

          <div className="relative hidden min-h-[320px] overflow-hidden rounded-2xl md:block md:rounded-3xl">
            <Image
              src={`https://picsum.photos/seed/${imageSeed}/900/1200`}
              alt="Suasana tenang mengatur keuangan"
              fill
              sizes="45vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
