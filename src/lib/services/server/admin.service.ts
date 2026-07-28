import "server-only";
import { query } from '@/lib/db/server';

export const adminService = {
  async setUserPlan(userId: string, plan: 'free' | 'pro', expiresAt?: string | null): Promise<void> {
    let expires = expiresAt;
    if (expiresAt === undefined && plan === 'pro') {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      expires = d.toISOString();
    } else if (plan === 'free') {
      expires = null;
    }
    
    await query(
      'UPDATE profiles SET plan = $1, plan_expires_at = $2 WHERE id = $3',
      [plan, expires, userId]
    );
  },

  async setUserBranding(
    userId: string,
    branding: {
      app_name: string | null;
      app_icon_url: string | null;
      app_title: string | null;
    }
  ): Promise<void> {
    await query(
      'UPDATE profiles SET app_name = $1, app_icon_url = $2, app_title = $3 WHERE id = $4',
      [branding.app_name, branding.app_icon_url, branding.app_title, userId]
    );
  },

  async setWhatsappContact(userId: string, link: string): Promise<void> {
    await query(
      'UPDATE profiles SET whatsapp_contact = $1 WHERE id = $2',
      [link, userId]
    );
  },

  async bulkUpdateStatus(userIds: string[], isSuspended: boolean): Promise<void> {
    await query(
      'UPDATE profiles SET is_suspended = $1 WHERE id = ANY($2)',
      [isSuspended, userIds]
    );
  },

  async isSuperAdmin(userId: string): Promise<boolean> {
    const { rows } = await query('SELECT 1 FROM admins WHERE user_id = $1', [userId]);
    return rows.length > 0;
  },
};
