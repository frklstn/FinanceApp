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
import { formatRupiah } from '@/lib/debt-planner/format';

interface SpendingChartProps {
  data: { date: string; amount: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  // Auto-calculate interval agar label X-axis tidak crowded
  const xInterval = data.length <= 3 ? 0 : data.length <= 7 ? 0 : data.length <= 24 ? 3 : 4;
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
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
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
        <XAxis
          dataKey="date"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
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
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700 }}
          axisLine={false}
          tickLine={false}
          width={45}
        />
        <Tooltip
          contentStyle={{
            background: '#0a0a0c',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '10px 16px',
          }}
          labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}
          itemStyle={{ color: '#10b981', fontSize: 12, fontWeight: 800 }}
          formatter={(value) => [formatRupiah(Number(value ?? 0)), 'Pengeluaran']}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorSpend)"
          dot={false}
          activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
