import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';

export function useUser() {
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
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
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Pengguna tidak terotentikasi');

      // 1. Update Auth
      const updateAuthData: { email?: string; password?: string; data: { full_name: string; avatar_url: string; currency?: string } } = {
        data: { full_name: data.fullName, avatar_url: data.avatarUrl }
      };
      if (data.email && data.email !== currentUser.email) updateAuthData.email = data.email;
      if (data.password) updateAuthData.password = data.password;
      if (data.currency) updateAuthData.data.currency = data.currency;

      const { error: authError } = await supabase.auth.updateUser(updateAuthData);
      if (authError) throw authError;

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          avatar_url: data.avatarUrl,
        })
        .eq('id', currentUser.id);

      if (profileError) throw profileError;

      await refreshSession();
      toast('Profil berhasil diperbarui!', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui profil.';
      toast(msg, 'danger');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [supabase, toast, refreshSession]);

  const updateLanguage = useCallback(async (language: 'id' | 'en') => {
    setSubmitting(true);
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('Pengguna tidak terotentikasi');

      const { error } = await supabase
        .from('profiles')
        .update({ language })
        .eq('id', currentUser.id);

      if (error) throw error;

      await refreshSession();
      toast(language === 'id' ? 'Bahasa diubah ke Indonesia.' : 'Language changed to English.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengubah bahasa.';
      toast(msg, 'danger');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [supabase, toast, refreshSession]);

  // Kosongkan seluruh data keuangan milik pengguna. RPC reset_my_data hanya
  // menyentuh workspace milik auth.uid(), jadi tak bisa mengenai akun lain.
  const resetData = useCallback(async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('reset_my_data');
      if (error) throw error;
      toast('Semua data keuangan berhasil dikosongkan.', 'success');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengosongkan data.';
      toast(msg, 'danger');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [supabase, toast]);

  // Hapus akun pemanggil sepenuhnya, lalu keluar. RPC delete_my_account hanya
  // menghapus auth.uid() sendiri.
  const deleteAccount = useCallback(async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;
      await supabase.auth.signOut();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus akun.';
      toast(msg, 'danger');
      setSubmitting(false);
      return false;
    }
  }, [supabase, toast]);

  return { updateProfile, updateLanguage, resetData, deleteAccount, submitting };
}
