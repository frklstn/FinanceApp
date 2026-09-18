'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Smartphone, ArrowRight } from 'lucide-react';

function MobileSuccessContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const name = searchParams.get('name');
  const [redirected, setRedirected] = useState(false);

  const finappLink = token ? `finapp://auth/callback?token=${token}&email=${encodeURIComponent(email || '')}&name=${encodeURIComponent(name || '')}` : '';
  const financeappLink = token ? `financeapp://auth/callback?token=${token}&email=${encodeURIComponent(email || '')}&name=${encodeURIComponent(name || '')}` : '';

  useEffect(() => {
    if (finappLink) {
      // Auto-trigger clean Flutter deep link
      window.location.href = finappLink;
      setRedirected(true);
    }
  }, [finappLink]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#15130F] text-[#F3EDE3]">
      <Card className="max-w-md w-full p-8 text-center bg-[#1C1A15] border-[#F3EDE3]/10 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#E2916A]/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-[#E2916A]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-[#F3EDE3]">Autentikasi Google Berhasil!</h2>
          <p className="text-sm text-[#8A8071]">
            Login untuk <span className="font-semibold text-[#B8AE9C]">{email}</span> telah terverifikasi.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => {
              if (finappLink) window.location.href = finappLink;
            }}
            className="w-full bg-[#E2916A] text-[#15130F] hover:bg-[#EDA684] font-semibold py-3 flex items-center justify-center gap-2"
          >
            <Smartphone className="w-4 h-4" /> Buka Aplikasi FinanceApp
          </Button>
        </div>

        <p className="text-xs text-[#8A8071]">
          Jika aplikasi tidak terbuka otomatis, tekan tombol di atas untuk kembali ke aplikasi mobile.
        </p>
      </Card>
    </div>
  );
}

export default function MobileSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#15130F]" />}>
      <MobileSuccessContent />
    </Suspense>
  );
}
