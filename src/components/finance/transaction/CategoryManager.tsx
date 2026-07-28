'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import type { Category } from '@/lib/services/server/category.service';
import { listCategories, saveCategoryAction, deleteCategoryAction } from '@/app/actions/category';
import { Pencil, Trash2 } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Scope diambil dari sesi di server; prop ini hanya penanda siap/tidak. */
  workspaceId: string;
  onChanged?: () => void;
}

export function CategoryManagerModal({ isOpen, onClose, onChanged }: CategoryManagerModalProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('#a8532f');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await listCategories());
    } catch {
      toast('Gagal memuat kategori', 'danger');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => fetchCategories());
    }
  }, [isOpen, fetchCategories]);

  const resetForm = () => {
    setEditingCategory(null);
    setName('');
    setColor('#a8532f');
    setType('expense');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await saveCategoryAction(editingCategory?.id ?? null, { name, color, type });
      toast(editingCategory ? 'Kategori diperbarui' : 'Kategori ditambahkan', 'success');
      resetForm();
      fetchCategories();
      onChanged?.();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan kategori', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await deleteCategoryAction(id);
      toast('Kategori dihapus', 'success');
      fetchCategories();
      onChanged?.();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menghapus', 'danger');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola kategori">
      <div className="space-y-6">
        <form onSubmit={handleSave} className="p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama kategori" value={name} onChange={(e) => setName(e.target.value)} required />
            <Select
              label="Tipe"
              value={type}
              onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              options={[{ value: 'expense', label: 'Pengeluaran' }, { value: 'income', label: 'Pemasukan' }]}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              {['#a8532f', '#c2693f', '#b45309', '#7a6f5c', '#8a4526'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent opacity-40 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {editingCategory && (
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Batal
                </Button>
              )}
              <Button type="submit" loading={submitting} size="sm">
                {editingCategory ? 'Simpan' : 'Tambah'}
              </Button>
            </div>
          </div>
        </form>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
          {loading ? (
            <div className="h-20 rounded-xl bg-[var(--nexus-bg-panel)] animate-pulse" />
          ) : categories.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--nexus-text-muted)]">Belum ada kategori.</p>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)] group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm font-medium text-[var(--nexus-text-primary)] truncate">{cat.name}</span>
                  <span className="text-[10px] text-[var(--nexus-text-muted)] shrink-0">{cat.type}</span>
                </div>
                {/* Kategori bawaan (workspace_id NULL) dipakai bersama semua akun,
                    jadi tidak disediakan tombol ubah/hapus untuk pengguna. */}
                {cat.workspace_id && (
                  <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingCategory(cat); setName(cat.name); setType(cat.type as 'income' | 'expense'); setColor(cat.color || '#a8532f'); }}
                      className="p-1.5 text-[var(--nexus-text-muted)] hover:text-[var(--nexus-text-primary)] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-[var(--nexus-text-muted)] hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
