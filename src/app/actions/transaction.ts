'use server'

import {
  transactionService,
  type NewTransaction,
  type TransactionFilters,
} from '@/lib/services/server/transaction.service';
import { walletService } from '@/lib/services/server/wallet.service';
import { categoryService } from '@/lib/services/server/category.service';
import { currencyService } from '@/lib/services/server/currency.service';
import { requireAccount } from '@/lib/auth/account';

export async function getTransactionsData(filters: TransactionFilters = {}) {
  const auth = await requireAccount();
  if (!auth) return { transactions: { data: [], count: 0 }, wallets: [], categories: [] };

  const [transactions, wallets, categories] = await Promise.all([
    transactionService.getTransactions(auth.accountId, { limit: 10, ...filters }),
    walletService.getWallets(auth.accountId),
    categoryService.getCategories(auth.accountId)
  ]);
  return { transactions, wallets, categories };
}

/** Daftar transaksi saja — dipakai saat filter/halaman berubah. */
export async function listTransactions(filters: TransactionFilters = {}) {
  const auth = await requireAccount();
  if (!auth) return { data: [], count: 0 };

  return await transactionService.getTransactions(auth.accountId, { limit: 10, ...filters });
}

export async function updateTransactionAction(id: string, input: Omit<NewTransaction, 'exchange_rate'>) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  return await transactionService.updateTransaction(id, auth.accountId, {
    ...input,
    currency: input.currency || 'IDR',
  });
}

/** Dompet + kategori saja, buat mengisi form QuickAdd. */
export async function getQuickAddOptions() {
  const auth = await requireAccount();
  if (!auth) return { wallets: [], categories: [] };

  const [wallets, categories] = await Promise.all([
    walletService.getWallets(auth.accountId),
    categoryService.getCategories(auth.accountId),
  ]);
  return { wallets, categories };
}

export async function createTransactionAction(input: Omit<NewTransaction, 'exchange_rate'>) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const currency = input.currency || 'IDR';
  // Kurs dihitung di server; sebelumnya client memanggil currencyService
  // langsung, padahal service itu 'server-only'.
  const exchangeRate = await currencyService.convert(1, currency, 'IDR');

  return await transactionService.createTransaction(auth.accountId, {
    ...input,
    currency,
    exchange_rate: exchangeRate,
  });
}

export async function deleteTransactionAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await transactionService.deleteTransaction(id, auth.accountId);
}
