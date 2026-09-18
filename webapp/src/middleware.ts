import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const session = await verifySession(request);
  const path = request.nextUrl.pathname;

  const isProtected = path.startsWith('/finance') || path.startsWith('/user') || path === '/suspended';
  const isAuth = path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/forgot-password');

  if (!session && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (session && isAuth) {
    return NextResponse.redirect(new URL('/finance/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
