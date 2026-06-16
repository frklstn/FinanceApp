'use client';

import React, { useState, useEffect } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { formatRupiah } from '@/lib/debt-planner/format';

interface CategoryRadarChartProps {
  data: { name: string; value: number; color: string }[];
  showLegend?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      color: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="glass-effect p-3 rounded-xl border border-light-border/40 dark:border-dark-border/40 text-light-text-primary dark:text-dark-text-primary text-xs font-bold space-y-1">
        <p className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}
        </p>
        <p className="text-sm font-extrabold text-primary">
          {formatRupiah(item.value)}
        </p>
      </div>
    );
  }
  return null;
};

export function CategoryRadarChart({ data, showLegend = false }: CategoryRadarChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // If there's no data or only 1-2 categories, radar can look sparse, but it's highly readable with the legend.
  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="relative w-full h-64 flex items-center justify-center">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="var(--text-secondary)" opacity={0.2} />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 8 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Pengeluaran"
              dataKey="value"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.25}
              dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 1.5, stroke: 'var(--bg-card)' }}
            />
          </RadarChart>
        </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-transparent" />
        )}
      </div>

      {/* Legend list */}
      {showLegend && (
        <div className="w-full flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
          {data.map((item, index) => {
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
            return (
              <div 
                key={index} 
                className="flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg hover:bg-light-bg/60 dark:hover:bg-dark-bg/60 transition-colors duration-150"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-light-text-secondary dark:text-dark-text-secondary font-bold shrink-0">
                  {formatRupiah(item.value)} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
