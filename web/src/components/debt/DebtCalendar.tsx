'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import type { LoanTracker } from '@/lib/debt-planner/types';
import { LOAN_CATEGORY_LABELS, hasClusteredDueDates } from '@/lib/debt-planner/calculations';
import { formatRupiah } from '@/lib/debt-planner/format';
import '@/styles/debt/calendar.css';

interface CalendarEntry {
  day: number;
  label: string;
  sub?: string;
  amount?: number;
  type: 'debt' | 'salary' | 'cluster';
}

interface DebtCalendarProps {
  loans: LoanTracker[];
  salaryDay: number;
}

export function DebtCalendar({ loans, salaryDay }: DebtCalendarProps) {
  const entries = useMemo(() => {
    const active = loans.filter((l) => l.status === 'active');
    const clustered = hasClusteredDueDates(active);
    const clusterDays = new Set<number>();

    if (clustered) {
      const sorted = [...active].sort((a, b) => a.due_day - b.due_day);
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1].due_day - sorted[i].due_day <= 5) {
          clusterDays.add(sorted[i].due_day);
          clusterDays.add(sorted[i + 1].due_day);
        }
      }
    }

    const items: CalendarEntry[] = active.map((l) => ({
      day: l.due_day,
      label: l.app_name,
      sub: LOAN_CATEGORY_LABELS[l.category] || l.category,
      amount: Number(l.monthly_payment),
      type: clusterDays.has(l.due_day) ? 'cluster' : 'debt',
    }));

    items.push({
      day: salaryDay,
      label: 'Gajian',
      sub: 'Pendapatan periode',
      type: 'salary',
    });

    return items.sort((a, b) => a.day - b.day);
  }, [loans, salaryDay]);

  return (
    <Card className="p-5 md:p-6">
      <h3 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-4 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Kalender Jatuh Tempo
      </h3>

      {entries.length <= 1 ? (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Tidak ada cicilan aktif. Tambahkan utang untuk melihat kalender.
        </p>
      ) : (
        <div className="debt-calendar">
          {entries.map((entry, idx) => (
            <div key={`${entry.day}-${entry.label}-${idx}`} className="debt-calendar-item">
              <div
                className={`debt-calendar-day debt-calendar-day--${entry.type === 'salary' ? 'salary' : entry.type === 'cluster' ? 'cluster' : 'debt'}`}
              >
                {entry.day}
              </div>
              <div className="debt-calendar-info">
                <p className="debt-calendar-name">{entry.label}</p>
                {entry.sub && <p className="debt-calendar-sub">{entry.sub}</p>}
              </div>
              {entry.amount != null && (
                <span className="debt-calendar-amount">{formatRupiah(entry.amount)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
