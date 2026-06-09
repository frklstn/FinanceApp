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

  const forecastTimeline = useMemo(
    () => buildForecastTimeline(loans, incomeTimeline, salaryDay, FORECAST_PERIOD_COUNT),
    [loans, incomeTimeline, salaryDay]
  );

  const currentForecast = useMemo(
    () => getCurrentPeriodForecast(loans, incomeTimeline, salaryDay),
    [loans, incomeTimeline, salaryDay]
  );

  const analytics = useMemo(
    () => buildForecastAnalytics(forecastTimeline, loans),
    [forecastTimeline, loans]
  );

  const survivalScore = useMemo(
    () => computeDashboardSurvivalScore(currentForecast, forecastTimeline, loans),
    [currentForecast, forecastTimeline, loans]
  );

  const globalWarnings = useMemo(
    () => generateGlobalWarnings(forecastTimeline, loans),
    [forecastTimeline, loans]
  );

  const survivalInsight = useMemo(() => {
    if (!insightRequested) return null;
    return generateSurvivalInsight(forecastTimeline, loans, currentForecast);
  }, [insightRequested, forecastTimeline, loans, currentForecast]);

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
      await incomeProjectionService.createEntry(accountId, { effective_date, monthly_income });
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
