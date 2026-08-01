'use server'

import { insightsService } from '@/lib/services/server/insights.service';
import { transactionService } from '@/lib/services/server/transaction.service';
import { requireAccount } from '@/lib/auth/account';

export async function getInsightsData() {
  const auth = await requireAccount();
  if (!auth) return null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthTxs } = await transactionService.getTransactions(auth.accountId, {
    startDate: startOfMonth.toISOString(),
    limit: 200,
  });

  return await insightsService.generateInsights(auth.accountId, monthTxs);
}
