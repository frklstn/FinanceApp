'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/debt-planner/format';
import type { OptimizationSuggestion } from '@/lib/services/server/budget-optimizer.service';

interface BudgetOptimizerWidgetProps {
  suggestions: OptimizationSuggestion[];
  onApply?: (suggestion: OptimizationSuggestion) => void;
}

export function BudgetOptimizerWidget({ suggestions, onApply }: BudgetOptimizerWidgetProps) {
  if (suggestions.length === 0) return null;

  return (
    <Card className="border-primary-border bg-primary-glow relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-glow border border-primary-border">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading text-sm font-semibold text-text-primary">AI Budget Optimizer</h3>
        </div>
        <span className="text-[10px] font-medium text-primary bg-primary-glow px-2 py-1 rounded-md border border-primary-border">Beta</span>
      </div>

      <div className="space-y-4">
        {suggestions.slice(0, 2).map((s, i) => (
          <motion.div
            key={s.categoryId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-2xl bg-surface border border-line space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-primary mb-1">{s.categoryName}</p>
                <p className="text-xs text-text-secondary leading-relaxed">{s.reason}</p>
              </div>
              {s.priority === 'high' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-success" />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line">
              <div className="space-y-0.5">
                <p className="text-[10px] text-text-muted">Potensi hemat</p>
                <p className="text-sm font-semibold text-success">{formatCurrency(s.potentialSavings)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-2 text-xs text-text-muted hover:text-text-primary flex items-center gap-2 group/btn"
                onClick={() => onApply?.(s)}
              >
                Optimalkan <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {suggestions.length > 2 && (
        <button className="w-full mt-4 text-xs text-text-muted hover:text-text-primary transition-colors">
          Lihat {suggestions.length - 2} rekomendasi lainnya
        </button>
      )}
    </Card>
  );
}
