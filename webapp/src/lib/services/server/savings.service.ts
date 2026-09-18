import "server-only";
import { query, withTransaction } from '@/lib/db/server';

export interface SavingsGoal {
  id: string;
  workspace_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const savingsService = {
  async getSavingsGoals(workspaceId: string): Promise<SavingsGoal[]> {
    const { rows } = await query(
      'SELECT * FROM savings_goals WHERE workspace_id = $1 ORDER BY created_at DESC',
      [workspaceId]
    );
    return rows as SavingsGoal[];
  },

  async createSavingsGoal(
    workspaceId: string,
    name: string,
    targetAmount: number,
    currentAmount: number = 0,
    deadline: string | null = null
  ): Promise<SavingsGoal> {
    const isCompleted = currentAmount >= targetAmount;
    const { rows } = await query(
      'INSERT INTO savings_goals (workspace_id, name, target_amount, current_amount, deadline, is_completed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [workspaceId, name, targetAmount, currentAmount, deadline, isCompleted]
    );
    return rows[0] as SavingsGoal;
  },

  /**
   * Pindahkan dana dari dompet ke target tabungan.
   *
   * goalId dan walletId datang dari client, jadi keduanya diverifikasi milik
   * workspace ini. Tanpa itu satu pengguna bisa menarik saldo dompet orang lain.
   * is_completed ikut diperbarui; sebelumnya hanya diisi saat pembuatan sehingga
   * target yang tercapai lewat kontribusi tidak pernah ditandai selesai.
   */
  async addContribution(
    workspaceId: string,
    goalId: string,
    amount: number,
    walletId: string
  ): Promise<void> {
    if (!(Number(amount) > 0)) throw new Error('Jumlah harus lebih dari 0');

    await withTransaction(async (client) => {
      const { rows: goals } = await client.query(
        'SELECT id FROM savings_goals WHERE id = $1 AND workspace_id = $2',
        [goalId, workspaceId]
      );
      if (goals.length === 0) throw new Error('Target tabungan tidak ditemukan');

      const { rows: wallets } = await client.query(
        'SELECT balance FROM wallets WHERE id = $1 AND workspace_id = $2',
        [walletId, workspaceId]
      );
      if (wallets.length === 0) throw new Error('Dompet tidak ditemukan');
      if (Number(wallets[0].balance) < Number(amount)) throw new Error('Saldo dompet tidak cukup');

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE id = $2', [amount, walletId]);
      await client.query(
        `UPDATE savings_goals
            SET current_amount = current_amount + $1,
                is_completed = (current_amount + $1) >= target_amount,
                updated_at = now()
          WHERE id = $2`,
        [amount, goalId]
      );
    });
  },

  async deleteSavingsGoal(id: string, workspaceId: string): Promise<void> {
    await query('DELETE FROM savings_goals WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
  },
};
