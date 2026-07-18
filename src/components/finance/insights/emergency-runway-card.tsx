'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShieldCheck, Info } from 'lucide-react';

interface EmergencyRunwayCardProps {
  runwayMonths: number;
}

export function EmergencyRunwayCard({ runwayMonths }: EmergencyRunwayCardProps) {
  const isHealthy = runwayMonths >= 6;
  const isWarning = runwayMonths >= 3 && runwayMonths < 6;

  const progress = Math.min((runwayMonths / 12) * 100, 100);

  const getStatusText = () => {
    if (runwayMonths >= 12) return 'Sangat kokoh';
    if (runwayMonths >= 6) return 'Aman';
    if (runwayMonths >= 3) return 'Waspada';
    return 'Kritis';
  };

  const barColor = isHealthy
    ? 'bg-[var(--nexus-emerald)]'
    : isWarning
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const statusBg = isHealthy
    ? 'bg-[var(--nexus-emerald-glow)] border-[var(--nexus-emerald-border)]'
    : isWarning
      ? 'bg-amber-500/10 border-amber-500/20'
      : 'bg-rose-500/10 border-rose-500/20';

  const textColor = isHealthy
    ? 'text-[var(--nexus-emerald)]'
    : isWarning
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full border ${statusBg} ${textColor}`}>
              {getStatusText()}
            </span>
            <h3 className="font-heading text-lg font-semibold text-[var(--nexus-text-primary)]">Dana darurat</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] ${textColor}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-semibold tracking-tight ${textColor}`}>
                {runwayMonths.toFixed(1)}
              </span>
              <span className="text-sm text-[var(--nexus-text-muted)] ml-1">bulan</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--nexus-text-muted)] block">Target survival</span>
              <span className="text-sm font-semibold text-[var(--nexus-text-primary)]">{Math.round((runwayMonths / 6) * 100)}%</span>
            </div>
          </div>

          <div className="h-2 w-full bg-[var(--nexus-bg-panel)] rounded-full overflow-hidden border border-[var(--nexus-glass-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${barColor}`}
            />
          </div>

          <div className="flex justify-between text-[10px] text-[var(--nexus-text-muted)]">
            <span>0 bln</span>
            <span>6 bln (aman)</span>
            <span>12+ bln</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
          <Info className={`w-5 h-5 mt-0.5 shrink-0 ${textColor}`} />
          <p className="text-xs text-[var(--nexus-text-secondary)] leading-relaxed">
            {runwayMonths >= 6
              ? 'Dana darurat kamu mencukupi untuk gaya hidup saat ini. Pertahankan aset likuid untuk keamanan jangka panjang.'
              : 'Perlu tingkatkan cadangan kas atau tekan pengeluaran bulanan buat mencapai batas aman 6 bulan survival.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
