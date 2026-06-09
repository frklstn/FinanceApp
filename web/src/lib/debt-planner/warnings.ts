import type { LoanTracker } from './types';
import { calcDebtRatio, getUpcomingDueDates, hasClusteredDueDates } from './calculations';

export interface Warning {
  level: 'danger' | 'warning' | 'info';
  message: string;
}

export function generateWarnings(loans: LoanTracker[], income: number): Warning[] {
  const warnings: Warning[] = [];
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalObligation = calcCycleTotalObligation(activeLoans);
  const debtRatio = calcDebtRatio(totalObligation, income);

  if (income > 0 && totalObligation > income) {
    warnings.push({
      level: 'danger',
      message: 'Cashflow deficit risk detected.',
    });
  }

  if (activeLoans.length >= 3) {
    warnings.push({
      level: 'warning',
      message: `${activeLoans.length} active debts detected.`,
    });
  }

  if (income > 0 && debtRatio > 50) {
    warnings.push({
      level: 'danger',
      message: 'Debt ratio exceeds 50%. Cashflow may be critically tight this period.',
    });
  } else if (income > 0 && debtRatio > 30) {
    warnings.push({
      level: 'warning',
      message: 'Cashflow may be tight this period. Avoid new debt if possible.',
    });
  }

  const remaining = income - totalObligation;
  if (income > 0 && remaining >= 0 && remaining < 500_000) {
    warnings.push({
      level: 'danger',
      message: 'Remaining cash is dangerously low.',
    });
  }

  if (hasClusteredDueDates(activeLoans)) {
    warnings.push({
      level: 'warning',
      message: 'High due-date clustering this period.',
    });
  }

  const imminent = getUpcomingDueDates(activeLoans, 3);
  if (imminent.length > 0) {
    warnings.push({
      level: 'danger',
      message: `${imminent.map((l) => l.app_name).join(', ')} — due within 3 days.`,
    });
  }

  return warnings;
}

export function generateSurvivalInsight(loans: LoanTracker[], income: number): string {
  const activeLoans = loans.filter((l) => l.status === 'active');
  const totalObligation = calcCycleTotalObligation(activeLoans);
  const debtRatio = calcDebtRatio(totalObligation, income);

  if (activeLoans.length === 0) {
    return 'Tidak ada cicilan aktif saat ini. Situasi cashflow sangat sehat — pertahankan!';
  }

  if (income <= 0) {
    return `Kamu memiliki ${activeLoans.length} cicilan aktif (${formatRp(totalObligation)}/bulan). Isi timeline gaji untuk analisis akurat.`;
  }

  if (totalObligation > income) {
    return `Cashflow deficit: cicilan ${formatRp(totalObligation)} melebihi pendapatan ${formatRp(income)}. Segera restrukturisasi atau kurangi pengeluaran.`;
  }

  if (debtRatio > 70) {
    return `Debt ratio ${debtRatio.toFixed(0)}% — berbahaya. Hindari utang baru dan fokus lunasi utang terkecil.`;
  }

  if (debtRatio > 50) {
    return `Periode ketat (debt ratio ${debtRatio.toFixed(0)}%). Sisa ${formatRp(income - totalObligation)} — jaga disiplin pengeluaran.`;
  }

  if (debtRatio > 30) {
    return `Masih manageable (${debtRatio.toFixed(0)}% debt ratio). Hindari utang baru hingga salah satu cicilan lunas.`;
  }

  return `Cashflow aman (${debtRatio.toFixed(0)}% debt ratio). Pertahankan pola ini.`;
}

function formatRp(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

/** Monthly obligation sum for active loans (calendar-month simplified). */
export function calcCycleTotalObligation(activeLoans: LoanTracker[]): number {
  return activeLoans
    .filter((l) => l.status === 'active')
    .reduce((sum, l) => sum + Number(l.monthly_payment), 0);
}
