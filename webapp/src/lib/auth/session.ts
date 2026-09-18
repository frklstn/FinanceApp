import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = '__session';
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Kunci penandatangan sesi.
 *
 * Sebelumnya ada fallback `|| 'fallback-dev-secret-change-me'`, sehingga bila env
 * var tidak terpasang aplikasi tetap menyala memakai string yang tertulis di repo
 * ini — siapa pun yang membacanya bisa menandatangani sesi sebagai user mana pun.
 * Kegagalannya diam-diam, tanpa satu pun peringatan. Sekarang gagal terang-terangan.
 *
 * Diresolusi saat dipanggil, bukan saat modul dimuat, supaya `next build` di CI
 * (yang tidak punya .env.local) tetap bisa jalan.
 */
function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET tidak diset. Aplikasi menolak menandatangani sesi tanpa kunci yang benar.'
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${MAX_AGE}s`)
    .setIssuedAt()
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
}

export async function verifySession(request?: NextRequest): Promise<{ userId: string } | null> {
  // Sengaja di luar try: kalau kunci tidak ada itu salah konfigurasi server, harus
  // meledak. Kalau ikut tertangkap catch di bawah, hasilnya cuma "semua orang
  // dianggap belum login" tanpa petunjuk apa pun soal penyebabnya.
  const secret = getSecret();

  try {
    let token: string | undefined;
    if (request) {
      token = request.cookies.get(COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
