'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import {
  TrendingDown,
  Wallet,
  BadgePercent,
  ListChecks,
  Calendar,
  Activity,
} from 'lucide-react';
import type { PeriodForecast, SurvivalScore } from '@/lib/debt-planner/types';
import { HEALTH_STATUS_LABELS } from '@/lib/debt-planner/calculations';
import { formatRupiah, formatDateId } from '@/lib/debt-planner/format';


interface DebtDashboardProps {
  currentForecast: PeriodForecast;
  survivalScore: SurvivalScore;
  activeDebtCount: number;
  nextDueDate: Date | null;
}

function healthPillClass(status: string): string {
  switch (status) {
    case 'SAFE':
      return 'debt-health-pill debt-health-pill--safe';
    case 'CAUTION':
      return 'debt-health-pill debt-health-pill--caution';
    case 'HEAVY':
      return 'debt-health-pill debt-health-pill--heavy';
    default:
      return 'debt-health-pill debt-health-pill--danger';
  }
}

export function DebtDashboard({
  currentForecast,
  survivalScore,
  activeDebtCount,
  nextDueDate,
}: DebtDashboardProps) {
  const { total_debt, remaining_cash, debt_ratio, health_status, income } = currentForecast;

  return (
    <div className="debt-dashboard-grid debt-dashboard-grid--six">
      <Card className="debt-score-card p-5 bg-gradient-to-br from-primary/5 to-info/5 border-primary/20">
        <div className="debt-score-ring">
          <div>
            <p className="pinjol-stat-label text-primary">Survival Score</p>
            <p className="debt-score-value text-primary">{survivalScore.score}/100</p>
            <p className="debt-score-label">{survivalScore.label}</p>
          </div>
          <Activity className="w-10 h-10 text-primary opacity-40 shrink-0" />
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-danger/5 to-danger/10 border-danger/20 flex items-center justify-between gap-4">
        <div>
          <p className="pinjol-stat-label text-danger">Total Debt This Period</p>
          <p className="pinjol-stat-value text-danger">{formatRupiah(total_debt)}</p>
          <p className="pinjol-stat-sub text-danger">Siklus gajian aktif</p>
        </div>
        <div className="pinjol-stat-icon bg-danger/10 text-danger">
          <TrendingDown className="w-5 h-5" />
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-success/5 to-success/10 border-success/20 flex items-center justify-between gap-4">
        <div>
          <p className="pinjol-stat-label text-success">Remaining Cash</p>
          <p className="pinjol-stat-value text-success">
            {income > 0 ? formatRupiah(remaining_cash) : '—'}
          </p>
          <p className="pinjol-stat-sub text-success">
            {remaining_cash < 0 ? 'Deficit!' : 'Setelah cicilan'}
          </p>
        </div>
        <div className="pinjol-stat-icon bg-success/10 text-success">
          <Wallet className="w-5 h-5" />
        </div>
      </Card>

      <Card className="p-5 bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 flex items-center justify-between gap-4">
        <div>
          <p className="pinjol-stat-label text-warning">Debt Ratio</p>
          <p className="pinjol-stat-value text-warning">
            {income > 0 ? `${debt_ratio.toFixed(1)}%` : '—'}
          </p>
          <span className={healthPillClass(health_status)}>
            {HEALTH_STATUS_LABELS[health_status]}
          </span>
        </div>
        <div className="pinjol-stat-icon bg-warning/10 text-warning">
          <BadgePercent className="w-5 h-5" />
        </div>
      </Card>

      <Card className="p-4 flex items-center justify-between gap-3">
        <div>
          <p className="pinjol-stat-label">Active Debt Count</p>
          <p className="text-2xl font-extrabold text-light-text-primary dark:text-dark-text-primary">
            {activeDebtCount}
          </p>
        </div>
        <ListChecks className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
      </Card>

      <Card className="p-4 flex items-center justify-between gap-3">
        <div>
          <p className="pinjol-stat-label">Next Due Date</p>
          <p className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary">
            {nextDueDate ? formatDateId(nextDueDate) : '—'}
          </p>
        </div>
        <Calendar className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
      </Card>
    </div>
  );
}
