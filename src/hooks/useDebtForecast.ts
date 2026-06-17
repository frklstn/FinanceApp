'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IncomeTimelineEntry, LoanTracker } from '@/lib/debt-planner/types';
import { incomeProjectionService } from '@/lib/services/income-projection.service';
import { debtPlannerSettingsService } from '@/lib/services/debt-planner-settings.service';
import {
  buildForecastAnalytics,
  buildForecastTimeline,
  computeDashboardSurvivalScore,
  generateGlobalWarnings,
  generateSurvivalInsight,
  getCurrentPeriodForecast,
} from '@/lib/services/forecast.service';
import { getNextDueDate } from '@/lib/debt-planner/calculations';

const FORECAST_PERIOD_COUNT = 12;

export function useDebtForecast(accountId: string | undefined, loans: LoanTracker[]) {
  const [incomeTimeline, setIncomeTimeline] = useState<IncomeTimelineEntry[]>([]);
  const [salaryDay, setSalaryDay] = useState(1);
  const [plannerLoading, setPlannerLoading] = useState(true);
  const [insightRequested, setInsightRequested] = useState(false);

  const loadPlannerData = useCallback(async () => {
    if (!accountId) {
      setIncomeTimeline([]);
      setPlannerLoading(false);
      return;
    }
    try {
      setPlannerLoading(true);
      const [timeline, settings] = await Promise.all([
        incomeProjectionService.getTimeline(accountId),
        debtPlannerSettingsService.getSettings(accountId),
      ]);
      setIncomeTimeline(timeline);
      if (settings?.salary_day) setSalaryDay(settings.salary_day);
    } catch {
      setIncomeTimeline([]);
    } finally {
      setPlannerLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    Promise.resolve().then(loadPlannerData);
  }, [loadPlannerData]);

  const [forecastTimeline, setForecastTimeline] = useState<import('@/lib/services/forecast.service').PeriodForecast[]>([]);
  const [currentForecast, setCurrentForecast] = useState<import('@/lib/services/forecast.service').PeriodForecast | null>(null);
  const [analytics, setAnalytics] = useState<import('@/lib/services/forecast.service').ForecastAnalytics | null>(null);
  const [survivalScore, setSurvivalScore] = useState<import('@/lib/debt-planner/types').SurvivalScore | null>(null);
  const [globalWarnings, setGlobalWarnings] = useState<import('@/lib/debt-planner/types').ForecastWarning[]>([]);
  const [survivalInsight, setSurvivalInsight] = useState<string | null>(null);

  useEffect(() => {
    async function updateForecast() {
      const timeline = await buildForecastTimeline(loans, incomeTimeline, salaryDay, FORECAST_PERIOD_COUNT);
      const current = await getCurrentPeriodForecast(loans, incomeTimeline, salaryDay);
      const ana = buildForecastAnalytics(timeline, loans);
      const score = computeDashboardSurvivalScore(current, timeline, loans);
      const warnings = generateGlobalWarnings(timeline, loans);
      
      setForecastTimeline(timeline);
      setCurrentForecast(current);
      setAnalytics(ana);
      setSurvivalScore(score);
      setGlobalWarnings(warnings);
      
      if (insightRequested) {
        const insight = await generateSurvivalInsight(timeline, loans, current);
        setSurvivalInsight(insight);
      }
    }
    updateForecast();
  }, [loans, incomeTimeline, salaryDay, insightRequested]);

  const nextDueDate = useMemo(() => getNextDueDate(loans), [loans]);

  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);

  const saveSalaryDay = useCallback(
    async (day: number) => {
      if (!accountId) return;
      await debtPlannerSettingsService.upsertSalaryDay(accountId, day);
      setSalaryDay(day);
    },
    [accountId]
  );

  const addIncomeEntry = useCallback(
    async (effective_date: string, monthly_income: number) => {
      if (!accountId) return;
      await incomeProjectionService.createEntry(accountId, { 
        effective_date, 
        monthly_income,
        currency: 'IDR',
        exchange_rate: 1.0
      });
      await loadPlannerData();
    },
    [accountId, loadPlannerData]
  );

  const removeIncomeEntry = useCallback(
    async (id: string) => {
      await incomeProjectionService.deleteEntry(id);
      await loadPlannerData();
    },
    [loadPlannerData]
  );

  const requestSurvivalAnalysis = useCallback(() => {
    setInsightRequested(true);
  }, []);

  return {
    incomeTimeline,
    salaryDay,
    plannerLoading,
    forecastTimeline,
    currentForecast,
    analytics,
    survivalScore,
    globalWarnings,
    survivalInsight,
    insightRequested,
    nextDueDate,
    activeLoans,
    saveSalaryDay,
    addIncomeEntry,
    removeIncomeEntry,
    refreshPlanner: loadPlannerData,
    requestSurvivalAnalysis,
  };
}
