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

    const categories = (data as unknown as Category[]) || [];

    // Filter out locally hidden system categories
    if (typeof window !== 'undefined') {
      const hiddenStr = localStorage.getItem('finance_app_hidden_system_categories');
      if (hiddenStr) {
        try {
          const hiddenIds = JSON.parse(hiddenStr) as string[];
          return categories.filter((cat) => !hiddenIds.includes(cat.id));
        } catch (e) {
          console.error('Error parsing hidden categories:', e);
        }
      }
    }

    return categories;
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
    return data as unknown as Category;
  },

  /**
   * Updates an existing custom category.
   * If the category is a system category, we hide it and clone it under the user's workspace.
   */
  async updateCategory(
    id: string,
    name: string,
    icon: string,
    color: string,
    type: 'income' | 'expense' | 'transfer',
    workspaceId: string,
    parentId: string | null = null
  ): Promise<Category> {
    const supabase = createClient();

    // Check if we are updating a system category (workspace_id is null)
    const { data: checkCat } = await supabase
      .from('categories')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (checkCat && checkCat.workspace_id === null) {
      // 1. Hide the system category locally
      if (typeof window !== 'undefined') {
        const hiddenStr = localStorage.getItem('finance_app_hidden_system_categories') || '[]';
        try {
          const hiddenIds = JSON.parse(hiddenStr) as string[];
          if (!hiddenIds.includes(id)) {
            hiddenIds.push(id);
            localStorage.setItem('finance_app_hidden_system_categories', JSON.stringify(hiddenIds));
          }
        } catch (e) {
          console.error(e);
        }
      }

      // 2. Clone it as a custom workspace-specific category
      return await this.createCategory(workspaceId, name, icon, color, type, parentId);
    }

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
    return data as unknown as Category;
  },

  /**
   * Deletes a custom category.
   * If the category is a system category, we hide it locally.
   */
  async deleteCategory(id: string): Promise<void> {
    const supabase = createClient();

    // Check if we are deleting a system category (workspace_id is null)
    const { data: checkCat } = await supabase
      .from('categories')
      .select('workspace_id')
      .eq('id', id)
      .single();

    if (checkCat && checkCat.workspace_id === null) {
      // Hide the system category locally
      if (typeof window !== 'undefined') {
        const hiddenStr = localStorage.getItem('finance_app_hidden_system_categories') || '[]';
        try {
          const hiddenIds = JSON.parse(hiddenStr) as string[];
          if (!hiddenIds.includes(id)) {
            hiddenIds.push(id);
            localStorage.setItem('finance_app_hidden_system_categories', JSON.stringify(hiddenIds));
          }
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error('Error deleting category:', error);
      throw new Error(error.message);
    }
  },
};
