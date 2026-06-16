'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface SurvivalAnalysisProps {
  insight: string | null;
  onAnalyze: () => void;
  loading?: boolean;
}

export function SurvivalAnalysis({ insight, onAnalyze, loading }: SurvivalAnalysisProps) {
  return (
    <div className="pinjol-insight-card mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <p className="pinjol-insight-label mb-0">
          <Lightbulb className="w-3.5 h-3.5" />
          Can I Survive?
        </p>
        <Button size="sm" onClick={onAnalyze} loading={loading} className="cursor-pointer">
          Analyze My Situation
        </Button>
      </div>
      {insight ? (
        <p className="pinjol-insight-text">{insight}</p>
      ) : (
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Klik tombol di atas untuk analisis deterministik berdasarkan forecast dan data utang
          aktif Anda.
        </p>
      )}
    </div>
  );
}
