import { 
  addMonths, 
  differenceInCalendarMonths, 
  getDate
} from 'date-fns';
import type {
  HealthStatus,
  LoanTracker,
  IncomeTimelineEntry,
  LoanComputed,
  SalaryPeriod,
  SurvivalScore,
} from './types';

export const LOAN_CATEGORY_LABELS: Record<string, string> = {
  pinjol: 'Pinjol',
  paylater: 'Paylater',
  kartu_kredit: 'Kartu Kredit',
  koperasi: 'Koperasi',
  teman_keluarga: 'Teman / Keluarga',
  hutang_pribadi: 'Teman / Keluarga',
  cicilan_barang: 'Cicilan Barang',
  cicilan: 'Cicilan Barang',
  custom: 'Custom',
  lainnya: 'Custom',
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  SAFE: 'Aman',
  CAUTION: 'Perhatikan',
  HEAVY: 'Ketat',
  DANGER: 'Berbahaya',
};

export function calcElapsedMonths(startDate: string, asOf: Date = new Date()): number {
  const diff = differenceInCalendarMonths(asOf, new Date(startDate));
  const hasNotReachedDay = getDate(asOf) < getDate(new Date(startDate));
  return Math.max(0, diff - (hasNotReachedDay ? 1 : 0));
}

export function calcRemainingMonths(
  tenureMonths: number,
  startDate: string,
  asOf: Date = new Date()
): number {
  return Math.max(0, tenureMonths - calcElapsedMonths(startDate, asOf));
}

export function calcEndDate(startDate: string, tenureMonths: number): Date {
  return addMonths(new Date(startDate), tenureMonths);
}

export function formatEndMonth(startDate: string, tenureMonths: number): string {
  return calcEndDate(startDate, tenureMonths).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });
}

export function calcProgressPercent(tenureMonths: number, startDate: string): number {
  if (tenureMonths <= 0) return 0;
  return Math.min(100, Math.round((calcElapsedMonths(startDate) / tenureMonths) * 100));
}

export function calcRemainingObligation(loan: LoanTracker): number {
  if (loan.total_remaining_balance != null && loan.total_remaining_balance > 0) {
    return Number(loan.total_remaining_balance);
  }
  const remainingMonths = calcRemainingMonths(loan.tenure_months, loan.start_date);
  return remainingMonths * Number(loan.monthly_payment);
}

export function computeLoanMetrics(loan: LoanTracker): LoanComputed {
  const remainingMonths = calcRemainingMonths(loan.tenure_months, loan.start_date);
  return {
    loan,
    remainingMonths,
    progressPercent: loan.status === 'paid_off' ? 100 : calcProgressPercent(loan.tenure_months, loan.start_date),
    endMonthLabel: formatEndMonth(loan.start_date, loan.tenure_months),
    remainingObligation: loan.status === 'paid_off' ? 0 : calcRemainingObligation(loan),
  };
}

export function getIncomeForDate(
  timeline: IncomeTimelineEntry[],
  date: Date
): number {
  if (timeline.length === 0) return 0;
  const sorted = [...timeline].sort(
    (a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
  );
  const target = date.getTime();
  for (const entry of sorted) {
    if (new Date(entry.effective_date).getTime() <= target) {
      return Number(entry.monthly_income);
    }
  }
  const oldest = sorted[sorted.length - 1];
  return Number(oldest.monthly_income);
}

export function formatPeriodLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = start.toLocaleDateString('id-ID', opts);
  const endStr = end.toLocaleDateString('id-ID', { ...opts, year: 'numeric' });
  return `${startStr} – ${endStr}`;
}

export function getSalaryPeriodContaining(
  salaryDay: number,
  reference: Date = new Date()
): SalaryPeriod {
  const y = reference.getFullYear();
  const m = reference.getMonth();
  const d = reference.getDate();

  let start: Date;
  let end: Date;

  if (d >= salaryDay) {
    start = new Date(y, m, salaryDay);
    end = new Date(y, m + 1, salaryDay - 1);
  } else {
    start = new Date(y, m - 1, salaryDay);
    end = new Date(y, m, salaryDay - 1);
  }

  return { start, end, label: formatPeriodLabel(start, end) };
}

/** Returns `count` consecutive salary periods starting from the period containing `fromDate`. */
export function getSalaryPeriods(
  salaryDay: number,
  count: number,
  fromDate: Date = new Date()
): SalaryPeriod[] {
  const periods: SalaryPeriod[] = [getSalaryPeriodContaining(salaryDay, fromDate)];
  let prevEnd = periods[0].end;

  for (let i = 1; i < count; i++) {
    const start = new Date(prevEnd);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(end.getDate() - 1);
    periods.push({ start, end, label: formatPeriodLabel(start, end) });
    prevEnd = end;
  }

  return periods;
}

