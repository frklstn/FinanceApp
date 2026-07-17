'use client';

import React from 'react';
import { Crown, AlertCircle } from 'lucide-react';

interface SubscriptionStatusProps {
  plan?: string | null;
  expiresAt?: string | null;
}

export function SubscriptionStatus({ plan, expiresAt }: SubscriptionStatusProps) {
  if (!plan || plan === 'free') {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--nexus-bg-panel)] border border-[var(--nexus-glass-border)]">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <div className="text-xs">
          <p className="font-bold text-[var(--nexus-text-primary)]">Akun Free</p>
          <p className="text-[var(--nexus-text-secondary)]">Upgrade ke Pro untuk fitur tanpa batas.</p>
        </div>
      </div>
    );
  }

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : true;
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isExpired ? 'bg-rose-500/5 border-rose-500/20' : 'bg-[var(--nexus-emerald-glow)] border-[var(--nexus-emerald-border)]'}`}>
      <Crown className={`w-5 h-5 ${isExpired ? 'text-rose-500' : 'text-[var(--nexus-emerald)]'}`} />
      <div className="text-xs">
        <p className={`font-bold ${isExpired ? 'text-rose-500' : 'text-[var(--nexus-emerald)]'}`}>
          Akun Pro {isExpired && '(Kadaluwarsa)'}
        </p>
        {expiresAt && !isExpired && (
          <p className="text-[var(--nexus-text-secondary)]">Berakhir pada: {new Date(expiresAt).toLocaleDateString('id-ID')}</p>
        )}
      </div>
    </div>
  );
}
