'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { setWhatsappContactAction } from '@/app/actions/admin';

export function WhatsappContactForm({ initialValue }: { initialValue: string | null }) {
  const [whatsapp, setWhatsapp] = useState(initialValue || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setWhatsappContactAction(whatsapp);
      toast('Kontak WhatsApp berhasil disimpan', 'success');
    } catch {
      toast('Gagal menyimpan kontak', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Kontak WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      <Button disabled={saving}>Simpan</Button>
    </form>
  );
}
