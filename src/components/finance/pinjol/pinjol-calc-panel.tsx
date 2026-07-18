'use client';

import React, { useMemo } from 'react';
import { calcEndDate } from '@/lib/debt-planner/calculations';

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

interface PinjolCalcPanelProps {
  /** Nilai string dari input form (dibaca apa adanya). */
  applied: string;
  received: string;
  tenure: string;
  monthly: string;
  startDate?: string;
}

/**
 * Panel hasil hitungan pinjol dari 4 angka yang diisi user. Dipakai di form
 * tambah dan edit supaya rumusnya satu tempat.
 */
export function PinjolCalcPanel({ applied, received, tenure, monthly, startDate }: PinjolCalcPanelProps) {
  const calc = useMemo(() => {
    const a = parseFloat(applied) || 0;
    const r = parseFloat(received) || 0;
    const t = parseInt(tenure, 10) || 0;
    const m = parseFloat(monthly) || 0;
    if (!t || !m || !r) return null;

    const total = m * t;
    const adminFee = a > r ? a - r : 0;
    const interest = total - r;
    const monthlyRate = (interest / r / t) * 100;
    const nombok = m - r / t;
    const endDateStr = startDate
      ? calcEndDate(startDate, t).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : null;
    return { total, adminFee, interest, monthlyRate, nombok, endDateStr };
  }, [applied, received, tenure, monthly, startDate]);

  if (!calc) return null;

  return (
    <div className="rounded-xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] p-4 space-y-2 text-sm">
      <p className="text-xs font-semibold text-[var(--nexus-text-muted)]">Hasil hitungan otomatis</p>
      <div className="flex justify-between"><span className="text-[var(--nexus-text-secondary)]">Total dibayar</span><span className="font-semibold text-[var(--nexus-text-primary)]">{rupiah(calc.total)}</span></div>
      {calc.adminFee > 0 && (
        <div className="flex justify-between"><span className="text-[var(--nexus-text-secondary)]">Potongan admin (diajukan - diterima)</span><span className="font-semibold text-amber-500">{rupiah(calc.adminFee)}</span></div>
      )}
      <div className="flex justify-between"><span className="text-[var(--nexus-text-secondary)]">Selisih bayar (bunga + biaya)</span><span className="font-semibold text-rose-400">{rupiah(calc.interest)}</span></div>
      <div className="flex justify-between"><span className="text-[var(--nexus-text-secondary)]">Bunga rata-rata / bulan</span><span className="font-semibold text-rose-400">{calc.monthlyRate.toFixed(2)}%</span></div>
      <div className="flex justify-between"><span className="text-[var(--nexus-text-secondary)]">Nombok / bulan</span><span className="font-semibold text-rose-400">{rupiah(calc.nombok)}</span></div>
      {calc.endDateStr && (
        <div className="flex justify-between border-t border-[var(--nexus-glass-border)] pt-2"><span className="text-[var(--nexus-text-secondary)]">Estimasi lunas</span><span className="font-semibold text-[var(--nexus-text-primary)]">{calc.endDateStr}</span></div>
      )}
    </div>
  );
}
