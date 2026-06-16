'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Trash2 } from 'lucide-react';
import type { LoanTracker } from '@/lib/debt-planner/types';
import { computeLoanMetrics, LOAN_CATEGORY_LABELS } from '@/lib/debt-planner/calculations';
import { formatRupiah } from '@/lib/debt-planner/format';

interface ActiveDebtCardProps {
  loan: LoanTracker;
  onMarkPaid: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
}

function getCategoryBadgeClass(category: string): string {
  const key = category.replace(/[^a-z_]/g, '');
  return `pinjol-debt-category-badge badge-${key}`;
}

export function ActiveDebtCard({ loan, onMarkPaid, onDelete }: ActiveDebtCardProps) {
  const metrics = computeLoanMetrics(loan);
  const isPaidOff = loan.status === 'paid_off';
  const categoryLabel = LOAN_CATEGORY_LABELS[loan.category] || loan.category;

  return (
    <Card className={`pinjol-debt-card ${isPaidOff ? 'opacity-60' : ''}`}>
      <div className="pinjol-debt-header">
        <div>
          <p className="pinjol-debt-name">{loan.app_name}</p>
          <span className={getCategoryBadgeClass(loan.category)}>{categoryLabel}</span>
        </div>
        <div className="flex gap-1">
          {!isPaidOff && (
            <button
              type="button"
              onClick={() => onMarkPaid(loan.id, loan.app_name)}
              className="p-1.5 rounded-lg hover:bg-success/10 text-light-text-secondary hover:text-success cursor-pointer transition-all duration-150"
              title="Tandai Lunas"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(loan.id, loan.app_name)}
            className="p-1.5 rounded-lg hover:bg-danger/10 text-light-text-secondary hover:text-danger cursor-pointer transition-all duration-150"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="pinjol-debt-amount">
        {formatRupiah(loan.monthly_payment)}
        <span>/bulan</span>
      </p>

      {!isPaidOff && (
        <Progress
          value={metrics.progressPercent}
          variant={metrics.progressPercent > 66 ? 'success' : 'primary'}
          showLabel
          label={`Progress — selesai ${metrics.endMonthLabel}`}
        />
      )}

      <div className="pinjol-debt-meta">
        <div className="pinjol-debt-meta-item">
          <span className="pinjol-debt-meta-label">Jatuh Tempo</span>
          <span className="pinjol-debt-meta-value">Tgl {loan.due_day}</span>
        </div>
        <div className="pinjol-debt-meta-item">
          <span className="pinjol-debt-meta-label">Sisa Bulan</span>
          <span className="pinjol-debt-meta-value">
            {isPaidOff ? 'Lunas' : `${metrics.remainingMonths} bln`}
          </span>
        </div>
        <div className="pinjol-debt-meta-item">
          <span className="pinjol-debt-meta-label">Selesai</span>
          <span className="pinjol-debt-meta-value">{metrics.endMonthLabel}</span>
        </div>
        <div className="pinjol-debt-meta-item">
          <span className="pinjol-debt-meta-label">Sisa kewajiban</span>
          <span className="pinjol-debt-meta-value">
            {formatRupiah(metrics.remainingObligation)}
          </span>
        </div>
      </div>

      {loan.notes && (
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary line-clamp-2">
          {loan.notes}
        </p>
      )}

      <div className="pinjol-debt-footer">
        <span
          className={`pinjol-status-badge ${isPaidOff ? 'pinjol-status-paid' : 'pinjol-status-active'}`}
        >
          {isPaidOff ? 'Lunas' : 'Aktif'}
        </span>
      </div>
    </Card>
  );
}
