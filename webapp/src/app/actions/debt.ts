'use server'

import { debtService, type LoanTrackerInput } from '@/lib/services/server/debt.service';
import { walletService } from '@/lib/services/server/wallet.service';
import { incomeProjectionService } from '@/lib/services/server/income-projection.service';
import { debtPlannerSettingsService } from '@/lib/services/server/debt-planner-settings.service';
import { requireAccount } from '@/lib/auth/account';

export async function getDebtsData() {
  const auth = await requireAccount();
  if (!auth) return { debts: [], wallets: [] };

  const [debts, wallets] = await Promise.all([
    debtService.getDebts(auth.accountId),
    walletService.getWallets(auth.accountId)
  ]);
  return { debts, wallets };
}

/** Pinjol/cicilan dari tabel loan_trackers — bukan utang manual di tabel debts. */
export async function getLoanTrackersData() {
  const auth = await requireAccount();
  if (!auth) return { loans: [], wallets: [] };

  const [loans, wallets] = await Promise.all([
    debtService.getLoanTrackers(auth.accountId),
    walletService.getWallets(auth.accountId),
  ]);
  return { loans, wallets };
}

export async function createDebtAction(input: {
  name: string;
  type: string;
  amount: number;
  contact: string | null;
  dueDate: string | null;
  currency: string;
}) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const name = input.name.trim();
  if (!name) throw new Error('Nama wajib diisi');
  if (!(input.amount > 0)) throw new Error('Jumlah harus lebih dari 0');

  await debtService.createDebt(
    auth.accountId,
    name,
    input.type,
    input.amount,
    input.contact,
    input.dueDate,
    input.currency
  );
}

export async function recordDebtPaymentAction(
  debtId: string,
  amount: number,
  walletId: string,
  note: string
) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await debtService.recordPayment(auth.accountId, debtId, amount, walletId, note);
}

export async function deleteDebtAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await debtService.deleteDebt(id, auth.accountId);
}

// --- Pinjol / cicilan (tabel loan_trackers) ---

export async function createLoanTrackerAction(input: LoanTrackerInput) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  if (!input.app_name?.trim()) throw new Error('Nama penyedia wajib diisi');
  if (!(input.monthly_payment > 0)) throw new Error('Cicilan bulanan harus lebih dari 0');
  if (!(input.tenure_months > 0)) throw new Error('Tenor harus lebih dari 0');

  return await debtService.createLoanTracker(auth.accountId, {
    ...input,
    app_name: input.app_name.trim(),
  });
}

export async function updateLoanTrackerAction(id: string, input: LoanTrackerInput) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const updated = await debtService.updateLoanTracker(id, auth.accountId, input);
  if (!updated) throw new Error('Pinjaman tidak ditemukan');
  return updated;
}

export async function deleteLoanTrackerAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await debtService.deleteLoanTracker(id, auth.accountId);
}

// --- Siklus gajian ---

export async function getSalaryCycleData() {
  const auth = await requireAccount();
  if (!auth) return { incomeTimeline: [], salaryDay: 1 };

  const [incomeTimeline, settings] = await Promise.all([
    incomeProjectionService.getTimeline(auth.accountId),
    debtPlannerSettingsService.getSettings(auth.accountId),
  ]);
  return { incomeTimeline, salaryDay: settings?.salary_day ?? 1 };
}

export async function saveSalaryDayAction(day: number) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new Error('Tanggal gajian harus antara 1 dan 31');
  }
  await debtPlannerSettingsService.updateSettings(auth.accountId, { salary_day: day });
}

export async function addIncomeEntryAction(effectiveDate: string, amount: number) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  if (!(amount > 0)) throw new Error('Nominal harus lebih dari 0');
  await incomeProjectionService.createEntry(auth.accountId, {
    effective_date: effectiveDate,
    monthly_income: amount,
    currency: 'IDR',
  });
}
