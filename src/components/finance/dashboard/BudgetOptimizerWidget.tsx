'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/debt-planner/format';
import type { OptimizationSuggestion } from '@/lib/services/finance/budget-optimizer.service';

interface BudgetOptimizerWidgetProps {
  suggestions: OptimizationSuggestion[];
  onApply?: (suggestion: OptimizationSuggestion) => void;
}

export function BudgetOptimizerWidget({ suggestions, onApply }: BudgetOptimizerWidgetProps) {
  if (suggestions.length === 0) return null;

  return (
    <Card glass className="p-6 border-emerald-500/20 bg-emerald-500/5 rounded-[32px] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-black text-[var(--nexus-text-primary)] uppercase tracking-tight">AI Budget Optimizer</h3>
        </div>
        <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 tracking-widest uppercase">Beta</span>
      </div>

      <div className="space-y-4 relative z-10">
        {suggestions.slice(0, 2).map((s, i) => (
          <motion.div
            key={s.categoryId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-[var(--nexus-bg-panel)]/50 border border-[var(--nexus-glass-border)] space-y-3 hover:bg-[var(--nexus-bg-panel)] transition-all"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{s.categoryName}</p>
                <p className="text-[11px] font-bold text-[var(--nexus-text-secondary)] leading-relaxed uppercase tracking-tight">{s.reason}</p>
              </div>
              {s.priority === 'high' ? (
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--nexus-glass-border)]">
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-[var(--nexus-text-muted)] uppercase tracking-widest">Potensi Hemat</p>
                <p className="text-sm font-black text-emerald-400">{formatCurrency(s.potentialSavings)}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-auto py-2 text-[9px] font-black uppercase tracking-widest text-[var(--nexus-text-secondary)] hover:text-[var(--nexus-text-primary)] flex items-center gap-2 group/btn"
                onClick={() => onApply?.(s)}
              >
                Optimalkan <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {suggestions.length > 2 && (
        <button className="w-full mt-4 text-[9px] font-black text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] uppercase tracking-[0.2em] transition-colors">
          Lihat {suggestions.length - 2} Rekomendasi Lainnya
        </button>
      )}
    </Card>
  );
}
