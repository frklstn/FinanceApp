'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import type { ForecastAnalytics as Analytics } from '@/lib/debt-planner/types';
import { formatRupiah, formatDateId } from '@/lib/debt-planner/format';
import '@/styles/forecast/timeline.css';

interface ForecastAnalyticsProps {
  analytics: Analytics;
}

export function ForecastAnalyticsSummary({ analytics }: ForecastAnalyticsProps) {
  return (
    <Card className="p-5 mb-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-light-text-secondary dark:text-dark-text-secondary mb-4">
        Ringkasan Analitik
      </h3>
      <div className="forecast-analytics-grid">
        <div className="forecast-analytics-item">
          <p className="forecast-analytics-label">Total sisa utang</p>
          <p className="forecast-analytics-value">{formatRupiah(analytics.totalDebtAmount)}</p>
        </div>
        <div className="forecast-analytics-item">
          <p className="forecast-analytics-label">Total kewajiban bayar</p>
          <p className="forecast-analytics-value">
            {formatRupiah(analytics.totalRepaymentObligation)}
          </p>
        </div>
        <div className="forecast-analytics-item">
          <p className="forecast-analytics-label">Estimasi bebas utang</p>
          <p className="forecast-analytics-value">
            {analytics.estimatedDebtFreeDate
              ? formatDateId(analytics.estimatedDebtFreeDate)
              : '—'}
          </p>
        </div>
        <div className="forecast-analytics-item">
          <p className="forecast-analytics-label">Periode terberat</p>
          <p className="forecast-analytics-value">{analytics.highestDebtMonth ?? '—'}</p>
        </div>
        <div className="forecast-analytics-item">
          <p className="forecast-analytics-label">Periode teraman</p>
          <p className="forecast-analytics-value">{analytics.safestMonth ?? '—'}</p>
        </div>
        <div className="forecast-analytics-item">
          <p className="forecast-analytics-label">Rata-rata debt ratio</p>
          <p className="forecast-analytics-value">
            {analytics.averageDebtRatio > 0
              ? `${analytics.averageDebtRatio.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>
    </Card>
  );
}
