'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/contexts/app-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { profileService } from '@/lib/services/user/user.service';
import { Crown, MessageCircle } from 'lucide-react';

interface UpgradeGateProps {
  children: React.ReactNode;
}

export function UpgradeGate({ children }: UpgradeGateProps) {
  const { isPro, isLoading } = useApp();
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [memuatKontak, setMemuatKontak] = useState(true);

  const isProUser = isPro();

  useEffect(() => {
    if (isLoading || isProUser) {
      return;
    }

    let batal = false;
    async function fetchContact() {
      try {
        const link = await profileService.getWhatsappContact();
        if (!batal) setWhatsappLink(link);
      } catch (err) {
        console.error('Failed to fetch admin WhatsApp contact:', err);
      } finally {
        if (!batal) setMemuatKontak(false);
      }
    }

    fetchContact();
    return () => { batal = true; };
  }, [isLoading, isProUser]);

  // Selama profil belum termuat, plan belum diketahui: isPro() mengembalikan
  // false hanya karena profile masih null. Tanpa guard isLoading, gate ini
  // memutuskan terlalu dini dan pengguna Pro sempat melihat paywall "Fitur Pro"
  // setiap kali halaman dimuat -- state `loading` yang lama hanya menunggu
  // fetch kontak WhatsApp, yang justru sering selesai lebih dulu dari profil.
  if (isLoading || (!isProUser && memuatKontak)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
            Fitur ini hanya tersedia untuk pengguna Pro. Hubungi admin untuk upgrade akun kamu.
          </p>
        </div>

        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-block"
          >
            <Button variant="default" className="w-full flex items-center justify-center gap-2 py-3 cursor-pointer">
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Hubungi Admin via WhatsApp</span>
            </Button>
          </a>
        )}
      </Card>
    </div>
  );
}
