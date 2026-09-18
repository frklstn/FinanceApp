'use client';
import React from 'react';
import { useApp } from '@/contexts/app-context';
import { Card } from '@/components/ui/card';
import { Crown } from 'lucide-react';

interface UpgradeGateProps {
  children: React.ReactNode;
}

export function UpgradeGate({ children }: UpgradeGateProps) {
  const { isPro, isLoading } = useApp();
  const isProUser = isPro();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">Memuat akses...</p>
      </div>
    );
  }

  if (isProUser) {
    return <>{children}</>;
  }

  return (
    <div className="max-w-md mx-auto my-12 p-1">
      <Card className="p-8 text-center border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl shadow-xl flex flex-col items-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <Crown className="w-8 h-8 text-primary animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-light-text-primary dark:text-dark-text-primary">
            Fitur Pro
          </h3>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed max-w-sm">
            Fitur ini hanya tersedia untuk pengguna Pro.
          </p>
        </div>
      </Card>
    </div>
  );
}
