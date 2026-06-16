import { createClient } from '@/lib/supabase/client';

export const profileService = {
  async getUserPlan(userId: string): Promise<'free' | 'pro'> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (error?.code === 'PGRST116') return 'free'; // row tidak ditemukan
    if (error) throw new Error(error.message);
    return (data?.plan as 'free' | 'pro') ?? 'free';
  },

  async getUserBranding(userId: string): Promise<{
    app_name: string | null;
    app_icon_url: string | null;
    app_title: string | null;
  }> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('app_name, app_icon_url, app_title')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    return {
      app_name: data?.app_name ?? null,
      app_icon_url: data?.app_icon_url ?? null,
      app_title: data?.app_title ?? null,
    };
  },

  async getWhatsappContact(): Promise<string | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('whatsapp_contact')
      .eq('plan', 'pro')
      .not('whatsapp_contact', 'is', null)
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data?.whatsapp_contact ?? null;
  },
};
