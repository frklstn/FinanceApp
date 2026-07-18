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
    <Card className="border-[var(--nexus-emerald-border)] bg-[var(--nexus-emerald-glow)] relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--nexus-emerald-glow)] border border-[var(--nexus-emerald-border)]">
            <Sparkles className="w-5 h-5 text-[var(--nexus-emerald)]" />
          </div>
          <h3 className="font-heading text-sm font-semibold text-[var(--nexus-text-primary)]">AI Budget Optimizer</h3>
        </div>
        <span className="text-[10px] font-medium text-[var(--nexus-emerald)] bg-[var(--nexus-emerald-glow)] px-2 py-1 rounded-md border border-[var(--nexus-emerald-border)]">Beta</span>
      </div>

      <div className="space-y-4">
        {suggestions.slice(0, 2).map((s, i) => (
          <motion.div
            key={s.categoryId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-[var(--nexus-emerald)] mb-1">{s.categoryName}</p>
                <p className="text-xs text-[var(--nexus-text-secondary)] leading-relaxed">{s.reason}</p>
              </div>
              {s.priority === 'high' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-[var(--nexus-success)]" />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--nexus-glass-border)]">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[var(--nexus-text-muted)]">Potensi hemat</p>
                <p className="text-sm font-semibold text-[var(--nexus-success)]">{formatCurrency(s.potentialSavings)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-2 text-xs text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] flex items-center gap-2 group/btn"
                onClick={() => onApply?.(s)}
              >
                Optimalkan <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {suggestions.length > 2 && (
        <button className="w-full mt-4 text-xs text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] transition-colors">
          Lihat {suggestions.length - 2} rekomendasi lainnya
        </button>
      )}
    </Card>
  );
}
