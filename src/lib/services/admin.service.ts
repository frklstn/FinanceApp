import { createClient } from '@/lib/supabase/client';

export const adminService = {
  async setUserPlan(userId: string, plan: 'free' | 'pro'): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  async setUserBranding(
    userId: string,
    branding: {
      app_name: string | null;
      app_icon_url: string | null;
      app_title: string | null;
    }
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        app_name: branding.app_name,
        app_icon_url: branding.app_icon_url,
        app_title: branding.app_title,
      })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  },

  async setWhatsappContact(link: string): Promise<void> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Pengguna tidak terotentikasi');

    const { error } = await supabase
      .from('profiles')
      .update({ whatsapp_contact: link })
      .eq('id', user.id);

    if (error) throw new Error(error.message);
  },
};
