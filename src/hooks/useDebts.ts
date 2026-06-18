'use client';

import { useCallback, useEffect, useState } from 'react';
import { debtService } from '@/lib/services/debt.service';
import type { LoanTracker } from '@/lib/debt-planner/types';

export function useDebts(accountId: string | undefined) {
  const [loans, setLoans] = useState<LoanTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accountId) {
      setLoans([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await debtService.getLoanTrackers(accountId);
      setLoans(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat pinjaman';
      setError(msg);
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    Promise.resolve().then(refresh);
  }, [refresh]);

  return { loans, loading, error, refresh };
}
