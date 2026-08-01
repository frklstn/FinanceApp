import { query } from '@/lib/db/server';
import { randomUUID } from 'crypto';

export interface DbUser {
  id: string;
  email: string;
  username: string | null;
  password_hash: string;
  email_verified: boolean;
  confirmation_token: string | null;
  reset_token: string | null;
  reset_token_expires: string | null;
  created_at: string;
  updated_at: string;
}

export async function createUser(
  email: string,
  passwordHash: string,
  username?: string | null
): Promise<DbUser> {
  const { rows } = await query(
    'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *',
    [email, passwordHash, username || null]
  );
  return rows[0];
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
  return rows[0] || null;
}

export async function getUserByUsername(username: string): Promise<DbUser | null> {
  const { rows } = await query('SELECT * FROM users WHERE lower(username) = lower($1)', [username]);
  return rows[0] || null;
}

/**
 * Cari akun dari email ATAU nama pengguna.
 *
 * Form login sebelumnya bertuliskan "Username" tetapi input-nya `type="email"`
 * dan hanya mencocokkan kolom email, jadi nama pengguna tidak pernah bisa dipakai.
 */
export async function getUserByIdentifier(identifier: string): Promise<DbUser | null> {
  const { rows } = await query(
    'SELECT * FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($1) LIMIT 1',
    [identifier]
  );
  return rows[0] || null;
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function setResetToken(email: string): Promise<string | null> {
  const token = randomUUID();
  const expires = new Date(Date.now() + 3600_000).toISOString(); // 1 hour
  const { rowCount } = await query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
    [token, expires, email]
  );
  return rowCount && rowCount > 0 ? token : null;
}

export async function getUserByResetToken(token: string): Promise<DbUser | null> {
  const { rows } = await query(
    'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );
  return rows[0] || null;
}

export async function updatePassword(userId: string, passwordHash: string): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
}
