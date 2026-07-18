'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useApp } from '@/contexts/app-context';
import { appSettingsService } from '@/lib/services/user/app-settings.service';
import { Palette } from 'lucide-react';

export function GlobalBrandingForm() {
  const { user, appSettings, refreshAppSettings } = useApp();
  const { toast } = useToast();
  const [appName, setAppName] = useState(appSettings.app_name);
  const [appLogoUrl, setAppLogoUrl] = useState(appSettings.app_logo_url ?? '');
  const [documentTitle, setDocumentTitle] = useState(appSettings.document_title);
  const [saving, setSaving] = useState(false);
  const [prevAppSettings, setPrevAppSettings] = useState(appSettings);

  if (appSettings !== prevAppSettings) {
    setPrevAppSettings(appSettings);
    setAppName(appSettings.app_name);
    setAppLogoUrl(appSettings.app_logo_url ?? '');
    setDocumentTitle(appSettings.document_title);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await appSettingsService.updateSettings(
        {
          app_name: appName.trim() || 'FinanceApp',
          app_logo_url: appLogoUrl.trim() || null,
          document_title: documentTitle.trim() || 'FinanceApp',
        },
        user.id
      );
      await refreshAppSettings();
      toast('Branding global berhasil disimpan untuk semua pengguna.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan branding';
      toast(msg, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-primary/20 bg-primary/5">
      <h3 className="text-sm font-bold text-light-text-primary dark:text-dark-text-primary flex items-center gap-2 mb-1">
        <Palette className="w-4 h-4 text-primary" />
        Branding Aplikasi (Global)
      </h3>
      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-4">
        Nama dan logo ini tampil untuk seluruh pengguna di sidebar, navbar, dan judul browser.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Aplikasi"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          required
          disabled={saving}
        />
        <Input
          label="URL Logo Aplikasi"
          value={appLogoUrl}
          onChange={(e) => setAppLogoUrl(e.target.value)}
          placeholder="https://..."
          disabled={saving}
        />
        {appLogoUrl && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-light-text-secondary">Preview:</span>
            <div className="w-10 h-10 rounded-xl border border-light-border/40 overflow-hidden bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
        <Input
          label="Judul Tab Browser"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          required
          disabled={saving}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Simpan Branding Global
          </Button>
        </div>
      </form>
    </Card>
  );
}
