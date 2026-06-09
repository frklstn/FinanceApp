import { createClient } from '@/lib/supabase/client';

export interface AppSettings {
  id: number;
  app_name: string;
  app_logo_url: string | null;
  document_title: string;
  updated_at: string;
  updated_by: string | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  id: 1,
  app_name: 'FinanceApp',
  app_logo_url: null,
  document_title: 'FinanceApp',
  updated_at: new Date().toISOString(),
  updated_by: null,
};

export const appSettingsService = {
  async getSettings(): Promise<AppSettings> {
    const supabase = createClient();
    const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        return DEFAULT_APP_SETTINGS;
      }
      throw new Error(error.message);
    }

    return data ?? DEFAULT_APP_SETTINGS;
  },

  async updateSettings(
    input: Pick<AppSettings, 'app_name' | 'app_logo_url' | 'document_title'>,
    updatedBy: string
  ): Promise<AppSettings> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .update({
        app_name: input.app_name,
        app_logo_url: input.app_logo_url,
        document_title: input.document_title,
        updated_by: updatedBy,
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
