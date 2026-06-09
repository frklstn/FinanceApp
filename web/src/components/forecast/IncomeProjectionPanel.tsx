'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Wallet, Trash2 } from 'lucide-react';
import type { IncomeTimelineEntry } from '@/lib/debt-planner/types';
import { formatRupiah } from '@/lib/debt-planner/format';
import '@/styles/forecast/timeline.css';

interface IncomeProjectionPanelProps {
  timeline: IncomeTimelineEntry[];
  salaryDay: number;
  onSaveSalaryDay: (day: number) => Promise<void>;
  onAddEntry: (effectiveDate: string, monthlyIncome: number) => Promise<void>;
  onRemoveEntry: (id: string) => Promise<void>;
  disabled?: boolean;
}

export function IncomeProjectionPanel({
  timeline,
  salaryDay,
  onSaveSalaryDay,
  onAddEntry,
  onRemoveEntry,
  disabled,
}: IncomeProjectionPanelProps) {
  const [salaryDraft, setSalaryDraft] = useState(String(salaryDay));
  const [prevSalaryDay, setPrevSalaryDay] = useState(salaryDay);

  if (salaryDay !== prevSalaryDay) {
    setPrevSalaryDay(salaryDay);
    setSalaryDraft(String(salaryDay));
  }
  const [effectiveDate, setEffectiveDate] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSalarySave = async () => {
    const day = parseInt(salaryDraft, 10);
    if (isNaN(day) || day < 1 || day > 31) return;
    setSaving(true);
    try {
      await onSaveSalaryDay(day);
    } finally {
      setSaving(false);
    }
  };

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseFloat(monthlyIncome);
    if (!effectiveDate || isNaN(income) || income < 0) return;
    setSaving(true);
    try {
      await onAddEntry(effectiveDate, income);
      setEffectiveDate('');
      setMonthlyIncome('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 mb-5">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-4 h-4 text-success" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
          Income Projection & Siklus Gaji
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary block mb-1">
            Tanggal Gajian (siklus)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={31}
              className="flex-1 px-3 py-2 rounded-lg bg-light-card border border-light-border dark:bg-dark-bg/40 dark:border-dark-border text-sm focus:outline-none focus:border-primary"
              value={salaryDraft}
              onChange={(e) => setSalaryDraft(e.target.value)}
              disabled={disabled || saving}
            />
            <Button size="sm" onClick={handleSalarySave} loading={saving} disabled={disabled}>
              Simpan
            </Button>
          </div>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
            Contoh: gajian tgl 20 → periode 20 Mei – 19 Juni
          </p>
        </div>
      </div>

      <form onSubmit={handleAddIncome} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <DatePicker
          label="Efektif dari"
          value={effectiveDate}
          onChange={(val) => setEffectiveDate(val)}
          disabled={disabled || saving}
        />
        <Input
          label="Gaji bulanan (Rp)"
          type="number"
          min={0}
          value={monthlyIncome}
          onChange={(e) => setMonthlyIncome(e.target.value)}
          required
          disabled={disabled || saving}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full" loading={saving} disabled={disabled}>
            Tambah
          </Button>
        </div>
      </form>

      {timeline.length === 0 ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Belum ada timeline gaji. Tambahkan entri untuk forecast yang akurat.
        </p>
      ) : (
        <div className="forecast-income-list">
          {timeline.map((entry) => (
            <div key={entry.id} className="forecast-income-row">
              <span>
                {new Date(entry.effective_date).toLocaleDateString('id-ID')} →{' '}
                {formatRupiah(Number(entry.monthly_income))}
              </span>
              <button
                type="button"
                className="p-1 rounded hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer"
                onClick={() => onRemoveEntry(entry.id)}
                disabled={disabled}
                title="Hapus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
