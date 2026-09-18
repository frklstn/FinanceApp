import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';
import { getUserByEmail, createUser } from '@/lib/db/user.repo';
import { createWorkspaceForUser } from '@/lib/db/profile.repo';
import { createSession, generateSessionToken } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { OAUTH_STATE_COOKIE, OAUTH_MODE_COOKIE } from '../route';

function fail(reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, process.env.NEXT_PUBLIC_APP_URL!));
}

function sameState(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) return fail('GoogleAuthFailed');

  // Cocokkan state dengan cookie yang dipasang saat memulai alur, lalu langsung
  // buang supaya satu state hanya bisa dipakai sekali.
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!state || !expectedState || !sameState(state, expectedState)) {
    return fail('GoogleStateMismatch');
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    // Jangan pernah mencetak tokenData / userData: keduanya berisi access token
    // dan data pribadi, dan log server biasanya tidak diperlakukan sebagai rahasia.
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error('Gagal mendapatkan token akses dari Google');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userRes.json();
    const email = userData.email;
    const name = userData.name || (email ? email.split('@')[0] : null);

    if (!email) throw new Error('Email tidak didapatkan dari Google.');

    // Email yang belum diverifikasi Google tidak membuktikan kepemilikan. Tanpa cek
    // ini, siapa pun yang bisa membuat akun Google beralamat email milik orang lain
    // akan langsung masuk ke akun lokal yang memakai email tersebut.
    if (userData.verified_email === false) {
      return fail('GoogleEmailUnverified');
    }

    let user = await getUserByEmail(email);

    if (!user) {
      // Akun OAuth tidak punya kata sandi. Diisi nilai acak kriptografis supaya
      // hash-nya tidak bisa ditebak; sebelumnya memakai Math.random() yang bukan
      // untuk keperluan keamanan.
      const placeholderPassword = randomBytes(32).toString('hex');
      const passwordHash = await hashPassword(placeholderPassword);

      user = await createUser(email, passwordHash);
      await createWorkspaceForUser(user.id, email, name);
    }

    await createSession(user.id);

    const isMobile = cookieStore.get(OAUTH_MODE_COOKIE)?.value === 'mobile';
    cookieStore.delete(OAUTH_MODE_COOKIE);

    if (isMobile) {
      const sessionToken = await generateSessionToken(user.id);
      const mobileParams = new URLSearchParams({
        token: sessionToken,
        email: email,
        name: name || '',
      });
      return NextResponse.redirect(new URL(`/auth/mobile-success?${mobileParams}`, process.env.NEXT_PUBLIC_APP_URL!));
    }

    const res = NextResponse.redirect(new URL('/finance/dashboard', process.env.NEXT_PUBLIC_APP_URL!));
    res.cookies.set('fin_saved_account', JSON.stringify({
      email,
      name: name || email.split('@')[0],
      avatar_url: userData.picture || null,
      provider: 'google',
    }), {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // client accessible for login screen
    });

    return res;
  } catch (error) {
    console.error('Google Callback Error:', error instanceof Error ? error.message : 'unknown');
    return fail('GoogleCallbackFailed');
  }
}
