import type {
  ForecastAnalytics,
  ForecastWarning,
  IncomeTimelineEntry,
  LoanTracker,
  PeriodForecast,
} from '@/lib/debt-planner/types';
import {
  calcDebtRatio,
  calcPeriodDebtTotal,
  calcSurvivalScore,
  getHealthStatus,
  getIncomeForDate,
  getSalaryPeriodContaining,
  getSalaryPeriods,
  hasClusteredDueDates,
  calcRemainingObligation,
} from '@/lib/debt-planner/calculations';

export type {
  PeriodForecast,
  ForecastAnalytics,
  SurvivalScore,
  ForecastWarning,
} from '@/lib/debt-planner/types';
export { calcSurvivalScore } from '@/lib/debt-planner/calculations';

const LOW_CASH_THRESHOLD = 500_000;

export function buildPeriodWarnings(
  totalDebt: number,
  income: number,
  remainingCash: number,
  activeCount: number,
  clustered: boolean
): ForecastWarning[] {
  const warnings: ForecastWarning[] = [];

  if (income > 0 && totalDebt > income) {
    warnings.push({
      level: 'danger',
      message: 'Cashflow deficit risk detected.',
    });
  }

  if (remainingCash >= 0 && remainingCash < LOW_CASH_THRESHOLD) {
    warnings.push({
      level: 'danger',
      message: 'Remaining cash is dangerously low.',
    });
  }

  if (activeCount >= 3) {
    warnings.push({
      level: 'warning',
      message: 'Multiple active debts detected.',
    });
  }

  if (clustered) {
    warnings.push({
      level: 'warning',
      message: 'High due-date clustering this period.',
    });
  }

  return warnings;
}

export function buildForecastForPeriod(
  loans: LoanTracker[],
  incomeTimeline: IncomeTimelineEntry[],
  salaryDay: number,
  periodIndex: number,
  fromDate: Date = new Date()
): PeriodForecast {
  const periods = getSalaryPeriods(salaryDay, periodIndex + 1, fromDate);
  const period = periods[periodIndex];
  const activeLoans = loans.filter((l) => l.status === 'active');
  const income = getIncomeForDate(incomeTimeline, period.start);
  const total_debt = calcPeriodDebtTotal(activeLoans, period.start, period.end);
  const remaining_cash = income - total_debt;
  const debt_ratio = calcDebtRatio(total_debt, income);
  const health_status = getHealthStatus(debt_ratio, remaining_cash);
  const clustered = hasClusteredDueDates(activeLoans);

  return {
    period,
    income,
    total_debt,
    remaining_cash,
    debt_ratio,
    health_status,
    warnings: buildPeriodWarnings(
      total_debt,
      income,
      remaining_cash,
      activeLoans.length,
      clustered
    ),
  };
}

export function buildForecastTimeline(
  loans: LoanTracker[],
  incomeTimeline: IncomeTimelineEntry[],
  salaryDay: number,
  periodCount = 12,
  fromDate: Date = new Date()
): PeriodForecast[] {
  const periods = getSalaryPeriods(salaryDay, periodCount, fromDate);
  const activeLoans = loans.filter((l) => l.status === 'active');
  const clustered = hasClusteredDueDates(activeLoans);

  return periods.map((period) => {
    const income = getIncomeForDate(incomeTimeline, period.start);
    const total_debt = calcPeriodDebtTotal(activeLoans, period.start, period.end);
    const remaining_cash = income - total_debt;
    const debt_ratio = calcDebtRatio(total_debt, income);
    const health_status = getHealthStatus(debt_ratio, remaining_cash);

    return {
      period,
      income,
      total_debt,
      remaining_cash,
      debt_ratio,
      health_status,
      warnings: buildPeriodWarnings(
        total_debt,
        income,
        remaining_cash,
        activeLoans.length,
        clustered
      ),
    };
  });
}

export function getCurrentPeriodForecast(
  loans: LoanTracker[],
  incomeTimeline: IncomeTimelineEntry[],
  salaryDay: number,
  fromDate: Date = new Date()
): PeriodForecast {
  const period = getSalaryPeriodContaining(salaryDay, fromDate);
  const activeLoans = loans.filter((l) => l.status === 'active');
  const income = getIncomeForDate(incomeTimeline, period.start);
  const total_debt = calcPeriodDebtTotal(activeLoans, period.start, period.end);
  const remaining_cash = income - total_debt;
  const debt_ratio = calcDebtRatio(total_debt, income);

  return {
    period,
    income,
    total_debt,
    remaining_cash,
    debt_ratio,
    health_status: getHealthStatus(debt_ratio, remaining_cash),
    warnings: buildPeriodWarnings(
      total_debt,
      income,
      remaining_cash,
      activeLoans.length,
      hasClusteredDueDates(activeLoans)
    ),
  };
}

