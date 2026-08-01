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
  tax_rate?: number | null;
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { rows } = await query('SELECT * FROM profiles WHERE id = $1 LIMIT 1', [userId]);
    return (rows[0] as UserProfile) || null;
  },



};
