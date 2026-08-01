'use server';

import { z } from 'zod';
import { createUser, getUserByEmail, getUserByUsername } from '@/lib/db/user.repo';
import { createWorkspaceForUser } from '@/lib/db/profile.repo';
import { hashPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

/**
 * Validasi ada di server karena server action bisa dipanggil langsung tanpa
 * melewati halaman. Minimum 6 karakter, sama dengan alur reset kata sandi.
 */
const RegisterSchema = z.object({
  // Email tetap wajib meski login bisa pakai username: tanpa email tidak ada
  // jalan memulihkan akun kalau kata sandinya lupa.
  email: z.string().trim().toLowerCase().email('Format email tidak valid.'),
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
  fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,30}$/, 'Username 3-30 karakter: huruf, angka, titik, garis bawah, atau strip.')
    .optional()
    .or(z.literal('')),
});

export async function register(_prevState: unknown, formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    username: formData.get('username') ?? '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password, fullName } = parsed.data;
  const username = parsed.data.username?.trim() || null;

  // Dicek terpisah supaya pesannya jelas. Sebelumnya email ganda jatuh ke catch
  // dan keluar sebagai "Gagal membuat akun".
  if (await getUserByEmail(email)) {
    return { error: 'Email ini sudah terdaftar. Silakan masuk.' };
  }
  if (username && (await getUserByUsername(username))) {
    return { error: 'Username ini sudah dipakai.' };
  }

  try {
    const user = await createUser(email, await hashPassword(password), username);
    await createWorkspaceForUser(user.id, email, fullName);
    await createSession(user.id);
  } catch (err) {
    console.error('Registration error:', err instanceof Error ? err.message : 'unknown');
    return { error: 'Gagal membuat akun.' };
  }

  redirect('/finance/dashboard');
}