function clampDueDay(year: number, month: number, dueDay: number): number {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(dueDay, last);
}

export function isLoanActiveInPeriod(loan: LoanTracker, periodStart: Date, periodEnd: Date): boolean {
  if (loan.status !== 'active') return false;
  const loanStart = new Date(loan.start_date);
  const loanEnd = calcEndDate(loan.start_date, loan.tenure_months);
  return loanStart <= periodEnd && loanEnd >= periodStart;
}

export function loanPaymentDueInPeriod(
  loan: LoanTracker,
  periodStart: Date,
  periodEnd: Date
): boolean {
  if (!isLoanActiveInPeriod(loan, periodStart, periodEnd)) return false;

  const cursor = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
  const endMonth = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);

  while (cursor <= endMonth) {
    const day = clampDueDay(cursor.getFullYear(), cursor.getMonth(), loan.due_day);
    const due = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    if (due >= periodStart && due <= periodEnd) return true;
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return false;
}

export function calcPeriodDebtTotal(
  activeLoans: LoanTracker[],
  periodStart: Date,
  periodEnd: Date
): number {
  return activeLoans
    .filter((l) => loanPaymentDueInPeriod(l, periodStart, periodEnd))
    .reduce((sum, l) => sum + Number(l.monthly_payment), 0);
}

export function calcDebtRatio(totalDebt: number, income: number): number {
  if (income <= 0) return totalDebt > 0 ? 100 : 0;
  return (totalDebt / income) * 100;
}

export function getHealthStatus(debtRatio: number, remainingCash: number): HealthStatus {
  if (remainingCash < 0 || debtRatio > 70) return 'DANGER';
  if (debtRatio > 50) return 'HEAVY';
  if (debtRatio > 30) return 'CAUTION';
  return 'SAFE';
}

export function hasClusteredDueDates(loans: LoanTracker[], windowDays = 5): boolean {
  const active = loans.filter((l) => l.status === 'active');
  if (active.length < 2) return false;
  const dueDays = active.map((l) => l.due_day).sort((a, b) => a - b);
  for (let i = 0; i < dueDays.length - 1; i++) {
    if (dueDays[i + 1] - dueDays[i] <= windowDays) return true;
  }
  return false;
}

export function getNextDueDate(loans: LoanTracker[], from: Date = new Date()): Date | null {
  const active = loans.filter((l) => l.status === 'active');
  if (active.length === 0) return null;

  let nearest: Date | null = null;
  for (const loan of active) {
    for (let offset = 0; offset <= 2; offset++) {
      const m = new Date(from.getFullYear(), from.getMonth() + offset, 1);
      const day = clampDueDay(m.getFullYear(), m.getMonth(), loan.due_day);
      const due = new Date(m.getFullYear(), m.getMonth(), day);
      if (due < from && offset === 0) continue;
      if (!nearest || due < nearest) nearest = due;
    }
  }
  return nearest;
}

export function calcSurvivalScore(params: {
  debtRatio: number;
  remainingCash: number;
  activeDebtCount: number;
  clusteredDueDates: boolean;
  hasDeficitPeriod: boolean;
}): SurvivalScore {
  let score = 100;
  const { debtRatio, remainingCash, activeDebtCount, clusteredDueDates, hasDeficitPeriod } =
    params;

  if (debtRatio > 70) score -= 30;
  else if (debtRatio > 50) score -= 22;
  else if (debtRatio > 30) score -= 12;

  if (remainingCash < 0) score -= 25;
  else if (remainingCash < 500_000) score -= 18;
  else if (remainingCash < 1_000_000) score -= 8;

  if (activeDebtCount >= 5) score -= 12;
  else if (activeDebtCount >= 3) score -= 6;

  if (clusteredDueDates) score -= 8;
  if (hasDeficitPeriod) score -= 15;

  const bounded = Math.max(0, Math.min(100, Math.round(score)));

  let label: string;
  if (bounded >= 80) label = 'Sehat — pertahankan disiplin';
  else if (bounded >= 65) label = 'Ketat tapi masih realistis';
  else if (bounded >= 45) label = 'Perlu waspada — hindari utang baru';
  else if (bounded >= 25) label = 'Risiko tinggi — restrukturisasi disarankan';
  else label = 'Kritis — cashflow berbahaya';

  return { score: bounded, label };
}

export function getUpcomingDueDates(
  loans: LoanTracker[],
  withinDays: number,
  from: Date = new Date()
): LoanTracker[] {
  const today = from.getDate();
  const daysInMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate();

  return loans.filter((l) => {
    if (l.status !== 'active') return false;
    let diff = l.due_day - today;
    if (diff < 0) diff += daysInMonth;
    return diff >= 0 && diff <= withinDays;
  });
}
