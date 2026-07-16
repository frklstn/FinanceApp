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

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake can cause a very difficult bug to debug, where
  // the user is signed in but they are shown as signed out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  if (!user && isProtectedPath) {
    const redirectUrl = new URL('/login', `${proto}://${host}`);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect unauthenticated users from /reset-password to /forgot-password
  if (!user && isResetPasswordPath) {
    const redirectUrl = new URL('/forgot-password', `${proto}://${host}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    // Database query check for suspension state
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
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
