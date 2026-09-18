import "server-only";
import { query, withTransaction } from '@/lib/db/server';
import type { LoanTracker } from '@/lib/debt-planner/types';

export interface LoanTrackerInput {
  app_name: string;
  category: string;
  amount_applied?: number | null;
  amount_received: number;
  total_repayment: number;
  monthly_payment: number;
  tenure_months: number;
  due_day: number;
  start_date: string;
  salary_date?: number | null;
  status?: string;
  notes?: string | null;
  payment_frequency?: string | null;
  total_remaining_balance?: number | null;
  currency?: string;
}

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
  },

  async createLoanTracker(workspaceId: string, input: LoanTrackerInput): Promise<LoanTracker> {
    const { rows } = await query(
      `INSERT INTO loan_trackers
         (workspace_id, app_name, category, amount_applied, amount_received, total_repayment,
          monthly_payment, tenure_months, due_day, start_date, salary_date, status, notes,
          payment_frequency, total_remaining_balance, currency)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        workspaceId,
        input.app_name,
        input.category,
        input.amount_applied ?? null,
        input.amount_received,
        input.total_repayment,
        input.monthly_payment,
        input.tenure_months,
        input.due_day,
        input.start_date,
        input.salary_date ?? null,
        input.status ?? 'active',
        input.notes ?? null,
        input.payment_frequency ?? 'monthly',
        // Sisa awal = total yang harus dibayar. Tanpa ini dashboard menghitung
        // total kewajiban sebagai nol.
        input.total_remaining_balance ?? input.total_repayment,
        input.currency ?? 'IDR',
      ]
    );
    return rows[0] as LoanTracker;
  },

  async updateLoanTracker(id: string, workspaceId: string, input: LoanTrackerInput): Promise<LoanTracker | null> {
    const { rows } = await query(
      `UPDATE loan_trackers SET
         app_name = $3, category = $4, amount_applied = $5, amount_received = $6,
         total_repayment = $7, monthly_payment = $8, tenure_months = $9, due_day = $10,
         start_date = $11, status = $12, notes = $13, updated_at = now()
       WHERE id = $1 AND workspace_id = $2
       RETURNING *`,
      [
        id,
        workspaceId,
        input.app_name,
        input.category,
        input.amount_applied ?? null,
        input.amount_received,
        input.total_repayment,
        input.monthly_payment,
        input.tenure_months,
        input.due_day,
        input.start_date,
        input.status ?? 'active',
        input.notes ?? null,
      ]
    );
    return (rows[0] as LoanTracker) ?? null;
  },

  async deleteLoanTracker(id: string, workspaceId: string): Promise<void> {
    await query('DELETE FROM loan_trackers WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
  },
};
