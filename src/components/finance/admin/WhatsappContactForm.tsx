'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';
import { adminService } from '@/lib/services/user/admin.service';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare } from 'lucide-react';

function formatWhatsappNumber(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('https://wa.me/')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('08')) return 'https://wa.me/+62' + digits.substring(1);
  if (digits.startsWith('628')) return 'https://wa.me/+' + digits;
  if (digits.startsWith('62')) return 'https://wa.me/+' + digits;
  return trimmed;
}

export function WhatsappContactForm() {
  const { user } = useApp();
  const { toast } = useToast();
  const supabase = createClient();
  const [whatsappLink, setWhatsappLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadWhatsappContact() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('whatsapp_contact')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        setWhatsappLink(data?.whatsapp_contact || '');
      } catch (err: unknown) {
        console.error('Failed to load WhatsApp contact:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWhatsappContact();
  }, [user, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formatted = formatWhatsappNumber(whatsappLink);
      setWhatsappLink(formatted);
      await adminService.setWhatsappContact(formatted);
      toast('Link WhatsApp berhasil disimpan.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan link WhatsApp';
      toast(msg, 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-32 rounded-xl shimmer animate-pulse" />;
  }

  return (
    <Card className="p-6 border border-primary/20 bg-primary/5">
      <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-1">
        <MessageSquare className="w-4 h-4 text-primary" />
        Kontak WhatsApp Admin
      </h3>
      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-4">
        Link WhatsApp ini akan digunakan sebagai tombol bantuan/kontak admin untuk seluruh pengguna.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Link WhatsApp Contact"
          value={whatsappLink}
          onChange={(e) => setWhatsappLink(e.target.value)}
          placeholder="081227779551 atau https://wa.me/628xxx"
          disabled={saving}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Simpan Link WhatsApp
          </Button>
        </div>
      </form>
    </Card>
  );
}
