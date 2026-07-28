import { useState, useCallback } from 'react';
// import { query } from '@/lib/db';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';

export function useUser() {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { refreshSession } = useApp();

  const updateProfile = useCallback(async (data: { 
    fullName: string; 
    email?: string; 
    password?: string; 
    avatarUrl: string;
    currency?: string;
  }) => {
    setSubmitting(true);
    try {
      // Stubbed: No Supabase
      toast('Profil berhasil diperbarui!', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      toast(msg, 'danger');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [toast, refreshSession]);

  const updateLanguage = useCallback(async (language: 'id' | 'en') => {
    setSubmitting(true);
    try {
      // Stubbed: No Supabase
      toast(language === 'id' ? 'Bahasa diubah ke Indonesia.' : 'Language changed to English.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah bahasa.';
      toast(msg, 'danger');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [toast, refreshSession]);

  const resetData = useCallback(async () => {
    setSubmitting(true);
    try {
      // Stubbed: No Supabase
      toast('Semua data keuangan berhasil dikosongkan.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengosongkan data.';
      toast(msg, 'danger');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [toast]);

  const deleteAccount = useCallback(async () => {
    setSubmitting(true);
    try {
      // Stubbed: No Supabase
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus akun.';
      toast(msg, 'danger');
      setSubmitting(false);
      return false;
    }
  }, [toast]);

  return { updateProfile, updateLanguage, resetData, deleteAccount, submitting };
}
