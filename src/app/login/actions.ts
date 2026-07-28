'use server';

import { getUserByEmail } from '@/lib/db/user.repo';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan kata sandi wajib diisi.' };
  }

  try {
    const user = await getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return { error: 'Email atau kata sandi salah.' };
    }

    await createSession(user.id);
  } catch (err: any) {
    console.error('Login error:', err);
    return { error: 'Gagal masuk.' };
  }

  redirect('/finance/dashboard');
}
