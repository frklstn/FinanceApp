import "server-only";
import { query, withTransaction } from '@/lib/db/server';
import type { LoanTracker } from '@/lib/debt-planner/types';

export interface Debt {
  id: string;
  workspace_id: string;
  name: string;
  type: string;
  amount: number;
  remaining_amount: number;
  status: string;
  currency: string;
  due_date: string | null;
}

export const debtService = {
  async getDebts(workspaceId: string): Promise<Debt[]> {
    const { rows } = await query(
      'SELECT * FROM debts WHERE workspace_id = $1',
      [workspaceId]
    );
    return rows;
  },

  async createDebt(workspaceId: string, name: string, type: string, amount: number, contact: string | null, due: string | null, currency: string): Promise<void> {
    await query(
      'INSERT INTO debts (workspace_id, name, type, amount, remaining_amount, contact_info, due_date, currency) VALUES ($1, $2, $3, $4, $4, $5, $6, $7)',
      [workspaceId, name, type, amount, contact, due, currency]
    );
  },

  /**
   * Catat pembayaran utang: kurangi sisa utang, sesuaikan saldo dompet.
   *
   * Sebelumnya method ini tidak memeriksa kepemilikan sama sekali (debtId dan
   * walletId datang dari client), tidak menyentuh saldo dompet, dan tidak pernah
   * menandai utang lunas walau sisanya sudah nol.
   *
   * Arah saldo mengikuti jenis utang: 'owe' berarti kita membayar (saldo dompet
   * berkurang), 'lend' berarti kita menerima pelunasan (saldo bertambah).
   */
  async recordPayment(workspaceId: string, debtId: string, amount: number, walletId: string, note: string): Promise<void> {
    if (!(Number(amount) > 0)) throw new Error('Jumlah harus lebih dari 0');

    await withTransaction(async (client) => {
      const { rows: debts } = await client.query(
        'SELECT type, remaining_amount FROM debts WHERE id = $1 AND workspace_id = $2',
        [debtId, workspaceId]
      );
      const debt = debts[0];
      if (!debt) throw new Error('Utang tidak ditemukan');
      if (Number(amount) > Number(debt.remaining_amount)) {
        throw new Error('Jumlah melebihi sisa utang');
      }

      const { rows: wallets } = await client.query(
        'SELECT balance FROM wallets WHERE id = $1 AND workspace_id = $2',
        [walletId, workspaceId]
      );
      if (wallets.length === 0) throw new Error('Dompet tidak ditemukan');

      const paying = debt.type === 'owe';
      if (paying && Number(wallets[0].balance) < Number(amount)) {
        throw new Error('Saldo dompet tidak cukup');
      }

      await client.query('INSERT INTO debt_payments (debt_id, wallet_id, amount, note) VALUES ($1, $2, $3, $4)', [debtId, walletId, amount, note]);
      await client.query(
        `UPDATE wallets SET balance = balance ${paying ? '-' : '+'} $1 WHERE id = $2`,
        [amount, walletId]
      );
      await client.query(
        `UPDATE debts
            SET remaining_amount = remaining_amount - $1,
                status = CASE WHEN remaining_amount - $1 <= 0 THEN 'settled' ELSE status END,
                updated_at = now()
          WHERE id = $2`,
        [amount, debtId]
      );
    });
  },

  async deleteDebt(id: string, workspaceId: string): Promise<void> {
    await query('DELETE FROM debts WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
  },

  async getLoanTrackers(workspaceId: string): Promise<LoanTracker[]> {
    const { rows } = await query(
      'SELECT * FROM loan_trackers WHERE workspace_id = $1 ORDER BY start_date DESC',
      [workspaceId]
    );
    return rows.map((r) => ({ ...r, currency: r.currency || 'IDR' })) as LoanTracker[];
  }
};
