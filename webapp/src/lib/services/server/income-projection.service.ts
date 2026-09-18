import "server-only";
import { query } from '@/lib/db/server';
import type { IncomeTimelineEntry } from '@/lib/debt-planner/types';

export interface CreateIncomeEntryInput {
  effective_date: string;
  monthly_income: number;
  currency: string;
}

export const incomeProjectionService = {
  async getTimeline(workspaceId: string): Promise<IncomeTimelineEntry[]> {
    const { rows } = await query(
      'SELECT * FROM income_timeline WHERE workspace_id = $1 ORDER BY effective_date ASC',
      [workspaceId]
    );
    return rows.map(entry => ({ ...entry, currency: entry.currency ?? 'IDR' }));
  },

  async createEntry(
    workspaceId: string,
    input: CreateIncomeEntryInput
  ): Promise<IncomeTimelineEntry> {
    // Tabel income_timeline tak punya kolom currency. Selalu IDR.
    const { rows } = await query(
      'INSERT INTO income_timeline (workspace_id, effective_date, monthly_income) VALUES ($1, $2, $3) RETURNING *',
      [workspaceId, input.effective_date, input.monthly_income]
    );
    return { ...rows[0], currency: rows[0].currency ?? 'IDR' };
  },

};
