import 'server-only';
import { verifySession } from './session';
import { workspaceService } from '@/lib/services/server/workspace';
import { adminService } from '@/lib/services/server/admin.service';

/**
 * Sesi + scope data milik user.
 *
 * accountId TIDAK PERNAH diterima dari client. Dulu RLS Supabase yang menjamin
 * satu user cuma bisa baca barisnya sendiri; setelah pindah ke Postgres lokal
 * tidak ada RLS sama sekali, jadi batas itu harus ditegakkan di sini. Server
 * action yang menerima accountId sebagai parameter berarti mengizinkan user
 * login manapun membaca workspace orang lain.
 *
 * File ini sengaja terpisah dari session.ts: session.ts dipakai middleware, dan
 * mengimpor workspaceService (yang menarik 'pg') ke sana akan menyeret pg ke
 * bundle middleware.
 */
export async function requireAccount(): Promise<{ userId: string; accountId: string } | null> {
  const session = await verifySession();
  if (!session) return null;

  // Suspensi ditegakkan di sini karena ini gerbang yang dilewati semua server
  // action. Middleware tidak bisa memeriksanya: berjalan di edge runtime, tidak
  // bisa memakai 'pg'.
  const accountId = await workspaceService.getActiveAccountForUser(session.userId);
  if (!accountId) return null;

  return { userId: session.userId, accountId };
}

export async function requireSuperAdmin(): Promise<{ userId: string } | null> {
  const session = await verifySession();
  if (!session) return null;

  const isAdmin = await adminService.isSuperAdmin(session.userId);
  return isAdmin ? session : null;
}
