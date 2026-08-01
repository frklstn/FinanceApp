'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import NumberTicker from '@/components/ui/number-ticker';
import { formatCurrency } from '@/lib/debt-planner/format';
import { cn } from '@/lib/utils';

type Tone = 'emerald' | 'danger';

interface SummaryCardProps {
  /** Keterangan kecil di atas angka. */
  label: string;
  /** Ikon kecil di samping label. */
  labelIcon?: LucideIcon;
  value: number;
  /** Kalimat pendek di bawah angka. */
  hint?: React.ReactNode;
  /** Ikon besar di kanan. */
  icon: LucideIcon;
  tone?: Tone;
  formatter?: (v: number) => string;
  className?: string;
}

const TONE = {
  emerald: {
    value: 'text-primary',
    labelIcon: 'text-primary',
    badge: 'bg-primary-glow border-primary-border text-primary',
  },
  danger: {
    value: 'text-rose-400',
    labelIcon: 'text-rose-400',
    badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  },
} satisfies Record<Tone, { value: string; labelIcon: string; badge: string }>;

/**
 * Kartu ringkasan di puncak halaman: label, satu angka besar, catatan, ikon.
 *
 * Sebelumnya markup yang sama persis disalin enam kali (dompet, tabungan,
 * anggaran ×2, utang ×2, dan dashboard), jadi mengubah anatominya berarti
 * menyunting enam tempat dan berharap tidak ada yang meleset.
 *
 * Warna judul angka sengaja bisa berbeda dari nada ikonnya — halaman Dompet
 * memakai angka netral dengan ikon emerald, sementara Utang memakai keduanya
 * merah. Itu sebabnya `tone` mengatur ikon dan angka sekaligus, dan halaman
 * yang ingin angkanya netral cukup tidak mengoper `tone`.
 */
export function SummaryCard({
  label,
  labelIcon: LabelIcon,
  value,
  hint,
  icon: Icon,
  tone,
  formatter = formatCurrency,
  className,
}: SummaryCardProps) {
  const t = TONE[tone ?? 'emerald'];

  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-xs text-text-secondary">
            {LabelIcon && <LabelIcon className={cn('w-3.5 h-3.5', t.labelIcon)} />}
            {label}
          </p>
          <h2
            className={cn(
              'text-2xl md:text-3xl font-semibold tracking-tight',
              tone ? t.value : 'text-text-primary'
            )}
          >
            <NumberTicker value={value} formatter={formatter} />
          </h2>
          {hint && <p className="text-xs text-text-muted">{hint}</p>}
        </div>

        <div
          className={cn(
            'w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0',
            t.badge
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
