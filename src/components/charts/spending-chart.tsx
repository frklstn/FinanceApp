'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SpendingChartProps {
  data: { date: string; amount: number }[];
}

import { formatRupiah } from '@/lib/debt-planner/format';

// Format numbers nicely
const formatCurrency = (val: number) => {
  return formatRupiah(val);
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
}

// Custom premium glassmorphism tooltip
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-effect p-3 rounded-xl border border-light-border/40 dark:border-dark-border/40 text-light-text-primary dark:text-dark-text-primary text-xs font-bold space-y-1">
        <p className="opacity-60">{label}</p>
        <p className="text-primary dark:text-white text-sm font-extrabold">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            opacity={0.4}
          />
          <YAxis
            stroke="var(--text-secondary)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            opacity={0.4}
            tickFormatter={(v) => formatRupiah(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#spendingGrad)"
            activeDot={{ r: 6, stroke: 'var(--bg-card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
