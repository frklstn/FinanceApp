'use server'

import { z } from 'zod';
import { query } from '@/lib/db/server';
import { transactionService } from '@/lib/services/server/transaction.service';
import { hashPassword } from '@/lib/auth/password';
import { deleteSession } from '@/lib/auth/session';
import { requireAccount } from '@/lib/auth/account';

const ProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
  avatarUrl: z.string().trim(),
  currency: z.string().trim().optional(),
  password: z.string().optional(),
});

export async function updateProfileAction(input: {
  fullName: string;
  avatarUrl: string;
  currency?: string;
  password?: string;
}) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { fullName, avatarUrl, currency, password } = parsed.data;

  // Email sengaja tidak bisa diubah dari sini: mengubahnya tanpa verifikasi
  // ulang berarti akun bisa dipindah ke alamat yang belum tentu dimiliki.
  await query(
    `UPDATE profiles SET full_name = $1, avatar_url = $2, currency = COALESCE($3, currency), updated_at = now()
     WHERE id = $4`,
    [fullName, avatarUrl || null, currency || null, auth.userId]
  );

  if (password) {
    if (password.length < 6) throw new Error('Kata sandi minimal 6 karakter.');
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      await hashPassword(password),
      auth.userId,
    ]);
  }
}

export async function updateLanguageAction(language: 'id' | 'en') {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  if (language !== 'id' && language !== 'en') throw new Error('Bahasa tidak dikenal');
  await query('UPDATE profiles SET language = $1, updated_at = now() WHERE id = $2', [
    language,
    auth.userId,
  ]);
}

/** Kosongkan seluruh data keuangan, akunnya tetap ada. */
export async function resetDataAction() {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await query('SELECT public.reset_my_data($1)', [auth.userId]);
}

export async function deleteAccountAction() {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await query('SELECT public.delete_my_account($1)', [auth.userId]);
  // Cookie ikut dibuang; kalau tidak, sesi tetap menunjuk user yang sudah hilang.
  await deleteSession();
}

/**
 * Kontak bantuan yang dipasang admin, untuk pengguna Free yang mau upgrade.
 *
 * Diambil dari profil superadmin — bukan dari "user pro mana pun" seperti query
 * lama, yang meleset kalau adminnya sendiri masih berpaket free.
 */
export async function getSupportContactAction(): Promise<string | null> {
  const auth = await requireAccount();
  if (!auth) return null;

  const { rows } = await query(
    `SELECT p.whatsapp_contact
       FROM admins a JOIN profiles p ON p.id = a.user_id
      WHERE p.whatsapp_contact IS NOT NULL AND p.whatsapp_contact <> ''
      LIMIT 1`
  );
  return rows[0]?.whatsapp_contact ?? null;
}

/** Seluruh transaksi untuk keperluan ekspor. */
export async function getAllTransactionsForExport() {
  const auth = await requireAccount();
  if (!auth) return [];

  const { data } = await transactionService.getTransactions(auth.accountId, { limit: 100000 });
  return data;
}
