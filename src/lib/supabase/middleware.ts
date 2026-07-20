import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims memvalidasi tanda tangan JWT secara LOKAL (Web Crypto, kunci
  // asimetris di-cache) tanpa round-trip ke server Auth pada tiap request --
  // jauh lebih ringan daripada getUser() yang memanggil Auth server setiap
  // navigasi. Ini pola yang disarankan Supabase untuk proteksi route.
  //
  // IMPORTANT: Jangan menaruh logika antara createServerClient dan getClaims;
  // salah taruh bisa membuat pengguna acak ter-logout saat SSR.
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  const userId = claims?.sub;

  const path = request.nextUrl.pathname;

  // Protected paths: /finance/*, /user/*, /suspended
  const isProtectedPath =
    path.startsWith('/finance') ||
    path.startsWith('/user') ||
    path === '/suspended';

  const isAuthPath = 
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/forgot-password');

  // Reset-password is special: unauthenticated users should go to forgot-password,
  // but authenticated users in recovery mode MUST be allowed to access it.
  const isResetPasswordPath = path.startsWith('/reset-password');

  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host') || request.nextUrl.host;

  if (!claims && isProtectedPath) {
    const redirectUrl = new URL('/login', `${proto}://${host}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users from /reset-password to /forgot-password
  if (!claims && isResetPasswordPath) {
    const redirectUrl = new URL('/forgot-password', `${proto}://${host}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Prefetch (<Link> saat hover/viewport) tidak benar-benar berpindah halaman,
  // jadi tak perlu cek suspensi -- lewati query DB-nya supaya prefetch ringan.
  // Navigasi asli tetap mengeceknya.
  const isPrefetch = request.headers.get('next-router-prefetch') === '1';

  if (claims && userId && !isPrefetch) {
    // Database query check for suspension state
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', userId)
      .single();

    if (profile?.is_suspended) {
      if (path !== '/suspended') {
        const redirectUrl = new URL('/suspended', `${proto}://${host}`);
        return NextResponse.redirect(redirectUrl);
      }
    } else {
      if (path === '/suspended') {
        const redirectUrl = new URL('/finance/dashboard', `${proto}://${host}`);
        return NextResponse.redirect(redirectUrl);
      }
      
      // Allow authenticated users to access /reset-password (recovery mode)
      if (!isResetPasswordPath && isAuthPath) {
        const redirectUrl = new URL('/finance/dashboard', `${proto}://${host}`);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return supabaseResponse;
}
