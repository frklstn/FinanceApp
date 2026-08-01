'use server';

import { adminService } from '@/lib/services/server/admin.service';
import { query } from '@/lib/db/server';
import { requireSuperAdmin } from '@/lib/auth/account';

export interface AdminUser {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  created_at: string;
  plan: 'free' | 'pro';
  plan_expires_at: string | null;
  is_admin: boolean;
}

export async function listUsersAction(): Promise<AdminUser[]> {
  const session = await requireSuperAdmin();
  if (!session) throw new Error('Unauthorized');

  const { rows } = await query(
    `SELECT p.id, p.email, u.username, p.full_name, p.avatar_url, p.is_suspended,
            p.created_at, p.plan,
            p.plan_expires_at,
            (a.user_id IS NOT NULL) AS is_admin
       FROM profiles p
       LEFT JOIN users u ON u.id = p.id
       LEFT JOIN admins a ON a.user_id = p.id
      ORDER BY p.created_at DESC`
  );
  return rows as AdminUser[];
}

export async function setUserPlanAction(userId: string, plan: 'free' | 'pro', expiresAt?: string | null) {
  const session = await requireSuperAdmin();
  if (!session) throw new Error('Unauthorized');

  await adminService.setUserPlan(userId, plan, expiresAt);
}

export async function updateUserProfileAction(
  userId: string,
  data: { full_name: string | null; avatar_url: string | null }
) {
  const session = await requireSuperAdmin();
  if (!session) throw new Error('Unauthorized');

  await query('UPDATE profiles SET full_name = $1, avatar_url = $2, updated_at = now() WHERE id = $3', [
    data.full_name,
    data.avatar_url,
    userId,
  ]);
}

export async function getWhatsappContactAction(): Promise<string | null> {
  const session = await requireSuperAdmin();
  if (!session) throw new Error('Unauthorized');

  const { rows } = await query('SELECT whatsapp_contact FROM profiles WHERE id = $1', [session.userId]);
  return rows[0]?.whatsapp_contact ?? null;
}

export async function setWhatsappContactAction(link: string) {
  // Kontak ini dibaca lintas-user (profileService.getWhatsappContact mengambil
  // satu baris pro mana pun), jadi efektif ini setelan global, bukan milik
  // pribadi. Harus superadmin.
  const session = await requireSuperAdmin();
  if (!session) throw new Error('Unauthorized');

  await adminService.setWhatsappContact(session.userId, link);
}

export async function bulkUpdateStatusAction(userIds: string[], isSuspended: boolean) {
  const session = await requireSuperAdmin();
  if (!session) throw new Error('Unauthorized');

  // Menonaktifkan akun sendiri = terkunci permanen: requireAccount menolak akun
  // tersuspensi, jadi halaman admin ikut tertutup dan tidak ada jalan
  // mengaktifkannya kembali lewat UI. Dijaga di server, bukan cuma di tombol.
  if (isSuspended && userIds.includes(session.userId)) {
    throw new Error('Tidak bisa menonaktifkan akun sendiri.');
  }

  return await adminService.bulkUpdateStatus(userIds, isSuspended);
}
