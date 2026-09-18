import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

export const OAUTH_STATE_COOKIE = 'g_oauth_state';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  // Tanpa `state`, callback menerima kode otorisasi apa pun yang sampai ke sana.
  // Penyerang bisa memancing korban menyelesaikan alur login memakai kode milik
  // penyerang, sehingga korban mencatat keuangannya ke akun penyerang (login CSRF).
  // Nilai ini disimpan di cookie httpOnly lalu dicocokkan di callback.
  const state = randomBytes(32).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 menit, cukup untuk menyelesaikan alur
    path: '/',
  });

  const params = new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
