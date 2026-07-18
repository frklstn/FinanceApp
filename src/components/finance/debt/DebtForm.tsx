'use client';

import React, { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import type { LoanCategory, LoanTracker } from '@/lib/debt-planner/types';
import { calcRemainingMonths, calcEndDate, LOAN_CATEGORY_LABELS } from '@/lib/debt-planner/calculations';

const CATEGORY_OPTIONS = Object.entries(LOAN_CATEGORY_LABELS)
  .filter(([key]) => !['hutang_pribadi', 'cicilan', 'lainnya'].includes(key))
  .map(([value, label]) => ({ value, label }));

const EMPTY_FORM = {
  app_name: '',
  category: 'pinjol' as LoanCategory,
  amount_applied: '',
  amount_received: '',
  monthly_payment: '',
  tenure_months: '',
  due_day: '',
  salary_date: '',
  start_date: '',
  notes: '',
};

const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  submitting?: boolean;
}

export function DebtFormModal({ isOpen, onClose, onSubmit, submitting }: DebtFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  // Hitung otomatis dari yang diisi user: diajukan, diterima, tenor, cicilan.
  // Semua turunan (total, bunga, potongan, nombok) tak perlu diketik manual.
  const calc = useMemo(() => {
    const applied = parseFloat(form.amount_applied) || 0;
    const received = parseFloat(form.amount_received) || 0;
    const tenure = parseInt(form.tenure_months, 10) || 0;
    const monthly = parseFloat(form.monthly_payment) || 0;
    if (!tenure || !monthly || !received) return null;

    const total = monthly * tenure;                 // total yang dibayar
    const adminFee = applied > received ? applied - received : 0; // potongan di depan
    const interest = total - received;               // biaya di atas uang diterima
    const monthlyRate = (interest / received / tenure) * 100; // bunga rata-rata %/bln
    const nombok = monthly - received / tenure;      // kelebihan bayar tiap bulan

    const endDateStr = form.start_date
      ? calcEndDate(form.start_date, tenure).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : null;
    const remaining = form.start_date ? calcRemainingMonths(tenure, form.start_date) : null;

    return { total, adminFee, interest, monthlyRate, nombok, endDateStr, remaining };
  }, [form.amount_applied, form.amount_received, form.tenure_months, form.monthly_payment, form.start_date]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const reset = () => setForm(EMPTY_FORM);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amtApplied = parseFloat(form.amount_applied);
    const amtReceived = parseFloat(form.amount_received);
    const monthly = parseFloat(form.monthly_payment);
    const tenure = parseInt(form.tenure_months, 10);
    const dueDay = parseInt(form.due_day, 10);
    const salaryDay = parseInt(form.salary_date, 10);

    if (
      !form.app_name.trim() ||
      isNaN(amtReceived) ||
      isNaN(monthly) ||
      isNaN(tenure) ||
      isNaN(dueDay) ||
      !form.start_date
    ) {
      return;
    }

    await onSubmit({
      app_name: form.app_name.trim(),
      category: form.category,
      amount_applied: isNaN(amtApplied) ? null : amtApplied,
      amount_received: amtReceived,
      // Total dihitung, bukan diketik: cicilan x tenor.
      total_repayment: monthly * tenure,
      monthly_payment: monthly,
      tenure_months: tenure,
      due_day: dueDay,
      start_date: form.start_date,
      status: 'active',
      salary_date: isNaN(salaryDay) ? null : salaryDay,
      currency: 'IDR',
      notes: form.notes.trim() || null,
    });
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Pinjaman / Cicilan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Pinjaman / Aplikasi"
          placeholder="cth. Adapundi, Akulaku"
          value={form.app_name}
          onChange={(e) => handleChange('app_name', e.target.value)}
          required
          disabled={submitting}
        />

        <Select
          label="Kategori"
          options={[{ value: '', label: '-- Pilih --' }, ...CATEGORY_OPTIONS]}
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          required
          disabled={submitting}
        />

        {/* Yang diisi user: diajukan, diterima, tenor, cicilan. Sisanya dihitung. */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Jumlah Diajukan (Rp)"
            type="number"
            min={1}
            value={form.amount_applied}
            onChange={(e) => handleChange('amount_applied', e.target.value)}
            disabled={submitting}
            description="Yang kamu ajukan"
          />
          <Input
            label="Uang Diterima (Rp)"
            type="number"
            min={1}
            value={form.amount_received}
            onChange={(e) => handleChange('amount_received', e.target.value)}
            required
            disabled={submitting}
            description="Yang masuk ke rekening"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cicilan / Bulan (Rp)"
            type="number"
            min={1}
            value={form.monthly_payment}
            onChange={(e) => handleChange('monthly_payment', e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Tenor (Bulan)"
            type="number"
            min={1}
            max={360}
            value={form.tenure_months}
            onChange={(e) => handleChange('tenure_months', e.target.value)}
            required
            disabled={submitting}
          />
        </div>

        {/* Panel hasil hitungan otomatis */}
        {calc && (
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
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Jatuh Tempo (Tgl)"
            type="number"
            min={1}
            max={31}
            value={form.due_day}
            onChange={(e) => handleChange('due_day', e.target.value)}
            required
            disabled={submitting}
            description="Tanggal tagihan tiap bulan"
          />
          <Input
            label="Tgl Gajian"
            type="number"
            min={1}
            max={31}
            value={form.salary_date}
            onChange={(e) => handleChange('salary_date', e.target.value)}
            disabled={submitting}
            description="Untuk menandai tagihan sebelum/sesudah gajian"
          />
        </div>

        <DatePicker
          label="Tanggal Mulai"
          value={form.start_date}
          onChange={(val) => handleChange('start_date', val)}
          disabled={submitting}
        />

        <Input
          label="Catatan (Opsional)"
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          disabled={submitting}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" loading={submitting}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
