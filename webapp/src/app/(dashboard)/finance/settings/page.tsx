'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { SettingsForm } from '@/components/user/profile/Settings';
import { AdminPanel } from '@/components/finance/admin/AdminPanel';
import { useApp } from '@/contexts/app-context';

export default function SettingsPage() {
  const { isSuperAdmin } = useApp();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola profil, preferensi tampilan, dan data keuanganmu"
      />

      {/* SettingsForm membawa kartunya sendiri. Sebelumnya seluruh isinya
          dibungkus satu Card raksasa di sini, jadi semua bagian menumpuk dalam
          satu kolom panjang dan beda sendiri dari halaman lain yang memakai
          beberapa kartu bergrid. */}
      <SettingsForm />

      {/* Panel admin dulunya halaman terpisah di /user/admin. Digabung ke sini
          supaya pengaturan tidak tersebar di dua tempat. Hanya dirender untuk
          superadmin; penegakan sebenarnya ada di requireSuperAdmin() pada tiap
          server action, bukan di kondisi render ini. */}
      {isSuperAdmin && (
        <Card>
          <AdminPanel />
        </Card>
      )}
    </div>
  );
}
