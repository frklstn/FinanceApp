'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { categoryService, type Category } from '@/lib/services/finance/category.service';
import { Pencil, Trash2 } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export function CategoryManagerModal({ isOpen, onClose, workspaceId }: CategoryManagerModalProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [color, setColor] = useState('var(--primary)');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const list = await categoryService.getCategories(workspaceId);
      setCategories(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => fetchCategories());
    }
  }, [isOpen, fetchCategories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, name.trim(), editingCategory.icon || 'tag', color, type, workspaceId);
        toast('Kategori diperbarui!', 'success');
      } else {
        await categoryService.createCategory(workspaceId, name.trim(), 'tag', color, type);
        toast('Kategori ditambahkan!', 'success');
      }
      setName('');
      setEditingCategory(null);
      fetchCategories();
    } catch {
      toast('Gagal menyimpan kategori', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      await categoryService.deleteCategory(id);
      toast('Kategori dihapus', 'success');
      fetchCategories();
    } catch {
      toast('Gagal menghapus', 'danger');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola Kategori Keuangan">
      <div className="space-y-6">
        <form onSubmit={handleSave} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nama Kategori" value={name} onChange={(e) => setName(e.target.value)} required />
            <Select 
              label="Tipe" 
              value={type} 
              onChange={(e) => setType(e.target.value as 'income' | 'expense')}
              options={[{value: 'expense', label: 'Pengeluaran'}, {value: 'income', label: 'Pemasukan'}]} 
            />
          </div>
          <div className="flex items-center justify-between gap-4">
             <div className="flex gap-2">
                {['var(--primary)', 'var(--success)', 'var(--danger)', 'var(--warning)', 'var(--color-surface-4)'].map(c => (
                  <button 
                    key={c} type="button" onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
             </div>
             <Button type="submit" loading={submitting} size="sm">
                {editingCategory ? 'Update' : 'Tambah'}
             </Button>
          </div>
        </form>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loading ? <div className="shimmer h-20 rounded-xl" /> : categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm font-bold text-white">{cat.name}</span>
                <span className="text-[10px] uppercase font-bold text-text-muted opacity-50">{cat.type}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingCategory(cat); setName(cat.name); setType(cat.type as 'income' | 'expense'); setColor(cat.color || 'var(--primary)'); }} className="p-1.5 hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
