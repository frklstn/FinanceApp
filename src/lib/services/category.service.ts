import { createClient } from '@/lib/supabase/client';

export interface Category {
  id: string;
  workspace_id: string | null; // null for global system categories
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer';
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export const categoryService = {
  /**
   * Fetches all global categories plus workspace-specific categories.
   */
  async getCategories(workspaceId: string): Promise<Category[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(error.message);
    }
    return data || [];
  },

  /**
   * Creates a custom category for a workspace.
   */
  async createCategory(
    workspaceId: string,
    name: string,
    icon: string,
    color: string,
    type: 'income' | 'expense' | 'transfer',
    parentId: string | null = null
  ): Promise<Category> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        workspace_id: workspaceId,
        name,
        icon,
        color,
        type,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Updates an existing custom category.
   */
  async updateCategory(
    id: string,
    name: string,
    icon: string,
    color: string,
    type: 'income' | 'expense' | 'transfer',
    parentId: string | null = null
  ): Promise<Category> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        icon,
        color,
        type,
        parent_id: parentId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      throw new Error(error.message);
    }
    return data;
  },

  /**
   * Deletes a custom category.
   */
  async deleteCategory(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting category:', error);
      throw new Error(error.message);
    }
  },
};
