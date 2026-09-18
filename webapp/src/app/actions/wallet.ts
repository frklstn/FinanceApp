'use server'

import { walletService, type Wallet } from '@/lib/services/server/wallet.service';
import { transactionService } from '@/lib/services/server/transaction.service';
import { requireAccount } from '@/lib/auth/account';

export async function getWalletsData() {
  const auth = await requireAccount();
  if (!auth) return [];

  return await walletService.getWallets(auth.accountId);
}

export async function createWalletAction(input: {
  name: string;
  type: string;
  balance: number;
  color: string;
  icon: string;
  currency: string;
}) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const name = input.name.trim();
  if (!name) throw new Error('Nama dompet wajib diisi');

  return await walletService.createWallet(
    auth.accountId,
    name,
    input.type,
    Number(input.balance) || 0,
    input.color,
    input.icon,
    input.currency
  );
}

export async function updateWalletAction(id: string, payload: Partial<Wallet>) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const updated = await walletService.updateWallet(id, auth.accountId, payload);
  if (!updated) throw new Error('Dompet tidak ditemukan');
  return updated;
}

export async function deleteWalletAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await walletService.deleteWallet(id, auth.accountId);
}

export async function transferFundsAction(input: {
  sourceId: string;
  destId: string;
  amount: number;
  note?: string;
  currency?: string;
}) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await transactionService.createTransaction(auth.accountId, {
    wallet_id: input.sourceId,
    destination_wallet_id: input.destId,
    amount: Number(input.amount),
    type: 'transfer',
    note: input.note || 'Pindah dana antar dompet',
    currency: input.currency ?? 'IDR',
  });
}
