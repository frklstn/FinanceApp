'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/debt-planner/format';
import { CalendarClock, Wallet, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { PeriodForecast } from '@/lib/debt-planner/types';

interface SalaryCyclePanelProps {
  salaryDay: number;
  currentForecast: PeriodForecast | null;
  onSaveSalaryDay: (day: number) => Promise<void>;
  onAddIncome: (effectiveDate: string, amount: number) => Promise<void>;
}

/**
 * Analisis siklus gajian: satu gaji harus menutup semua cicilan yang jatuh tempo
 * sebelum gajian berikutnya. Semua logika (periode, total cicilan per siklus,
 * sisa) sudah ada di useDebtForecast/forecast.service -- panel ini hanya
 * menampilkannya dan menyediakan input tanggal + nominal gaji.
 *
 * Gaji per periode bisa berbeda (potongan/bonus): "Perbarui gaji" menyimpan
 * entri income baru yang berlaku sejak tanggal tertentu.
 */
export function SalaryCyclePanel({ salaryDay, currentForecast, onSaveSalaryDay, onAddIncome }: SalaryCyclePanelProps) {
  const [dayInput, setDayInput] = useState(String(salaryDay));
  const [savingDay, setSavingDay] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeDateInput, setIncomeDateInput] = useState('');
  const [savingIncome, setSavingIncome] = useState(false);

  // Income dihitung per AWAL periode: entri gaji harus berlaku sejak awal siklus
  // agar ikut terhitung pada periode berjalan. Default (turunan, bukan state)
  // ke tanggal mulai periode; dipakai selama user belum mengubahnya.
  const periodStart = currentForecast?.period?.start;
  const defaultIncomeDate = periodStart
    ? new Date(periodStart).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const incomeDate = incomeDateInput || defaultIncomeDate;
  const setIncomeDate = setIncomeDateInput;

  const saveDay = async () => {
    const d = parseInt(dayInput, 10);
    if (isNaN(d) || d < 1 || d > 31) return;
    setSavingDay(true);
    try { await onSaveSalaryDay(d); } finally { setSavingDay(false); }
  };

  const saveIncome = async () => {
    const amt = parseFloat(incomeInput);
    if (isNaN(amt) || amt < 0 || !incomeDate) return;
    setSavingIncome(true);
    try { await onAddIncome(incomeDate, amt); setIncomeInput(''); } finally { setSavingIncome(false); }
  };

  const income = currentForecast?.income ?? 0;
  const debt = currentForecast?.total_debt ?? 0;
  const remaining = currentForecast?.remaining_cash ?? 0;
  const cukup = remaining >= 0;

  return (
    <Card className="gap-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-[var(--nexus-emerald)]" />
        <h3 className="font-heading text-base font-semibold tracking-tight text-[var(--nexus-text-primary)]">Siklus gajian</h3>
      </div>

      {/* Tanggal gajian */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-28">
          <Input
            label="Tanggal gajian"
            type="number"
            min={1}
            max={31}
            value={dayInput}
            onChange={(e) => setDayInput(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" size="sm" loading={savingDay} onClick={saveDay}>Simpan</Button>
        {currentForecast && (
          <span className="text-xs text-[var(--nexus-text-muted)] pb-2">
            Periode berjalan: {currentForecast.period.label}
          </span>
        )}
      </div>

      {/* Ringkasan periode berjalan: gaji vs cicilan jatuh tempo sebelum gajian berikutnya */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--nexus-text-secondary)]"><Wallet className="w-3.5 h-3.5" /> Gaji periode ini</div>
          <p className="text-lg font-semibold text-[var(--nexus-text-primary)] tracking-tight mt-1">{formatCurrency(income)}</p>
        </div>
        <div className="rounded-xl border border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-panel)] p-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--nexus-text-secondary)]"><TrendingDown className="w-3.5 h-3.5" /> Cicilan jatuh tempo</div>
          <p className="text-lg font-semibold text-rose-400 tracking-tight mt-1">{formatCurrency(debt)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${cukup ? 'border-[var(--nexus-emerald-border)] bg-[var(--nexus-emerald-glow)]' : 'border-rose-500/30 bg-rose-500/10'}`}>
          <div className="flex items-center gap-1.5 text-xs text-[var(--nexus-text-secondary)]">
            {cukup ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--nexus-emerald)]" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            {cukup ? 'Sisa setelah cicilan' : 'Kurang'}
          </div>
          <p className={`text-lg font-semibold tracking-tight mt-1 ${cukup ? 'text-[var(--nexus-emerald)]' : 'text-rose-400'}`}>{formatCurrency(Math.abs(remaining))}</p>
        </div>
      </div>

      <p className="text-xs text-[var(--nexus-text-muted)]">
        {income === 0
          ? 'Isi gaji periode ini agar tahu cukup atau tidak untuk semua cicilan.'
          : cukup
            ? `Gaji cukup. Sisa ${formatCurrency(remaining)} bisa untuk kebutuhan lain atau cicilan baru.`
            : `Gaji kurang ${formatCurrency(-remaining)} untuk menutup semua cicilan siklus ini. Hindari menambah utang.`}
      </p>

      {/* Perbarui gaji (potongan/bonus) */}
      <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-[var(--nexus-glass-border)]">
        <div className="flex-1 min-w-[140px]">
          <Input
            label="Perbarui gaji (Rp)"
            type="number"
            min={0}
            placeholder="mis. ada bonus / potongan"
            value={incomeInput}
            onChange={(e) => setIncomeInput(e.target.value)}
          />
        </div>
        <div className="w-40">
          <Input label="Berlaku sejak" type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
        </div>
        <Button type="button" variant="nexus-emerald" size="sm" loading={savingIncome} onClick={saveIncome}>Simpan gaji</Button>
      </div>
    </Card>
  );
}
