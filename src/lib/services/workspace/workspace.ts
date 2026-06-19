import { createClient } from '@/lib/supabase/client';

/**
 * Resolves the user's primary data scope.
 * DB still uses workspace_id columns; each user gets one personal scope at signup.
 */
export const workspaceService = {
  async getAccountIdForUser(userId: string): Promise<string | null> {
    const supabase = createClient();

    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('profile_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return membership?.workspace_id ?? null;
  },
};

export const accountService = workspaceService;

