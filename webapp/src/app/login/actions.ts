'use server';

import { getUserByIdentifier } from '@/lib/db/user.repo';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function login(_prevState: unknown, formData: FormData) {
  // Bisa email atau nama pengguna. Sebelumnya hanya email, padahal form-nya
  // sudah bertuliskan "Username".
  const identifier = ((formData.get('identifier') || formData.get('email')) as string || '').trim();
  const password = formData.get('password') as string;

  if (!identifier || !password) {
    return { error: 'Email/username dan kata sandi wajib diisi.' };
  }

  try {
    const user = await getUserByIdentifier(identifier);

    // Pesannya sengaja sama untuk akun tidak ada maupun kata sandi salah, supaya
    // halaman login tidak bisa dipakai menebak akun mana yang terdaftar.
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return { error: 'Email/username atau kata sandi salah.' };
    }

    await createSession(user.id);
  } catch (err) {
    console.error('Login error:', err instanceof Error ? err.message : 'unknown');
    return { error: 'Gagal masuk.' };
  }

  redirect('/finance/dashboard');
}
