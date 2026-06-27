'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { SettingsForm } from '@/components/user/profile/Settings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-[var(--nexus-text-primary)] tracking-tight font-outfit uppercase">
          Pengaturan
        </h1>
        <p className="text-xs text-[var(--nexus-text-secondary)] font-medium mt-1">
          Kelola profil, preferensi tampilan, dan data keuangan Anda
        </p>
      </header>

      <Card className="bg-[var(--nexus-bg-card)] border border-[var(--nexus-glass-border)] rounded-[32px] p-6 md:p-8 shadow-2xl">
        <SettingsForm isModal={false} />
      </Card>
    </div>
  );
}
