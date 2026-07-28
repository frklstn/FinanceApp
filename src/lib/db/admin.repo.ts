import { query } from '@/lib/db/server';

export async function isSuperAdmin(userId: string): Promise<boolean> {
  const { rows } = await query(
    'SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = $1) AS is_admin',
    [userId]
  );
  return rows[0]?.is_admin === true;
}
