import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/finance/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const baseUrl = isLocalEnv ? origin : `https://${forwardedHost}`;
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Fallback to login with error
  return NextResponse.redirect(`${origin}/login?error=Could not verify auth code`);
}