export function buildForecastAnalytics(
  timeline: PeriodForecast[],
  loans: LoanTracker[]
): ForecastAnalytics {
  const activeLoans = loans.filter((l) => l.status === 'active');

  const totalDebtAmount = activeLoans.reduce((s, l) => s + calcRemainingObligation(l), 0);

  const totalRepaymentObligation = activeLoans.reduce((s, l) => s + Number(l.total_repayment), 0);

  let estimatedDebtFreeDate: Date | null = null;
  if (activeLoans.length > 0) {
    const ends = activeLoans.map((l) => {
      const d = new Date(l.start_date);
      d.setMonth(d.getMonth() + l.tenure_months);
      return d;
    });
    estimatedDebtFreeDate = new Date(Math.max(...ends.map((d) => d.getTime())));
  }

  const withIncome = timeline.filter((t) => t.income > 0);
  let highestDebtMonth: string | null = null;
  let safestMonth: string | null = null;

  if (withIncome.length > 0) {
    const heaviest = withIncome.reduce((a, b) => (b.debt_ratio > a.debt_ratio ? b : a));
    const safest = withIncome.reduce((a, b) => (b.debt_ratio < a.debt_ratio ? b : a));
    highestDebtMonth = heaviest.period.label;
    safestMonth = safest.period.label;
  }

  const averageDebtRatio =
    withIncome.length > 0
      ? withIncome.reduce((s, t) => s + t.debt_ratio, 0) / withIncome.length
      : 0;

  return {
    totalDebtAmount,
    totalRepaymentObligation,
    estimatedDebtFreeDate,
    highestDebtMonth,
    safestMonth,
    averageDebtRatio,
  };
}

export function generateSurvivalInsight(
  forecastTimeline: PeriodForecast[],
  loans: LoanTracker[],
  currentForecast: PeriodForecast
): string {
  const activeLoans = loans.filter((l) => l.status === 'active');

  if (activeLoans.length === 0) {
    return 'Tidak ada cicilan aktif. Cashflow periode ini bersih dari kewajiban cicilan pinjol.';
  }

  if (currentForecast.income <= 0) {
    return `Ada ${activeLoans.length} utang aktif dengan kewajiban periode ini ${formatRupiah(currentForecast.total_debt)}. Tambahkan timeline gaji untuk analisis lengkap.`;
  }

  const deficitPeriods = forecastTimeline.filter((p) => p.remaining_cash < 0);
  if (deficitPeriods.length > 0) {
    const first = deficitPeriods[0];
    return `Cashflow menjadi negatif pada periode ${first.period.label} (sisa ${formatRupiah(first.remaining_cash)}). Pertimbangkan kurangi pengeluaran atau restrukturisasi utang.`;
  }

  const heavyPeriods = forecastTimeline.filter(
    (p) => p.health_status === 'HEAVY' || p.health_status === 'DANGER'
  );

  if (heavyPeriods.length >= 2) {
    const first = heavyPeriods[0];
    const last = heavyPeriods[heavyPeriods.length - 1];
    const range =
      first.period.label === last.period.label
        ? first.period.label
        : `${first.period.label.split('–')[0]?.trim()} – ${last.period.label.split('–')[1]?.trim() || last.period.label}`;
    return `Periode terberat sekitar ${range} (debt ratio hingga ${Math.max(...heavyPeriods.map((p) => p.debt_ratio)).toFixed(0)}%). Hindari utang baru pada rentang ini.`;
  }

  if (currentForecast.debt_ratio > 50) {
    return `Periode ini berat dengan debt ratio ${currentForecast.debt_ratio.toFixed(0)}% dan sisa ${formatRupiah(currentForecast.remaining_cash)}. Fokus bertahan tanpa menambah utang.`;
  }

  if (currentForecast.debt_ratio > 30) {
    return `Cashflow masih manageable (debt ratio ${currentForecast.debt_ratio.toFixed(0)}%, sisa ${formatRupiah(currentForecast.remaining_cash)}). Pertahankan disiplin hingga salah satu cicilan lunas.`;
  }

  return `Situasi aman: debt ratio ${currentForecast.debt_ratio.toFixed(0)}%, sisa ${formatRupiah(currentForecast.remaining_cash)} per periode gajian.`;
}

export function generateGlobalWarnings(
  forecastTimeline: PeriodForecast[],
  loans: LoanTracker[]
): ForecastWarning[] {
  const warnings: ForecastWarning[] = [];
  const activeCount = loans.filter((l) => l.status === 'active').length;

  const heavyStretch = forecastTimeline.filter(
    (p) => p.health_status === 'HEAVY' || p.health_status === 'DANGER'
  );

  if (heavyStretch.length >= 3) {
    const start = heavyStretch[0].period.label;
    const end = heavyStretch[heavyStretch.length - 1].period.label;
    warnings.push({
      level: 'warning',
      message: `${start} hingga ${end} mungkin periode paling ketat. Hindari mengambil utang baru.`,
    });
  }

  if (activeCount >= 3) {
    warnings.push({
      level: 'warning',
      message: `${activeCount} active debts detected.`,
    });
  }

  const anyDeficit = forecastTimeline.some((p) => p.remaining_cash < 0);
  if (anyDeficit) {
    warnings.push({
      level: 'danger',
      message: 'Cashflow deficit risk detected in upcoming salary periods.',
    });
  }

  return warnings;
}

export function computeDashboardSurvivalScore(
  currentForecast: PeriodForecast,
  forecastTimeline: PeriodForecast[],
  loans: LoanTracker[]
): import('@/lib/debt-planner/types').SurvivalScore {
  const activeCount = loans.filter((l) => l.status === 'active').length;
  const hasDeficitPeriod = forecastTimeline.some((p) => p.remaining_cash < 0);

  return calcSurvivalScore({
    debtRatio: currentForecast.debt_ratio,
    remainingCash: currentForecast.remaining_cash,
    activeDebtCount: activeCount,
    clusteredDueDates: hasClusteredDueDates(loans.filter((l) => l.status === 'active')),
    hasDeficitPeriod,
  });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
