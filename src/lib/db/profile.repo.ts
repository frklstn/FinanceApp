import { query, withTransaction } from '@/lib/db/server';

export interface DbProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  language: string;
  timezone: string;
  is_suspended: boolean;
  plan: string;
  app_name: string | null;
  app_icon_url: string | null;
  app_title: string | null;
  whatsapp_contact: string | null;
  tax_rate: number;
  workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function createProfile(userId: string, email: string, fullName: string | null): Promise<DbProfile> {
  const { rows } = await query(
    `INSERT INTO profiles (id, email, full_name, language) VALUES ($1, $2, $3, 'id') RETURNING *`,
    [userId, email, fullName]
  );
  return rows[0];
}

export async function getProfileById(userId: string): Promise<DbProfile | null> {
  const { rows } = await query('SELECT * FROM profiles WHERE id = $1', [userId]);
  return rows[0] || null;
}

export async function updateProfile(userId: string, data: Partial<Pick<DbProfile, 'full_name' | 'avatar_url' | 'language' | 'currency'>>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
  }
  if (fields.length === 0) return;
  values.push(userId);
  await query(`UPDATE profiles SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i}`, values);
}

export async function createWorkspaceForUser(userId: string, email: string, fullName: string | null): Promise<string> {
  return await withTransaction(async (client) => {
    // Create profile
    await client.query(
      `INSERT INTO profiles (id, email, full_name, language) VALUES ($1, $2, $3, 'id') ON CONFLICT (id) DO NOTHING`,
      [userId, email, fullName]
    );
    // Create workspace
    const { rows: wsRows } = await client.query(
      'INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id',
      [`${fullName || email}'s Workspace`, userId]
    );
    const workspaceId = wsRows[0].id;
    // Add membership
    await client.query(
      'INSERT INTO workspace_members (workspace_id, profile_id, role) VALUES ($1, $2, $3)',
      [workspaceId, userId, 'owner']
    );
    // Update profile
    await client.query(
      'UPDATE profiles SET workspace_id = $1 WHERE id = $2',
      [workspaceId, userId]
    );
    return workspaceId;
  });
}
