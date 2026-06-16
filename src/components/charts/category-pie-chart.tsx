'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface CategoryPieChartProps {
  data: { name: string; value: number; color: string }[];
}

import { formatRupiah } from '@/lib/debt-planner/format';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      color: string;
    };
  }>;
  total?: number;
}

// Custom premium glassmorphism tooltip
const CustomTooltip = ({ active, payload, total }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const percentage = (total !== undefined && total > 0) ? ((item.value / total) * 100).toFixed(0) : '0';
    return (
      <div className="glass-effect p-3 rounded-xl border border-light-border/40 dark:border-dark-border/40 text-light-text-primary dark:text-dark-text-primary text-xs font-bold space-y-1">
        <p className="flex items-center gap-1.5 font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.name}
        </p>
        <p className="text-sm font-extrabold">
          {formatRupiah(item.value)}
        </p>
        <p className="opacity-60 font-semibold">{percentage}% dari total pengeluaran</p>
      </div>
    );
  }
  return null;
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <div className="w-full flex flex-col items-center gap-5">
      {/* Chart wrapper - relative height, square proportions for a perfect circle */}
      <div className="relative w-full max-w-[200px] h-44 flex items-center justify-center">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip total={total} />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => {
                const isHovered = activeIndex === index;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    stroke="var(--bg-card)" 
                    strokeWidth={isHovered ? 2.5 : 1.5} 
                    style={{
                      filter: isHovered ? 'drop-shadow(0px 0px 6px rgba(255,255,255,0.15))' : 'none',
                      cursor: 'pointer',
                      transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                      transformOrigin: '50% 50%',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-transparent" />
        )}
      </div>

      {/* Legend list */}
      <div className="w-full flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
        {data.map((item, index) => {
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : '0';
          const isHovered = activeIndex === index;
          return (
            <div 
              key={index} 
              className={`flex items-center justify-between gap-3 text-xs p-1.5 rounded-lg transition-colors duration-150 ${
                isHovered ? 'bg-light-bg/60 dark:bg-dark-bg/60' : ''
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className={`font-semibold text-light-text-primary dark:text-dark-text-primary truncate ${
                  isHovered ? 'text-primary font-bold' : ''
                }`}>
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
    </div>
  );
}
