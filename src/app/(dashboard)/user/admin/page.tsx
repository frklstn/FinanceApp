'use client';
import React, { useEffect, useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/layout/page-header';
import { useToast } from '@/components/ui/toast';

export default function AdminPage() {
  const { t } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <PageHeader title={t('admin.title', 'Admin Panel')} />
      <Card className="p-4">
        <p>Panel Admin sedang dalam proses migrasi ke PostgreSQL lokal.</p>
      </Card>
    </div>
  );
}
