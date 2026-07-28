import "server-only";
import { query } from '@/lib/db/server';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_suspended?: boolean | null;
  language?: string | null;
  plan_expires_at?: string | null;
  plan?: 'free' | 'pro' | null;
  app_name?: string | null;
  app_icon_url?: string | null;
  app_title?: string | null;
  tax_rate?: number | null;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { rows } = await query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [userId]);
    return (rows[0] as UserProfile) || null;
  },

  async getUserPlan(userId: string): Promise<'free' | 'pro'> {
    const { rows } = await query(
      'SELECT plan FROM profiles WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (rows.length === 0) return 'free';
    return (rows[0].plan as 'free' | 'pro') ?? 'free';
  },

  async getUserBranding(userId: string): Promise<{
    app_name: string | null;
    app_icon_url: string | null;
    app_title: string | null;
  }> {
    const { rows } = await query(
      'SELECT app_name, app_icon_url, app_title FROM profiles WHERE id = $1 LIMIT 1',
      [userId]
    );
    if (rows.length === 0) return { app_name: null, app_icon_url: null, app_title: null };
    return {
      app_name: rows[0].app_name ?? null,
      app_icon_url: rows[0].app_icon_url ?? null,
      app_title: rows[0].app_title ?? null,
    };
  },

  async getWhatsappContact(): Promise<string | null> {
    const { rows } = await query(
      'SELECT whatsapp_contact FROM profiles WHERE plan = $1 AND whatsapp_contact IS NOT NULL LIMIT 1',
      ['pro']
    );
    if (rows.length === 0) return null;
    return rows[0].whatsapp_contact ?? null;
  },
};
