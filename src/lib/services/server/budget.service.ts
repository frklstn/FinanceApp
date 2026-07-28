import "server-only";
import { query } from '@/lib/db/server';

export interface Budget {
  id: string;
  workspace_id: string;
  category_id: string;
  amount: number;
  spent: number;
  period: string;
  currency: string;
  created_at: string;
  updated_at: string;
  categories?: { name: string; color: string };
}

export const budgetService = {
  async getBudgets(workspaceId: string, periodString?: string): Promise<Budget[]> {
    const currentPeriod = periodString || new Date().toISOString().substring(0, 7);

    const { rows: budgets } = await query(
      `SELECT b.*, c.name as cat_name, c.color as cat_color 
       FROM budgets b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.workspace_id = $1 AND b.period = $2`,
      [workspaceId, currentPeriod]
    );

    const startOfMonth = `${currentPeriod}-01T00:00:00Z`;
    const nextMonth = new Date(`${currentPeriod}-01T00:00:00Z`);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { rows: txs } = await query(
      `SELECT category_id, SUM(amount) as spent 
       FROM transactions 
       WHERE workspace_id = $1 AND type = 'expense' 
       AND date >= $2 AND date < $3 
       GROUP BY category_id`,
      [workspaceId, startOfMonth, nextMonth.toISOString()]
    );

    const spendingMap: { [catId: string]: number } = {};
    txs.forEach((t) => (spendingMap[t.category_id] = Number(t.spent)));

    return budgets.map((b) => ({
      ...b,
      categories: { name: b.cat_name, color: b.cat_color },
      spent: spendingMap[b.category_id] || 0,
    }));
  },

  async createBudget(
    workspaceId: string,
    categoryId: string,
    amount: number,
    periodString?: string,
    currency: string = 'IDR'
  ): Promise<Budget> {
    const period = periodString || new Date().toISOString().substring(0, 7);
    const startOfMonth = `${period}-01T00:00:00Z`;
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const { rows } = await query(
      `INSERT INTO budgets (workspace_id, category_id, amount, period, start_date, end_date, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (workspace_id, category_id, period)
       DO UPDATE SET amount = EXCLUDED.amount, currency = EXCLUDED.currency
       RETURNING *`,
      [workspaceId, categoryId, amount, period, startOfMonth, endOfMonth.toISOString(), currency]
    );
    return { ...rows[0], spent: 0 };
  },

  async deleteBudget(id: string, workspaceId: string): Promise<void> {
    await query('DELETE FROM budgets WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
  },
};
