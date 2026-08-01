'use client';

import { useCallback, useEffect, useState } from 'react';
import { getLoanTrackersData } from '@/app/actions/debt';
import { type LoanTracker } from '@/lib/debt-planner/types';

/**
 * Pinjol/cicilan dari tabel loan_trackers.
 *
 * Sebelumnya hook ini memanggil getDebtsData() yang membaca tabel `debts` —
 * itu utang manual milik halaman Utang, bukan pinjol. Halaman Pinjol jadi
 * menampilkan data yang salah.
 */
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
      const { loans: list } = await getLoanTrackersData();
      setLoans(list);
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
