'use server'

import { savingsService } from '@/lib/services/server/savings.service';
import { walletService } from '@/lib/services/server/wallet.service';
import { requireAccount } from '@/lib/auth/account';

export async function getSavingsData() {
  const auth = await requireAccount();
  if (!auth) return { goals: [], wallets: [] };

  const [goals, wallets] = await Promise.all([
    savingsService.getSavingsGoals(auth.accountId),
    walletService.getWallets(auth.accountId),
  ]);
  return { goals, wallets };
}

export async function createSavingsGoalAction(input: {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const name = input.name.trim();
  if (!name) throw new Error('Nama target wajib diisi');
  if (!(input.targetAmount > 0)) throw new Error('Jumlah target harus lebih dari 0');

  return await savingsService.createSavingsGoal(
    auth.accountId,
    name,
    input.targetAmount,
    input.currentAmount || 0,
    input.deadline
  );
}

export async function addContributionAction(goalId: string, amount: number, walletId: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await savingsService.addContribution(auth.accountId, goalId, amount, walletId);
}

export async function deleteSavingsGoalAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await savingsService.deleteSavingsGoal(id, auth.accountId);
}
