'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Lora } from 'next/font/google';
import { useApp } from '@/contexts/app-context';
import { ArrowRight } from 'lucide-react';

const serif = Lora({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-serif' });

export default function LandingPage() {
  const { appSettings } = useApp();
  const appName = appSettings?.app_name || 'FinanceApp';
  const brandMark = appName === 'FinanceApp' ? 'FRKLSTN' : appName;

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

            <div className="flex flex-col items-start gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 text-sm font-medium transition-all hover:gap-3"
              >
                Mulai gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="text-xs text-[#1b1815]/50 hover:underline dark:text-[#f3ede3]/50"
              >
                Sudah punya akun? Masuk
              </Link>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden rounded-2xl md:rounded-3xl bg-[#e9e2d3] dark:bg-[#1c1a15]">
            <Image
              src="https://picsum.photos/seed/quiet-linen-still-life-warm/900/1200"
              alt="Suasana tenang mengatur keuangan"
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover saturate-[0.65] contrast-[0.92] brightness-[1.03] sepia-[0.12]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1b1815]/25 via-transparent to-[#f6f2ea]/10 mix-blend-multiply dark:from-black/35 dark:to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
