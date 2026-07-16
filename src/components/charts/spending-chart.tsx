'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/debt-planner/format';

interface SpendingChartProps {
  data: { date: string; amount: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  // Auto-calculate interval agar label X-axis tidak crowded
  const xInterval = data.length <= 3 ? 0 : data.length <= 7 ? 0 : data.length <= 24 ? 3 : 4;
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-xs text-[var(--nexus-text-muted)]">
          Tidak ada data pengeluaran
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--nexus-emerald)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--nexus-emerald)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--nexus-glass-border)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--nexus-text-muted)', fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          interval={xInterval}
        />
        <YAxis
          tickFormatter={(v) => {
            if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
            if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
            return `${v}`;
          }}
          tick={{ fill: 'var(--nexus-text-muted)', fontSize: 10, fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--nexus-bg-popup)',
            border: '1px solid var(--nexus-glass-border)',
            borderRadius: '16px',
            padding: '10px 16px',
          }}
          labelStyle={{ color: 'var(--nexus-text-secondary)', fontSize: 10, fontWeight: 600 }}
          itemStyle={{ color: 'var(--nexus-emerald)', fontSize: 12, fontWeight: 600 }}
          formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Pengeluaran']}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--nexus-emerald)"
          strokeWidth={3}
          fill="url(#colorSpend)"
          dot={false}
          activeDot={{ r: 4, fill: 'var(--nexus-emerald)', strokeWidth: 0 }}
          isAnimationActive={true}
          animationDuration={1500}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
