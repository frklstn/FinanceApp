'use client';
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';
import { Palette } from 'lucide-react';

export function GlobalBrandingForm() {
  const { appSettings } = useApp();
  const [appName, setAppName] = useState(appSettings.app_name);
  const [appLogoUrl, setAppLogoUrl] = useState(appSettings.app_logo_url ?? '');
  const [documentTitle, setDocumentTitle] = useState(appSettings.document_title);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: Implement server action
      alert('Implement Server Action');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Branding Aplikasi</h3>
        </div>
        <Input label="Nama Aplikasi" value={appName} onChange={(e) => setAppName(e.target.value)} />
        <Input label="URL Logo" value={appLogoUrl} onChange={(e) => setAppLogoUrl(e.target.value)} />
        <Input label="Judul Dokumen" value={documentTitle} onChange={(e) => setDocumentTitle(e.target.value)} />
        <Button disabled={saving}>Simpan</Button>
      </form>
    </Card>
  );
}
