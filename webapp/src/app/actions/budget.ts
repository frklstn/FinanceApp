'use server'

import { budgetService } from '@/lib/services/server/budget.service';
import { categoryService } from '@/lib/services/server/category.service';
import { incomeProjectionService } from '@/lib/services/server/income-projection.service';
import { debtPlannerSettingsService } from '@/lib/services/server/debt-planner-settings.service';
import { debtService } from '@/lib/services/server/debt.service';
import { requireAccount } from '@/lib/auth/account';

export async function getBudgetsData(period: string) {
  const auth = await requireAccount();
  if (!auth) return { budgets: [], categories: [], incomeTimeline: [], loanTrackers: [], salaryDay: 25 };

  const [budgets, categories, incomeTimeline, loanTrackers, settings] = await Promise.all([
    budgetService.getBudgets(auth.accountId, period),
    categoryService.getCategories(auth.accountId),
    incomeProjectionService.getTimeline(auth.accountId),
    debtService.getLoanTrackers(auth.accountId),
    debtPlannerSettingsService.getSettings(auth.accountId),
  ]);

  return {
    budgets,
    categories,
    incomeTimeline,
    loanTrackers,
    salaryDay: settings?.salary_day ?? 25,
  };
}

export async function saveBudgetsAction(
  period: string,
  entries: { categoryId: string; amount: number }[]
) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  for (const entry of entries) {
    if (!(entry.amount > 0)) throw new Error('Nominal anggaran harus lebih dari 0');
  }

  await Promise.all(
    entries.map((e) => budgetService.createBudget(auth.accountId, e.categoryId, e.amount, period))
  );
}

export async function deleteBudgetAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await budgetService.deleteBudget(id, auth.accountId);
}
