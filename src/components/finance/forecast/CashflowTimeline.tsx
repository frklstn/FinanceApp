'use client';

import React from 'react';
import type { PeriodForecast } from '@/lib/debt-planner/types';
import { HEALTH_STATUS_LABELS } from '@/lib/debt-planner/calculations';
import { formatCurrency } from '@/lib/debt-planner/format';
import '@/styles/forecast/timeline.css';

interface CashflowTimelineProps {
  periods: PeriodForecast[];
}

function cardModifier(status: string): string {
  if (status === 'DANGER') return 'forecast-period-card forecast-period-card--danger';
  if (status === 'HEAVY') return 'forecast-period-card forecast-period-card--heavy';
  return 'forecast-period-card';
}

export function CashflowTimeline({ periods }: CashflowTimelineProps) {
  if (periods.length === 0) {
    return (
      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
        Tambahkan utang dan timeline gaji untuk melihat forecast.
      </p>
    );
  }

  return (
    <div className="forecast-timeline">
      {periods.map((p) => (
        <div key={p.period.label} className={cardModifier(p.health_status)}>
          <div className="forecast-period-header">
            <span className="forecast-period-title">{p.period.label}</span>
            <span className={`debt-health-pill debt-health-pill--${p.health_status.toLowerCase()}`}>
              {HEALTH_STATUS_LABELS[p.health_status]}
            </span>
          </div>
          <div className="forecast-period-metrics">
            <div>
              <p className="forecast-metric-label">Income</p>
              <p className="forecast-metric-value">{formatCurrency(p.income)}</p>
            </div>
            <div>
              <p className="forecast-metric-label">Total debt</p>
              <p className="forecast-metric-value text-danger">{formatCurrency(p.total_debt)}</p>
            </div>
            <div>
              <p className="forecast-metric-label">Remaining</p>
              <p className="forecast-metric-value text-success">{formatCurrency(p.remaining_cash)}</p>
            </div>
            <div>
              <p className="forecast-metric-label">Debt ratio</p>
              <p className="forecast-metric-value">
                {p.income > 0 ? `${p.debt_ratio.toFixed(0)}%` : '—'}
              </p>
            </div>
          </div>
          {p.warnings.length > 0 && (
            <div className="forecast-period-warnings">
              {p.warnings.map((w, i) => (
                <p key={i} className="forecast-period-warning">
                  {w.message}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
