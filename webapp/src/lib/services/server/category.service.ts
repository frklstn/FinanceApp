import "server-only";
import { query } from '@/lib/db/server';

export interface Category {
  id: string;
  workspace_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export const categoryService = {
  async getCategories(workspaceId: string): Promise<Category[]> {
    const { rows } = await query(
      'SELECT * FROM categories WHERE workspace_id = $1 OR workspace_id IS NULL ORDER BY name',
      [workspaceId]
    );
    return rows;
  },

  async createCategory(
    workspaceId: string,
    input: { name: string; icon?: string; color?: string; type: string }
  ): Promise<Category> {
    const { rows } = await query(
      'INSERT INTO categories (workspace_id, name, icon, color, type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [workspaceId, input.name, input.icon || 'tag', input.color || '#a8532f', input.type]
    );
    return rows[0];
  },

  // update & delete disyaratkan workspace_id cocok. Selain mencegah user mengubah
  // kategori milik workspace lain, ini juga melindungi kategori bawaan
  // (workspace_id NULL) yang dipakai bersama semua akun.
  async updateCategory(
    id: string,
    workspaceId: string,
    input: { name: string; icon?: string; color?: string; type: string }
  ): Promise<Category | null> {
    const { rows } = await query(
      `UPDATE categories SET name = $3, icon = $4, color = $5, type = $6, updated_at = now()
       WHERE id = $1 AND workspace_id = $2 RETURNING *`,
      [id, workspaceId, input.name, input.icon || 'tag', input.color || '#a8532f', input.type]
    );
    return rows[0] ?? null;
  },

  async deleteCategory(id: string, workspaceId: string): Promise<void> {
    await query('DELETE FROM categories WHERE id = $1 AND workspace_id = $2', [id, workspaceId]);
  }
};
