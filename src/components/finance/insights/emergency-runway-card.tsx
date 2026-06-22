'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShieldCheck, Info } from 'lucide-react';

interface EmergencyRunwayCardProps {
  runwayMonths: number;
}

export function EmergencyRunwayCard({ runwayMonths }: EmergencyRunwayCardProps) {
  // Thresholds for colors
  const isHealthy = runwayMonths >= 6;
  const isWarning = runwayMonths >= 3 && runwayMonths < 6;
  
  // Progress calculation (clamped at 12 months for 100%)
  const progress = Math.min((runwayMonths / 12) * 100, 100);
  
  const getStatusText = () => {
    if (runwayMonths >= 12) return 'Benteng Finansial Kokoh';
    if (runwayMonths >= 6) return 'Sangat Aman';
    if (runwayMonths >= 3) return 'Waspada';
    return 'Kritis';
  };

  const getStatusColor = () => {
    if (isHealthy) return 'from-emerald-500 to-teal-400';
    if (isWarning) return 'from-amber-500 to-orange-400';
    return 'from-rose-600 to-pink-500';
  };

  const getStatusBg = () => {
    if (isHealthy) return 'bg-emerald-500/10 border-emerald-500/20';
    if (isWarning) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  const getTextColor = () => {
    if (isHealthy) return 'text-emerald-400';
    if (isWarning) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <Card className="p-6 md:p-8 overflow-hidden relative border-[var(--nexus-glass-border)] bg-[var(--nexus-bg-card)] backdrop-blur-xl">
      {/* Background Glow */}
      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br ${getStatusColor()}`} />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-widest border ${getStatusBg()} ${getTextColor()}`}>
                {getStatusText()}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-[var(--nexus-text-primary)]">Emergency Runway</h3>
          </div>
          <div className={`p-3 rounded-2xl bg-[var(--nexus-bg-panel)]/50 border border-[var(--nexus-glass-border)] ${getTextColor()}`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black tracking-tighter ${getTextColor()}`}>
                {runwayMonths.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-[var(--nexus-text-secondary)] uppercase tracking-widest ml-1">Bulan</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[var(--nexus-text-secondary)] uppercase tracking-widest block">Survival Score</span>
              <span className="text-sm font-black text-[var(--nexus-text-primary)]">{Math.round((runwayMonths / 6) * 100)}% Target</span>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="h-3 w-full bg-[var(--nexus-bg-panel)]/50 rounded-full overflow-hidden border border-[var(--nexus-glass-border)] p-[1px]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${getStatusColor()} shadow-[0_0_15px_rgba(16,185,129,0.3)]`}
            />
          </div>

          <div className="flex justify-between text-[10px] font-bold text-[var(--nexus-text-muted)] uppercase tracking-[0.2em]">
            <span>0 Bln</span>
            <span>6 Bln (Safe)</span>
            <span>12+ Bln</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--nexus-bg-panel)]/50 border border-[var(--nexus-glass-border)]">
          <Info className={`w-5 h-5 mt-0.5 shrink-0 ${getTextColor()}`} />
          <p className="text-xs font-medium text-[var(--nexus-text-secondary)] leading-relaxed">
            {runwayMonths >= 6 
              ? 'Dana darurat Anda mencukupi untuk gaya hidup saat ini. Pertahankan aset likuid untuk keamanan jangka panjang.' 
              : 'Anda perlu meningkatkan cadangan kas atau menekan pengeluaran bulanan untuk mencapai batas aman 6 bulan survival.'}
          </p>
        </div>
      </div>
    </Card>
  );
}
