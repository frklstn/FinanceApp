'use server';

import { adminService } from '@/lib/services/server/admin.service';
import { requireSuperAdmin } from '@/lib/auth/account';

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

  return await adminService.bulkUpdateStatus(userIds, isSuspended);
}
