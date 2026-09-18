'use server';

import { query } from '@/lib/db/server';
import { requireAccount } from '@/lib/auth/account';
import { randomBytes, createHash } from 'crypto';

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
}

export interface CreatedApiKeyResult {
  id: string;
  name: string;
  key: string;
  prefix: string;
  created_at: string;
}

export async function getApiKeysAction(): Promise<ApiKeyItem[]> {
  const auth = await requireAccount();
  if (!auth) return [];

  const res = await query(
    `SELECT id, name, key_prefix, last_used_at, created_at, is_active 
     FROM api_keys 
     WHERE workspace_id = $1 AND is_active = true 
     ORDER BY created_at DESC`,
    [auth.accountId]
  );

  return res.rows.map((r) => ({
    id: r.id,
    name: r.name,
    key_prefix: r.key_prefix,
    last_used_at: r.last_used_at ? new Date(r.last_used_at).toISOString() : null,
    created_at: new Date(r.created_at).toISOString(),
    is_active: r.is_active,
  }));
}

export async function createApiKeyAction(name: string): Promise<CreatedApiKeyResult> {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const randomHex = randomBytes(24).toString('hex');
  const rawKey = `fin_live_${randomHex}`;
  const prefix = `fin_live_${randomHex.substring(0, 6)}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const keyName = name.trim() || 'Third-Party App Key';

  const res = await query(
    `INSERT INTO api_keys (workspace_id, user_id, name, key_hash, key_prefix)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, key_prefix, created_at`,
    [auth.accountId, auth.userId, keyName, keyHash, prefix]
  );

  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    key: rawKey,
    prefix: row.key_prefix,
    created_at: new Date(row.created_at).toISOString(),
  };
}

export async function revokeApiKeyAction(keyId: string): Promise<boolean> {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const res = await query(
    `UPDATE api_keys 
     SET is_active = false, updated_at = now() 
     WHERE workspace_id = $1 AND id = $2`,
    [auth.accountId, keyId]
  );

  return (res.rowCount ?? 0) > 0;
}
