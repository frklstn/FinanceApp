import { useState, useCallback, useEffect } from 'react';

export function useDebtForecast(accountId: string | undefined, loans: any[]) {
  const [globalWarnings, setGlobalWarnings] = useState<any[]>([]);
  const [survivalInsight, setSurvivalInsight] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [survivalScore, setSurvivalScore] = useState<any>(null);
  const [forecastTimeline, setForecastTimeline] = useState<any[]>([]);
  const [currentForecast, setCurrentForecast] = useState<any>(null);

  const loadPlannerData = useCallback(async () => {
    // Stub
  }, [accountId, loans]);

  useEffect(() => {
    Promise.resolve().then(loadPlannerData);
  }, [loadPlannerData]);

  return { 
    globalWarnings, 
    survivalInsight, 
    analytics, 
    survivalScore, 
    forecastTimeline, 
    currentForecast,
    incomeTimeline: [{ monthly_income: 0 }],
    salaryDay: 1,
    saveSalaryDay: async () => {},
    addIncomeEntry: async () => {}
  };
}
