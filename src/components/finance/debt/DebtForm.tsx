'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { PinjolCalcPanel } from '@/components/finance/pinjol/pinjol-calc-panel';
import type { LoanCategory, LoanTracker } from '@/lib/debt-planner/types';
import { LOAN_CATEGORY_LABELS } from '@/lib/debt-planner/calculations';

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
  paid_months: '',
  due_day: '',
  start_date: '',
  notes: '',
};

interface DebtFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  submitting?: boolean;
}

export function DebtFormModal({ isOpen, onClose, onSubmit, submitting }: DebtFormModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);

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
    const monthly = parseFloat(form.monthly_payment);
    const tenure = parseInt(form.tenure_months, 10);
    const dueDay = parseInt(form.due_day, 10);
    // Lupa nominal diterima -> pakai jumlah diajukan (anggap tanpa potongan).
    const amtReceived = form.amount_received
      ? parseFloat(form.amount_received)
      : (isNaN(amtApplied) ? NaN : amtApplied);
    // Cicilan yang sudah dibayar (untuk pinjaman yang sudah berjalan).
    const paidMonths = Math.min(Math.max(parseInt(form.paid_months, 10) || 0, 0), tenure || 0);

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
      // Sisa kewajiban menyesuaikan cicilan yang sudah berjalan.
      total_remaining_balance: monthly * Math.max(tenure - paidMonths, 0),
      monthly_payment: monthly,
      tenure_months: tenure,
      due_day: dueDay,
      start_date: form.start_date,
      status: 'active',
      salary_date: null,
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
          <CurrencyInput
            label="Jumlah Diajukan (Rp)"
            value={form.amount_applied}
            onChange={(raw) => handleChange('amount_applied', raw)}
            disabled={submitting}
            description="Yang kamu ajukan (boleh kosong)"
          />
          <CurrencyInput
            label="Uang Diterima (Rp)"
            value={form.amount_received}
            onChange={(raw) => handleChange('amount_received', raw)}
            disabled={submitting}
            description="Kosongkan jika lupa; dipakai jumlah diajukan"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <CurrencyInput
            label="Cicilan / Bulan (Rp)"
            value={form.monthly_payment}
            onChange={(raw) => handleChange('monthly_payment', raw)}
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

        {/* Pinjaman yang sudah berjalan: berapa cicilan sudah dibayar. Sisa
            kewajiban dihitung dari sini. */}
        <div className="space-y-1.5">
          <Input
            label="Cicilan sudah dibayar (bulan)"
            type="number"
            min={0}
            max={Number(form.tenure_months) || undefined}
            value={form.paid_months}
            onChange={(e) => handleChange('paid_months', e.target.value)}
            disabled={submitting}
            description="Isi jika pinjaman sudah jalan; kosongkan kalau baru"
          />
          {(() => {
            const tenure = Number(form.tenure_months) || 0;
            const paid = Math.min(Number(form.paid_months) || 0, tenure);
            const monthly = Number(form.monthly_payment) || 0;
            if (!tenure || !paid) return null;
            const left = Math.max(tenure - paid, 0);
            return (
              <p className="text-xs text-[var(--nexus-emerald)]">
                Sisa {left} dari {tenure} cicilan
                {monthly > 0 && ` · Rp ${(left * monthly).toLocaleString('id-ID')}`}
              </p>
            );
          })()}
        </div>

        <PinjolCalcPanel
          applied={form.amount_applied}
          received={form.amount_received || form.amount_applied}
          tenure={form.tenure_months}
          monthly={form.monthly_payment}
          startDate={form.start_date}
        />

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
          <DatePicker
            label="Tanggal Mulai (asli)"
            value={form.start_date}
            onChange={(val) => handleChange('start_date', val)}
            disabled={submitting}
          />
        </div>

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
