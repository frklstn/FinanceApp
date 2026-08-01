'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Wallet as WalletIcon, Calendar as CalendarIcon, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatProps {
  label: string;
  amount: number;
  hint: string;
  icon: LucideIcon;
  /** Menandai angka & ikon merah, plus denyut pada nominal. */
  alert?: boolean;
}

/**
 * Satu petak statistik di puncak halaman Pinjol.
 *
 * Bentuknya lebih padat daripada SummaryCard di halaman lain (empat kolom
 * sejajar, bukan satu angka besar), jadi sengaja komponen tersendiri —
 * menyatukan keduanya berarti satu komponen dengan dua mode tampilan yang
 * hampir tidak berbagi apa pun.
 */
function Stat({ label, amount, hint, icon: Icon, alert }: StatProps) {
  return (
    <Card className="p-4 bg-card border border-line rounded-[24px] group hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between w-full gap-3">
        <div className="space-y-0.5 min-w-0">
          <span className="text-[9px] font-extrabold text-text-muted block">{label}</span>
          <h3
            className={cn(
              'text-base md:text-lg font-semibold tracking-tight truncate leading-none',
              alert ? 'text-rose-500 animate-pulse' : 'text-text-primary'
            )}
          >
            Rp {amount.toLocaleString('id-ID')}
          </h3>
          <p
            className={cn(
              'text-[10px] leading-none mt-1',
              alert ? 'text-rose-500 font-bold' : 'text-text-muted font-semibold'
            )}
          >
            {hint}
          </p>
        </div>
        <div
          className={cn(
            'w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0',
            alert ? 'bg-rose-500/10 text-rose-500' : 'bg-primary-glow text-primary'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
}

export interface PinjolStats {
  totalPinjaman: number;
  totalPinjamanHint: string;
  tagihanBulanIni: number;
  tagihanBulanIniHint: string;
  sudahDibayar: number;
  sudahDibayarHint: string;
  terlambat: number;
  terlambatHint: string;
}

/**
 * Empat petak statistik. Dua kolom sejak layar kecil — sebelumnya
 * grid-cols-1 sampai 640px sehingga tiap kartu memakan satu baris penuh di hp.
 */
export function PinjolStatCards(s: PinjolStats) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat label="Total Pinjaman" amount={s.totalPinjaman} hint={s.totalPinjamanHint} icon={WalletIcon} />
      <Stat label="Tagihan Bulan Ini" amount={s.tagihanBulanIni} hint={s.tagihanBulanIniHint} icon={CalendarIcon} />
      <Stat label="Sudah Dibayar" amount={s.sudahDibayar} hint={s.sudahDibayarHint} icon={CheckCircle} />
      <Stat label="Terlambat" amount={s.terlambat} hint={s.terlambatHint} icon={AlertTriangle} alert />
    </section>
  );
}
