import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  // Clean up all auth params from the redirect URL
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('next');
  redirectTo.searchParams.delete('error');

  const supabase = await createClient();

  // PKCE flow — Supabase sends a `code` param (default with @supabase/ssr)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // OTP flow — Supabase sends `token_hash` + `type` params
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // Both flows failed — redirect to login with a clear error message
  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = '/login';
  errorUrl.search = '';
  errorUrl.searchParams.set('error', 'Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.');
  return NextResponse.redirect(errorUrl);
}
