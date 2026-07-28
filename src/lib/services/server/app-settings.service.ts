import "server-only";
import { query } from '@/lib/db/server';

export const DEFAULT_APP_SETTINGS = {
  app_name: 'FinanceApp',
  app_logo_url: null,
  document_title: 'FinanceApp - Premium Personal Finance Platform',
};

export interface AppSettings {
  app_name: string;
  app_logo_url: string | null;
  document_title: string;
}

export const appSettingsService = {
  async getSettings(): Promise<AppSettings> {
    try {
      const { rows } = await query('SELECT app_name, app_logo_url, document_title FROM app_settings WHERE id = 1');
      return rows[0] || DEFAULT_APP_SETTINGS;
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const { rows } = await query('SELECT id FROM app_settings WHERE id = 1');
    if (rows.length === 0) {
      await query(
        'INSERT INTO app_settings (id, app_name, app_logo_url, document_title) VALUES (1, $1, $2, $3)',
        [settings.app_name, settings.app_logo_url, settings.document_title]
      );
    } else {
      await query(
        'UPDATE app_settings SET app_name = $1, app_logo_url = $2, document_title = $3 WHERE id = 1',
        [settings.app_name, settings.app_logo_url, settings.document_title]
      );
    }
  },
};
