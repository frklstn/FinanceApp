import type { User } from '@supabase/supabase-js';

/** Matches client + RLS superadmin rules in migration 004. */
export function isSuperAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase();
  return (
    email.includes('admin') ||
    email === 'ifalfahlevi4@gmail.com' ||
    user.user_metadata?.is_admin === true
  );
}
