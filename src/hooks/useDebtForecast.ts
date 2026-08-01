'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  getSalaryPeriods,
  getSalaryPeriodContaining,
  getIncomeForDate,
  calcPeriodDebtTotal,
  calcDebtRatio,
  getHealthStatus,
  calcSurvivalScore,
  hasClusteredDueDates,
} from '@/lib/debt-planner/calculations';
import type {
  IncomeTimelineEntry,
  LoanTracker,
  PeriodForecast,
  ForecastWarning,
} from '@/lib/debt-planner/types';
import {
  getSalaryCycleData,
  saveSalaryDayAction,
  addIncomeEntryAction,
} from '@/app/actions/debt';

/**
 * Proyeksi kas per siklus gajian.
 *
 * Sebelumnya seluruh isi hook ini stub: `loadPlannerData` kosong, semua nilai
 * dikembalikan sebagai array kosong, dan `incomeTimeline` di-hardcode
 * `[{ monthly_income: 0 }]`. Akibatnya panel siklus gajian di halaman Pinjol
 * selalu menampilkan nol, dan tombol simpan tanggal gajian tidak menyimpan apa pun.
 *
 * Perhitungannya sendiri sudah lengkap di lib/debt-planner/calculations —
 * yang hilang cuma penyambungan ke data.
 */
export function useDebtForecast(accountId: string | undefined, loans: LoanTracker[]) {
  const [incomeTimeline, setIncomeTimeline] = useState<IncomeTimelineEntry[]>([]);
  const [salaryDay, setSalaryDay] = useState(1);

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      const data = await getSalaryCycleData();
      setIncomeTimeline(data.incomeTimeline);
      setSalaryDay(data.salaryDay);
    } catch {
      // Panel tetap tampil dengan nilai default; halaman punya penanganan error sendiri.
    }
  }, [accountId]);

  useEffect(() => {
    Promise.resolve().then(load);
  }, [load]);

  const activeLoans = useMemo(() => loans.filter((l) => l.status === 'active'), [loans]);

  const buildForecast = useCallback(
    (start: Date, end: Date, label: string): PeriodForecast => {
      const income = getIncomeForDate(incomeTimeline, start);
      const totalDebt = calcPeriodDebtTotal(activeLoans, start, end);
      const remainingCash = income - totalDebt;
      const debtRatio = calcDebtRatio(totalDebt, income);

      const warnings: ForecastWarning[] = [];
      if (remainingCash < 0) {
        warnings.push({ level: 'danger', message: 'Tagihan periode ini melebihi pemasukan.' });
      } else if (debtRatio > 50) {
        warnings.push({ level: 'warning', message: 'Lebih dari separuh pemasukan habis untuk cicilan.' });
      }
      if (income === 0 && totalDebt > 0) {
        warnings.push({ level: 'warning', message: 'Pemasukan periode ini belum dicatat.' });
      }

      return {
        period: { start, end, label },
        income,
        total_debt: totalDebt,
        remaining_cash: remainingCash,
        debt_ratio: debtRatio,
        health_status: getHealthStatus(debtRatio, remainingCash),
        warnings,
      };
    },
    [incomeTimeline, activeLoans]
  );

  const forecastTimeline = useMemo(
    () => getSalaryPeriods(salaryDay, 6).map((p) => buildForecast(p.start, p.end, p.label)),
    [salaryDay, buildForecast]
  );

  const currentForecast = useMemo(() => {
    const p = getSalaryPeriodContaining(salaryDay);
    return buildForecast(p.start, p.end, p.label);
  }, [salaryDay, buildForecast]);

  const globalWarnings = useMemo(
    () => forecastTimeline.flatMap((f) => f.warnings),
    [forecastTimeline]
  );

  const survivalScore = useMemo(
    () =>
      calcSurvivalScore({
        debtRatio: currentForecast.debt_ratio,
        remainingCash: currentForecast.remaining_cash,
        activeDebtCount: activeLoans.length,
        clusteredDueDates: hasClusteredDueDates(activeLoans),
        // Defisit di periode mana pun dalam 6 siklus ke depan, bukan cuma sekarang.
        hasDeficitPeriod: forecastTimeline.some((f) => f.remaining_cash < 0),
      }),
    [currentForecast, activeLoans, forecastTimeline]
  );

  const analytics = useMemo(() => {
    const totalRepayment = activeLoans.reduce((s, l) => s + Number(l.total_repayment || 0), 0);
    const totalRemaining = activeLoans.reduce((s, l) => s + Number(l.total_remaining_balance || 0), 0);
    const ratios = forecastTimeline.map((f) => f.debt_ratio);

    return {
      totalDebtAmount: totalRemaining,
      totalRepaymentObligation: totalRepayment,
      averageDebtRatio: ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0,
      highestDebtMonth: forecastTimeline.length
        ? forecastTimeline.reduce((a, b) => (b.total_debt > a.total_debt ? b : a)).period.label
        : null,
      safestMonth: forecastTimeline.length
        ? forecastTimeline.reduce((a, b) => (b.remaining_cash > a.remaining_cash ? b : a)).period.label
        : null,
      estimatedDebtFreeDate: null,
    };
  }, [activeLoans, forecastTimeline]);

  const survivalInsight = useMemo(() => {
    if (activeLoans.length === 0) return null;
    if (currentForecast.remaining_cash < 0) {
      return 'Periode ini defisit. Prioritaskan cicilan yang jatuh tempo paling dekat.';
    }
    if (currentForecast.debt_ratio > 50) {
      return 'Cicilan memakan lebih dari separuh pemasukan. Hindari menambah pinjaman baru.';
    }
    return 'Rasio cicilan masih terkendali. Pertahankan dan fokus melunasi yang terkecil.';
  }, [activeLoans, currentForecast]);

  const saveSalaryDay = useCallback(async (day: number) => {
    await saveSalaryDayAction(day);
    setSalaryDay(day);
  }, []);

  const addIncomeEntry = useCallback(
    async (effectiveDate: string, amount: number) => {
      await addIncomeEntryAction(effectiveDate, amount);
      await load();
    },
    [load]
  );

  return {
    globalWarnings,
    survivalInsight,
    analytics,
    survivalScore,
    forecastTimeline,
    currentForecast,
    incomeTimeline,
    salaryDay,
    saveSalaryDay,
    addIncomeEntry,
  };
}
