'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IncomeTimelineEntry, LoanTracker } from '@/lib/debt-planner/types';
import { debtService } from '@/lib/services/finance/debt.service';
import {
  buildForecastAnalytics,
  buildForecastTimeline,
  computeDashboardSurvivalScore,
  generateGlobalWarnings,
  generateSurvivalInsight,
  getCurrentPeriodForecast,
} from '@/lib/services/finance/forecast.service';
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
        debtService.getIncomeTimeline(accountId),
        debtService.getPlannerSettings(accountId),
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

  // Derived state via synchronous calculations
  const forecastTimeline = useMemo(() => {
    return buildForecastTimeline(loans, incomeTimeline, salaryDay, FORECAST_PERIOD_COUNT);
  }, [loans, incomeTimeline, salaryDay]);

  const currentForecast = useMemo(() => {
    return getCurrentPeriodForecast(loans, incomeTimeline, salaryDay);
  }, [loans, incomeTimeline, salaryDay]);

  const analytics = useMemo(() => {
    return buildForecastAnalytics(forecastTimeline, loans);
  }, [forecastTimeline, loans]);

  const survivalScore = useMemo(() => {
    return computeDashboardSurvivalScore(currentForecast, forecastTimeline, loans);
  }, [currentForecast, forecastTimeline, loans]);

  const globalWarnings = useMemo(() => {
    return generateGlobalWarnings(forecastTimeline, loans);
  }, [forecastTimeline, loans]);

  const survivalInsight = useMemo(() => {
    if (!insightRequested) return null;
    return generateSurvivalInsight(forecastTimeline, loans, currentForecast);
  }, [insightRequested, forecastTimeline, loans, currentForecast]);

  const nextDueDate = useMemo(() => getNextDueDate(loans), [loans]);

  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);

  const saveSalaryDay = useCallback(
    async (day: number) => {
      if (!accountId) return;
      await debtService.upsertSalaryDay(accountId, day);
      setSalaryDay(day);
    },
    [accountId]
  );

  const addIncomeEntry = useCallback(
    async (effective_date: string, monthly_income: number) => {
      if (!accountId) return;
      await debtService.createIncomeEntry(accountId, { 
        effective_date, 
        monthly_income,
        currency: 'IDR'
      });
      await loadPlannerData();
    },
    [accountId, loadPlannerData]
  );

  const removeIncomeEntry = useCallback(
    async (id: string) => {
      await debtService.deleteIncomeEntry(id);
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
