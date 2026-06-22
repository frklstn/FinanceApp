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
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <AlertCircle className="w-5 h-5 text-amber-500" />
        <div className="text-xs">
          <p className="font-bold text-white">Akun Free</p>
          <p className="text-white/60">Upgrade ke Pro untuk fitur tanpa batas.</p>
        </div>
      </div>
    );
  }

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : true;
  
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${isExpired ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
      <Crown className={`w-5 h-5 ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`} />
      <div className="text-xs">
        <p className={`font-bold ${isExpired ? 'text-rose-500' : 'text-emerald-500'}`}>
          Akun Pro {isExpired && '(Kadaluwarsa)'}
        </p>
        {expiresAt && !isExpired && (
          <p className="text-white/60">Berakhir pada: {new Date(expiresAt).toLocaleDateString('id-ID')}</p>
        )}
      </div>
    </div>
  );
}
