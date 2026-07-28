'use server'

import { transactionService } from '@/lib/services/server/transaction.service';
import { query } from '@/lib/db/server';
import { requireAccount } from '@/lib/auth/account';

export async function getReportData(period: 'month' | 'last_month' | 'ytd') {
  const auth = await requireAccount();
  if (!auth) return { transactions: [] };

  const startDate = new Date();
  const endDate = new Date();

  if (period === 'last_month') {
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(0); // hari terakhir bulan lalu
    endDate.setHours(23, 59, 59, 999);
  } else if (period === 'ytd') {
    startDate.setMonth(0);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  const { data } = await transactionService.getTransactions(auth.accountId, {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    limit: 1000,
  });

  return { transactions: data };
}

/**
 * Tarif pajak disimpan di profil pengguna sendiri, bukan di workspace, jadi
 * dikunci ke userId dari sesi.
 */
export async function saveTaxRateAction(rate: number) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new Error('Tarif pajak harus antara 0 dan 100');
  }

  await query('UPDATE profiles SET tax_rate = $1 WHERE id = $2', [rate, auth.userId]);
}
