import styles from './spending-chart.module.css';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
              <stop offset="5%" stopColor="#6E5CFF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#6E5CFF" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.03)" />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            opacity={0.6}
            dy={10}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            opacity={0.6}
            tickFormatter={(v) => v > 1000 ? `${v/1000}k` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="basis" // Smoother curves
            dataKey="amount"
            stroke="#8B7CFF"
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#spendingGrad)"
            animationDuration={2000}
            activeDot={{ 
              r: 6, 
              fill: '#8B7CFF', 
              stroke: '#050816', 
              strokeWidth: 3,
              style: { filter: 'drop-shadow(0 0 12px #8B7CFF)' } 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
