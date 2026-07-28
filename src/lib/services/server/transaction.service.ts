import "server-only";
import { query, withTransaction } from '@/lib/db/server';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  walletId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface NewTransaction {
  wallet_id: string;
  destination_wallet_id?: string | null;
  category_id?: string | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  note?: string | null;
  date?: string;
  tags?: string[];
  currency?: string;
  exchange_rate?: number;
  is_recurring?: boolean;
}

/**
 * Efek sebuah transaksi terhadap saldo dompet.
 * sign = +1 menerapkan, -1 membatalkan (dipakai saat hapus).
 */
async function applyBalance(
  client: { query: (text: string, params?: unknown[]) => Promise<unknown> },
  tx: { type: string; amount: number; wallet_id: string; destination_wallet_id?: string | null },
  sign: 1 | -1
) {
  const amount = Number(tx.amount) * sign;
  if (tx.type === 'income') {
    await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, tx.wallet_id]);
  } else if (tx.type === 'expense') {
    await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, tx.wallet_id]);
  } else if (tx.type === 'transfer') {
    await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, tx.wallet_id]);
    if (tx.destination_wallet_id) {
      await client.query('UPDATE wallets SET balance = balance + $1 WHERE id = $2', [amount, tx.destination_wallet_id]);
    }
  }
}

