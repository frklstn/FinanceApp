'use server'

import { debtService } from '@/lib/services/server/debt.service';
import { walletService } from '@/lib/services/server/wallet.service';
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
