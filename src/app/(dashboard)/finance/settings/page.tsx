'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { SettingsForm } from '@/components/user/profile/Settings';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola profil, preferensi tampilan, dan data keuanganmu"
      />

      <Card className="p-6 md:p-8">
        <SettingsForm isModal={false} />
      </Card>
    </div>
  );
}
