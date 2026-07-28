'use server'

import { categoryService } from '@/lib/services/server/category.service';
import { requireAccount } from '@/lib/auth/account';

export async function listCategories() {
  const auth = await requireAccount();
  if (!auth) return [];

  return await categoryService.getCategories(auth.accountId);
}

export async function saveCategoryAction(
  id: string | null,
  input: { name: string; color: string; type: string }
) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  const name = input.name.trim();
  if (!name) throw new Error('Nama kategori wajib diisi');

  if (id) {
    const updated = await categoryService.updateCategory(id, auth.accountId, { ...input, name });
    // null berarti kategorinya milik workspace lain, atau kategori bawaan.
    if (!updated) throw new Error('Kategori tidak bisa diubah');
    return updated;
  }

  return await categoryService.createCategory(auth.accountId, { ...input, name });
}

export async function deleteCategoryAction(id: string) {
  const auth = await requireAccount();
  if (!auth) throw new Error('Unauthorized');

  await categoryService.deleteCategory(id, auth.accountId);
}