export const transactionService = {
  async getTransactions(workspaceId: string, filters: TransactionFilters = {}) {
    const conditions = ['t.workspace_id = $1'];
    const params: unknown[] = [workspaceId];

    if (filters.startDate) {
      params.push(filters.startDate);
      conditions.push(`t.date >= $${params.length}`);
    }
    if (filters.endDate) {
      params.push(filters.endDate);
      conditions.push(`t.date <= $${params.length}`);
    }
    if (filters.type) {
      params.push(filters.type);
      conditions.push(`t.type = $${params.length}`);
    }
    if (filters.walletId) {
      params.push(filters.walletId);
      conditions.push(`(t.wallet_id = $${params.length} OR t.destination_wallet_id = $${params.length})`);
    }
    if (filters.search) {
      params.push(`%${filters.search}%`);
      conditions.push(`(t.note ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
    }

    const where = conditions.join(' AND ');
    const from = `FROM transactions t
       LEFT JOIN wallets w ON t.wallet_id = w.id
       LEFT JOIN categories c ON t.category_id = c.id`;

    // Total dihitung terpisah supaya paginasi tahu jumlah sebenarnya. Sebelumnya
    // count diisi panjang halaman, jadi tombol berikutnya tidak pernah muncul.
    const { rows: countRows } = await query(`SELECT count(*)::int AS total ${from} WHERE ${where}`, params);

    const paged = [...params, filters.limit ?? 20, filters.offset ?? 0];
    const { rows } = await query(
      `SELECT t.*, w.name as wallet_name, c.name as category_name
       ${from}
       WHERE ${where}
       ORDER BY t.date DESC
       LIMIT $${paged.length - 1} OFFSET $${paged.length}`,
      paged
    );

    const data = rows.map((r) => ({
      ...r,
      categories: r.category_name ? { name: r.category_name } : null,
      wallets: r.wallet_name ? { name: r.wallet_name } : null,
    }));

    return { data, count: countRows[0].total as number };
  },

  /**
   * Insert transaksi + penyesuaian saldo dalam satu transaksi DB.
   *
   * Dulu ini memanggil fungsi Postgres public.create_transaction(); fungsi itu
   * hanya ada di migrasi era Supabase dan tidak pernah dibuat di DB lokal, jadi
   * pemanggilnya selalu gagal. Logikanya dipindah ke sini supaya tidak perlu
   * menambah fungsi DB baru yang harus ikut dijaga.
   */
  async createTransaction(workspaceId: string, tx: NewTransaction) {
    if (!(Number(tx.amount) > 0)) throw new Error('Jumlah harus lebih dari 0');
    if (tx.type === 'transfer' && !tx.destination_wallet_id) {
      throw new Error('Transfer butuh dompet tujuan');
    }
    if (tx.type === 'transfer' && tx.destination_wallet_id === tx.wallet_id) {
      throw new Error('Dompet asal dan tujuan tidak boleh sama');
    }

    return withTransaction(async (client) => {
      // Dompet yang disebut harus milik workspace ini; id-nya datang dari client.
      const walletIds = [tx.wallet_id, tx.destination_wallet_id].filter(Boolean) as string[];
      const { rows: owned } = await client.query(
        'SELECT id FROM wallets WHERE workspace_id = $1 AND id = ANY($2)',
        [workspaceId, walletIds]
      );
      if (owned.length !== walletIds.length) throw new Error('Dompet tidak ditemukan');

      await applyBalance(client, { ...tx, amount: Number(tx.amount) }, 1);

      const { rows } = await client.query(
        `INSERT INTO transactions
           (workspace_id, wallet_id, category_id, amount, type, destination_wallet_id,
            note, date, tags, currency, exchange_rate, is_recurring)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING *`,
        [
          workspaceId,
          tx.wallet_id,
          tx.category_id ?? null,
          tx.amount,
          tx.type,
          tx.destination_wallet_id ?? null,
          tx.note ?? null,
          tx.date ?? new Date().toISOString(),
          tx.tags ?? [],
          tx.currency ?? 'IDR',
          tx.exchange_rate ?? 1,
          tx.is_recurring ?? false,
        ]
      );
      return rows[0];
    });
  },

  /**
   * Ubah transaksi: batalkan efek saldo yang lama, terapkan yang baru, lalu
   * simpan barisnya — semuanya dalam satu transaksi DB.
   *
   * Sebelumnya method ini hanya `UPDATE transactions SET amount, note` tanpa
   * menyentuh saldo dompet sama sekali, jadi mengubah nominal membuat saldo dan
   * riwayat tidak lagi cocok.
   */
  async updateTransaction(id: string, workspaceId: string, tx: NewTransaction) {
    if (!(Number(tx.amount) > 0)) throw new Error('Jumlah harus lebih dari 0');
    if (tx.type === 'transfer' && !tx.destination_wallet_id) {
      throw new Error('Transfer butuh dompet tujuan');
    }
    if (tx.type === 'transfer' && tx.destination_wallet_id === tx.wallet_id) {
      throw new Error('Dompet asal dan tujuan tidak boleh sama');
    }

    return withTransaction(async (client) => {
      const { rows: oldRows } = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND workspace_id = $2',
        [id, workspaceId]
      );
      const old = oldRows[0];
      if (!old) throw new Error('Transaksi tidak ditemukan');

      const walletIds = [tx.wallet_id, tx.destination_wallet_id].filter(Boolean) as string[];
      const { rows: owned } = await client.query(
        'SELECT id FROM wallets WHERE workspace_id = $1 AND id = ANY($2)',
        [workspaceId, walletIds]
      );
      if (owned.length !== walletIds.length) throw new Error('Dompet tidak ditemukan');

      await applyBalance(client, old, -1);
      await applyBalance(client, { ...tx, amount: Number(tx.amount) }, 1);

      const { rows } = await client.query(
        `UPDATE transactions SET
           wallet_id = $1, category_id = $2, amount = $3, type = $4,
           destination_wallet_id = $5, note = $6, date = $7, updated_at = now()
         WHERE id = $8 RETURNING *`,
        [
          tx.wallet_id,
          tx.category_id ?? null,
          tx.amount,
          tx.type,
          tx.destination_wallet_id ?? null,
          tx.note ?? null,
          tx.date ?? old.date,
          id,
        ]
      );
      return rows[0];
    });
  },

  async deleteTransaction(id: string, workspaceId: string): Promise<void> {
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM transactions WHERE id = $1 AND workspace_id = $2',
        [id, workspaceId]
      );
      const tx = rows[0];
      if (!tx) throw new Error('Transaksi tidak ditemukan');

      await applyBalance(client, tx, -1);
      await client.query('DELETE FROM transactions WHERE id = $1', [id]);
    });
  },
};
