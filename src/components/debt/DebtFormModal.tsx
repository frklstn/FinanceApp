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
  amount_received: '',
  total_repayment: '',
  monthly_payment: '',
  tenure_months: '',
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

  const calcPreview = useMemo(() => {
    const tenureNum = parseInt(form.tenure_months, 10) || 0;
    if (!tenureNum || !form.start_date) return null;
    const remaining = calcRemainingMonths(tenureNum, form.start_date);
    const endDateStr = calcEndDate(form.start_date, tenureNum).toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
    return { remaining, endDateStr };
  }, [form.tenure_months, form.start_date]);

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
    const amtReceived = parseFloat(form.amount_received);
    const totalRepay = parseFloat(form.total_repayment);
    const monthly = parseFloat(form.monthly_payment);
    const tenure = parseInt(form.tenure_months, 10);
    const dueDay = parseInt(form.due_day, 10);

    if (
      !form.app_name.trim() ||
      isNaN(amtReceived) ||
      isNaN(totalRepay) ||
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
      amount_received: amtReceived,
      total_repayment: totalRepay,
      monthly_payment: monthly,
      tenure_months: tenure,
      due_day: dueDay,
      start_date: form.start_date,
      notes: form.notes.trim() || null,
      currency: 'IDR',
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Uang Diterima (Rp)"
            type="number"
            min={1}
            value={form.amount_received}
            onChange={(e) => handleChange('amount_received', e.target.value)}
            required
            disabled={submitting}
          />
          <Input
            label="Total Bayar (Rp)"
            type="number"
            min={1}
            value={form.total_repayment}
            onChange={(e) => handleChange('total_repayment', e.target.value)}
            required
            disabled={submitting}
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
            description="Tanggal jatuh tempo setiap bulan"
          />
          <DatePicker
            label="Tanggal Mulai"
            value={form.start_date}
            onChange={(val) => handleChange('start_date', val)}
            disabled={submitting}
          />
        </div>

        {calcPreview && (
          <div className="pinjol-calc-preview">
            <p className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-2">
              Kalkulasi Otomatis
            </p>
            <div className="pinjol-calc-preview-row">
              <span className="pinjol-calc-preview-label">Sisa bulan</span>
              <span className="pinjol-calc-preview-value">{calcPreview.remaining} bln</span>
            </div>
            <div className="pinjol-calc-preview-row">
              <span className="pinjol-calc-preview-label">Estimasi selesai</span>
              <span className="pinjol-calc-preview-value">{calcPreview.endDateStr}</span>
            </div>
          </div>
        )}

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
