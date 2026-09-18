import "server-only";
import { query } from '@/lib/db/server';

export interface DebtPlannerSettings {
  workspace_id: string;
  salary_day: number;
}

export const debtPlannerSettingsService = {
  async getSettings(workspaceId: string): Promise<DebtPlannerSettings | null> {
    const { rows } = await query(
      'SELECT * FROM debt_planner_settings WHERE workspace_id = $1',
      [workspaceId]
    );
    return rows[0] || null;
  },

  async updateSettings(workspaceId: string, settings: Partial<DebtPlannerSettings>): Promise<void> {
    await query(
      `INSERT INTO debt_planner_settings (workspace_id, salary_day) VALUES ($1, $2)
       ON CONFLICT (workspace_id) DO UPDATE SET salary_day = EXCLUDED.salary_day`,
      [workspaceId, settings.salary_day]
    );
  }
};
