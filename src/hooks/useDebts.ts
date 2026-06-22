'use client';

import { useCallback, useEffect, useState } from 'react';
import { debtService, Debt } from '@/lib/services/finance/debt.service';
import type { LoanTracker } from '@/lib/debt-planner/types';

export function useDebts(accountId: string | undefined) {
  const [loans, setLoans] = useState<LoanTracker[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId) {
      setLoans([]);
      setDebts([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [loanData, debtData] = await Promise.all([
        debtService.getLoanTrackers(accountId),
        debtService.getDebts(accountId)
      ]);
      setLoans(loanData);
      setDebts(debtData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pinjaman';
      setError(msg);
      setLoans([]);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    Promise.resolve().then(refresh);
  }, [refresh]);

  // Actions for Loans
  const createLoan = async (data: Omit<LoanTracker, 'id' | 'workspace_id' | 'created_at' | 'updated_at'>) => {
    if (!accountId) throw new Error("Account ID missing");
    await debtService.createLoanTracker(accountId, data);
    await refresh();
  };

  const updateLoanStatus = async (id: string, status: string) => {
    await debtService.updateLoanStatus(id, status);
    await refresh();
  };

  const deleteLoan = async (id: string) => {
    await debtService.deleteLoanTracker(id);
    await refresh();
  };

  // Actions for Debts (Ledger)
  const createDebt = async (name: string, type: 'owe' | 'lend', amount: number, contact: string | null, due: string | null) => {
    if (!accountId) throw new Error("Account ID missing");
    await debtService.createDebt(accountId, name, type, amount, contact, due);
    await refresh();
  };

  const deleteDebt = async (id: string) => {
    await debtService.deleteDebt(id);
    await refresh();
  };

  const recordPayment = async (debtId: string, amount: number, walletId: string, note: string) => {
    if (!accountId) throw new Error("Account ID missing");
    await debtService.recordPayment(accountId, debtId, amount, walletId, note);
    await refresh();
  };

  return { 
    loans, debts, loading, error, refresh,
    createLoan, updateLoanStatus, deleteLoan,
    createDebt, deleteDebt, recordPayment
  };
}
