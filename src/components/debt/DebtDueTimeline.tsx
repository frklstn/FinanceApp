'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import type { LoanTracker } from '@/lib/debt-planner/types';
import { formatEndMonth, getUpcomingDueDates, LOAN_CATEGORY_LABELS } from '@/lib/debt-planner/calculations';
import { formatCurrency } from '@/lib/debt-planner/format';

interface DebtDueTimelineProps {
  loans: LoanTracker[];
}

export function DebtDueTimeline({ loans }: DebtDueTimelineProps) {
  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);
  const sorted = useMemo(
    () => [...activeLoans].sort((a, b) => a.due_day - b.due_day),
    [activeLoans]
  );
  const imminent = useMemo(() => getUpcomingDueDates(activeLoans, 7), [activeLoans]);
  const total = activeLoans.reduce((s, l) => s + Number(l.monthly_payment), 0);

  return (
    <Card className="p-5 md:p-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Timeline Jatuh Tempo Bulanan
      </h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Tidak ada cicilan aktif.
        </p>
      ) : (
        <>
          <div className="pinjol-timeline">
            {sorted.map((loan) => {
              const isUrgent = imminent.some((l) => l.id === loan.id);
              return (
                <div key={loan.id} className="pinjol-timeline-item">
                  <div className={`pinjol-timeline-day ${isUrgent ? 'urgent' : 'normal'}`}>
                    {loan.due_day}
                  </div>
                  <div className="pinjol-timeline-info">
                    <p className="pinjol-timeline-name">{loan.app_name}</p>
                    <p className="pinjol-timeline-detail">
                      {LOAN_CATEGORY_LABELS[loan.category] || loan.category} · Selesai{' '}
                      {formatEndMonth(loan.start_date, loan.tenure_months)}
                    </p>
                  </div>
                  <div className="pinjol-timeline-amount">{formatCurrency(loan.monthly_payment)}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center pt-4 mt-2 border-t border-light-border/40 dark:border-dark-border/40">
            <span className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary">
              Total / Bulan
            </span>
            <span className="text-lg font-extrabold text-danger">{formatCurrency(total)}</span>
          </div>
        </>
      )}
    </Card>
  );
}
