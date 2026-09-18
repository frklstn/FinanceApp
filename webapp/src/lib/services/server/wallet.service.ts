import "server-only";
import { query } from '@/lib/db/server';

export interface Wallet {
  id: string;
  workspace_id: string;
  name: string;
  type: 'cash' | 'bank' | 'e-wallet' | 'crypto' | 'savings' | 'other';
  balance: number;
  color: string;
  icon: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const walletService = {
  async getWallets(workspaceId: string): Promise<Wallet[]> {
    const { rows } = await query(
      'SELECT * FROM wallets WHERE workspace_id = $1 ORDER BY name ASC',
      [workspaceId]
    );
    return rows as Wallet[];
  },

  async createWallet(
    workspaceId: string,
    name: string,
    type: string,
    balance: number,
    color: string,
    icon: string,
    currency: string = 'IDR'
  ): Promise<Wallet> {
    const { rows } = await query(
      'INSERT INTO wallets (workspace_id, name, type, balance, color, icon, currency) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [workspaceId, name, type, balance, color, icon, currency]
    );
    return rows[0] as Wallet;
  },

  // update & delete di-scope ke workspace: id-nya datang dari client, jadi tanpa
  // syarat workspace_id user mana pun bisa mengubah dompet milik orang lain.
  async updateWallet(id: string, workspaceId: string, payload: Partial<Wallet>): Promise<Wallet | null> {
    const ALLOWED = ['name', 'type', 'color', 'icon', 'currency', 'balance', 'is_active'] as const;
    const keys = Object.keys(payload).filter((k): k is (typeof ALLOWED)[number] =>
      (ALLOWED as readonly string[]).includes(k)
    );
    if (keys.length === 0) return null;

    const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(', ');
    const values = keys.map((k) => payload[k]);
    const { rows } = await query(
      `UPDATE wallets SET ${setClause} WHERE id = $1 AND workspace_id = $2 RETURNING *`,
      [id, workspaceId, ...values]
    );
    return (rows[0] as Wallet) ?? null;
  },

  async deleteWallet(id: string, workspaceId: string): Promise<void> {
    await query('DELETE FROM wallets WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
  },
};
