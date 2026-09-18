'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { MessageCircle } from 'lucide-react';
import { setWhatsappContactAction, getWhatsappContactAction } from '@/app/actions/admin';

/**
 * Kontak bantuan yang ditampilkan ke pengguna Free di UpgradeGate.
 *
 * Nilai awal diambil sendiri lewat server action; sebelumnya komponen ini
 * mewajibkan prop `initialValue` yang tidak pernah dikirim siapa pun.
 */
export function WhatsappContactForm() {
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getWhatsappContactAction()
      .then((v) => setWhatsapp(v || ''))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setWhatsappContactAction(whatsapp);
      toast('Kontak WhatsApp berhasil disimpan', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Gagal menyimpan kontak', 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="gap-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          Kontak bantuan
        </h3>
      </div>
      <p className="text-xs text-text-muted">
        Ditampilkan ke pengguna Free saat mereka menekan tombol upgrade.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tautan atau nomor WhatsApp"
          placeholder="https://wa.me/62..."
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
        />
        <Button type="submit" variant="primary" loading={saving} className="w-full">
          Simpan
        </Button>
      </form>
    </Card>
  );
}
