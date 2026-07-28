'use server';

import { z } from 'zod';
import { createUser, getUserByEmail } from '@/lib/db/user.repo';
import { createWorkspaceForUser } from '@/lib/db/profile.repo';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

/**
 * Validasi ada di server karena server action bisa dipanggil langsung tanpa
 * melewati halaman. Minimum 8 karakter menyamakan dengan alur reset kata sandi;
 * halaman daftar sebelumnya meminta 6.
 */
const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid.'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
  fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
});

export async function register(_prevState: unknown, formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password, fullName } = parsed.data;

  // Dicek terpisah supaya pesannya jelas. Sebelumnya email ganda jatuh ke catch
  // dan keluar sebagai "Gagal membuat akun".
  if (await getUserByEmail(email)) {
    return { error: 'Email ini sudah terdaftar. Silakan masuk.' };
  }

  try {
    const user = await createUser(email, await hashPassword(password));
    await createWorkspaceForUser(user.id, email, fullName);
    await createSession(user.id);
  } catch (err) {
    console.error('Registration error:', err instanceof Error ? err.message : 'unknown');
    return { error: 'Gagal membuat akun.' };
  }

  redirect('/finance/dashboard');
}
