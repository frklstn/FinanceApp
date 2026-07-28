'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/shared/layout/sidebar';

const MobileNav = dynamic(() => import('@/components/shared/layout/mobile-nav'), { ssr: false });

import { useApp } from '@/contexts/app-context';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Pengalihan akun tersuspensi.
 *
 * Penegakan sebenarnya ada di requireAccount() di server — tanpa itu, ini cuma
 * lapisan tampilan yang bisa dilewati. Bagian ini hanya supaya pengguna melihat
 * halaman penjelasan, bukan dashboard kosong tanpa keterangan.
 */
function SuspensionGuard() {
  const { profile, isLoading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profile?.is_suspended) {
      router.replace('/suspended');
    }
  }, [isLoading, profile?.is_suspended, router]);

  return null;
}

function DocumentTitle() {
  const pathname = usePathname();
  const { appSettings } = useApp();

  useEffect(() => {
    // Ambil segmen terakhir: '/finance/transactions' -> 'transactions'.
    // Sebelumnya memakai indeks [1] sehingga semua halaman berjudul "Finance".
    const segment = pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const label = segment.charAt(0).toUpperCase() + segment.slice(1);
    const docTitle = appSettings?.document_title || 'FinanceApp';
    document.title = `${label} | ${docTitle}`;
  }, [pathname, appSettings?.document_title]);

  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DocumentTitle />
      <SuspensionGuard />
      <div className="flex h-screen overflow-hidden bg-[var(--nexus-bg-main)] text-[var(--nexus-text-primary)] transition-all duration-300">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative transition-all duration-300 md:pl-[84px]">
          <main className="flex-1 overflow-y-auto no-scrollbar focus:outline-none py-6 px-4 md:py-10 md:px-12 bg-[var(--nexus-bg-main)]">
            {/* Lebar kontainer disamakan dengan landing & auth (max-w-[1400px]). */}
            <div className="max-w-[1400px] mx-auto min-h-full pb-24 md:pb-0">
              {children}
            </div>
          </main>
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </>
  );
}
