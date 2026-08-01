import "server-only";
import { query } from '@/lib/db/server';

/**
 * Resolves the user's primary data scope.
 * DB still uses workspace_id columns; each user gets one personal scope at signup.
 */
export const workspaceService = {
  async getAccountIdForUser(userId: string): Promise<string | null> {
    const { rows } = await query(
      'SELECT workspace_id FROM workspace_members WHERE profile_id = $1 ORDER BY created_at ASC LIMIT 1',
      [userId]
    );
    return rows.length > 0 ? rows[0].workspace_id : null;
  },

  /**
   * Scope data user, TAPI null kalau akunnya disuspensi.
   *
   * Dipakai requireAccount() sebagai satu-satunya gerbang server action. Kolom
   * is_suspended sebelumnya hanya ditulis admin dan tidak pernah dibaca siapa pun,
   * sehingga tombol suspend tidak berefek sama sekali.
   */
  async getActiveAccountForUser(userId: string): Promise<string | null> {
    const { rows } = await query(
      `SELECT wm.workspace_id, p.is_suspended
         FROM workspace_members wm
         JOIN profiles p ON p.id = wm.profile_id
        WHERE wm.profile_id = $1
        ORDER BY wm.created_at ASC
        LIMIT 1`,
      [userId]
    );

    const row = rows[0];
    if (!row || row.is_suspended) return null;
    return row.workspace_id;
  },
};

